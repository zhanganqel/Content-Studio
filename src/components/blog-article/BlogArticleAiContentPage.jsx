import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  PauseCircle,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Toast from '../ui/Toast.jsx';
import AiCreationStepLabel from './AiCreationStepLabel.jsx';
import { formatTaskState, getTaskCompletedText, getTaskName, getTaskRunningText } from './aiTaskText.js';
import { getAgentDisplay } from './agentDisplay.js';
import {
  createContentDemoData,
  resetAiContentTask,
  splitAiKeywordText,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';
import { createBlogArticleId, getTodayString, upsertBlogArticle } from '../../services/blogArticleStore.js';

function getArtifactIcon(type) {
  // 按产物类型选择预览卡片图标。
  if (type === 'evaluation') return ClipboardList;
  if (type === 'tdk') return Sparkles;
  if (type === 'references') return BookOpen;
  return FileText;
}

function getLocalizedArtifactText(artifact, field, locale) {
  // 英文环境优先读取对应的英文展示字段。
  const localizedField = `${field}En`;
  return locale === 'en-US' && artifact?.[localizedField] ? artifact[localizedField] : artifact?.[field];
}

function openAppViewInNewTab(params) {
  // 使用查询参数打开指定页面，避免影响当前生成流程。
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.search = '';
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function getArtifactIdsFromItem(item) {
  // 兼容单个产物和多个产物两种历史数据结构。
  return item?.artifactIds ?? (item?.artifactId ? [item.artifactId] : []);
}

function getTaskSteps(task) {
  // 将单步任务归一为 steps 数组，方便统一播放。
  if (Array.isArray(task?.steps) && task.steps.length) {
    return task.steps.map((step, index) => ({
      ...step,
      artifactIds: getArtifactIdsFromItem(step),
      id: step.id ?? `${task.id}-step-${index}`,
      thinking: step.thinking ?? [],
    }));
  }

  return [
    {
      ...task,
      artifactIds: getArtifactIdsFromItem(task),
      id: task?.id,
      thinking: task?.thinking ?? [],
    },
  ];
}

function getStepRevealCount(step) {
  // 每个步骤按思考内容和来源列表分段逐步展示。
  return (step?.thinking?.length ?? 0) + (step?.sourceList ? 1 : 0);
}

function getTaskArtifactIds(task) {
  return getTaskSteps(task).flatMap((step) => step.artifactIds).filter(Boolean);
}

function getWorkflowArtifactIds(workflow) {
  return workflow.flatMap((item) => getTaskArtifactIds(item)).filter(Boolean);
}

function getWorkflowThinkingCounts(workflow, endIndex = workflow.length) {
  // 生成已完成任务的完整思考展示进度。
  return Object.fromEntries(
    workflow
      .slice(0, endIndex)
      .flatMap((item) => getTaskSteps(item).map((step) => [step.id, getStepRevealCount(step)])),
  );
}

function isStepDone(step, visibleThinkingCounts, visibleArtifactIds) {
  // 思考内容和产物都可见后，当前步骤才算完成。
  const thinkingCount = visibleThinkingCounts[step.id] ?? 0;
  const allArtifactsVisible = step.artifactIds.every((artifactId) => visibleArtifactIds.includes(artifactId));
  return thinkingCount >= getStepRevealCount(step) && allArtifactsVisible;
}

function isStepReachable(steps, stepIndex, visibleThinkingCounts, visibleArtifactIds, taskCompleted) {
  // 后续步骤必须等待前置步骤完成后再出现。
  if (taskCompleted) return true;
  if (stepIndex === 0) return true;

  return steps
    .slice(0, stepIndex)
    .every((step) => isStepDone(step, visibleThinkingCounts, visibleArtifactIds));
}

function getActiveStepState(task, visibleThinkingCounts, visibleArtifactIds) {
  // 定位当前任务里第一个尚未完全展示的步骤。
  const steps = getTaskSteps(task);
  const step = steps.find((candidate) => !isStepDone(candidate, visibleThinkingCounts, visibleArtifactIds));

  if (!step) {
    return {
      allArtifactsVisible: true,
      artifactIds: [],
      complete: true,
      hasMoreThinking: false,
      step: null,
      thinkingCount: 0,
    };
  }

  const thinkingCount = visibleThinkingCounts[step.id] ?? 0;
  const artifactIds = step.artifactIds;
  const allArtifactsVisible = artifactIds.every((artifactId) => visibleArtifactIds.includes(artifactId));

  return {
    allArtifactsVisible,
    artifactIds,
    complete: false,
    hasMoreThinking: thinkingCount < getStepRevealCount(step),
    step,
    thinkingCount,
  };
}

function getInitialPlaybackState(workflow, task) {
  // 根据任务缓存恢复已完成、已中止或首次进入的播放状态。
  const alreadyCompleted = task?.stage === 'content-completed';
  const savedCompletedTaskIds = task?.content?.completedTaskIds ?? [];
  const savedArtifactId = task?.content?.currentArtifactId ?? '';
  const savedVisibleArtifactIds = task?.content?.visibleArtifactIds ?? [];

  if (alreadyCompleted) {
    return {
      completedTaskIds: workflow.map((item) => item.id),
      currentTaskIndex: workflow.length,
      isComplete: true,
      selectedArtifactId: savedArtifactId,
      visibleArtifactIds: getWorkflowArtifactIds(workflow),
      visibleThinkingCounts: getWorkflowThinkingCounts(workflow),
    };
  }

  if (task?.stage === 'content-stopped' && savedCompletedTaskIds.length) {
    const currentTaskIndex = Math.min(savedCompletedTaskIds.length, workflow.length - 1);
    return {
      completedTaskIds: savedCompletedTaskIds,
      currentTaskIndex,
      isComplete: false,
      selectedArtifactId: savedArtifactId,
      visibleArtifactIds: savedVisibleArtifactIds,
      visibleThinkingCounts: getWorkflowThinkingCounts(workflow, currentTaskIndex + 1),
    };
  }

  return {
    completedTaskIds: [],
    currentTaskIndex: 0,
    isComplete: false,
    selectedArtifactId: '',
    visibleArtifactIds: [],
    visibleThinkingCounts: {},
  };
}

function Stepper({ copy }) {
  return (
    /* 顶部步骤条固定高亮正文生成阶段。 */
    <div className="flex flex-1 items-center justify-center gap-5">
      {copy.steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold ${
              index === 3 ? 'bg-[#365EFF] text-white' : 'bg-[#E9ECF2] text-[#A8ABB2]'
            }`}
          >
            {index + 1}
          </span>
          <AiCreationStepLabel active={index === 3} step={step} />
          {index < copy.steps.length - 1 ? <span className="h-px w-16 bg-[#E4E7ED]" /> : null}
        </div>
      ))}
    </div>
  );
}

function AgentAvatar({ agentTitle }) {
  // 根据 Agent 名称生成统一头像样式。
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
  // 步骤图标区分完成、中止和进行中状态。
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
  // 加粗包裹的思考文本显示为强调段落。
  const text = typeof children === 'string' ? children : '';
  const emphasisMatch = text.match(/^\*\*(.*)\*\*$/);

  return (
    <div
      className={`ml-2 border-l-2 pl-5 text-[14px] leading-[22px] ${
        emphasisMatch
          ? 'border-[#365EFF] font-semibold text-[#303133]'
          : 'border-[#E4E7ED] text-[#606266]'
      }`}
      style={{ animation: 'aiContentFadeInUp 180ms ease-out both' }}
    >
      {emphasisMatch ? emphasisMatch[1] : children}
    </div>
  );
}

function ArtifactCard({ artifact, locale, onClick, selected }) {
  // 产物卡片负责在流程中暴露可点击预览入口。
  const Icon = getArtifactIcon(artifact.type);
  const title = getLocalizedArtifactText(artifact, 'title', locale);
  const subtitle = getLocalizedArtifactText(artifact, 'subtitle', locale);

  return (
    <button
      type="button"
      className={`ml-2 flex h-[78px] w-[520px] max-w-full items-center gap-3 rounded-[8px] border p-4 text-left transition hover:border-[#365EFF] hover:bg-[#F5F7FF] ${
        selected ? 'border-[#365EFF] bg-[#EEF3FF]' : 'border-[#DCDFE6] bg-white'
      }`}
      onClick={onClick}
    >
      <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-[8px] bg-[#5B7CFF] text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-[22px] text-[#303133]">{title}</span>
        <span className="mt-0.5 block truncate text-[13px] leading-[20px] text-[#606266]">{subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 flex-none text-[#A8ABB2]" />
    </button>
  );
}

function StepSourceList({ locale, sourceList }) {
  // 来源列表按资料、媒体、链接和普通标签分别渲染。
  const items = sourceList?.items ?? [];
  const isEnglish = locale === 'en-US';

  return (
    <div
      className="ml-2 border-l-2 border-[#E4E7ED] pl-5"
      style={{ animation: 'aiContentFadeInUp 180ms ease-out both' }}
    >
      {items.length ? (
        sourceList.variant === 'knowledge-assets' ? (
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {items.map((item) => (
              <span key={item.id} className="inline-flex min-w-0 max-w-[240px] items-center gap-2 text-[14px] leading-[22px] text-[#303133]">
                <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-[4px] bg-[#365EFF] text-white">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{item.label}</span>
              </span>
            ))}
          </div>
        ) : sourceList.variant === 'media' ? (
          <div className="flex flex-wrap gap-3">
            {items.map((item) => (
              <figure key={item.id} className="w-[132px]">
                <img
                  alt={item.alt || item.label}
                  className="h-[96px] w-[132px] rounded-[6px] border border-[#EBEEF5] object-cover"
                  src={item.imageUrl}
                />
                <figcaption className="mt-1 truncate text-[12px] leading-[18px] text-[#606266]" title={item.label}>
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : sourceList.variant === 'links' ? (
          <div className="space-y-3">
            {['knowledge', 'company', 'authority'].map((group) => {
              const groupItems = items.filter((item) => item.group === group);
              if (!groupItems.length) return null;

              const groupLabels = {
                authority: isEnglish ? 'Authority Links' : '权威参考链接',
                company: isEnglish ? 'Company Links' : '公司相关链接',
                knowledge: isEnglish ? 'Knowledge Item Links' : '知识条目链接',
              };

              return (
                <div key={group}>
                  <div className="mb-2 text-[12px] font-semibold leading-[18px] text-[#909399]">{groupLabels[group]}</div>
                  <div className="flex flex-wrap gap-2">
                    {groupItems.map((item) => (
                      <a
                        key={item.id}
                        className="inline-flex max-w-[320px] items-center gap-1.5 rounded-full border border-[#C7D2FE] bg-[#EEF3FF] px-3 py-1 text-[14px] font-semibold leading-[20px] text-[#365EFF] transition hover:border-[#365EFF] hover:bg-[#E5ECFF]"
                        href={item.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-none" />
                        <span className="truncate">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-[260px] items-center rounded-full border border-[#C7D2FE] bg-[#EEF3FF] px-3 py-1 text-[14px] font-semibold leading-[20px] text-[#365EFF]"
              >
                <span className="truncate">{item.label}</span>
              </span>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-[6px] border border-dashed border-[#DCDFE6] bg-[#F7F8FB] px-3 py-2 text-[13px] leading-[20px] text-[#909399]">
          {isEnglish && sourceList.emptyTextEn ? sourceList.emptyTextEn : sourceList.emptyText}
        </div>
      )}
    </div>
  );
}

function RevisionRequestBox({ copy, disabled, locale, onChange, onSubmit, value }) {
  return (
    /* 终稿评估通过后展示的二次修改输入区。 */
    <form
      className={`ml-14 mb-8 w-[560px] max-w-[calc(100%-56px)] rounded-[8px] border p-4 ${
        disabled ? 'border-[#DCDFE6] bg-[#F7F8FB]' : 'border-[#C7D2FE] bg-[#F5F7FF]'
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold leading-[22px] text-[#303133]">
            {locale === 'en-US' ? 'Revision Request' : '修改要求'}
          </h3>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[#909399]">
            {disabled
              ? locale === 'en-US'
                ? 'Submitted. Revising now.'
                : '已提交，正在按要求修改'
              : locale === 'en-US'
                ? 'After final review, ask AI to revise and recheck.'
                : '文章终稿评估完成后，可继续让 AI 按要求修改并复评。'}
          </p>
        </div>
        {disabled ? (
          <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[12px] font-semibold text-[#365EFF]">
            {locale === 'en-US' ? 'Working' : '处理中'}
          </span>
        ) : null}
      </div>
      <textarea
        autoComplete="off"
        className="mt-3 h-[88px] w-full resize-none rounded-[6px] border border-[#DCDFE6] bg-white px-3 py-2 text-[14px] leading-[22px] text-[#303133] outline-none transition placeholder:text-[#B4B8C2] focus:border-[#365EFF] focus:ring-2 focus:ring-[#E8EEFF] disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#606266]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          locale === 'en-US'
            ? 'Enter revision notes, such as stronger CTA, shorter copy, or more case details'
            : '请输入希望 AI 继续修改的要求，如加强采购转化、压缩篇幅、补充某类案例等'
        }
        value={value}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12px] leading-[18px] text-[#909399]">
          {locale === 'en-US'
            ? 'Submitting creates a revision record, a new final draft, and a new final review.'
            : '提交后会生成修改记录、文章终稿新版，并重新评估文章终稿。'}
        </p>
        <button
          type="submit"
          className="inline-flex h-8 flex-none items-center justify-center rounded-[6px] bg-[#365EFF] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
          disabled={disabled || !value.trim()}
        >
          {locale === 'en-US' ? 'Submit' : '提交修改要求'}
        </button>
      </div>
    </form>
  );
}

function WorkflowTask({
  artifacts,
  completed,
  isCurrent,
  isStopped,
  onArtifactClick,
  selectedArtifactId,
  showArtifactIds,
  task,
  visibleThinkingCounts,
  locale,
  copy,
}) {
  // 单个工作流任务负责按步骤展示思考、来源和产物。
  const steps = getTaskSteps(task);

  if (task.kind === 'user-request') {
    // 用户请求以右侧气泡展示，保持和 Agent 输出的视觉区分。
    const userStep = steps[0];
    const thinkingCount = visibleThinkingCounts[userStep.id] ?? 0;
    const visibleText = userStep.thinking.slice(0, thinkingCount).join('\n') || getTaskRunningText(task, locale);
    const agentDisplay = getAgentDisplay(task.agentTitle, locale);

    return (
      <section className="flex justify-end pb-8">
        <div className="flex max-w-[74%] items-start justify-end gap-3">
          <div className="min-w-0 text-right">
            <div className="text-[13px] font-semibold leading-[20px] text-[#606266]">{agentDisplay.name}</div>
            <div
              className="mt-2 whitespace-pre-wrap rounded-[8px] bg-[#365EFF] px-4 py-3 text-left text-[14px] leading-[22px] text-white shadow-[0_4px_12px_rgba(54,94,255,0.16)]"
              style={{ animation: 'aiContentFadeInUp 180ms ease-out both' }}
            >
              {visibleText}
            </div>
          </div>
          <AgentAvatar agentTitle={task.agentTitle} />
        </div>
      </section>
    );
  }

  const agentDisplay = getAgentDisplay(task.agentTitle, locale);

  return (
    <section className="flex gap-4">
      <AgentAvatar agentTitle={task.agentTitle} />
      <div className="min-w-0 flex-1 pb-8">
        <div className="text-[15px] font-semibold leading-[24px] text-[#303133]">{agentDisplay.name}</div>
        <div className="mt-3 space-y-5">
          {steps.map((step, stepIndex) => {
            const reachable = isStepReachable(steps, stepIndex, visibleThinkingCounts, showArtifactIds, completed);
            if (!reachable) return null;

            const stepCompleted = completed || isStepDone(step, visibleThinkingCounts, showArtifactIds);
            const stepActive =
              isCurrent &&
              !completed &&
              reachable &&
              !stepCompleted &&
              steps.slice(0, stepIndex).every((candidate) => isStepDone(candidate, visibleThinkingCounts, showArtifactIds));
            const thinkingCount = visibleThinkingCounts[step.id] ?? 0;
            const taskName = getTaskName(step, locale);

            return (
              <div key={step.id} className="flex items-start gap-3">
                <StatusIcon completed={stepCompleted} stopped={isStopped && stepActive} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-[20px] text-[#303133]">
                    {stepCompleted
                      ? getTaskCompletedText(step, copy.status.done, locale)
                      : isStopped && stepActive
                        ? formatTaskState(taskName, copy.status.stopped, locale)
                        : getTaskRunningText(step, locale)}
                  </div>
                  <div className="mt-3 space-y-4">
                    {step.thinking.slice(0, Math.min(thinkingCount, step.thinking.length)).map((paragraph, index) => (
                      <ThinkingBlock key={`${step.id}-thinking-${index}`}>{paragraph}</ThinkingBlock>
                    ))}
                    {step.sourceList && thinkingCount >= getStepRevealCount(step) ? (
                      <StepSourceList locale={locale} sourceList={step.sourceList} />
                    ) : null}
                    {step.artifactIds
                      .filter((artifactId) => showArtifactIds.includes(artifactId))
                      .map((artifactId) => {
                        const artifact = artifacts[artifactId];
                        if (!artifact) return null;
                        return (
                          <ArtifactCard
                            key={artifactId}
                            artifact={artifact}
                            locale={locale}
                            onClick={() => onArtifactClick(artifactId)}
                            selected={selectedArtifactId === artifactId}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EmptyPreview({ copy }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <div>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[#365EFF]">
          <FileText className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold leading-[28px] text-[#303133]">
          {copy.empty.contentPreviewTitle}
        </h2>
        <p className="mt-2 text-[14px] leading-[22px] text-[#909399]">
          {copy.empty.contentPreviewBody}
        </p>
      </div>
    </div>
  );
}

function RatingBadge({ rating }) {
  const classes = {
    High: 'bg-[#ECFDF5] text-[#00A85F]',
    Medium: 'bg-[#FFF7E6] text-[#D97706]',
    Low: 'bg-[#FFF1F0] text-[#D92D20]',
  };

  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2 text-[12px] font-semibold ${classes[rating]}`}>
      {rating}
    </span>
  );
}

function ArticleBody({ content }) {
  // 将轻量 Markdown 文本转换为页面预览块。
  const lines = content.split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`heading-${index}`} className="mt-7 text-[18px] font-bold leading-[28px] text-[#303133]">
          {line.replace(/^##\s*/, '')}
        </h2>,
      );
      continue;
    }

    const imageMatch = line.match(/^!\[(.*)]\((.*)\)$/);
    if (imageMatch) {
      const captionLine = lines[index + 1]?.trim() ?? '';
      const caption = captionLine.startsWith('Caption: ') ? captionLine.replace(/^Caption:\s*/, '') : '';
      if (caption) index += 1;

      blocks.push(
        <figure key={`image-${index}`} className="my-6 overflow-hidden rounded-[8px] border border-[#EBEEF5] bg-[#F7F8FB]">
          <img
            alt={imageMatch[1]}
            className="h-auto max-h-[340px] w-full object-cover"
            loading="lazy"
            src={imageMatch[2]}
          />
          {caption ? (
            <figcaption className="border-t border-[#EBEEF5] px-4 py-3 text-[13px] leading-[20px] text-[#606266]">
              {caption}
            </figcaption>
          ) : null}
        </figure>,
      );
      continue;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="mt-4 text-[15px] leading-[28px] text-[#3F3F46]">
        {line}
      </p>,
    );
  }

  return blocks;
}

function ArticlePreview({ artifact }) {
  // 文章预览支持切换引用高亮。
  const [highlight, setHighlight] = useState(true);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center justify-between border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
        <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#606266]">
          高亮引用
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#365EFF]"
            checked={highlight}
            onChange={(event) => setHighlight(event.target.checked)}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        <h1 className="text-[22px] font-bold leading-[32px] text-[#303133]">{artifact.headline}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-[13px] text-[#606266]">
          {(artifact.keywords ?? []).map((keyword) => (
            <span key={keyword} className="rounded-full bg-[#F5F7FA] px-2.5 py-1">
              {keyword}
            </span>
          ))}
        </div>
        <article
          className={`mt-6 ${
            highlight ? '[&_strong]:rounded-sm [&_strong]:bg-[#FFF7D6] [&_strong]:px-1' : ''
          }`}
        >
          <ArticleBody content={artifact.content} />
        </article>
      </div>
    </div>
  );
}

function EvaluationPreview({ artifact }) {
  return (
    /* 终稿评估预览展示分组指标和优化建议。 */
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center justify-between border-b border-[#EBEEF5] px-6">
        <div>
          <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
          <p className="mt-0.5 text-[13px] leading-[20px] text-[#909399]">{artifact.subtitle}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
            artifact.passed ? 'bg-[#ECFDF5] text-[#00A85F]' : 'bg-[#FFF1F0] text-[#D92D20]'
          }`}
        >
          {artifact.passed ? '通过' : '未通过'}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FB] px-6 py-5">
        <div className="rounded-[8px] bg-white p-4 text-[14px] leading-[22px] text-[#606266]">{artifact.summary}</div>
        <div className="mt-4 space-y-4">
          {artifact.groups.map((group) => (
            <section key={group.name} className="rounded-[8px] bg-white p-4">
              <h3 className="text-[15px] font-bold leading-[24px] text-[#303133]">{group.name}</h3>
              <div className="mt-3 overflow-hidden rounded-[8px] border border-[#EBEEF5]">
                <table className="w-full table-fixed text-left text-[13px]">
                  <thead className="bg-[#F7F8FB] text-[#606266]">
                    <tr>
                      <th className="w-[28%] px-3 py-2 font-semibold">评估项</th>
                      <th className="w-[14%] px-3 py-2 font-semibold">评级</th>
                      <th className="w-[14%] px-3 py-2 font-semibold">结果</th>
                      <th className="px-3 py-2 font-semibold">优化建议</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.name} className="border-t border-[#EBEEF5]">
                        <td className="px-3 py-2 font-medium text-[#303133]">{item.name}</td>
                        <td className="px-3 py-2"><RatingBadge rating={item.rating} /></td>
                        <td className={`px-3 py-2 font-semibold ${item.pass ? 'text-[#00A85F]' : 'text-[#D92D20]'}`}>
                          {item.pass ? 'pass' : 'fail'}
                        </td>
                        <td className="px-3 py-2 leading-[20px] text-[#606266]">{item.suggestion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionPreview({ artifact }) {
  return (
    /* 修改建议预览用于查看未通过指标的修正方向。 */
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          {artifact.items.map((item) => (
            <div key={`${item.group}-${item.metric}`} className="rounded-[8px] border border-[#EBEEF5] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-bold text-[#303133]">{item.group} / {item.metric}</div>
                <RatingBadge rating={item.rating} />
              </div>
              <p className="mt-2 text-[14px] leading-[22px] text-[#606266]">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevisionPreview({ artifact }) {
  return (
    /* 修改记录预览展示前后文案差异。 */
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {artifact.changes.map((change, index) => (
            <div key={`${change.type}-${index}`} className="space-y-2">
              {change.before ? (
                <div className="rounded-[8px] bg-[#F5F7FA] px-4 py-3 text-[14px] leading-[22px] text-[#909399] line-through">
                  {change.before}
                </div>
              ) : null}
              {change.after ? (
                <div className="rounded-[8px] border border-[#CDEFD8] bg-[#ECFDF5] px-4 py-3 text-[14px] leading-[22px] text-[#00A85F]">
                  + {change.after}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TdkPreview({ artifact }) {
  return (
    /* TDK 预览展示标题、关键词和描述。 */
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">文章元信息</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        <label className="block">
          <span className="mb-2 block text-[14px] font-semibold text-[#303133]">标题</span>
          <input className="h-10 w-full rounded-[6px] border border-[#DCDFE6] px-3 text-[14px]" readOnly value={artifact.tdk.title} />
        </label>
        <div className="mt-5">
          <span className="mb-2 block text-[14px] font-semibold text-[#303133]">关键词</span>
          <div className="flex min-h-10 flex-wrap gap-2 rounded-[6px] border border-[#DCDFE6] px-3 py-2">
            {artifact.tdk.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[13px] font-semibold text-[#365EFF]">
                {keyword}
              </span>
            ))}
          </div>
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-[14px] font-semibold text-[#303133]">描述</span>
          <textarea
            className="h-[180px] w-full resize-none rounded-[6px] border border-[#DCDFE6] px-3 py-2 text-[14px] leading-[22px]"
            readOnly
            value={artifact.tdk.description}
          />
        </label>
      </div>
    </div>
  );
}

function ReferenceOutline({ outline }) {
  // 外部引用按标题层级展示网页大纲。
  if (!outline?.length) {
    return <p className="text-[14px] leading-[22px] text-[#909399]">暂无可展示的大纲结构。</p>;
  }

  return (
    <div className="space-y-3">
      {outline.map((section, index) => (
        <div key={`${section.title}-${index}`} className="space-y-2">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#303133]">
            <span className="inline-flex h-5 items-center rounded-[4px] border border-[#C7D2FE] px-1.5 text-[12px] font-bold text-[#365EFF]">
              {section.level}
            </span>
            {section.title}
          </div>
          {section.children?.length ? (
            <ul className="ml-10 list-disc space-y-1 text-[13px] leading-[20px] text-[#606266]">
              {section.children.map((child) => (
                <li key={child}>{child}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ReferenceBlockCard({ block, expanded, onOpenKnowledgeItem, onOpenSourcePreview, onToggle }) {
  // 引用卡片根据来源类型跳转到网页、知识条目或资料预览。
  const isReferenceWeb = block.blockKind === 'reference-web';
  const isKnowledgeItem = block.blockKind === 'knowledge-item';
  const isKnowledgeAsset = block.blockKind === 'knowledge-asset';

  function handleSourceClick(event) {
    event.stopPropagation();
    if (isReferenceWeb && block.sourceUrl) {
      window.open(block.sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (isKnowledgeItem) {
      onOpenKnowledgeItem(block);
      return;
    }

    if (isKnowledgeAsset) {
      onOpenSourcePreview(block);
    }
  }

  return (
    <article className={`rounded-[8px] border ${expanded ? 'border-[#6B7DFF] bg-[#F5F7FF]' : 'border-[#EBEEF5] bg-white'}`}>
      <div className="flex items-start gap-3 p-4">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <div className="text-[14px] font-bold leading-[22px] text-[#303133]">标题：{block.title}</div>
          <p className="mt-1 text-[14px] leading-[22px] text-[#606266]">内容：{block.content}</p>
        </button>
        <button
          type="button"
          className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-[6px] text-[#909399] transition hover:bg-white hover:text-[#365EFF]"
          onClick={onToggle}
          aria-label={expanded ? '收起详情' : '展开详情'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-[13px] leading-[20px]">
          <span className="text-[#A8ABB2]">{block.sourceLabel || '来源'}：</span>
          <button
            type="button"
            className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#365EFF] hover:text-[#2547D0]"
            onClick={handleSourceClick}
          >
            <span className="truncate">{block.sourceName}</span>
            {isReferenceWeb || isKnowledgeAsset ? <ExternalLink className="h-3.5 w-3.5 flex-none" /> : null}
          </button>
        </div>

        {expanded ? (
          <div className="mt-4 rounded-[8px] border border-[#EBEEF5] bg-white px-4 py-3">
            {isReferenceWeb ? (
              <ReferenceOutline outline={block.outline} />
            ) : (
              <p className="whitespace-pre-line text-[14px] leading-[24px] text-[#606266]">
                {block.fullContent || block.content}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function getReferenceTabs(locale) {
  // 引用抽屉只展示知识条目和知识资料两个来源组。
  return [
    { id: 'knowledge-items', label: locale === 'en-US' ? 'Knowledge Items' : '知识条目' },
    { id: 'knowledge-files', label: locale === 'en-US' ? 'Knowledge Files' : '知识资料' },
  ];
}

function isReferenceBlockInTab(block, tab) {
  // 当前标签决定引用块所属的筛选范围。
  return tab === 'knowledge-items' ? block.blockKind === 'knowledge-item' : block.blockKind === 'knowledge-asset';
}

function ReferencesPreview({ artifact, locale, onOpenKnowledgeItem, onOpenSourcePreview }) {
  // 引用产物预览按标签切换知识条目和资料文本块。
  const [activeTab, setActiveTab] = useState('knowledge-items');
  const filteredBlocks = artifact.referenceBlocks.filter((block) => isReferenceBlockInTab(block, activeTab));
  const firstBlockId = filteredBlocks[0]?.id ?? '';
  const tabs = getReferenceTabs(locale);
  const [expandedId, setExpandedId] = useState(firstBlockId);

  useEffect(() => {
    setExpandedId(firstBlockId);
  }, [activeTab, artifact.id, firstBlockId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center justify-between border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">
          {getLocalizedArtifactText(artifact, 'title', locale)}
        </h2>
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold ${
                activeTab === tab.id ? 'bg-[#EEF3FF] text-[#365EFF]' : 'text-[#606266] hover:bg-[#F5F7FA]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="mb-4 text-[13px] leading-[20px] text-[#909399]">
          {activeTab === 'knowledge-items'
            ? locale === 'en-US'
              ? 'Shows referenced knowledge items selected for article generation.'
              : '展示文章生成引用的知识条目。'
            : locale === 'en-US'
              ? 'Shows matched text blocks from referenced knowledge files.'
              : '展示检索到的知识资料文本块。'}
        </p>
        <div className="space-y-3">
          {filteredBlocks.map((block) => (
            <ReferenceBlockCard
              key={block.id}
              block={block}
              expanded={expandedId === block.id}
              onOpenKnowledgeItem={onOpenKnowledgeItem}
              onOpenSourcePreview={onOpenSourcePreview}
              onToggle={() => setExpandedId((current) => (current === block.id ? '' : block.id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({ artifact, copy, locale, onOpenKnowledgeItem, onOpenSourcePreview }) {
  // 根据产物类型选择右侧预览面板。
  if (!artifact) return <EmptyPreview copy={copy} />;
  if (artifact.type === 'references') {
    return (
      <ReferencesPreview
        artifact={artifact}
        locale={locale}
        onOpenKnowledgeItem={onOpenKnowledgeItem}
        onOpenSourcePreview={onOpenSourcePreview}
      />
    );
  }
  if (artifact.type === 'evaluation') return <EvaluationPreview artifact={artifact} />;
  if (artifact.type === 'suggestion') return <SuggestionPreview artifact={artifact} />;
  if (artifact.type === 'revision') return <RevisionPreview artifact={artifact} />;
  if (artifact.type === 'tdk') return <TdkPreview artifact={artifact} />;
  return <ArticlePreview artifact={artifact} />;
}

function ReferenceDrawer({
  activeTab,
  articleGenerated,
  citationUsages,
  locale,
  onClose,
  onOpenKnowledgeItem,
  onOpenSourcePreview,
  onTabChange,
  references,
}) {
  // 引用抽屉在文章生成后展示实际引用与生成内容的对应关系。
  const tabs = getReferenceTabs(locale);
  const filtered = articleGenerated
    ? citationUsages
        .map((usage) => ({
          ...usage,
          sourceBlock: references.find((block) => block.id === usage.sourceBlockId),
        }))
        .filter((item) => item.sourceBlock && isReferenceBlockInTab(item.sourceBlock, activeTab))
    : [];

  function openCitationSource(usage) {
    // 点击引用时打开对应来源，而不是切换当前生成页面。
    const block = usage.sourceBlock;
    if (!block) return;

    if (block.blockKind === 'reference-web' && block.sourceUrl) {
      window.open(block.sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (block.blockKind === 'knowledge-item') {
      onOpenKnowledgeItem(block);
      return;
    }

    if (block.blockKind === 'knowledge-asset') {
      onOpenSourcePreview(block);
    }
  }

  return (
    <aside className="h-[calc(100vh-152px)] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
      <div className="flex h-[58px] items-center justify-between border-b border-[#EBEEF5] px-5">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-[6px] px-3 py-1.5 text-[14px] font-semibold ${
                activeTab === tab.id ? 'bg-[#EEF3FF] text-[#365EFF]' : 'text-[#606266]'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#606266] hover:bg-[#F5F7FA]"
          onClick={onClose}
          aria-label={locale === 'en-US' ? 'Close referenced knowledge' : '关闭引用知识'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 h-[calc(100%-58px)] overflow-y-auto p-4">
        {!articleGenerated ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-[14px] leading-[22px] text-[#909399]">
              {locale === 'en-US'
                ? 'Citations and matched content appear after draft generation.'
                : '文章生成后将展示引用标识与对应内容。'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-[14px] leading-[22px] text-[#606266]">
              {locale === 'en-US'
                ? `${filtered.length} citations matched to generated content.`
                : `总计 ${filtered.length} 条实际引用，按文章生成内容对应展示。`}
            </div>
            <div className="space-y-3">
              {filtered.map((item) => (
                <article key={item.id} className="rounded-[8px] border border-[#6B7DFF] bg-[#F5F7FF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 text-left text-[14px] font-bold leading-[22px] text-[#365EFF] hover:text-[#2547D0]"
                      onClick={() => openCitationSource(item)}
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] text-[12px] font-bold text-[#606266]">
                        {item.marker}
                      </span>
                      {item.sourceName}
                    </button>
                  </div>
                  <div className="mt-3 rounded-[8px] bg-white px-3 py-2">
                    <div className="text-[12px] font-semibold text-[#A8ABB2]">
                      {locale === 'en-US' ? 'Source' : '来源文本块'}
                    </div>
                    <p className="mt-1 text-[13px] leading-[20px] text-[#606266]">{item.sourceSnippet}</p>
                  </div>
                  <div className="mt-3 rounded-[8px] border border-[#CDEFD8] bg-[#ECFDF5] px-3 py-2">
                    <div className="text-[12px] font-semibold text-[#00A85F]">
                      {locale === 'en-US' ? 'Generated' : '文章生成内容'}
                    </div>
                    <p className="mt-1 text-[13px] leading-[20px] text-[#26734D]">{item.generatedContent}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default function BlogArticleAiContentPage({ article, locale, onBack, onClose, onSaveAndEdit, project, t, task }) {
  const copy = t.blogArticle.aiCreation;
  // 修改要求会参与 demo 数据重算，形成新的终稿版本。
  const [revisionRequests, setRevisionRequests] = useState(() => task?.content?.revisionRequests ?? []);
  const [revisionInput, setRevisionInput] = useState('');
  const demoData = useMemo(
    () => createContentDemoData(task, project, { revisionRequests }),
    [project, revisionRequests, task],
  );
  const workflow = demoData.workflow;
  const initialPlaybackState = useMemo(() => getInitialPlaybackState(workflow, task), [workflow, task]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialPlaybackState.currentTaskIndex);
  const [visibleThinkingCounts, setVisibleThinkingCounts] = useState(initialPlaybackState.visibleThinkingCounts);
  const [visibleArtifactIds, setVisibleArtifactIds] = useState(initialPlaybackState.visibleArtifactIds);
  const [completedTaskIds, setCompletedTaskIds] = useState(initialPlaybackState.completedTaskIds);
  const [isComplete, setIsComplete] = useState(initialPlaybackState.isComplete);
  const [isStopped, setIsStopped] = useState(task?.stage === 'content-stopped' || Boolean(task?.content?.isStopped));
  const [selectedArtifactId, setSelectedArtifactId] = useState(initialPlaybackState.selectedArtifactId);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referenceTab, setReferenceTab] = useState('knowledge-items');
  const [toast, setToast] = useState(null);
  const workflowRef = useRef(null);

  // 当前展示状态由播放进度、可见产物和保存缓存共同决定。
  const currentTask = workflow[currentTaskIndex];
  const visibleTaskList = workflow.slice(0, Math.min(currentTaskIndex + 1, workflow.length));
  const selectedArtifact = selectedArtifactId ? demoData.artifacts[selectedArtifactId] : null;
  const articleGenerated = visibleArtifactIds.some((artifactId) => demoData.artifacts[artifactId]?.type === 'article');
  const finalEvaluationReady = visibleArtifactIds.includes('final-evaluation') || completedTaskIds.includes('final-evaluate');
  const showRevisionRequestBox =
    finalEvaluationReady && isComplete && !isStopped;

  useEffect(() => {
    setRevisionInput('');
  }, [task.id]);

  function buildContentPayload(data = demoData, overrides = {}) {
    // 将页面播放状态和正文产物合并成任务缓存。
    return {
      articleVersions: data.articleVersions,
      citationUsages: data.citationUsages,
      completedTaskIds,
      currentArtifactId: selectedArtifactId,
      evaluationReports: data.evaluationReports,
      finalEvaluationReport: data.latestEvaluationReport ?? data.finalEvaluationReport,
      finalArticle: data.latestFinalArticle ?? data.finalArticle,
      finalRevisionRounds: data.finalRevisionRounds,
      isStopped,
      latestEvaluationReportId: data.latestEvaluationReportId,
      latestFinalArticleId: data.latestFinalArticleId,
      latestTdkId: data.latestTdkId,
      referenceBlocks: data.referenceBlocks,
      revisionRecords: data.revisionRecords,
      revisionRequests: data.revisionRequests,
      revisionSuggestions: data.revisionSuggestions,
      savedArticleId: task?.content?.savedArticleId,
      tdk: data.latestTdk ?? data.tdk,
      updatedAt: getTodayString(),
      visibleArtifactIds,
      ...overrides,
    };
  }

  useEffect(() => {
    // 首次进入时写回当前内容阶段，保证历史任务列表能恢复进度。
    updateAiCreationTask(project.id, task.id, {
      stage: isComplete ? 'content-completed' : isStopped ? 'content-stopped' : 'content',
      content: buildContentPayload(),
    });
  }, []);

  useEffect(() => {
    // 普通 toast 自动关闭，带操作按钮的 toast 等待用户处理。
    if (!toast || toast.actionLabel) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // 工作流按定时器逐段显示思考、来源和产物。
    if (isStopped || isComplete || !currentTask) {
      return undefined;
    }

    const activeStepState = getActiveStepState(currentTask, visibleThinkingCounts, visibleArtifactIds);
    const { allArtifactsVisible, artifactIds, complete, hasMoreThinking, step } = activeStepState;

    const timer = window.setTimeout(() => {
      if (step && hasMoreThinking) {
        setVisibleThinkingCounts((current) => ({
          ...current,
          [step.id]: (current[step.id] ?? 0) + 1,
        }));
        return;
      }

      if (!complete && artifactIds.length && !allArtifactsVisible) {
        setVisibleArtifactIds((current) => [...new Set([...current, ...artifactIds])]);
        return;
      }

      const nextCompletedTaskIds = completedTaskIds.includes(currentTask.id)
        ? completedTaskIds
        : [...completedTaskIds, currentTask.id];
      setCompletedTaskIds(nextCompletedTaskIds);

      if (currentTaskIndex + 1 >= workflow.length) {
        setIsComplete(true);
        updateAiCreationTask(project.id, task.id, {
          stage: 'content-completed',
          content: buildContentPayload(demoData, {
            completedTaskIds: nextCompletedTaskIds,
            isStopped: false,
            visibleArtifactIds: [...new Set([...visibleArtifactIds, ...getTaskArtifactIds(currentTask)])],
          }),
        });
        return;
      }

      setCurrentTaskIndex((current) => current + 1);
    }, hasMoreThinking ? 900 : 650);

    return () => window.clearTimeout(timer);
  }, [
    completedTaskIds,
    currentTask,
    currentTaskIndex,
    demoData,
    isComplete,
    isStopped,
    project.id,
    selectedArtifactId,
    task.id,
    visibleArtifactIds,
    visibleThinkingCounts,
    workflow.length,
  ]);

  useEffect(() => {
    // 用户未手动上滑时，流程区自动跟随最新生成内容。
    const container = workflowRef.current;
    if (!container || !autoScrollEnabled) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [autoScrollEnabled, completedTaskIds, currentTaskIndex, visibleArtifactIds, visibleThinkingCounts]);

  function handleWorkflowScroll() {
    // 接近底部时继续自动滚动，离开底部则暂停。
    const container = workflowRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceToBottom < 48);
  }

  function handleStopTask() {
    // 中止任务时保留当前可见进度，方便返回后恢复。
    if (isStopped || isComplete) return;

    setIsStopped(true);
    updateAiCreationTask(project.id, task.id, {
      stage: 'content-stopped',
      content: buildContentPayload(demoData, {
        completedTaskIds,
        currentArtifactId: selectedArtifactId,
        isStopped: true,
        updatedAt: getTodayString(),
        visibleArtifactIds,
      }),
    });
    setToast({
      actionLabel: copy.actions.regenerate,
      message:
        locale === 'en-US'
          ? 'Task stopped. Go back or regenerate.'
          : '任务已中止，可返回上一步修改或重新生成',
      type: 'warning',
    });
  }

  function handleRegenerate() {
    // 重新生成会清空正文阶段缓存后刷新页面。
    resetAiContentTask(project.id, task.id);
    window.location.reload();
  }

  function handleSubmitRevisionRequest() {
    // 提交修改要求后追加一轮修订任务。
    const text = revisionInput.trim();
    if (!text || !isComplete || isStopped) return;

    const version = revisionRequests.length + 2;
    const nextRevisionRequests = [
      ...revisionRequests,
      {
        createdAt: getTodayString(),
        id: `revision-request-${Date.now()}`,
        status: 'submitted',
        text,
        version,
      },
    ];
    const nextDemoData = createContentDemoData(task, project, { revisionRequests: nextRevisionRequests });
    const nextCurrentTaskIndex = workflow.length;

    setRevisionRequests(nextRevisionRequests);
    setRevisionInput('');
    setIsComplete(false);
    setIsStopped(false);
    setAutoScrollEnabled(true);
    setCurrentTaskIndex(nextCurrentTaskIndex);
    setVisibleThinkingCounts((current) => ({
      ...current,
      [getTaskSteps(nextDemoData.workflow[nextCurrentTaskIndex])[0]?.id]: 0,
    }));
    updateAiCreationTask(project.id, task.id, {
      stage: 'content',
      content: buildContentPayload(nextDemoData, {
        completedTaskIds,
        currentArtifactId: selectedArtifactId,
        isStopped: false,
        revisionRequests: nextDemoData.revisionRequests,
        updatedAt: getTodayString(),
        visibleArtifactIds,
      }),
    });
  }

  function handleSaveAndEdit() {
    // 将最终文章写入文章列表，并带着新文章进入编辑页。
    const finalArticle = demoData.latestFinalArticle;
    const tdk = demoData.latestTdk;
    const taskInput = task?.taskInput ?? {};
    const nextArticle = {
      ...article,
      aiTaskId: task.id,
      articleType: taskInput.articleType || article?.articleType || 'Comparison',
      content: finalArticle.content,
      embeddedMediaAssets: finalArticle.images ?? [],
      evaluationReport: demoData.latestEvaluationReport,
      id: article?.id || createBlogArticleId(),
      keywords: [
        ...new Set([
          ...(tdk.keywords ?? []),
          ...splitAiKeywordText(taskInput.primaryKeyword),
          ...(taskInput.secondaryKeywords ?? []),
        ].filter(Boolean)),
      ],
      status: 'draft',
      targetAudienceName: taskInput.targetAudience?.name || taskInput.targetAudienceName || article?.targetAudienceName || '',
      tdk,
      title: finalArticle.headline,
      updatedAt: getTodayString(),
      updatedBy: 'Angel',
    };

    upsertBlogArticle(project, nextArticle);
    updateAiCreationTask(project.id, task.id, {
      stage: 'content-completed',
      content: buildContentPayload(demoData, {
        completedTaskIds: workflow.map((item) => item.id),
        isStopped: false,
        savedArticleId: nextArticle.id,
        updatedAt: getTodayString(),
        visibleArtifactIds,
      }),
    });
    onSaveAndEdit(nextArticle);
  }

  function handleOpenKnowledgeItem(block) {
    // 知识条目从新标签进入，避免打断当前生成上下文。
    openAppViewInNewTab({
      knowledgeItemId: block.knowledgeItemId,
      projectId: project.id,
      view: 'knowledge-items',
    });
  }

  function handleOpenSourcePreview(block) {
    // 知识资料优先打开文件预览，缺少文件时打开来源片段预览。
    if (block.sourceFileId) {
      openAppViewInNewTab({
        fileId: block.sourceFileId,
        projectId: project.id,
        view: 'knowledge-file-preview',
      });
      return;
    }

    openAppViewInNewTab({
      projectId: project.id,
      sourceId: block.sourceId || block.id,
      taskId: task.id,
      view: 'knowledge-source-preview',
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <style>
        {`
          @keyframes aiContentFadeInUp {
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
            onClick={onClose ?? onBack}
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="w-[360px] text-[18px] font-bold leading-[28px] text-[#232E45]">
            {copy.titles.content}
          </h1>
          <Stepper copy={copy} />
          <div className="flex w-[360px] justify-end">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] bg-white px-3 text-[14px] font-semibold text-[#365EFF] shadow-[0_2px_8px_rgba(31,45,61,0.12)] transition hover:bg-[#F5F7FF]"
              onClick={() => setReferenceOpen((current) => !current)}
            >
              <BookOpen className="h-4 w-4" />
              {copy.actions.references}
            </button>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto grid max-w-[1600px] gap-4 px-6 pb-[84px] pt-[68px] ${
          referenceOpen ? 'grid-cols-[400px_minmax(0,1fr)_420px]' : 'grid-cols-2'
        }`}
      >
        <section
          ref={workflowRef}
          className="h-[calc(100vh-152px)] overflow-y-auto rounded-[8px] bg-white px-8 py-7 shadow-[0_2px_10px_rgba(31,45,61,0.04)]"
          onScroll={handleWorkflowScroll}
        >
          <div className="space-y-1">
            {visibleTaskList.map((workflowTask) => {
              const completed = completedTaskIds.includes(workflowTask.id);
              const isCurrent = workflowTask.id === currentTask?.id && !completed;

              return (
                <WorkflowTask
                  key={workflowTask.id}
                  artifacts={demoData.artifacts}
                  completed={completed}
                  copy={copy}
                  isCurrent={isCurrent}
                  isStopped={isStopped}
                  locale={locale}
                  onArtifactClick={setSelectedArtifactId}
                  selectedArtifactId={selectedArtifactId}
                  showArtifactIds={visibleArtifactIds}
                  task={workflowTask}
                  visibleThinkingCounts={visibleThinkingCounts}
                />
              );
            })}
            {showRevisionRequestBox ? (
              <RevisionRequestBox
                key={`${task.id}-${revisionRequests.length}`}
                copy={copy}
                disabled={false}
                locale={locale}
                onChange={setRevisionInput}
                onSubmit={handleSubmitRevisionRequest}
                value={revisionInput}
              />
            ) : null}
          </div>
        </section>

        <section className="h-[calc(100vh-152px)] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
          <PreviewPanel
            artifact={selectedArtifact}
            copy={copy}
            locale={locale}
            onOpenKnowledgeItem={handleOpenKnowledgeItem}
            onOpenSourcePreview={handleOpenSourcePreview}
          />
        </section>

        {referenceOpen ? (
          <ReferenceDrawer
            activeTab={referenceTab}
            articleGenerated={articleGenerated}
            citationUsages={demoData.citationUsages}
            locale={locale}
            onClose={() => setReferenceOpen(false)}
            onOpenKnowledgeItem={handleOpenKnowledgeItem}
            onOpenSourcePreview={handleOpenSourcePreview}
            onTabChange={setReferenceTab}
            references={demoData.referenceBlocks}
          />
        ) : null}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#EBEEF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-6">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
            onClick={onBack}
          >
            {copy.actions.previous}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:border-[#DCDFE6] disabled:text-[#A8ABB2] disabled:hover:bg-white"
              disabled={isComplete || isStopped}
              onClick={handleStopTask}
            >
              {copy.actions.stop}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] bg-[#365EFF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
              disabled={!isComplete || isStopped}
              onClick={handleSaveAndEdit}
            >
              <Save className="h-4 w-4" />
              {copy.actions.saveAndEdit}
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
    </div>
  );
}
