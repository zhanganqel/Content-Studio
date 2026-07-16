// 协同创作阶段重跑时使用的空状态，保持任务存储与测试不依赖浏览器资源模块。
export function createPlanningResetState(updatedAt) {
  return {
    completedTaskIds: [],
    currentArtifactId: '',
    isStopped: false,
    playback: {
      completedTaskIds: [],
      currentTaskIndex: 0,
      isComplete: false,
      selectedArtifactId: '',
      visibleArtifactIds: [],
      visibleThinkingCounts: {},
    },
    strategyContent: '',
    updatedAt,
  };
}

export function createOutlineResetState(updatedAt) {
  return {
    completedTaskIds: [],
    confirmedTitleId: '',
    currentArtifactId: '',
    isStopped: false,
    outlineTree: [],
    playback: {
      completedTaskIds: [],
      currentTaskIndex: 0,
      isComplete: false,
      selectedArtifactId: '',
      titleConfirmed: false,
      titlesVisible: false,
      visibleArtifactIds: [],
      visibleThinkingCounts: {},
    },
    selectedTitleId: '',
    titleConfirmed: false,
    titleDraft: '',
    titleOptions: [],
    updatedAt,
  };
}

export function createContentResetState(updatedAt) {
  return {
    articleVersions: [],
    citationUsages: [],
    completedTaskIds: [],
    currentArtifactId: '',
    evaluationReports: [],
    finalArticle: null,
    finalEvaluationReport: null,
    finalRevisionRounds: [],
    isStopped: false,
    latestEvaluationReportId: '',
    latestFinalArticleId: '',
    latestTdkId: '',
    playback: {
      completedTaskIds: [],
      currentTaskIndex: 0,
      isComplete: false,
      selectedArtifactId: '',
      visibleArtifactIds: [],
      visibleThinkingCounts: {},
    },
    referenceBlocks: [],
    revisionRecords: [],
    revisionRequests: [],
    revisionSuggestions: [],
    savedArticleId: '',
    tdk: null,
    updatedAt,
    visibleArtifactIds: [],
  };
}

export function createCollaborativeRunId(now = Date.now(), random = Math.random()) {
  return `collaborative-run-${now}-${random.toString(16).slice(2)}`;
}
