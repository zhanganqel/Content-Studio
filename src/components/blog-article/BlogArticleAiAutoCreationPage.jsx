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
import { formatTaskState, getTaskCompletedText, getTaskName, getTaskRunningText } from './aiTaskText.js';
import { getAgentDisplay } from './agentDisplay.js';
import {
  createContentDemoData,
  createOutlineDemoData,
  createPlanningDemoData,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';
import { saveAiTaskAsBlogArticle } from '../../services/blogArticleAiArticleStore.js';
import { getTodayString } from '../../services/blogArticleStore.js';

const stageOrder = ['planning', 'outline', 'content'];

function getArtifactIcon(type) {
  if (type === 'evaluation') return ClipboardList;
  if (type === 'tdk') return Sparkles;
  if (type === 'references') return BookOpen;
  if (type === 'strategy') return ClipboardList;
  return FileText;
}

function getLocalizedArtifactText(artifact, field, locale) {
  const localizedField = `${field}En`;
  return locale === 'en-US' && artifact?.[localizedField] ? artifact[localizedField] : artifact?.[field];
}

function getTaskStatus(task) {
  const stage = task?.stage ?? '';
  if (task?.errorMessage || stage === 'failed' || stage.endsWith('-failed')) return 'failed';
  if (stage.endsWith('-stopped')) return 'stopped';
  if (stage === 'content-completed') return 'success';
  return 'generating';
}

function isAutoTask(task) {
  const stage = task?.stage ?? '';
  return task?.mode === 'auto' || stage.startsWith('auto');
}

function hasStagePayload(task, stageKey) {
  const payload = task?.[stageKey];
  if (!payload || typeof payload !== 'object') return false;

  return Object.entries(payload).some(([key, value]) => {
    if (key === 'updatedAt' || key === 'isStopped') return false;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

function inferStageKey(task) {
  const stage = task?.stage ?? '';
  if (isAutoTask(task)) return 'content';
  if (stage.startsWith('content') || stage === 'content-completed') return 'content';
  if (stage.startsWith('outline')) return 'outline';
  if (stage.startsWith('planning')) return 'planning';
  if (hasStagePayload(task, 'content')) return 'content';
  if (hasStagePayload(task, 'outline')) return 'outline';
  return 'planning';
}

function getVisibleStages(task, status) {
  if (status === 'success') return stageOrder;

  const stageKey = inferStageKey(task);
  const endIndex = stageOrder.indexOf(stageKey);
  return stageOrder.slice(0, Math.max(0, endIndex) + 1);
}

function openAppViewInNewTab(params) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.search = '';
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function prefixId(stageKey, id) {
  return id ? `${stageKey}:${id}` : '';
}

function getArtifactIdsFromItem(item) {
  return item?.artifactIds ?? (item?.artifactId ? [item.artifactId] : []);
}

function getRawTaskSteps(task) {
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

function prefixSourceList(sourceList, stageKey) {
  if (!sourceList) return sourceList;

  return {
    ...sourceList,
    items: (sourceList.items ?? []).map((item) => ({
      ...item,
      id: prefixId(stageKey, item.id),
    })),
  };
}

function normalizeWorkflowItem(item, stageKey) {
  const steps = getRawTaskSteps(item).map((step) => ({
    ...step,
    artifactId: step.artifactId ? prefixId(stageKey, step.artifactId) : '',
    artifactIds: step.artifactIds.map((artifactId) => prefixId(stageKey, artifactId)),
    id: prefixId(stageKey, step.id),
    sourceList: prefixSourceList(step.sourceList, stageKey),
  }));

  return {
    ...item,
    artifactId: item.artifactId ? prefixId(stageKey, item.artifactId) : '',
    artifactIds: getArtifactIdsFromItem(item).map((artifactId) => prefixId(stageKey, artifactId)),
    id: prefixId(stageKey, item.id),
    rawTaskIds: [prefixId(stageKey, item.id)],
    stageKey,
    steps,
  };
}

function mergeSequentialAgentTasks(items) {
  return items.reduce((groups, item) => {
    const lastGroup = groups[groups.length - 1];
    const canMerge =
      lastGroup &&
      lastGroup.agentTitle === item.agentTitle &&
      lastGroup.kind !== 'user-request' &&
      item.kind !== 'user-request';

    if (canMerge) {
      lastGroup.steps.push(...item.steps);
      lastGroup.rawTaskIds.push(...item.rawTaskIds);
      lastGroup.stageKeys = [...new Set([...lastGroup.stageKeys, item.stageKey])];
      return groups;
    }

    groups.push({
      ...item,
      stageKeys: [item.stageKey],
    });
    return groups;
  }, []);
}

function prefixArtifacts(artifacts, stageKey) {
  return Object.fromEntries(
    Object.entries(artifacts ?? {}).map(([id, artifact]) => {
      const nextId = prefixId(stageKey, id);
      return [
        nextId,
        {
          ...artifact,
          id: nextId,
          originalId: artifact.id ?? id,
          stageKey,
        },
      ];
    }),
  );
}

function buildAutoDemoData(task, project, revisionRequests) {
  const status = getTaskStatus(task);
  const visibleStages = getVisibleStages(task, status);
  const stageData = {
    planning: createPlanningDemoData(task, project),
    outline: createOutlineDemoData(task, project),
    content: createContentDemoData(task, project, { revisionRequests }),
  };
  const artifacts = {};
  const workflowItems = [];

  visibleStages.forEach((stageKey) => {
    const data = stageData[stageKey];
    Object.assign(artifacts, prefixArtifacts(data.artifacts, stageKey));
    workflowItems.push(...data.workflow.map((item) => normalizeWorkflowItem(item, stageKey)));
  });

  const contentData = stageData.content;
  const latestFinalArtifactId = prefixId('content', contentData.latestFinalArticleId || 'final');

  return {
    artifacts,
    contentData,
    latestFinalArtifactId,
    stageData,
    visibleStages,
    workflow: mergeSequentialAgentTasks(workflowItems),
  };
}

function getTaskSteps(task) {
  return Array.isArray(task?.steps) ? task.steps : [];
}

function getStepRevealCount(step) {
  return (step?.thinking?.length ?? 0) + (step?.sourceList ? 1 : 0);
}

function getTaskArtifactIds(task) {
  return getTaskSteps(task).flatMap((step) => step.artifactIds).filter(Boolean);
}

function getWorkflowArtifactIds(workflow) {
  return workflow.flatMap((item) => getTaskArtifactIds(item)).filter(Boolean);
}

function getWorkflowThinkingCounts(workflow, endIndex = workflow.length) {
  return Object.fromEntries(
    workflow
      .slice(0, endIndex)
      .flatMap((item) => getTaskSteps(item).map((step) => [step.id, getStepRevealCount(step)])),
  );
}

function isStepDone(step, visibleThinkingCounts, visibleArtifactIds) {
  const thinkingCount = visibleThinkingCounts[step.id] ?? 0;
  const allArtifactsVisible = step.artifactIds.every((artifactId) => visibleArtifactIds.includes(artifactId));
  return thinkingCount >= getStepRevealCount(step) && allArtifactsVisible;
}

function isStepReachable(steps, stepIndex, visibleThinkingCounts, visibleArtifactIds, taskCompleted) {
  if (taskCompleted) return true;
  if (stepIndex === 0) return true;

  return steps
    .slice(0, stepIndex)
    .every((step) => isStepDone(step, visibleThinkingCounts, visibleArtifactIds));
}

function getActiveStepState(task, visibleThinkingCounts, visibleArtifactIds) {
  const steps = getTaskSteps(task);
  const step = steps.find((candidate) => !isStepDone(candidate, visibleThinkingCounts, visibleArtifactIds));

  if (!step) {
    return {
      allArtifactsVisible: true,
      artifactIds: [],
      complete: true,
      hasMoreThinking: false,
      step: null,
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
  };
}

function getSavedCompletedIds(task, stageKey) {
  const savedIds = task?.[stageKey]?.completedTaskIds ?? [];
  return new Set(savedIds.map((id) => prefixId(stageKey, id)));
}

function getInitialGeneratingState(workflow, task, currentStageKey) {
  const stageStartIndex = workflow.findIndex((item) => item.stageKeys.includes(currentStageKey));
  const startIndex = stageStartIndex >= 0 ? stageStartIndex : 0;
  const completedTaskIds = workflow.slice(0, startIndex).map((item) => item.id);
  const savedCompletedIds = getSavedCompletedIds(task, currentStageKey);
  let currentTaskIndex = startIndex;

  for (let index = startIndex; index < workflow.length; index += 1) {
    const item = workflow[index];
    if (item.stageKeys.includes(currentStageKey) && item.rawTaskIds.every((id) => savedCompletedIds.has(id))) {
      completedTaskIds.push(item.id);
      currentTaskIndex = index + 1;
      continue;
    }

    break;
  }

  const currentIndex = Math.min(currentTaskIndex, Math.max(workflow.length - 1, 0));
  const completedWorkflow = workflow.filter((item) => completedTaskIds.includes(item.id));
  const currentStageVisibleArtifacts = (task?.[currentStageKey]?.visibleArtifactIds ?? []).map((id) =>
    prefixId(currentStageKey, id),
  );

  return {
    completedTaskIds,
    currentTaskIndex: currentIndex,
    isComplete: false,
    selectedArtifactId: '',
    visibleArtifactIds: [...new Set([...getWorkflowArtifactIds(completedWorkflow), ...currentStageVisibleArtifacts])],
    visibleThinkingCounts: getWorkflowThinkingCounts(workflow, currentIndex),
  };
}

function getSavedWorkflowState(workflow, task) {
  const completedTaskIds = [];
  const visibleArtifactIds = [];

  stageOrder.forEach((stageKey) => {
    const payload = task?.[stageKey] ?? {};
    const savedCompletedIds = new Set((payload.completedTaskIds ?? []).map((id) => prefixId(stageKey, id)));

    workflow.forEach((item) => {
      const itemScopedToStage = item.stageKeys.includes(stageKey);
      const itemCompletedInStage = item.rawTaskIds
        ?.filter((id) => isStageScopedId(id, stageKey))
        .every((id) => savedCompletedIds.has(id));

      if (itemScopedToStage && itemCompletedInStage) {
        completedTaskIds.push(item.id);
      }
    });

    visibleArtifactIds.push(...(payload.visibleArtifactIds ?? []).map((id) => prefixId(stageKey, id)));

    if (payload.currentArtifactId) {
      visibleArtifactIds.push(prefixId(stageKey, payload.currentArtifactId));
    }
  });

  const uniqueCompletedTaskIds = [...new Set(completedTaskIds)];
  const uniqueVisibleArtifactIds = [...new Set(visibleArtifactIds)];
  const completedIndexes = uniqueCompletedTaskIds
    .map((id) => workflow.findIndex((item) => item.id === id))
    .filter((index) => index >= 0);
  const lastCompletedIndex = completedIndexes.length ? Math.max(...completedIndexes) : -1;
  const currentTaskIndex = Math.min(Math.max(lastCompletedIndex + 1, 0), Math.max(workflow.length - 1, 0));
  const completedWorkflow = workflow.filter((item) => uniqueCompletedTaskIds.includes(item.id));

  return {
    completedTaskIds: uniqueCompletedTaskIds,
    currentTaskIndex,
    isComplete: false,
    selectedArtifactId: '',
    visibleArtifactIds: uniqueVisibleArtifactIds,
    visibleThinkingCounts: getWorkflowThinkingCounts(completedWorkflow),
  };
}

function getInitialAutoState(workflow, task, status, latestFinalArtifactId) {
  if (status === 'success') {
    return {
      completedTaskIds: workflow.map((item) => item.id),
      currentTaskIndex: workflow.length,
      isComplete: true,
      selectedArtifactId: latestFinalArtifactId,
      visibleArtifactIds: getWorkflowArtifactIds(workflow),
      visibleThinkingCounts: getWorkflowThinkingCounts(workflow),
    };
  }

  if (status === 'failed' || status === 'stopped') {
    return getSavedWorkflowState(workflow, task);
  }

  if (status === 'generating' && isAutoTask(task)) {
    return {
      completedTaskIds: [],
      currentTaskIndex: 0,
      isComplete: false,
      selectedArtifactId: '',
      visibleArtifactIds: [],
      visibleThinkingCounts: {},
    };
  }

  return getInitialGeneratingState(workflow, task, inferStageKey(task));
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
  const text = typeof children === 'string' ? children : '';
  const emphasisMatch = text.match(/^\*\*(.*)\*\*$/);

  return (
    <div
      className={`ml-2 border-l-2 pl-5 text-[14px] leading-[22px] ${
        emphasisMatch ? 'border-[#365EFF] font-semibold text-[#303133]' : 'border-[#E4E7ED] text-[#606266]'
      }`}
      style={{ animation: 'aiAutoFadeInUp 180ms ease-out both' }}
    >
      {emphasisMatch ? emphasisMatch[1] : children}
    </div>
  );
}

function ArtifactCard({ artifact, locale, onClick, selected }) {
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
  const items = sourceList?.items ?? [];
  const isEnglish = locale === 'en-US';

  return (
    <div
      className="ml-2 border-l-2 border-[#E4E7ED] pl-5"
      style={{ animation: 'aiAutoFadeInUp 180ms ease-out both' }}
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

function WorkflowTask({
  artifacts,
  completed,
  copy,
  isCurrent,
  isStopped,
  locale,
  onArtifactClick,
  selectedArtifactId,
  showArtifactIds,
  task,
  visibleThinkingCounts,
}) {
  if (task.kind === 'user-request') {
    const userStep = getTaskSteps(task)[0];
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
              style={{ animation: 'aiAutoFadeInUp 180ms ease-out both' }}
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
  const steps = getTaskSteps(task);

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

function RevisionRequestBox({ disabled, locale, onChange, onSubmit, value }) {
  return (
    <form
      className="ml-14 mb-8 w-[560px] max-w-[calc(100%-56px)] rounded-[8px] border border-[#C7D2FE] bg-[#F5F7FF] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 className="text-[14px] font-semibold leading-[22px] text-[#303133]">
        {locale === 'en-US' ? 'Revision Request' : '修改要求'}
      </h3>
      <p className="mt-0.5 text-[12px] leading-[18px] text-[#909399]">
        {locale === 'en-US'
          ? 'After reviewing the final draft, add revision notes for follow-up editing.'
          : '文章终稿生成后，可在这里保留后续修改要求。'}
      </p>
      <textarea
        autoComplete="off"
        className="mt-3 h-[88px] w-full resize-none rounded-[6px] border border-[#DCDFE6] bg-white px-3 py-2 text-[14px] leading-[22px] text-[#303133] outline-none transition placeholder:text-[#B4B8C2] focus:border-[#365EFF] focus:ring-2 focus:ring-[#E8EEFF]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          locale === 'en-US'
            ? 'Enter revision notes, such as stronger CTA, shorter copy, or more case details'
            : '请输入希望 AI 继续修改的要求，如加强采购转化、压缩篇幅、补充某类案例等'
        }
        value={value}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="inline-flex h-8 flex-none items-center justify-center rounded-[6px] bg-[#365EFF] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
          disabled={disabled || !value.trim()}
        >
          {locale === 'en-US' ? 'Save Note' : '保存修改要求'}
        </button>
      </div>
    </form>
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

function ArticleBody({ content }) {
  const lines = String(content ?? '').split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (line.startsWith('# ')) continue;

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

function EvaluationPreview({ artifact }) {
  return (
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
          {(artifact.groups ?? []).map((group) => (
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
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          {(artifact.items ?? []).map((item) => (
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
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {(artifact.changes ?? []).map((change, index) => (
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
            {(artifact.tdk.keywords ?? []).map((keyword) => (
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

function StrategyPreview({ artifact }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <div>
          <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
          <p className="mt-0.5 text-[13px] leading-[20px] text-[#909399]">{artifact.subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        <pre className="whitespace-pre-wrap font-sans text-[14px] leading-[24px] text-[#3F3F46]">{artifact.content}</pre>
      </div>
    </div>
  );
}

function ProjectReportPreview({ artifact }) {
  const report = artifact.report ?? {};

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <div>
          <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
          <p className="mt-0.5 text-[13px] leading-[20px] text-[#909399]">{artifact.subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FB] px-6 py-5">
        <div className="space-y-4">
          <section className="rounded-[8px] bg-white p-4">
            <h3 className="text-[15px] font-bold leading-[24px] text-[#303133]">基础信息</h3>
            <div className="mt-3 space-y-2">
              {(report.basicInfo ?? []).map((item) => (
                <div key={item.label} className="rounded-[6px] border border-[#EBEEF5] px-3 py-2">
                  <div className="text-[13px] font-semibold text-[#303133]">{item.label}：{item.value}</div>
                  <p className="mt-1 text-[12px] leading-[18px] text-[#909399]">{item.note}</p>
                </div>
              ))}
            </div>
          </section>
          {(report.summarySections ?? []).map((section) => (
            <section key={section.title} className="rounded-[8px] bg-white p-4">
              <h3 className="text-[15px] font-bold leading-[24px] text-[#303133]">{section.title}</h3>
              <p className="mt-2 text-[14px] leading-[24px] text-[#606266]">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferenceOutline({ outline }) {
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

function PlanningReferencesPreview({ artifact }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <div>
          <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
          <p className="mt-0.5 text-[13px] leading-[20px] text-[#909399]">{artifact.subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          {(artifact.references ?? []).map((reference) => (
            <article key={reference.id} className="rounded-[8px] border border-[#EBEEF5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a
                    className="text-[14px] font-bold leading-[22px] text-[#365EFF] hover:text-[#2547D0]"
                    href={reference.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {reference.title}
                  </a>
                  <p className="mt-2 text-[13px] leading-[20px] text-[#606266]">{reference.summary}</p>
                </div>
                <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[12px] font-semibold text-[#365EFF]">
                  {reference.relevanceLabel}
                </span>
              </div>
              <div className="mt-4 rounded-[8px] border border-[#EBEEF5] bg-[#F7F8FB] px-4 py-3">
                <ReferenceOutline outline={reference.outline} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutlineNode({ node }) {
  return (
    <li className="rounded-[8px] border border-[#EBEEF5] bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[14px] font-semibold leading-[22px] text-[#303133]">
        <span className="inline-flex h-6 items-center rounded-[4px] border border-[#C7D2FE] px-2 text-[12px] font-bold text-[#365EFF]">
          {node.level}
        </span>
        {node.title}
      </div>
      {node.children?.length ? (
        <ul className="mt-3 space-y-3 pl-5">
          {node.children.map((child) => (
            <OutlineNode key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function OutlinePreview({ artifact }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[58px] flex-none items-center border-b border-[#EBEEF5] px-6">
        <div>
          <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">{artifact.title}</h2>
          <p className="mt-0.5 text-[13px] leading-[20px] text-[#909399]">{artifact.subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FB] px-6 py-5">
        <ul className="space-y-3">
          {(artifact.outlineTree ?? []).map((node) => (
            <OutlineNode key={node.id} node={node} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReferenceBlockCard({ block, expanded, onOpenKnowledgeItem, onOpenSourcePreview, onToggle }) {
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
  return [
    { id: 'knowledge-items', label: locale === 'en-US' ? 'Knowledge Items' : '知识条目' },
    { id: 'knowledge-files', label: locale === 'en-US' ? 'Knowledge Files' : '知识资料' },
  ];
}

function isReferenceBlockInTab(block, tab) {
  return tab === 'knowledge-items' ? block.blockKind === 'knowledge-item' : block.blockKind === 'knowledge-asset';
}

function ReferencesPreview({ artifact, locale, onOpenKnowledgeItem, onOpenSourcePreview }) {
  const [activeTab, setActiveTab] = useState('knowledge-items');
  const filteredBlocks = (artifact.referenceBlocks ?? []).filter((block) => isReferenceBlockInTab(block, activeTab));
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
  if (!artifact) return <EmptyPreview copy={copy} />;
  if (artifact.type === 'project-report') return <ProjectReportPreview artifact={artifact} />;
  if (artifact.type === 'strategy') return <StrategyPreview artifact={artifact} />;
  if (artifact.type === 'outline') return <OutlinePreview artifact={artifact} />;
  if (artifact.type === 'references' && artifact.referenceBlocks) {
    return (
      <ReferencesPreview
        artifact={artifact}
        locale={locale}
        onOpenKnowledgeItem={onOpenKnowledgeItem}
        onOpenSourcePreview={onOpenSourcePreview}
      />
    );
  }
  if (artifact.type === 'references') return <PlanningReferencesPreview artifact={artifact} />;
  if (artifact.type === 'evaluation') return <EvaluationPreview artifact={artifact} />;
  if (artifact.type === 'suggestion') return <SuggestionPreview artifact={artifact} />;
  if (artifact.type === 'revision') return <RevisionPreview artifact={artifact} />;
  if (artifact.type === 'tdk') return <TdkPreview artifact={artifact} />;
  return <ArticlePreview artifact={artifact} />;
}

export default function BlogArticleAiAutoCreationPage({
  article,
  locale,
  onBack,
  onRecreateTask,
  onSaveAndEdit,
  project,
  t,
  task,
}) {
  const copy = t.blogArticle.aiCreation;
  const taskListCopy = t.blogArticle.taskList;
  const [revisionRequests] = useState(() => task?.content?.revisionRequests ?? []);
  const [revisionInput, setRevisionInput] = useState('');
  const [localStatus, setLocalStatus] = useState(() => getTaskStatus(task));
  const demoData = useMemo(
    () => buildAutoDemoData(task, project, revisionRequests),
    [project, revisionRequests, task],
  );
  const initialState = useMemo(
    () => getInitialAutoState(demoData.workflow, task, localStatus, demoData.latestFinalArtifactId),
    [demoData.latestFinalArtifactId, demoData.workflow, localStatus, task],
  );
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialState.currentTaskIndex);
  const [visibleThinkingCounts, setVisibleThinkingCounts] = useState(initialState.visibleThinkingCounts);
  const [visibleArtifactIds, setVisibleArtifactIds] = useState(initialState.visibleArtifactIds);
  const [completedTaskIds, setCompletedTaskIds] = useState(initialState.completedTaskIds);
  const [isComplete, setIsComplete] = useState(initialState.isComplete);
  const [isStopped, setIsStopped] = useState(localStatus === 'stopped');
  const [selectedArtifactId, setSelectedArtifactId] = useState(initialState.selectedArtifactId);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [toast, setToast] = useState(null);
  const [stopTaskToast, setStopTaskToast] = useState(null);
  const workflowRef = useRef(null);

  const workflow = demoData.workflow;
  const artifacts = demoData.artifacts;
  const currentTask = workflow[currentTaskIndex];
  const visibleTaskList = workflow.slice(0, Math.min(currentTaskIndex + 1, workflow.length));
  const selectedArtifact = selectedArtifactId ? artifacts[selectedArtifactId] : null;
  const canStop = localStatus === 'generating' && !isStopped && !isComplete;
  const canSaveAndEdit = localStatus === 'success';
  const showRevisionRequestBox = canSaveAndEdit;

  useEffect(() => {
    if (localStatus === 'failed') {
      setToast({
        id: Date.now(),
        message: task?.errorMessage || copy.toast?.autoFailed || '生成失败，可查看已完成内容',
        type: 'error',
      });
    }
  }, [copy.toast, localStatus, task?.errorMessage]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (localStatus !== 'stopped') return;

    setStopTaskToast((current) =>
      current ?? {
        id: Date.now(),
        task,
      },
    );
  }, [localStatus, task]);

  useEffect(() => {
    if (isStopped || isComplete || localStatus !== 'generating' || !currentTask) {
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
        const completedStage = inferStageKey(task);
        const nextStage = completedStage === 'content' ? 'content-completed' : `${completedStage}-completed`;
        const nextSelectedArtifactId =
          nextStage === 'content-completed' ? demoData.latestFinalArtifactId : selectedArtifactId;
        const nextStagePayload =
          completedStage === 'content' && isAutoTask(task)
            ? buildStagePayloadPatch(demoData.visibleStages, demoData, task, {
                completedTaskIds: nextCompletedTaskIds,
                isStopped: false,
                selectedArtifactId: nextSelectedArtifactId,
                visibleArtifactIds,
                workflow,
              })
            : {
                [completedStage]: buildStagePayload(completedStage, demoData, task, {
                  completedTaskIds: getCompletedTaskIdsForStage(nextCompletedTaskIds, workflow, completedStage),
                  currentArtifactId: getSelectedArtifactIdForStage(nextSelectedArtifactId, completedStage),
                  isStopped: false,
                  visibleArtifactIds: getVisibleArtifactIdsForStage(visibleArtifactIds, completedStage),
                }),
              };

        setIsComplete(true);
        setLocalStatus(nextStage === 'content-completed' ? 'success' : 'generating');
        if (nextStage === 'content-completed') {
          setSelectedArtifactId(nextSelectedArtifactId);
        }
        updateAiCreationTask(project.id, task.id, {
          stage: nextStage,
          ...nextStagePayload,
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
    localStatus,
    project.id,
    selectedArtifactId,
    task,
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
        behavior: localStatus === 'success' ? 'auto' : 'smooth',
      });
    });
  }, [autoScrollEnabled, completedTaskIds, currentTaskIndex, localStatus, visibleArtifactIds, visibleThinkingCounts]);

  function handleWorkflowScroll() {
    const container = workflowRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceToBottom < 48);
  }

  function handleStopTask() {
    if (!canStop) return;

    const flowStage = inferStageKey(task);
    const nextStage = isAutoTask(task) ? 'auto-stopped' : `${flowStage}-stopped`;
    const stoppedPayload = isAutoTask(task)
      ? buildStagePayloadPatch(demoData.visibleStages, demoData, task, {
          completedTaskIds,
          isStopped: true,
          selectedArtifactId,
          visibleArtifactIds,
          workflow,
        })
      : {
          [flowStage]: buildStagePayload(flowStage, demoData, task, {
            completedTaskIds: getCompletedTaskIdsForStage(completedTaskIds, workflow, flowStage),
            currentArtifactId: getSelectedArtifactIdForStage(selectedArtifactId, flowStage),
            isStopped: true,
            visibleArtifactIds: getVisibleArtifactIdsForStage(visibleArtifactIds, flowStage),
          }),
        };

    setIsStopped(true);
    setLocalStatus('stopped');
    const nextTask = updateAiCreationTask(project.id, task.id, {
      stage: nextStage,
      ...stoppedPayload,
    });
    setStopTaskToast({
      id: Date.now(),
      task: nextTask ?? {
        ...task,
        stage: nextStage,
        ...stoppedPayload,
      },
    });
  }

  function handleSaveAndEdit() {
    if (!canSaveAndEdit) return;

    const { article: nextArticle } = saveAiTaskAsBlogArticle(project, task, {
      article,
      content: buildStagePayload('content', demoData, task, {
        completedTaskIds: getCompletedTaskIdsForStage(workflow.map((item) => item.id), workflow, 'content'),
        currentArtifactId: getSelectedArtifactIdForStage(demoData.latestFinalArtifactId, 'content'),
        isStopped: false,
        visibleArtifactIds: getVisibleArtifactIdsForStage(getWorkflowArtifactIds(workflow), 'content'),
      }),
    });

    onSaveAndEdit(nextArticle);
  }

  function handleOpenKnowledgeItem(block) {
    openAppViewInNewTab({
      knowledgeItemId: block.knowledgeItemId,
      projectId: project.id,
      view: 'knowledge-items',
    });
  }

  function handleOpenSourcePreview(block) {
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

  function handleSaveRevisionNote() {
    if (!revisionInput.trim()) return;

    setRevisionInput('');
    setToast({
      id: Date.now(),
      message: locale === 'en-US' ? 'Revision note saved.' : '修改要求已保存',
      type: 'success',
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <style>
        {`
          @keyframes aiAutoFadeInUp {
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
            onClick={onBack}
            aria-label={locale === 'en-US' ? 'Back' : '返回'}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[18px] font-bold leading-[28px] text-[#232E45]">
            {copy.titles.auto}
          </h1>
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
              const completed = completedTaskIds.includes(workflowTask.id);
              const isCurrent = workflowTask.id === currentTask?.id && !completed;

              return (
                <WorkflowTask
                  key={workflowTask.id}
                  artifacts={artifacts}
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
                disabled={false}
                locale={locale}
                onChange={setRevisionInput}
                onSubmit={handleSaveRevisionNote}
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
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#EBEEF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-end gap-3 px-6">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:border-[#DCDFE6] disabled:text-[#A8ABB2] disabled:hover:bg-white"
            disabled={!canStop}
            onClick={handleStopTask}
          >
            {copy.actions.stop}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] bg-[#365EFF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
            disabled={!canSaveAndEdit}
            onClick={handleSaveAndEdit}
          >
            <Save className="h-4 w-4" />
            {copy.actions.saveAndEdit}
          </button>
        </div>
      </footer>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
        />
      ) : null}

      {stopTaskToast ? (
        <Toast
          key={stopTaskToast.id}
          actionLabel={taskListCopy.actions.recreate}
          message={copy.toast?.autoStoppedManual || copy.toast?.autoStopped || copy.actions.stop}
          onAction={() => {
            const recreateTask = stopTaskToast.task;
            setStopTaskToast(null);
            onRecreateTask?.(recreateTask);
          }}
          onClose={() => setStopTaskToast(null)}
          testId="blog-article-auto-stop-toast"
          type="info"
        />
      ) : null}
    </div>
  );
}

function stripStagePrefix(id) {
  return String(id ?? '').split(':').pop();
}

function isStageScopedId(id, stageKey) {
  return String(id ?? '').startsWith(`${stageKey}:`);
}

function getCompletedTaskIdsForStage(completedTaskIds, workflow, stageKey) {
  const completedSet = new Set(completedTaskIds);

  return workflow
    .filter((item) => completedSet.has(item.id))
    .flatMap((item) => item.rawTaskIds ?? [])
    .filter((id) => isStageScopedId(id, stageKey))
    .map(stripStagePrefix);
}

function getVisibleArtifactIdsForStage(visibleArtifactIds, stageKey) {
  return visibleArtifactIds.filter((id) => isStageScopedId(id, stageKey)).map(stripStagePrefix);
}

function getSelectedArtifactIdForStage(selectedArtifactId, stageKey) {
  return isStageScopedId(selectedArtifactId, stageKey) ? stripStagePrefix(selectedArtifactId) : '';
}

function buildStagePayload(stageKey, demoData, task, overrides = {}) {
  if (stageKey === 'content') {
    const contentData = demoData.contentData;
    return {
      ...(task?.content ?? {}),
      articleVersions: contentData.articleVersions,
      citationUsages: contentData.citationUsages,
      evaluationReports: contentData.evaluationReports,
      finalEvaluationReport: contentData.latestEvaluationReport ?? contentData.finalEvaluationReport,
      finalArticle: contentData.latestFinalArticle ?? contentData.finalArticle,
      finalRevisionRounds: contentData.finalRevisionRounds,
      latestEvaluationReportId: contentData.latestEvaluationReportId,
      latestFinalArticleId: contentData.latestFinalArticleId,
      latestTdkId: contentData.latestTdkId,
      referenceBlocks: contentData.referenceBlocks,
      revisionRecords: contentData.revisionRecords,
      revisionRequests: contentData.revisionRequests,
      revisionSuggestions: contentData.revisionSuggestions,
      tdk: contentData.latestTdk ?? contentData.tdk,
      updatedAt: getTodayString(),
      ...overrides,
    };
  }

  if (stageKey === 'outline') {
    const outlineData = demoData.stageData.outline;
    return {
      ...(task?.outline ?? {}),
      outlineTree: outlineData.outlineTree,
      titleDraft: outlineData.selectedTitle,
      titleOptions: outlineData.titleOptions,
      updatedAt: getTodayString(),
      ...overrides,
    };
  }

  const planningData = demoData.stageData.planning;
  return {
    ...(task?.planning ?? {}),
    strategyContent: planningData.artifacts.strategy?.content,
    updatedAt: getTodayString(),
    ...overrides,
  };
}

function buildStagePayloadPatch(stageKeys, demoData, task, state) {
  return Object.fromEntries(
    stageKeys.map((stageKey) => [
      stageKey,
      buildStagePayload(stageKey, demoData, task, {
        completedTaskIds: getCompletedTaskIdsForStage(state.completedTaskIds, state.workflow, stageKey),
        currentArtifactId: getSelectedArtifactIdForStage(state.selectedArtifactId, stageKey),
        isStopped: state.isStopped,
        visibleArtifactIds: getVisibleArtifactIdsForStage(state.visibleArtifactIds, stageKey),
      }),
    ]),
  );
}
