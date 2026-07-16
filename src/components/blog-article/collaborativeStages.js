// 协同创作阶段定义与可访问性规则，供页面阶段条和 App 路由共享。
export const collaborativeStages = ['create', 'planning', 'outline', 'content'];

export function getCollaborativeExecutionStage(task) {
  if (!task || task.mode === 'auto') return '';

  return collaborativeStages.find((stage) => task.stage === stage) ?? '';
}

// 阶段状态决定阶段条颜色与可点击性；已中止阶段因有可查看产物而保持可进入。
export function getCollaborativeStageStatuses(task) {
  const stage = task?.stage ?? '';
  const outline = task?.outline ?? {};
  const content = task?.content ?? {};
  const planning = task?.planning ?? {};

  const planningStopped = stage === 'planning-stopped' || Boolean(planning.isStopped);
  const outlineStopped = stage === 'outline-stopped' || Boolean(outline.isStopped);
  const contentStopped = stage === 'content-stopped' || Boolean(content.isStopped);
  const planningComplete =
    stage === 'planning-completed' ||
    stage.startsWith('outline') ||
    stage.startsWith('content') ||
    Boolean(planning.playback?.isComplete);
  const outlineComplete =
    stage === 'outline-completed' ||
    stage.startsWith('content') ||
    Boolean(outline.playback?.isComplete);
  const contentComplete = stage === 'content-completed' || Boolean(content.playback?.isComplete);

  return {
    content: contentComplete ? 'completed' : contentStopped ? 'stopped' : stage === 'content' ? 'running' : 'unavailable',
    create: task && stage !== 'create-task' ? 'completed' : 'running',
    outline: outlineComplete ? 'completed' : outlineStopped ? 'stopped' : stage === 'outline' ? 'running' : 'unavailable',
    planning: planningComplete ? 'completed' : planningStopped ? 'stopped' : stage === 'planning' ? 'running' : 'unavailable',
  };
}

export function getCollaborativeStageAvailability(task) {
  return Object.fromEntries(
    Object.entries(getCollaborativeStageStatuses(task)).map(([stage, status]) => [stage, status !== 'unavailable']),
  );
}

// 当前任务实际正在后台播放时返回 true，页面查看阶段不会影响此状态。
export function isCollaborativeStageRunning(task) {
  return Boolean(getCollaborativeExecutionStage(task));
}
