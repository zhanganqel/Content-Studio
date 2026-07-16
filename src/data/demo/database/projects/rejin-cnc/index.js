import { rejinCncProject } from '../../../rejinCncProject.js';
import { createFileScenarioSeeds } from '../seedFactories.js';
import { rejinCncArticleCreationTasks } from './article-creation-tasks.js';
import { rejinCncBlogArticles } from './blog-articles.js';

export const rejinCncDemoDatabase = {
  schemaVersion: 1,
  projectId: rejinCncProject.id,
  tables: {
    articleCreationTasks: rejinCncArticleCreationTasks,
    articleWorkflowSession: null,
    audiencePersonas: rejinCncProject.audiencePersonas ?? [],
    blogArticles: rejinCncBlogArticles,
    brandProfile: rejinCncProject.brandProfile ?? {},
    fileAssets: createFileScenarioSeeds(rejinCncProject.fileAssets),
    fileChunks: {},
    knowledgeItems: rejinCncProject.knowledgeItems ?? [],
    knowledgeTypes: [],
    mediaAssets: rejinCncProject.mediaAssets ?? [],
    project: rejinCncProject,
  },
};
