import { useEffect, useRef } from 'react';
import {
  createContentDemoData,
  createOutlineDemoData,
  createPlanningDemoData,
  getAiCreationTasks,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';

function getContentSteps(workflowTask) {
  if (Array.isArray(workflowTask?.steps) && workflowTask.steps.length) {
    return workflowTask.steps.map((step, index) => ({
      ...step,
      artifactIds: step.artifactIds ?? (step.artifactId ? [step.artifactId] : []),
      id: step.id ?? `${workflowTask.id}-step-${index}`,
      thinking: step.thinking ?? [],
    }));
  }

  return [{
    ...workflowTask,
    artifactIds: workflowTask?.artifactIds ?? (workflowTask?.artifactId ? [workflowTask.artifactId] : []),
    id: workflowTask?.id,
    thinking: workflowTask?.thinking ?? [],
  }];
}

function getContentRevealCount(step) {
  return (step?.thinking?.length ?? 0) + (step?.sourceList ? 1 : 0);
}

function isContentStepComplete(step, visibleThinkingCounts, visibleArtifactIds) {
  const allArtifactsVisible = step.artifactIds.every((artifactId) => visibleArtifactIds.includes(artifactId));
  return (visibleThinkingCounts[step.id] ?? 0) >= getContentRevealCount(step) && allArtifactsVisible;
}

function getCurrentContentStep(task, visibleThinkingCounts, visibleArtifactIds) {
  return getContentSteps(task).find((step) => !isContentStepComplete(step, visibleThinkingCounts, visibleArtifactIds));
}

function getPlayback(phase) {
  return {
    completedTaskIds: phase?.playback?.completedTaskIds ?? phase?.completedTaskIds ?? [],
    currentTaskIndex: phase?.playback?.currentTaskIndex ?? 0,
    isComplete: Boolean(phase?.playback?.isComplete),
    selectedArtifactId: phase?.playback?.selectedArtifactId ?? phase?.currentArtifactId ?? '',
    titleConfirmed: Boolean(phase?.playback?.titleConfirmed ?? phase?.titleConfirmed),
    titlesVisible: Boolean(phase?.playback?.titlesVisible),
    version: Number(phase?.playback?.version ?? 0),
    visibleArtifactIds: phase?.playback?.visibleArtifactIds ?? phase?.visibleArtifactIds ?? [],
    visibleThinkingCounts: phase?.playback?.visibleThinkingCounts ?? {},
  };
}

function withPlaybackVersion(playback, patch) {
  return {
    ...playback,
    ...patch,
    version: playback.version + 1,
  };
}

function updatePhase(projectId, taskId, phaseName, patch, onTaskUpdated) {
  const nextTask = updateAiCreationTask(projectId, taskId, { [phaseName]: patch });
  if (nextTask) onTaskUpdated?.(nextTask);
  return nextTask;
}

function advanceSimplePhase({ demoData, phaseName, projectId, task, onTaskUpdated }) {
  const phase = task[phaseName] ?? {};
  const playback = getPlayback(phase);
  const currentTask = demoData.workflow[playback.currentTaskIndex];
  if (!currentTask || playback.isComplete || phase.isStopped) return { delay: null };

  const thinkingCount = playback.visibleThinkingCounts[currentTask.id] ?? 0;
  if (thinkingCount < (currentTask.thinking?.length ?? 0)) {
    updatePhase(projectId, task.id, phaseName, {
      playback: withPlaybackVersion(playback, {
        visibleThinkingCounts: {
          ...playback.visibleThinkingCounts,
          [currentTask.id]: thinkingCount + 1,
        },
      }),
    }, onTaskUpdated);
    return { delay: 950 };
  }

  if (currentTask.artifactId && !playback.visibleArtifactIds.includes(currentTask.artifactId)) {
    updatePhase(projectId, task.id, phaseName, {
      currentArtifactId: currentTask.artifactId,
      playback: withPlaybackVersion(playback, {
        selectedArtifactId: currentTask.artifactId,
        visibleArtifactIds: [...playback.visibleArtifactIds, currentTask.artifactId],
      }),
    }, onTaskUpdated);
    return { delay: 650 };
  }

  const completedTaskIds = playback.completedTaskIds.includes(currentTask.id)
    ? playback.completedTaskIds
    : [...playback.completedTaskIds, currentTask.id];
  const complete = playback.currentTaskIndex + 1 >= demoData.workflow.length;
  const nextStage = complete ? `${phaseName}-completed` : phaseName;
  const nextTask = updateAiCreationTask(projectId, task.id, {
    stage: nextStage,
    [phaseName]: {
      completedTaskIds,
      isStopped: false,
      playback: withPlaybackVersion(playback, {
        completedTaskIds,
        currentTaskIndex: complete ? demoData.workflow.length : playback.currentTaskIndex + 1,
        isComplete: complete,
      }),
    },
  });
  if (nextTask) onTaskUpdated?.(nextTask);
  return { delay: 650 };
}

function advanceOutlinePhase({ demoData, projectId, task, onTaskUpdated }) {
  const phase = task.outline ?? {};
  const playback = getPlayback(phase);
  const currentTask = demoData.workflow[playback.currentTaskIndex];
  if (!currentTask || playback.isComplete || phase.isStopped) return { delay: null };

  const thinkingCount = playback.visibleThinkingCounts[currentTask.id] ?? 0;
  if (thinkingCount < (currentTask.thinking?.length ?? 0)) {
    updatePhase(projectId, task.id, 'outline', {
      playback: withPlaybackVersion(playback, {
        visibleThinkingCounts: {
          ...playback.visibleThinkingCounts,
          [currentTask.id]: thinkingCount + 1,
        },
      }),
    }, onTaskUpdated);
    return { delay: 950 };
  }

  if (currentTask.titleSelection && !playback.titlesVisible) {
    updatePhase(projectId, task.id, 'outline', {
      selectedTitleId: phase.selectedTitleId || demoData.selectedTitleId,
      titleDraft: phase.titleDraft || demoData.selectedTitle,
      titleOptions: phase.titleOptions?.length ? phase.titleOptions : demoData.titleOptions,
      playback: withPlaybackVersion(playback, { titlesVisible: true }),
    }, onTaskUpdated);
    return { delay: 650 };
  }

  if (currentTask.titleSelection && !phase.titleConfirmed) {
    return { delay: 350 };
  }

  if (currentTask.artifactId && !playback.visibleArtifactIds.includes(currentTask.artifactId)) {
    updatePhase(projectId, task.id, 'outline', {
      currentArtifactId: currentTask.artifactId,
      playback: withPlaybackVersion(playback, {
        selectedArtifactId: currentTask.artifactId,
        visibleArtifactIds: [...playback.visibleArtifactIds, currentTask.artifactId],
      }),
    }, onTaskUpdated);
    return { delay: 650 };
  }

  const completedTaskIds = playback.completedTaskIds.includes(currentTask.id)
    ? playback.completedTaskIds
    : [...playback.completedTaskIds, currentTask.id];
  const complete = playback.currentTaskIndex + 1 >= demoData.workflow.length;
  const nextTask = updateAiCreationTask(projectId, task.id, {
    stage: complete ? 'outline-completed' : 'outline',
    outline: {
      completedTaskIds,
      isStopped: false,
      playback: withPlaybackVersion(playback, {
        completedTaskIds,
        currentTaskIndex: complete ? demoData.workflow.length : playback.currentTaskIndex + 1,
        isComplete: complete,
        titleConfirmed: Boolean(phase.titleConfirmed),
      }),
    },
  });
  if (nextTask) onTaskUpdated?.(nextTask);
  return { delay: 650 };
}

function advanceContentPhase({ demoData, projectId, task, onTaskUpdated }) {
  const phase = task.content ?? {};
  const playback = getPlayback(phase);
  const currentTask = demoData.workflow[playback.currentTaskIndex];
  if (!currentTask || playback.isComplete || phase.isStopped) return { delay: null };

  const currentStep = getCurrentContentStep(currentTask, playback.visibleThinkingCounts, playback.visibleArtifactIds);
  if (currentStep) {
    const thinkingCount = playback.visibleThinkingCounts[currentStep.id] ?? 0;
    if (thinkingCount < getContentRevealCount(currentStep)) {
      updatePhase(projectId, task.id, 'content', {
        playback: withPlaybackVersion(playback, {
          visibleThinkingCounts: {
            ...playback.visibleThinkingCounts,
            [currentStep.id]: thinkingCount + 1,
          },
        }),
      }, onTaskUpdated);
      return { delay: 950 };
    }

    const nextArtifactId = currentStep.artifactIds.find((artifactId) => !playback.visibleArtifactIds.includes(artifactId));
    if (nextArtifactId) {
      updatePhase(projectId, task.id, 'content', {
        currentArtifactId: nextArtifactId,
        playback: withPlaybackVersion(playback, {
          selectedArtifactId: nextArtifactId,
          visibleArtifactIds: [...playback.visibleArtifactIds, nextArtifactId],
        }),
      }, onTaskUpdated);
      return { delay: 650 };
    }
  }

  const completedTaskIds = playback.completedTaskIds.includes(currentTask.id)
    ? playback.completedTaskIds
    : [...playback.completedTaskIds, currentTask.id];
  const complete = playback.currentTaskIndex + 1 >= demoData.workflow.length;
  const nextTask = updateAiCreationTask(projectId, task.id, {
    stage: complete ? 'content-completed' : 'content',
    content: {
      completedTaskIds,
      isStopped: false,
      playback: withPlaybackVersion(playback, {
        completedTaskIds,
        currentTaskIndex: complete ? demoData.workflow.length : playback.currentTaskIndex + 1,
        isComplete: complete,
      }),
    },
  });
  if (nextTask) onTaskUpdated?.(nextTask);
  return { delay: 650 };
}

function getRunnerDelay(task, project) {
  if (task.stage === 'planning') {
    const playback = getPlayback(task.planning);
    const currentTask = createPlanningDemoData(task, project).workflow[playback.currentTaskIndex];
    if (!currentTask) return null;
    return (playback.visibleThinkingCounts[currentTask.id] ?? 0) < (currentTask.thinking?.length ?? 0) ? 950 : 650;
  }

  if (task.stage === 'outline') {
    const playback = getPlayback(task.outline);
    const currentTask = createOutlineDemoData(task, project).workflow[playback.currentTaskIndex];
    if (!currentTask) return null;
    if (currentTask.titleSelection && playback.titlesVisible && !task.outline?.titleConfirmed) return 350;
    return (playback.visibleThinkingCounts[currentTask.id] ?? 0) < (currentTask.thinking?.length ?? 0) ? 950 : 650;
  }

  if (task.stage === 'content') {
    const playback = getPlayback(task.content);
    const workflow = createContentDemoData(task, project, {
      revisionRequests: task.content?.revisionRequests ?? [],
    }).workflow;
    const currentTask = workflow[playback.currentTaskIndex];
    if (!currentTask) return null;
    const currentStep = getCurrentContentStep(currentTask, playback.visibleThinkingCounts, playback.visibleArtifactIds);
    if (!currentStep) return 650;
    return (playback.visibleThinkingCounts[currentStep.id] ?? 0) < getContentRevealCount(currentStep) ? 950 : 650;
  }

  return null;
}

function advanceLatestTask({ onTaskUpdated, project, task }) {
  const latestTask = getAiCreationTasks(project.id).find((item) => item.id === task.id) ?? task;
  if (latestTask.stage === 'planning') {
    advanceSimplePhase({
      demoData: createPlanningDemoData(latestTask, project),
      onTaskUpdated,
      phaseName: 'planning',
      projectId: project.id,
      task: latestTask,
    });
    return;
  }

  if (latestTask.stage === 'outline') {
    advanceOutlinePhase({
      demoData: createOutlineDemoData(latestTask, project),
      onTaskUpdated,
      projectId: project.id,
      task: latestTask,
    });
    return;
  }

  if (latestTask.stage === 'content') {
    advanceContentPhase({
      demoData: createContentDemoData(latestTask, project, {
        revisionRequests: latestTask.content?.revisionRequests ?? [],
      }),
      onTaskUpdated,
      projectId: project.id,
      task: latestTask,
    });
  }
}

// 页面切换后仍存活的协同任务运行器；它只推进实际执行阶段，不改变用户的查看阶段。
export default function CollaborativeTaskRunner({ onTaskUpdated, project, task }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!project?.id || !task?.id || task.mode === 'auto' || !['planning', 'outline', 'content'].includes(task.stage)) {
      return undefined;
    }

    const latestTask = getAiCreationTasks(project.id).find((item) => item.id === task.id) ?? task;
    const delay = getRunnerDelay(latestTask, project);
    if (delay) timerRef.current = window.setTimeout(() => advanceLatestTask({ onTaskUpdated, project, task }), delay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [onTaskUpdated, project, task]);

  return null;
}
