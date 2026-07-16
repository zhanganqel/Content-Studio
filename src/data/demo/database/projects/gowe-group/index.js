import { goweGroupProject } from '../../../goweGroupProject.js';
import { createFileScenarioSeeds } from '../seedFactories.js';
import { goweGroupArticleCreationTasks } from './article-creation-tasks.js';
import { goweGroupBlogArticles } from './blog-articles.js';

export const goweGroupDemoDatabase = {
  schemaVersion: 1,
  projectId: goweGroupProject.id,
  tables: {
    articleCreationTasks: goweGroupArticleCreationTasks,
    articleWorkflowSession: null,
    audiencePersonas: goweGroupProject.audiencePersonas ?? [],
    blogArticles: goweGroupBlogArticles,
    brandProfile: goweGroupProject.brandProfile ?? {},
    fileAssets: createFileScenarioSeeds(goweGroupProject.fileAssets),
    fileChunks: {},
    knowledgeItems: goweGroupProject.knowledgeItems ?? [],
    knowledgeTypes: [],
    mediaAssets: goweGroupProject.mediaAssets ?? [],
    project: goweGroupProject,
  },
};
