export const demoDatabaseVersion = 1;

// 表名集中维护，业务 Store 只能通过这些名称读取固定种子和会话快照。
export const demoTableNames = Object.freeze({
  articleCreationTasks: 'articleCreationTasks',
  articleWorkflowSession: 'articleWorkflowSession',
  audiencePersonas: 'audiencePersonas',
  blogArticles: 'blogArticles',
  brandProfile: 'brandProfile',
  copilotUi: 'copilotUi',
  fileAssets: 'fileAssets',
  fileChunks: 'fileChunks',
  knowledgeItems: 'knowledgeItems',
  knowledgeTypes: 'knowledgeTypes',
  mediaAssets: 'mediaAssets',
  project: 'project',
});

export const demoTableNameSet = new Set(Object.values(demoTableNames));
