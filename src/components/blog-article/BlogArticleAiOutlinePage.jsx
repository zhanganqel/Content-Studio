import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  GripVertical,
  PauseCircle,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Toast from '../ui/Toast.jsx';
import { getAgentDisplay } from './agentDisplay.js';
import {
  createOutlineDemoData,
  resetAiOutlineTask,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';

const stepItems = ['创建任务', '文章策划', '标题大纲', '内容生成'];
const outlineLevels = ['H2', 'H3', 'H4'];
const postOutlineStages = new Set(['content', 'content-completed', 'content-stopped']);

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

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
    titleConfirmed: false,
    titlesVisible: false,
    visibleArtifactIds: [],
    visibleThinkingCounts: {},
  };
}

function Stepper() {
  return (
    <div className="flex flex-1 items-center justify-center gap-5">
      {stepItems.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold ${
              index === 2 ? 'bg-[#365EFF] text-white' : 'bg-[#E9ECF2] text-[#A8ABB2]'
            }`}
          >
            {index + 1}
          </span>
          <span className={`text-[14px] font-semibold ${index === 2 ? 'text-[#303133]' : 'text-[#A8ABB2]'}`}>
            {step}
          </span>
          {index < stepItems.length - 1 ? <span className="h-px w-16 bg-[#E4E7ED]" /> : null}
        </div>
      ))}
    </div>
  );
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

function StatusIcon({ completed, stopped }) {
  if (completed) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#10B981] text-[#10B981]">
        <Check className="h-3 w-3" />
      </span>
    );
  }

  if (stopped) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#F59E0B] text-[#F59E0B]">
        <PauseCircle className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#365EFF] border-t-transparent">
      <span className="h-1.5 w-1.5 rounded-full bg-[#365EFF]" />
    </span>
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
}) {
  return (
    <div className="ml-2 space-y-3 border-l-2 border-[#E4E7ED] pl-5">
      <div className="text-[14px] font-semibold leading-[22px] text-[#303133]">请在以下标题中进行选择：</div>
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
            标题已确认
          </span>
        ) : (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
            disabled={!selectedTitleId}
            onClick={onConfirmTitle}
          >
            确认标题
          </button>
        )}
      </div>
    </div>
  );
}

function WorkflowTask({
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
}) {
  const agentDisplay = getAgentDisplay(task.agentTitle, locale);

  return (
    <section className="flex gap-4">
      <AgentAvatar agentTitle={task.agentTitle} />
      <div className="min-w-0 flex-1 pb-8">
        <div className="text-[15px] font-semibold leading-[24px] text-[#303133]">{agentDisplay.name}</div>
        <div className="mt-3 flex items-start gap-3">
          <StatusIcon completed={completed} stopped={isStopped && isCurrent && !completed} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold leading-[20px] text-[#303133]">
              {completed
                ? `${task.taskName}完成`
                : isStopped && isCurrent
                  ? `${task.taskName}已中止`
                  : task.runningText}
            </div>
            <div className="mt-3 space-y-4">
              {task.thinking.slice(0, thinkingCount).map((paragraph, index) => (
                <ThinkingBlock key={`${task.id}-thinking-${index}`}>{paragraph}</ThinkingBlock>
              ))}
              {showTitleSelection ? (
                <TitleSelection
                  onConfirmTitle={onConfirmTitle}
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
      </div>
    </section>
  );
}

function EmptyEditor() {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <div>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[#365EFF]">
          <FileText className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold leading-[28px] text-[#303133]">等待标题与大纲生成</h2>
        <p className="mt-2 text-[14px] leading-[22px] text-[#909399]">
          标题选择后会自动填写到右侧，文章大纲生成后可拖拽编辑。
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
  dragError,
  dragState,
  dropIndicator,
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
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">文章大纲</h2>
      </div>
      <div className="flex h-[60px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <input
          className="h-10 min-w-0 flex-1 border-none bg-transparent text-[20px] font-semibold leading-[30px] text-[#303133] outline-none placeholder:text-[#A8ABB2] focus:ring-0"
          value={titleDraft}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="请输入文章标题"
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
            正在等待大纲生成，完成后将在这里展示 H2/H3/H4 树形结构。
          </div>
        )}
      </div>
    </div>
  );
}

function UnsavedDialog({ onClose, onDiscard }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-[420px] max-w-full rounded-[12px] border border-[#EBEEF5] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">内容未保存</h2>
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
          当前标题或大纲尚未保存，是否放弃本次修改？
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#C8D2FF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
            onClick={onClose}
          >
            继续编辑
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0]"
            onClick={onDiscard}
          >
            放弃修改
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogArticleAiOutlinePage({ article, locale, onBack, onClose, onGenerateContent, project, task }) {
  const demoData = useMemo(() => createOutlineDemoData(task, project), [project, task]);
  const workflow = demoData.workflow;
  const initialPlaybackState = useMemo(() => getInitialPlaybackState(workflow, task), [workflow, task]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialPlaybackState.currentTaskIndex);
  const [visibleThinkingCounts, setVisibleThinkingCounts] = useState(initialPlaybackState.visibleThinkingCounts);
  const [visibleArtifactIds, setVisibleArtifactIds] = useState(initialPlaybackState.visibleArtifactIds);
  const [completedTaskIds, setCompletedTaskIds] = useState(initialPlaybackState.completedTaskIds);
  const [isComplete, setIsComplete] = useState(initialPlaybackState.isComplete);
  const [isStopped, setIsStopped] = useState(task?.stage === 'outline-stopped' || Boolean(task?.outline?.isStopped));
  const [titlesVisible, setTitlesVisible] = useState(initialPlaybackState.titlesVisible);
  const [titleConfirmed, setTitleConfirmed] = useState(initialPlaybackState.titleConfirmed);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [selectedArtifactId, setSelectedArtifactId] = useState(initialPlaybackState.visibleArtifactIds[0] ?? '');
  const [titleOptions, setTitleOptions] = useState(demoData.titleOptions);
  const [selectedTitleId, setSelectedTitleId] = useState(demoData.selectedTitleId);
  const [confirmedTitleId, setConfirmedTitleId] = useState(
    task?.outline?.confirmedTitleId || (initialPlaybackState.titleConfirmed ? demoData.selectedTitleId : ''),
  );
  const [titleDraft, setTitleDraft] = useState(task?.outline?.titleDraft || demoData.selectedTitle);
  const [outlineTree, setOutlineTree] = useState(cloneTree(task?.outline?.outlineTree?.length ? task.outline.outlineTree : demoData.outlineTree));
  const [savedTitleDraft, setSavedTitleDraft] = useState(task?.outline?.titleDraft || demoData.selectedTitle);
  const [savedOutlineTree, setSavedOutlineTree] = useState(cloneTree(task?.outline?.outlineTree?.length ? task.outline.outlineTree : demoData.outlineTree));
  const [toast, setToast] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [dragError, setDragError] = useState('');
  const workflowRef = useRef(null);

  const currentTask = workflow[currentTaskIndex];
  const visibleTaskList = workflow.slice(0, Math.min(currentTaskIndex + 1, workflow.length));
  const outlineDirty = titleDraft !== savedTitleDraft || JSON.stringify(outlineTree) !== JSON.stringify(savedOutlineTree);
  const currentArtifact = {
    ...demoData.artifacts.outline,
    outlineTree,
    subtitle: `标题：${titleDraft}`,
    titleDraft,
  };
  const outlineReady = visibleArtifactIds.includes('outline') || isComplete;
  const editorReady = titlesVisible || outlineReady;

  useEffect(() => {
    const nextStage = isPostOutlineStage(task?.stage)
      ? task.stage
      : isComplete
        ? 'outline-completed'
        : isStopped
          ? 'outline-stopped'
          : 'outline';

    updateAiCreationTask(project.id, task.id, {
      stage: nextStage,
      outline: {
        completedTaskIds,
        confirmedTitleId,
        currentArtifactId: selectedArtifactId || task?.outline?.currentArtifactId || '',
        isStopped,
        outlineTree,
        selectedTitleId,
        titleConfirmed,
        titleDraft,
        titleOptions,
        updatedAt: getTodayString(),
      },
    });
  }, []);

  useEffect(() => {
    if (!toast || toast.actionLabel) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (isStopped || isComplete || !currentTask) {
      return undefined;
    }

    const thinkingCount = visibleThinkingCounts[currentTask.id] ?? 0;
    const hasMoreThinking = thinkingCount < currentTask.thinking.length;
    const titleSelectionVisible = !currentTask.titleSelection || titlesVisible;
    const artifactVisible = !currentTask.artifactId || visibleArtifactIds.includes(currentTask.artifactId);

    if (currentTask.titleSelection && titleSelectionVisible && !titleConfirmed) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (hasMoreThinking) {
        setVisibleThinkingCounts((current) => ({
          ...current,
          [currentTask.id]: (current[currentTask.id] ?? 0) + 1,
        }));
        return;
      }

      if (currentTask.titleSelection && !titleSelectionVisible) {
        setTitlesVisible(true);
        setTitleDraft((current) => current || demoData.selectedTitle);
        return;
      }

      if (!artifactVisible && currentTask.artifactId) {
        setVisibleArtifactIds((current) =>
          current.includes(currentTask.artifactId) ? current : [...current, currentTask.artifactId],
        );
        setSelectedArtifactId(currentTask.artifactId);
        return;
      }

      const nextCompletedTaskIds = completedTaskIds.includes(currentTask.id)
        ? completedTaskIds
        : [...completedTaskIds, currentTask.id];
      setCompletedTaskIds(nextCompletedTaskIds);

      if (currentTaskIndex + 1 >= workflow.length) {
        setIsComplete(true);
        updateAiCreationTask(project.id, task.id, {
          stage: 'outline-completed',
          outline: {
            completedTaskIds: nextCompletedTaskIds,
            confirmedTitleId,
            currentArtifactId: 'outline',
            isStopped: false,
            outlineTree,
            selectedTitleId,
            titleConfirmed,
            titleDraft,
            titleOptions,
            updatedAt: getTodayString(),
          },
        });
        return;
      }

      setCurrentTaskIndex((current) => current + 1);
    }, hasMoreThinking ? 950 : 650);

    return () => window.clearTimeout(timer);
  }, [
    completedTaskIds,
    confirmedTitleId,
    currentTask,
    currentTaskIndex,
    demoData.selectedTitle,
    isComplete,
    isStopped,
    outlineTree,
    project.id,
    selectedTitleId,
    task.id,
    titleConfirmed,
    titleDraft,
    titleOptions,
    titlesVisible,
    visibleArtifactIds,
    visibleThinkingCounts,
    workflow.length,
  ]);

  useEffect(() => {
    const container = workflowRef.current;
    if (!container || !autoScrollEnabled) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [autoScrollEnabled, completedTaskIds, currentTaskIndex, titlesVisible, visibleArtifactIds, visibleThinkingCounts]);

  function handleWorkflowScroll() {
    const container = workflowRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceToBottom < 48);
  }

  function persistOutline(overrides = {}) {
    return updateAiCreationTask(project.id, task.id, {
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
  }

  function executePendingAction(action) {
    if (!action) return;

    if (action.type === 'select-title') {
      selectTitle(action.option);
      return;
    }

    if (action.type === 'back') {
      onBack();
      return;
    }

    if (action.type === 'close') {
      onClose();
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

    updateAiCreationTask(project.id, task.id, {
      outline: {
        selectedTitleId,
        titleConfirmed,
        titleDraft: selectedTitleId === optionId ? nextTitle : titleDraft,
        titleOptions: nextTitleOptions,
        updatedAt: getTodayString(),
      },
    });
  }

  function handleConfirmTitle() {
    const nextTitle = titleDraft.trim();
    if (!selectedTitleId || !nextTitle) {
      setToast({ message: '请先选择并确认文章标题', type: 'error' });
      return;
    }

    const outlineTaskIndex = workflow.findIndex((item) => item.id === 'write-outline');
    const completedThroughTitle = workflow.slice(0, outlineTaskIndex).map((item) => item.id);
    const nextCompletedTaskIds = [...new Set([...completedTaskIds, ...completedThroughTitle])];
    const writeTitlesTask = workflow.find((item) => item.id === 'write-titles');

    setTitleConfirmed(true);
    setConfirmedTitleId(selectedTitleId);
    setTitleDraft(nextTitle);
    setSavedTitleDraft(nextTitle);
    setCompletedTaskIds(nextCompletedTaskIds);
    setVisibleThinkingCounts((current) => ({
      ...current,
      ...(writeTitlesTask ? { [writeTitlesTask.id]: writeTitlesTask.thinking.length } : {}),
    }));
    if (outlineTaskIndex >= 0) {
      setCurrentTaskIndex(outlineTaskIndex);
    }

    updateAiCreationTask(project.id, task.id, {
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
        updatedAt: getTodayString(),
      },
    });
  }

  function stopTask() {
    if (isStopped || isComplete) return;

    setIsStopped(true);
    updateAiCreationTask(project.id, task.id, {
      stage: 'outline-stopped',
      outline: {
        completedTaskIds,
        confirmedTitleId,
        currentArtifactId: selectedArtifactId,
        isStopped: true,
        outlineTree,
        selectedTitleId,
        titleConfirmed,
        titleDraft,
        titleOptions,
        updatedAt: getTodayString(),
      },
    });
    setToast({
      actionLabel: '重新生成',
      message: '任务已中止，可返回上一步修改或重新生成',
      type: 'warning',
    });
  }

  function handleStopTask() {
    requestAction({ type: 'stop' });
  }

  function handleRegenerate() {
    resetAiOutlineTask(project.id, task.id);
    window.location.reload();
  }

  function handleDiscardUnsaved() {
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
    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      setToast({ message: '文章标题不能为空，无法生成内容', type: 'error' });
      return;
    }

    if (!outlineTree.length) {
      setToast({ message: '文章大纲不能为空，无法生成内容', type: 'error' });
      return;
    }

    const nextTree = cloneTree(outlineTree);
    const nextCompletedTaskIds = workflow.map((item) => item.id);

    setTitleDraft(nextTitle);
    setSavedTitleDraft(nextTitle);
    setSavedOutlineTree(nextTree);
    setTitleConfirmed(true);
    setConfirmedTitleId((current) => current || selectedTitleId);
    setCompletedTaskIds(nextCompletedTaskIds);
    setIsComplete(true);

    const nextTask = updateAiCreationTask(project.id, task.id, {
      content: {
        currentArtifactId: '',
        isStopped: false,
        updatedAt: getTodayString(),
      },
      stage: 'content',
      outline: {
        completedTaskIds: nextCompletedTaskIds,
        confirmedTitleId: confirmedTitleId || selectedTitleId,
        currentArtifactId: 'outline',
        isStopped: false,
        outlineTree: nextTree,
        selectedTitleId,
        titleConfirmed: true,
        titleDraft: nextTitle,
        titleOptions,
        updatedAt: getTodayString(),
      },
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
      <header className="fixed left-0 right-0 top-0 z-40 h-[52px] border-b border-[#EBEEF5] bg-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center px-6">
          <button
            type="button"
            className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#232E45] transition hover:bg-[#F5F7FA]"
            onClick={() => requestAction({ type: 'close' })}
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="w-[360px] text-[18px] font-bold leading-[28px] text-[#232E45]">AI 创作-标题大纲</h1>
          <Stepper />
          <div className="w-[360px] text-right text-[13px] text-[#909399]">
            {article?.title ? `草稿：${article.title}` : ''}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-2 gap-4 px-6 pb-[84px] pt-[68px]">
        <section
          ref={workflowRef}
          className="h-[calc(100vh-152px)] overflow-y-auto rounded-[8px] bg-white px-8 py-7 shadow-[0_2px_10px_rgba(31,45,61,0.04)]"
          onScroll={handleWorkflowScroll}
        >
          <div className="space-y-1">
            {visibleTaskList.map((workflowTask) => {
              const artifact = workflowTask.artifactId ? currentArtifact : null;
              const completed = completedTaskIds.includes(workflowTask.id);
              const isCurrent = workflowTask.id === currentTask?.id && !completed;

              return (
                <WorkflowTask
                  key={workflowTask.id}
                  artifact={artifact}
                  completed={completed}
                  isCurrent={isCurrent}
                  isStopped={isStopped}
                  locale={locale}
                  onArtifactClick={setSelectedArtifactId}
                  onConfirmTitle={handleConfirmTitle}
                  onRegenerateTitle={handleRegenerateTitle}
                  onSelectTitle={handleSelectTitle}
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
        </section>

        <section className="h-[calc(100vh-152px)] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
          {editorReady ? (
            <OutlineEditor
              dragError={dragError}
              dragState={dragState}
              dropIndicator={dropIndicator}
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
            <EmptyEditor />
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#EBEEF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-6">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
            onClick={() => requestAction({ type: 'back' })}
          >
            上一步
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:border-[#DCDFE6] disabled:text-[#A8ABB2] disabled:hover:bg-white"
              disabled={isComplete || isStopped}
              onClick={handleStopTask}
            >
              中止任务
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[#365EFF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
              disabled={!isComplete || isStopped}
              onClick={handleGenerateContent}
            >
              生成内容
            </button>
          </div>
        </div>
      </footer>

      {toast ? (
        <Toast
          actionLabel={toast.actionLabel}
          message={toast.message}
          onAction={toast.actionLabel ? handleRegenerate : undefined}
          onClose={toast.actionLabel ? () => setToast(null) : undefined}
          type={toast.type}
        />
      ) : null}

      {pendingAction ? (
        <UnsavedDialog onClose={() => setPendingAction(null)} onDiscard={handleDiscardUnsaved} />
      ) : null}
    </div>
  );
}
