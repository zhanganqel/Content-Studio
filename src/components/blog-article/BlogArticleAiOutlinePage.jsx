import {
  ChevronRight,
  FileText,
  GripVertical,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TaskStatusIcon } from '../ai-workflow/AiWorkflowComponents.jsx';
import { useToast } from '../ui/Toast.jsx';
import CollaborativeCreationHeader from './CollaborativeCreationHeader.jsx';
import { formatTaskState, getTaskCompletedText, getTaskName, getTaskRunningText } from './aiTaskText.js';
import { getCollaborativeStageStatuses } from './collaborativeStages.js';
import { getAgentDisplay } from './agentDisplay.js';
import {
  createOutlineDemoData,
  restartCollaborativeOutlineTask,
  startCollaborativeContentTask,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';

const outlineLevels = ['H2', 'H3', 'H4'];
const postOutlineStages = new Set(['content', 'content-completed', 'content-stopped']);

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

// 大纲树需要深拷贝后再编辑，避免直接修改已保存结构。
function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree ?? []));
}

function getNodeDepth(node) {
  if (!node.children?.length) return 0;
  return 1 + Math.max(...node.children.map(getNodeDepth));
}

function containsNode(node, nodeId) {
  if (node.id === nodeId) return true;
  return node.children?.some((child) => containsNode(child, nodeId)) ?? false;
}

function normalizeNodeLevel(node, levelIndex) {
  const nextLevelIndex = Math.min(levelIndex, outlineLevels.length - 1);
  return {
    ...node,
    level: outlineLevels[nextLevelIndex],
    children:
      nextLevelIndex >= outlineLevels.length - 1
        ? []
        : (node.children ?? []).map((child) => normalizeNodeLevel(child, nextLevelIndex + 1)),
  };
}

function removeNodeById(nodes, nodeId) {
  let removedNode = null;
  const nextNodes = [];

  nodes.forEach((node) => {
    if (node.id === nodeId) {
      removedNode = node;
      return;
    }

    const result = removeNodeById(node.children ?? [], nodeId);
    if (result.removedNode) {
      removedNode = result.removedNode;
      nextNodes.push({ ...node, children: result.nodes });
      return;
    }

    nextNodes.push(node);
  });

  return { nodes: nextNodes, removedNode };
}

function insertNodeByTarget(nodes, targetId, nodeToInsert, position) {
  const nextNodes = [];
  let inserted = false;

  nodes.forEach((node) => {
    if (node.id === targetId && position === 'before') {
      nextNodes.push(nodeToInsert);
      nextNodes.push(node);
      inserted = true;
      return;
    }

    if (node.id === targetId && position === 'after') {
      nextNodes.push(node);
      nextNodes.push(nodeToInsert);
      inserted = true;
      return;
    }

    if (node.id === targetId && position === 'inside') {
      nextNodes.push({ ...node, children: [...(node.children ?? []), nodeToInsert] });
      inserted = true;
      return;
    }

    const result = insertNodeByTarget(node.children ?? [], targetId, nodeToInsert, position);
    nextNodes.push(result.inserted ? { ...node, children: result.nodes } : node);
    inserted = inserted || result.inserted;
  });

  return { nodes: nextNodes, inserted };
}

function updateNodeTitle(nodes, nodeId, title) {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, title };
    }

    return { ...node, children: updateNodeTitle(node.children ?? [], nodeId, title) };
  });
}

function updateNodeLevel(nodes, nodeId, level) {
  const levelIndex = outlineLevels.indexOf(level);
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return normalizeNodeLevel(node, levelIndex);
    }

    return { ...node, children: updateNodeLevel(node.children ?? [], nodeId, level) };
  });
}

function getTargetLevelIndex(targetNode, position) {
  const targetLevelIndex = outlineLevels.indexOf(targetNode.level);
  return position === 'inside' ? targetLevelIndex + 1 : targetLevelIndex;
}

function canDropNode({ draggedNode, position, targetNode }) {
  // 拖拽前校验层级和父子关系，防止树结构超过 H4 或拖入自身。
  if (!draggedNode || !targetNode) {
    return { ok: false, reason: '无效的拖拽目标' };
  }

  if (draggedNode.id === targetNode.id || containsNode(draggedNode, targetNode.id)) {
    return { ok: false, reason: '不能拖入自身或子节点' };
  }

  if (position === 'inside' && targetNode.level === 'H4') {
    return { ok: false, reason: 'H4 下不能继续添加子级' };
  }

  const nextLevelIndex = getTargetLevelIndex(targetNode, position);
  if (nextLevelIndex > outlineLevels.length - 1) {
    return { ok: false, reason: '已达到最低层级 H4' };
  }

  if (nextLevelIndex + getNodeDepth(draggedNode) > outlineLevels.length - 1) {
    return { ok: false, reason: '该节点包含子级，移动后会超过 H4 层级' };
  }

  return { ok: true, reason: '' };
}

function isPostOutlineStage(stage) {
  return postOutlineStages.has(stage);
}

function hasCompletedOutlineOutput(task) {
  const outline = task?.outline;
  const hasOutlineTree = Array.isArray(outline?.outlineTree) && outline.outlineTree.length > 0;
  const outlineGenerated =
    outline?.completedTaskIds?.includes('write-outline') ||
    outline?.currentArtifactId === 'outline' ||
    isPostOutlineStage(task?.stage);

  return Boolean(outline?.titleConfirmed && hasOutlineTree && outlineGenerated);
}

function getInitialPlaybackState(workflow, task) {
  const playback = task?.outline?.playback;
  if (playback) {
    return {
      completedTaskIds: playback.completedTaskIds ?? [],
      currentTaskIndex: playback.currentTaskIndex ?? 0,
      isComplete: Boolean(playback.isComplete),
      selectedArtifactId: playback.selectedArtifactId ?? task?.outline?.currentArtifactId ?? '',
      titleConfirmed: Boolean(playback.titleConfirmed),
      titlesVisible: Boolean(playback.titlesVisible),
      visibleArtifactIds: playback.visibleArtifactIds ?? [],
      visibleThinkingCounts: playback.visibleThinkingCounts ?? {},
    };
  }

  // 返回正文阶段时，大纲页需要恢复为已完成状态。
  const returnedFromContentStage = isPostOutlineStage(task?.stage);
  const alreadyCompleted = task?.stage === 'outline-completed' || hasCompletedOutlineOutput(task);
  const savedCompletedTaskIds = task?.outline?.completedTaskIds ?? [];
  const savedTitleConfirmed = Boolean(task?.outline?.titleConfirmed);
  const titleTaskIndex = workflow.findIndex((item) => item.id === 'write-titles');
  const outlineTaskIndex = workflow.findIndex((item) => item.id === 'write-outline');

  if (alreadyCompleted) {
    return {
      completedTaskIds: workflow.map((item) => item.id),
      currentTaskIndex: workflow.length,
      isComplete: true,
      selectedArtifactId: task?.outline?.currentArtifactId ?? '',
      titleConfirmed: true,
      titlesVisible: true,
      visibleArtifactIds: returnedFromContentStage ? [] : workflow.map((item) => item.artifactId).filter(Boolean),
      visibleThinkingCounts: Object.fromEntries(workflow.map((item) => [item.id, item.thinking.length])),
    };
  }

  if (task?.stage === 'outline-stopped' && savedCompletedTaskIds.length) {
    const currentTaskIndex = Math.min(savedCompletedTaskIds.length, workflow.length - 1);
    return {
      completedTaskIds: savedCompletedTaskIds,
      currentTaskIndex,
      isComplete: false,
      selectedArtifactId: task?.outline?.currentArtifactId ?? '',
      titleConfirmed: savedTitleConfirmed || savedCompletedTaskIds.includes('write-titles'),
      titlesVisible: savedTitleConfirmed || savedCompletedTaskIds.includes('write-titles'),
      visibleArtifactIds: task?.outline?.currentArtifactId ? [task.outline.currentArtifactId] : [],
      visibleThinkingCounts: Object.fromEntries(
        workflow.slice(0, currentTaskIndex + 1).map((item) => [item.id, item.thinking.length]),
      ),
    };
  }

  if (savedTitleConfirmed && outlineTaskIndex >= 0) {
    const completedThroughTitle = workflow.slice(0, outlineTaskIndex).map((item) => item.id);
    return {
      completedTaskIds: [...new Set([...savedCompletedTaskIds, ...completedThroughTitle])],
      currentTaskIndex: outlineTaskIndex,
      isComplete: false,
      selectedArtifactId: task?.outline?.currentArtifactId ?? '',
      titleConfirmed: true,
      titlesVisible: true,
      visibleArtifactIds: task?.outline?.currentArtifactId ? [task.outline.currentArtifactId] : [],
      visibleThinkingCounts: Object.fromEntries(
        workflow.slice(0, Math.max(titleTaskIndex + 1, outlineTaskIndex)).map((item) => [
          item.id,
          item.thinking.length,
        ]),
      ),
    };
  }

  return {
    completedTaskIds: [],
    currentTaskIndex: 0,
    isComplete: false,
    selectedArtifactId: '',
    titleConfirmed: false,
    titlesVisible: false,
    visibleArtifactIds: [],
    visibleThinkingCounts: {},
  };
}

function AgentAvatar({ agentTitle }) {
  const agentDisplay = getAgentDisplay(agentTitle);

  return (
    <div
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border text-[15px] font-bold ${agentDisplay.avatarClassName}`}
    >
      {agentDisplay.initial}
    </div>
  );
}

function ThinkingBlock({ children }) {
  return (
    <div
      className="ml-2 border-l-2 border-[#E4E7ED] pl-5 text-[14px] leading-[22px] text-[#606266]"
      style={{ animation: 'aiOutlineFadeInUp 180ms ease-out both' }}
    >
      {children}
    </div>
  );
}

function ArtifactCard({ artifact, onClick, selected }) {
  return (
    <button
      type="button"
      className={`ml-2 flex h-[78px] w-[520px] max-w-full items-center gap-3 rounded-[8px] border p-4 text-left transition hover:border-[#365EFF] hover:bg-[#F5F7FF] ${
        selected ? 'border-[#365EFF] bg-[#EEF3FF]' : 'border-[#DCDFE6] bg-white'
      }`}
      onClick={onClick}
    >
      <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-[8px] bg-[#5B7CFF] text-white">
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-[22px] text-[#303133]">{artifact.title}</span>
        <span className="mt-0.5 block truncate text-[13px] leading-[20px] text-[#606266]">{artifact.subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 flex-none text-[#A8ABB2]" />
    </button>
  );
}

function TitleSelection({
  onConfirmTitle,
  onRegenerateTitle,
  onSelectTitle,
  selectedTitleId,
  titleConfirmed,
  titleOptions,
  copy,
  locale,
}) {
  return (
    <div className="ml-2 space-y-3 border-l-2 border-[#E4E7ED] pl-5">
      <div className="text-[14px] font-semibold leading-[22px] text-[#303133]">
        {locale === 'en-US' ? 'Choose a title:' : '请在以下标题中进行选择：'}
      </div>
      <div className="space-y-2">
        {titleOptions.map((option) => {
          const selected = selectedTitleId === option.id;
          return (
            <div
              key={option.id}
              className={`group flex h-[42px] items-center rounded-[6px] border transition ${
                selected
                  ? 'border-[#365EFF] bg-white shadow-[0_0_0_1px_rgba(54,94,255,0.04)]'
                  : titleConfirmed
                    ? 'border-[#EBEEF5] bg-[#F7F8FB] opacity-55'
                    : 'border-[#DCDFE6] bg-white hover:border-[#C8D2FF]'
              }`}
            >
              <button
                type="button"
                className={`min-w-0 flex-1 px-3 text-left text-[14px] leading-[22px] transition ${
                  selected ? 'text-[#303133]' : 'text-[#606266]'
                } ${titleConfirmed && !selected ? 'cursor-not-allowed' : ''}`}
                disabled={titleConfirmed && !selected}
                onClick={() => onSelectTitle(option)}
              >
                <span className="block truncate">{option.title}</span>
              </button>
              {!titleConfirmed ? (
                <button
                  type="button"
                  className="mr-2 inline-flex h-7 w-7 flex-none items-center justify-center rounded-[6px] text-[#A8ABB2] opacity-0 transition hover:bg-[#EEF3FF] hover:text-[#365EFF] group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRegenerateTitle(option.id);
                  }}
                  aria-label={`重新生成 ${option.title}`}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        {titleConfirmed ? (
          <span className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#ECFDF5] px-3 text-[13px] font-semibold text-[#00A85F]">
            {locale === 'en-US' ? 'Title confirmed' : '标题已确认'}
          </span>
        ) : (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
            disabled={!selectedTitleId}
            onClick={onConfirmTitle}
          >
            {copy.actions.confirmTitle}
          </button>
        )}
      </div>
    </div>
  );
}

function groupWorkflowTasks(tasks) {
  // 连续相同角色的任务合并展示，减少左侧流程重复头像。
  return tasks.reduce((groups, task) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.agentTitle === task.agentTitle) {
      lastGroup.tasks.push(task);
      return groups;
    }

    groups.push({
      agentTitle: task.agentTitle,
      id: `${task.agentTitle}-${task.id}`,
      tasks: [task],
    });
    return groups;
  }, []);
}

function WorkflowTaskItem({
  artifact,
  completed,
  isCurrent,
  isStopped,
  onArtifactClick,
  onConfirmTitle,
  onRegenerateTitle,
  onSelectTitle,
  selectedArtifactId,
  selectedTitleId,
  showArtifact,
  showTitleSelection,
  task,
  thinkingCount,
  titleConfirmed,
  titleOptions,
  locale,
  copy,
}) {
  const taskName = getTaskName(task, locale);
  const stopped = isStopped && isCurrent && !completed;
  const taskLabel = completed
    ? getTaskCompletedText(task, copy.status.done, locale)
    : stopped
      ? formatTaskState(taskName, copy.status.stopped, locale)
      : getTaskRunningText(task, locale);

  return (
    <div className="flex items-start gap-3">
      <TaskStatusIcon label={taskLabel} status={completed ? 'done' : stopped ? 'cancelled' : 'running'} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-[20px] text-[#303133]">
          {taskLabel}
        </div>
        <div className="mt-3 space-y-4">
          {task.thinking.slice(0, thinkingCount).map((paragraph, index) => (
            <ThinkingBlock key={`${task.id}-thinking-${index}`}>{paragraph}</ThinkingBlock>
          ))}
          {showTitleSelection ? (
            <TitleSelection
              onConfirmTitle={onConfirmTitle}
              copy={copy}
              locale={locale}
              onRegenerateTitle={onRegenerateTitle}
              onSelectTitle={onSelectTitle}
              selectedTitleId={selectedTitleId}
              titleConfirmed={titleConfirmed}
              titleOptions={titleOptions}
            />
          ) : null}
          {showArtifact && artifact ? (
            <ArtifactCard
              artifact={artifact}
              onClick={() => onArtifactClick(artifact.id)}
              selected={selectedArtifactId === artifact.id}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkflowAgentGroup({
  completedTaskIds,
  copy,
  currentArtifact,
  currentTask,
  group,
  isStopped,
  locale,
  onArtifactClick,
  onConfirmTitle,
  onRegenerateTitle,
  onSelectTitle,
  selectedArtifactId,
  selectedTitleId,
  titleConfirmed,
  titleOptions,
  titlesVisible,
  visibleArtifactIds,
  visibleThinkingCounts,
}) {
  const agentDisplay = getAgentDisplay(group.agentTitle, locale);

  return (
    <section className="flex gap-4">
      <AgentAvatar agentTitle={group.agentTitle} />
      <div className="min-w-0 flex-1 pb-8">
        <div className="text-[15px] font-semibold leading-[24px] text-[#303133]">{agentDisplay.name}</div>
        <div className="mt-3 space-y-7">
          {group.tasks.map((workflowTask) => {
            const artifact = workflowTask.artifactId ? currentArtifact : null;
            const completed = completedTaskIds.includes(workflowTask.id);
            const isCurrent = workflowTask.id === currentTask?.id && !completed;

            return (
              <WorkflowTaskItem
                key={workflowTask.id}
                artifact={artifact}
                completed={completed}
                copy={copy}
                isCurrent={isCurrent}
                isStopped={isStopped}
                locale={locale}
                onArtifactClick={onArtifactClick}
                onConfirmTitle={onConfirmTitle}
                onRegenerateTitle={onRegenerateTitle}
                onSelectTitle={onSelectTitle}
                selectedArtifactId={selectedArtifactId}
                selectedTitleId={selectedTitleId}
                showArtifact={Boolean(workflowTask.artifactId && visibleArtifactIds.includes(workflowTask.artifactId))}
                showTitleSelection={Boolean(workflowTask.titleSelection && titlesVisible)}
                task={workflowTask}
                thinkingCount={visibleThinkingCounts[workflowTask.id] ?? 0}
                titleConfirmed={titleConfirmed}
                titleOptions={titleOptions}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EmptyEditor({ copy }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <div>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[#365EFF]">
          <FileText className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold leading-[28px] text-[#303133]">
          {copy.empty.outlinePreviewTitle}
        </h2>
        <p className="mt-2 text-[14px] leading-[22px] text-[#909399]">
          {copy.empty.outlinePreviewBody}
        </p>
      </div>
    </div>
  );
}

function DropHint({ active, position }) {
  if (!active) return null;

  if (position === 'inside') {
    return <span className="absolute inset-x-0 inset-y-1 rounded-[6px] border border-dashed border-[#365EFF] bg-[#EEF3FF]/70" />;
  }

  return (
    <span
      className={`absolute left-0 right-0 h-0.5 rounded-full bg-[#365EFF] ${
        position === 'before' ? 'top-0' : 'bottom-0'
      }`}
    />
  );
}

function OutlineNode({
  depth,
  dragState,
  dropIndicator,
  node,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onLevelChange,
  onTitleChange,
}) {
  return (
    <div>
      <div
        className="relative"
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragOver={(event) => onDragOver(event, node)}
        onDrop={(event) => onDrop(event, node)}
        onDragEnd={onDragEnd}
      >
        <DropHint active={dropIndicator?.targetId === node.id} position={dropIndicator?.position} />
        <div
          className={`relative z-10 flex min-h-[40px] items-center gap-2 rounded-[6px] px-2 py-1.5 transition ${
            dragState?.nodeId === node.id ? 'opacity-45' : 'hover:bg-[#F7F8FB]'
          }`}
          style={{ marginLeft: `${depth * 32}px` }}
        >
          <span className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-[6px] text-[#A8ABB2] hover:bg-[#EEF3FF] hover:text-[#365EFF]">
            <GripVertical className="h-4 w-4" />
          </span>
          <select
            className={`h-6 w-[52px] flex-none rounded-[5px] border px-1 text-[12px] font-semibold outline-none transition focus:ring-2 focus:ring-[#365EFF]/10 ${
              node.level === 'H2'
                ? 'border-[#A7C0FF] bg-[#EEF3FF] text-[#365EFF]'
                : node.level === 'H3'
                  ? 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]'
                  : 'border-[#DCDFE6] bg-[#F5F7FA] text-[#909399]'
            }`}
            value={node.level}
            onChange={(event) => onLevelChange(node.id, event.target.value)}
          >
            {outlineLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 flex-1 rounded-[6px] border border-transparent bg-transparent px-2 py-1 text-[14px] font-semibold leading-[22px] text-[#303133] outline-none transition hover:border-[#DCDFE6] focus:border-[#365EFF] focus:bg-white focus:ring-2 focus:ring-[#365EFF]/10"
            value={node.title}
            onChange={(event) => onTitleChange(node.id, event.target.value)}
          />
          <button
            type="button"
            className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-[6px] text-[#A8ABB2] transition hover:bg-[#FFF1F0] hover:text-[#F56C6C]"
            onClick={() => onDelete(node.id)}
            aria-label={`删除 ${node.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {node.children?.map((child) => (
        <OutlineNode
          key={child.id}
          depth={depth + 1}
          dragState={dragState}
          dropIndicator={dropIndicator}
          node={child}
          onDelete={onDelete}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onLevelChange={onLevelChange}
          onTitleChange={onTitleChange}
        />
      ))}
    </div>
  );
}

function OutlineEditor({
  copy,
  dragError,
  dragState,
  dropIndicator,
  locale,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onLevelChange,
  outlineReady,
  onTitleChange,
  onTreeTitleChange,
  outlineTree,
  titleDraft,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">
          {copy.titles.outline}
        </h2>
      </div>
      <div className="flex h-[60px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <input
          className="h-10 min-w-0 flex-1 border-none bg-transparent text-[20px] font-semibold leading-[30px] text-[#303133] outline-none placeholder:text-[#A8ABB2] focus:ring-0"
          value={titleDraft}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={locale === 'en-US' ? 'Enter article title' : '请输入文章标题'}
        />
      </div>
      <div className="flex h-[46px] flex-none items-center gap-5 border-b border-[#EBEEF5] px-7 text-[#606266]">
        <span className="text-[22px] leading-none">H</span>
        <span className="text-[22px] leading-none">T</span>
        <span className="text-[18px] leading-none">1 2</span>
        <span className="text-[22px] leading-none text-[#365EFF]">☷</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {dragError ? (
          <div className="mb-3 rounded-[6px] border border-[#FDECC8] bg-[#FFFBEB] px-3 py-2 text-[13px] font-medium text-[#C97900]">
            {dragError}
          </div>
        ) : null}
        {outlineReady ? (
          <div className="space-y-1">
            {outlineTree.map((node) => (
              <OutlineNode
                key={node.id}
                depth={0}
                dragState={dragState}
                dropIndicator={dropIndicator}
                node={node}
                onDelete={onDelete}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragStart={onDragStart}
                onDrop={onDrop}
                onLevelChange={onLevelChange}
                onTitleChange={onTreeTitleChange}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-[#DCDFE6] bg-[#FAFBFD] px-4 py-8 text-center text-[14px] leading-[22px] text-[#909399]">
            {locale === 'en-US'
              ? 'Waiting for the outline. H2/H3/H4 sections will appear here.'
              : '正在等待大纲生成，完成后将在这里展示 H2/H3/H4 树形结构。'}
          </div>
        )}
      </div>
    </div>
  );
}

function UnsavedDialog({ copy, onClose, onDiscard }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-[420px] max-w-full rounded-[12px] border border-[#EBEEF5] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">{copy.dialog.unsavedTitle}</h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#606266] hover:bg-[#F5F7FA]"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-5 text-[14px] leading-[22px] text-[#606266]">
          {copy.dialog.unsavedBody}
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#C8D2FF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
            onClick={onClose}
          >
            {copy.dialog.keepEditing}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0]"
            onClick={onDiscard}
          >
            {copy.dialog.discard}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogArticleAiOutlinePage({
  article,
  isHistoricalView = false,
  locale,
  onClose,
  onGenerateContent,
  onRestartStage,
  onStageChange,
  onTaskUpdated,
  project,
  t,
  task,
}) {
  // 大纲页同时管理任务播放状态、标题确认和可编辑大纲树。
  const copy = t.blogArticle.aiCreation;
  const demoData = useMemo(() => createOutlineDemoData(task, project), [project, task]);
  const workflow = demoData.workflow;
  // 播放展示来自任务快照，避免播放节拍导致页面本地状态重新初始化。
  const playbackState = useMemo(() => getInitialPlaybackState(workflow, task), [workflow, task]);
  const {
    completedTaskIds,
    currentTaskIndex,
    isComplete,
    selectedArtifactId,
    titleConfirmed,
    titlesVisible,
    visibleArtifactIds,
    visibleThinkingCounts,
  } = playbackState;
  const isStopped = task?.stage === 'outline-stopped' || Boolean(task?.outline?.isStopped);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [titleOptions, setTitleOptions] = useState(demoData.titleOptions);
  const [selectedTitleId, setSelectedTitleId] = useState(demoData.selectedTitleId);
  const [confirmedTitleId, setConfirmedTitleId] = useState(
    task?.outline?.confirmedTitleId || (playbackState.titleConfirmed ? demoData.selectedTitleId : ''),
  );
  const [titleDraft, setTitleDraft] = useState(task?.outline?.titleDraft || demoData.selectedTitle);
  const [outlineTree, setOutlineTree] = useState(cloneTree(task?.outline?.outlineTree?.length ? task.outline.outlineTree : demoData.outlineTree));
  const [savedTitleDraft, setSavedTitleDraft] = useState(task?.outline?.titleDraft || demoData.selectedTitle);
  const [savedOutlineTree, setSavedOutlineTree] = useState(cloneTree(task?.outline?.outlineTree?.length ? task.outline.outlineTree : demoData.outlineTree));
  const toast = useToast({ scope: `blog-ai-outline-${task.id}` });
  const [pendingAction, setPendingAction] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [dragError, setDragError] = useState('');
  const workflowRef = useRef(null);

  const currentTask = workflow[currentTaskIndex];
  const visibleTaskList = workflow.slice(0, Math.min(currentTaskIndex + 1, workflow.length));
  const visibleTaskGroups = useMemo(() => groupWorkflowTasks(visibleTaskList), [visibleTaskList]);
  const outlineDirty = titleDraft !== savedTitleDraft || JSON.stringify(outlineTree) !== JSON.stringify(savedOutlineTree);
  const currentArtifact = {
    ...demoData.artifacts.outline,
    outlineTree,
    subtitle: `标题：${titleDraft}`,
    titleDraft,
  };
  const outlineReady = visibleArtifactIds.includes('outline') || isComplete;
  const editorReady = titlesVisible || outlineReady;
  const stoppedToastId = `blog-ai-outline-stopped-${task.id}`;
  const isOutlineStopped = isStopped && task?.stage === 'outline-stopped';

  useEffect(() => {
    // 用户停留在任务流底部时自动跟随最新生成步骤。
    const container = workflowRef.current;
    if (!container || !autoScrollEnabled) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [autoScrollEnabled, completedTaskIds, currentTaskIndex, titlesVisible, visibleArtifactIds, visibleThinkingCounts]);

  useEffect(() => {
    if (!isOutlineStopped) return;

    toast.show({
      actions: [{ label: copy.actions.regenerate, closeOnClick: false, onClick: handleRegenerate }],
      duration: 0,
      id: stoppedToastId,
      message: locale === 'en-US' ? 'Task stopped. Go back to edit or' : '任务已中止，可返回上一步修改或',
      showClose: false,
      type: 'warning',
    });
  }, [isOutlineStopped, locale, stoppedToastId, task.id]);

  function handleWorkflowScroll() {
    // 距离底部较远说明用户正在查看历史步骤，暂停自动滚动。
    const container = workflowRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceToBottom < 48);
  }

  function persistOutline(overrides = {}) {
    // 大纲局部保存统一经过这里，便于保留当前标题和树结构。
    const nextTask = updateAiCreationTask(project.id, task.id, {
      outline: {
        currentArtifactId: selectedArtifactId,
        outlineTree,
        selectedTitleId,
        titleConfirmed,
        titleDraft,
        titleOptions,
        updatedAt: getTodayString(),
        ...overrides,
      },
    });
    onTaskUpdated?.(nextTask ?? task);
    return nextTask;
  }

  function executePendingAction(action) {
    // 未保存确认通过后，从这里恢复原本要执行的动作。
    if (!action) return;

    if (action.type === 'select-title') {
      selectTitle(action.option);
      return;
    }

    if (action.type === 'close') {
      onClose();
      return;
    }

    if (action.type === 'view-stage') {
      onStageChange?.(action.stage);
      return;
    }

    if (action.type === 'stop') {
      stopTask();
      return;
    }

    if (action.type === 'generate-content') {
      saveAndEnterContent();
    }
  }

  function requestAction(action) {
    // 大纲树或标题有未保存改动时，先确认再切换步骤或离开。
    if (outlineDirty) {
      setPendingAction(action);
      return;
    }

    executePendingAction(action);
  }

  function handleSelectTitle(option) {
    if (titleConfirmed) return;
    if (option.id === selectedTitleId && option.title === titleDraft) return;
    selectTitle(option);
  }

  function selectTitle(option) {
    setSelectedTitleId(option.id);
    setTitleDraft(option.title);
  }

  function handleRegenerateTitle(optionId) {
    if (titleConfirmed) return;

    const option = titleOptions.find((item) => item.id === optionId);
    if (!option) return;

    const pool = demoData.titleRegenerationPools?.[optionId] ?? [option.title];
    const currentIndex =
      Number.isInteger(option.variantIndex) && option.variantIndex >= 0
        ? option.variantIndex
        : Math.max(0, pool.indexOf(option.title));
    const nextIndex = (currentIndex + 1) % pool.length;
    const nextTitle = pool[nextIndex] || option.title;
    const nextTitleOptions = titleOptions.map((item) =>
      item.id === optionId ? { ...item, title: nextTitle, variantIndex: nextIndex } : item,
    );

    setTitleOptions(nextTitleOptions);
    if (selectedTitleId === optionId) {
      setTitleDraft(nextTitle);
    }

    const nextTask = updateAiCreationTask(project.id, task.id, {
      outline: {
        selectedTitleId,
        titleConfirmed,
        titleDraft: selectedTitleId === optionId ? nextTitle : titleDraft,
        titleOptions: nextTitleOptions,
        updatedAt: getTodayString(),
      },
    });
    onTaskUpdated?.(nextTask ?? task);
  }

  function handleConfirmTitle() {
    // 标题确认后才允许继续播放到大纲生成步骤。
    const nextTitle = titleDraft.trim();
    if (!selectedTitleId || !nextTitle) {
      toast.error('请先选择并确认文章标题');
      return;
    }

    const outlineTaskIndex = workflow.findIndex((item) => item.id === 'write-outline');
    const completedThroughTitle = workflow.slice(0, outlineTaskIndex).map((item) => item.id);
    const nextCompletedTaskIds = [...new Set([...completedTaskIds, ...completedThroughTitle])];
    const writeTitlesTask = workflow.find((item) => item.id === 'write-titles');
    const nextVisibleThinkingCounts = {
      ...visibleThinkingCounts,
      ...(writeTitlesTask ? { [writeTitlesTask.id]: writeTitlesTask.thinking.length } : {}),
    };
    const nextCurrentTaskIndex = outlineTaskIndex >= 0 ? outlineTaskIndex : currentTaskIndex;

    setConfirmedTitleId(selectedTitleId);
    setTitleDraft(nextTitle);
    setSavedTitleDraft(nextTitle);

    const nextTask = updateAiCreationTask(project.id, task.id, {
      stage: 'outline',
      outline: {
        completedTaskIds: nextCompletedTaskIds,
        confirmedTitleId: selectedTitleId,
        currentArtifactId: selectedArtifactId,
        isStopped: false,
        outlineTree,
        selectedTitleId,
        titleConfirmed: true,
        titleDraft: nextTitle,
        titleOptions,
        playback: {
          ...(task?.outline?.playback ?? {}),
          completedTaskIds: nextCompletedTaskIds,
          currentTaskIndex: nextCurrentTaskIndex,
          isComplete: false,
          selectedArtifactId,
          titleConfirmed: true,
          titlesVisible: true,
          visibleArtifactIds,
          visibleThinkingCounts: nextVisibleThinkingCounts,
        },
        updatedAt: getTodayString(),
      },
    });
    onTaskUpdated?.(nextTask ?? task);
  }

  function stopTask() {
    // 停止任务保留当前标题、大纲树和已完成步骤。
    if (isStopped || isComplete) return;

    const nextTask = updateAiCreationTask(project.id, task.id, {
      stage: 'outline-stopped',
      outline: {
        completedTaskIds,
        confirmedTitleId,
        currentArtifactId: selectedArtifactId || task?.outline?.currentArtifactId || '',
        isStopped: true,
        outlineTree,
        playback: {
          ...(task?.outline?.playback ?? {}),
          completedTaskIds,
          currentTaskIndex,
          isComplete: false,
          selectedArtifactId,
          titleConfirmed,
          titlesVisible,
          visibleArtifactIds,
          visibleThinkingCounts,
        },
        selectedTitleId,
        titleConfirmed,
        titleDraft,
        titleOptions,
        updatedAt: getTodayString(),
      },
    });
    onTaskUpdated?.(nextTask ?? task);
  }

  function handleStopTask() {
    requestAction({ type: 'stop' });
  }

  function handleRegenerate() {
    // 大纲中止后从已保存的策划输入重新开始，并清空大纲与正文产物。
    const nextTask = restartCollaborativeOutlineTask(project.id, task.id);
    toast.dismiss(stoppedToastId);
    onRestartStage?.({ article, stage: 'outline', task: nextTask ?? task });
  }

  function handleArtifactClick(artifactId) {
    const nextTask = updateAiCreationTask(project.id, task.id, {
      outline: {
        currentArtifactId: artifactId,
        playback: {
          ...(task?.outline?.playback ?? {}),
          selectedArtifactId: artifactId,
        },
      },
    });
    onTaskUpdated?.(nextTask ?? task);
  }

  function handleDiscardUnsaved() {
    // 丢弃改动后恢复上次保存的标题和大纲树。
    const action = pendingAction;
    setPendingAction(null);
    setTitleDraft(savedTitleDraft);
    setOutlineTree(cloneTree(savedOutlineTree));

    executePendingAction(action);
  }

  function handleDragStart(event, node) {
    setDragState({ nodeId: node.id, node });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', node.id);
  }

  function getDropPosition(event, targetNode) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    if (offsetY < rect.height * 0.28) return 'before';
    if (offsetY > rect.height * 0.72) return 'after';
    return targetNode.level === 'H4' ? 'after' : 'inside';
  }

  function handleDragOver(event, targetNode) {
    if (!dragState) return;

    event.preventDefault();
    const position = getDropPosition(event, targetNode);
    setDropIndicator({ position, targetId: targetNode.id });
  }

  function handleDrop(event, targetNode) {
    // 拖拽落点校验通过后，先移除原节点再插入目标位置。
    event.preventDefault();
    if (!dragState) return;

    const position = dropIndicator?.targetId === targetNode.id ? dropIndicator.position : getDropPosition(event, targetNode);
    const validation = canDropNode({ draggedNode: dragState.node, position, targetNode });
    if (!validation.ok) {
      setDragError(validation.reason);
      setDragState(null);
      setDropIndicator(null);
      return;
    }

    const removed = removeNodeById(outlineTree, dragState.nodeId);
    if (!removed.removedNode) {
      setDragState(null);
      setDropIndicator(null);
      return;
    }

    const targetLevelIndex = getTargetLevelIndex(targetNode, position);
    const normalizedNode = normalizeNodeLevel(removed.removedNode, targetLevelIndex);
    const inserted = insertNodeByTarget(removed.nodes, targetNode.id, normalizedNode, position);

    if (inserted.inserted) {
      setOutlineTree(inserted.nodes);
      setDragError('');
    }

    setDragState(null);
    setDropIndicator(null);
  }

  function handleDragEnd() {
    setDragState(null);
    setDropIndicator(null);
  }

  function handleDeleteNode(nodeId) {
    const removed = removeNodeById(outlineTree, nodeId);
    setOutlineTree(removed.nodes);
  }

  function handleLevelChange(nodeId, level) {
    setOutlineTree((current) => updateNodeLevel(current, nodeId, level));
    setDragError('');
  }

  function saveAndEnterContent() {
    // 进入正文前保存最终标题和大纲树，并初始化正文阶段状态。
    if (isOutlineStopped) {
      handleRegenerate();
      return;
    }

    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      toast.error(locale === 'en-US' ? 'Title cannot be empty.' : '文章标题不能为空，无法生成内容');
      return;
    }

    if (!outlineTree.length) {
      toast.error(locale === 'en-US' ? 'Outline cannot be empty.' : '文章大纲不能为空，无法生成内容');
      return;
    }

    const nextTree = cloneTree(outlineTree);
    const nextCompletedTaskIds = workflow.map((item) => item.id);

    setTitleDraft(nextTitle);
    setSavedTitleDraft(nextTitle);
    setSavedOutlineTree(nextTree);
    setConfirmedTitleId((current) => current || selectedTitleId);

    const nextTask = startCollaborativeContentTask(project.id, task.id, {
        completedTaskIds: nextCompletedTaskIds,
        confirmedTitleId: confirmedTitleId || selectedTitleId,
        currentArtifactId: 'outline',
        isStopped: false,
        outlineTree: nextTree,
        playback: {
          completedTaskIds: nextCompletedTaskIds,
          currentTaskIndex: workflow.length,
          isComplete: true,
          selectedArtifactId: 'outline',
          titleConfirmed: true,
          titlesVisible: true,
          visibleArtifactIds: ['outline'],
          visibleThinkingCounts: Object.fromEntries(workflow.map((item) => [item.id, item.thinking.length])),
        },
        selectedTitleId,
        titleConfirmed: true,
        titleDraft: nextTitle,
        titleOptions,
        updatedAt: getTodayString(),
    });
    onGenerateContent?.({ article, task: nextTask ?? task });
  }

  function handleGenerateContent() {
    saveAndEnterContent();
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <style>
        {`
          @keyframes aiOutlineFadeInUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <CollaborativeCreationHeader
        copy={copy}
        onBack={() => requestAction({ type: 'close' })}
        onStageChange={(stage) => requestAction({ stage, type: 'view-stage' })}
        stageStatuses={getCollaborativeStageStatuses(task)}
        title={copy.titles.outline}
        viewStage="outline"
      />

      <main className="mx-auto grid max-w-[1600px] grid-cols-2 gap-4 px-6 pb-[84px] pt-[68px]">
        <section
          ref={workflowRef}
          className="h-[calc(100vh-152px)] overflow-y-auto rounded-[8px] bg-white px-8 py-7 shadow-[0_2px_10px_rgba(31,45,61,0.04)]"
          onScroll={handleWorkflowScroll}
        >
          <div className="space-y-1">
            {visibleTaskGroups.map((group) => (
              <WorkflowAgentGroup
                key={group.id}
                completedTaskIds={completedTaskIds}
                copy={copy}
                currentArtifact={currentArtifact}
                currentTask={currentTask}
                group={group}
                isStopped={isStopped}
                locale={locale}
                onArtifactClick={handleArtifactClick}
                onConfirmTitle={handleConfirmTitle}
                onRegenerateTitle={handleRegenerateTitle}
                onSelectTitle={handleSelectTitle}
                selectedArtifactId={selectedArtifactId}
                selectedTitleId={selectedTitleId}
                titleConfirmed={titleConfirmed}
                titleOptions={titleOptions}
                titlesVisible={titlesVisible}
                visibleArtifactIds={visibleArtifactIds}
                visibleThinkingCounts={visibleThinkingCounts}
              />
            ))}
          </div>
        </section>

        <section className="h-[calc(100vh-152px)] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
          {editorReady ? (
            <OutlineEditor
              copy={copy}
              dragError={dragError}
              dragState={dragState}
              dropIndicator={dropIndicator}
              locale={locale}
              onDelete={handleDeleteNode}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onLevelChange={handleLevelChange}
              outlineReady={outlineReady}
              onTitleChange={setTitleDraft}
              onTreeTitleChange={(nodeId, title) => setOutlineTree((current) => updateNodeTitle(current, nodeId, title))}
              outlineTree={outlineTree}
              titleDraft={titleDraft}
            />
          ) : (
            <EmptyEditor copy={copy} />
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#EBEEF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-end px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:border-[#DCDFE6] disabled:text-[#A8ABB2] disabled:hover:bg-white"
              disabled={isHistoricalView || isComplete || isStopped}
              onClick={handleStopTask}
            >
              {copy.actions.stop}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] bg-[#365EFF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
              disabled={isHistoricalView || (isOutlineStopped ? false : !isComplete || isStopped)}
              onClick={handleGenerateContent}
            >
              {isOutlineStopped ? copy.actions.regenerateOutline : copy.actions.generateContent}
            </button>
          </div>
        </div>
      </footer>

      {pendingAction ? (
        <UnsavedDialog copy={copy} onClose={() => setPendingAction(null)} onDiscard={handleDiscardUnsaved} />
      ) : null}
    </div>
  );
}
