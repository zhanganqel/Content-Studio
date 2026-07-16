function createArticleContent(title, summary, companyName) {
  return [
    `# ${title}`,
    '',
    summary,
    '',
    '## What Buyers Should Evaluate',
    '',
    'Compare technical fit, quality evidence, delivery planning, communication, and the information required for an accurate quotation.',
    '',
    '## Recommended Next Step',
    '',
    `Prepare drawings, specifications, quantities, and delivery expectations before contacting ${companyName}.`,
  ].join('\n');
}

export function createBlogArticleSeeds(config) {
  return config.articles.map((article, index) => ({
    articleType: article.articleType,
    content: createArticleContent(article.title, article.summary, config.companyName),
    id: `${config.idPrefix}-article-${article.slug}`,
    keywords: article.keywords,
    status: article.status,
    targetAudienceName: article.audienceName,
    targetAudiencePersonaId: article.audienceId,
    title: article.title,
    updatedAt: article.updatedAt,
    updatedBy: index % 2 === 0 ? 'Angel' : 'Content Team',
  }));
}

function createTaskInput(config, scenario) {
  return {
    additionalRequirements: scenario.additionalRequirements ?? '',
    articleLanguage: 'EN',
    articleLength: '1200 -1400（5-6个H2）',
    articleTopic: scenario.title,
    articleType: scenario.articleType ?? 'Comparison（对比分析）',
    brandRequirements: config.brandRequirements,
    businessGoal: scenario.businessGoal,
    knowledgeAssets: config.knowledgeAssets,
    knowledgeItems: config.knowledgeItems,
    person: '第三人称',
    primaryKeyword: scenario.primaryKeyword,
    referenceArticles: [],
    secondaryKeywords: scenario.secondaryKeywords,
    targetAudience: {
      id: config.audienceId,
      name: config.audienceName,
      title: config.audienceName,
    },
    targetAudienceId: config.audienceId,
    targetAudienceName: config.audienceName,
    targetRegion: config.targetRegion ?? 'Global',
    tone: 'professional（专业）',
  };
}

function createPlanningState(updatedAt) {
  return {
    completedTaskIds: [
      'load-project',
      'summarize-project',
      'analyze-market-audience',
      'analyze-references',
      'create-strategy',
    ],
    currentArtifactId: 'strategy',
    isStopped: false,
    strategyContent: '',
    updatedAt,
    visibleArtifactIds: ['project-report', 'references', 'strategy'],
  };
}

function createOutlineState(updatedAt, complete) {
  return {
    completedTaskIds: complete ? ['read-strategy', 'write-titles', 'write-outline'] : [],
    confirmedTitleId: 'title-choice-best',
    currentArtifactId: complete ? 'outline' : '',
    isStopped: false,
    outlineTree: [],
    selectedTitleId: 'title-choice-best',
    titleConfirmed: complete,
    titleDraft: '',
    titleOptions: [],
    updatedAt,
    visibleArtifactIds: complete ? ['outline'] : [],
  };
}

function createContentState(updatedAt, scenario) {
  const state = {
    articleVersions: [],
    citationUsages: [],
    completedTaskIds: [],
    currentArtifactId: '',
    evaluationReports: [],
    finalArticle: null,
    finalEvaluationReport: null,
    finalRevisionRounds: [],
    isStopped: scenario === 'stopped',
    latestEvaluationReportId: '',
    latestFinalArticleId: '',
    latestTdkId: '',
    referenceBlocks: [],
    revisionRecords: [],
    revisionRequests: [],
    revisionSuggestions: [],
    savedArticleId: '',
    tdk: null,
    updatedAt,
    visibleArtifactIds: [],
  };

  if (scenario === 'stopped') {
    return {
      ...state,
      completedTaskIds: ['load-content-knowledge', 'write-article-v1'],
      currentArtifactId: 'article-v1',
      visibleArtifactIds: ['references', 'article-v1'],
    };
  }

  if (scenario === 'failed') {
    return {
      ...state,
      completedTaskIds: ['load-content-knowledge', 'write-article-v1', 'evaluate-v1'],
      currentArtifactId: 'suggestion-v1',
      visibleArtifactIds: ['references', 'article-v1', 'evaluation-v1', 'suggestion-v1'],
    };
  }

  return state;
}

export function createArticleTaskSeeds(config) {
  const dates = {
    failed: '2026-07-12',
    generating: '2026-07-16',
    stopped: '2026-07-13',
    success: '2026-07-15',
  };

  return config.tasks.map((scenario) => {
    const updatedAt = dates[scenario.status];
    const task = {
      articleId: `${config.idPrefix}-future-article-${scenario.status}`,
      content: createContentState(updatedAt, scenario.status),
      createdAt: updatedAt,
      errorMessage: scenario.status === 'failed' ? scenario.errorMessage : '',
      evaluationVersion: 'ragseo-ai-writing-evaluation-v1',
      id: `${config.idPrefix}-task-${scenario.status}`,
      mode: 'auto',
      model: 'GPT-5.5',
      outline: createOutlineState(updatedAt, scenario.status !== 'generating'),
      planning: createPlanningState(updatedAt),
      schemaVersion: 1,
      searchAnalyses: [],
      stage: {
        failed: 'auto-failed',
        generating: 'auto-generating',
        stopped: 'auto-stopped',
        success: 'content-completed',
      }[scenario.status],
      taskInput: createTaskInput(config, scenario),
      updatedAt,
      updatedBy: 'Angel',
    };

    return task;
  });
}

export function createFileScenarioSeeds(files) {
  const statuses = ['chunked', 'processing', 'failed'];
  return (files ?? []).map((file, index) => ({
    ...file,
    processingStatus: statuses[index] ?? file.processingStatus ?? 'chunked',
  }));
}
