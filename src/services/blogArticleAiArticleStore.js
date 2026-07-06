import { createContentDemoData, splitAiKeywordText, updateAiCreationTask } from './blogArticleAiStore.js';
import {
  createBlogArticleId,
  getBlogArticleDrafts,
  getTodayString,
  saveBlogArticleDrafts,
  upsertBlogArticle,
} from './blogArticleStore.js';

const articleStorageKeyPrefix = 'content-studio-blog-articles:';
const taskStorageKeyPrefix = 'content-studio-blog-article-ai-tasks:';
const taskArticleRuleMigrationKeyPrefix = 'content-studio-blog-article-task-article-rule-v1:';

function normalizeArticleType(value) {
  return String(value ?? '').replace(/（.*$/, '').trim();
}

function getTaskInput(task) {
  return task?.taskInput ?? {};
}

function getTaskAudienceId(task) {
  const input = getTaskInput(task);
  return input.targetAudienceId || input.targetAudience?.id || '';
}

function getTaskAudienceName(task) {
  const input = getTaskInput(task);
  return input.targetAudience?.title || input.targetAudience?.name || input.targetAudienceName || getTaskAudienceId(task);
}

function getTaskArticleType(task) {
  return normalizeArticleType(getTaskInput(task).articleType);
}

function parseStoredTasks(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.tasks)) return parsed.tasks;
    return [];
  } catch {
    return [];
  }
}

function parseStoredArticles(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.articles)) return parsed.articles;
    return [];
  } catch {
    return [];
  }
}

function isUnsavedTaskDraft(article, taskArticleIds) {
  return (
    taskArticleIds.has(article.id) &&
    !article.aiTaskId &&
    !String(article.content ?? '').trim() &&
    !article.tdk &&
    !article.evaluationReport
  );
}

export function migrateAiTaskArticleRuleStorage(project) {
  if (typeof window === 'undefined' || !project?.id) return false;

  const migrationKey = `${taskArticleRuleMigrationKeyPrefix}${project.id}`;
  if (window.localStorage.getItem(migrationKey)) return false;

  const taskStorageKey = `${taskStorageKeyPrefix}${project.id}`;
  const articleStorageKey = `${articleStorageKeyPrefix}${project.id}`;
  const storedTasks = window.localStorage.getItem(taskStorageKey);
  const tasks = parseStoredTasks(storedTasks);
  const taskArticleIds = new Set(tasks.map((task) => task.articleId).filter(Boolean));
  let changed = false;

  if (storedTasks) {
    window.localStorage.removeItem(taskStorageKey);
    changed = true;
  }

  const storedArticles = window.localStorage.getItem(articleStorageKey);
  if (storedArticles && taskArticleIds.size) {
    const articles = parseStoredArticles(storedArticles);
    const nextArticles = articles.filter((article) => !isUnsavedTaskDraft(article, taskArticleIds));

    if (nextArticles.length !== articles.length) {
      saveBlogArticleDrafts(project.id, nextArticles);
      changed = true;
    }
  }

  window.localStorage.setItem(migrationKey, '1');
  return changed;
}

export function createArticleContextFromAiTask(task, fallback = {}) {
  const input = getTaskInput(task);
  const title = task?.content?.finalArticle?.headline || task?.outline?.titleDraft || input.articleTopic || '文章创作任务';
  const tdk = task?.content?.tdk ?? null;
  const finalArticle = task?.content?.finalArticle ?? null;

  return {
    ...fallback,
    aiTaskId: task?.id,
    articleType: getTaskArticleType(task) || fallback.articleType || 'Comparison',
    content: finalArticle?.content ?? fallback.content ?? '',
    embeddedMediaAssets: finalArticle?.images ?? fallback.embeddedMediaAssets ?? [],
    evaluationReport: task?.content?.finalEvaluationReport ?? fallback.evaluationReport,
    id: task?.articleId || fallback.id || createBlogArticleId(),
    keywords: [
      ...new Set([
        ...(tdk?.keywords ?? []),
        ...splitAiKeywordText(input.primaryKeyword),
        ...(input.secondaryKeywords ?? []),
        ...(fallback.keywords ?? []),
      ].filter(Boolean)),
    ],
    status: fallback.status || 'draft',
    targetAudienceName: getTaskAudienceName(task) || fallback.targetAudienceName || '',
    targetAudiencePersonaId: input.targetAudienceId || fallback.targetAudiencePersonaId || '',
    tdk: tdk ?? fallback.tdk,
    title,
    updatedAt: task?.updatedAt || fallback.updatedAt || getTodayString(),
    updatedBy: fallback.updatedBy || 'Angel',
  };
}

export function getAiTaskArticleContext(project, task) {
  if (!task) return null;

  const existingArticle = getBlogArticleDrafts(project).find((article) => article.id === task.articleId);
  return createArticleContextFromAiTask(task, existingArticle);
}

export function saveAiTaskAsBlogArticle(project, task, options = {}) {
  const demoData = createContentDemoData(task, project);
  const finalArticle = demoData.latestFinalArticle;
  const tdk = demoData.latestTdk;
  const existingArticle =
    options.article ?? getBlogArticleDrafts(project).find((article) => article.id === task.articleId);
  const nextArticle = {
    ...createArticleContextFromAiTask(task, existingArticle),
    aiTaskId: task.id,
    articleType: getTaskArticleType(task) || existingArticle?.articleType || 'Comparison',
    content: finalArticle.content,
    embeddedMediaAssets: finalArticle.images ?? [],
    evaluationReport: demoData.latestEvaluationReport,
    id: existingArticle?.id || task.articleId || createBlogArticleId(),
    keywords: [
      ...new Set([
        ...(tdk.keywords ?? []),
        ...splitAiKeywordText(getTaskInput(task).primaryKeyword),
        ...(getTaskInput(task).secondaryKeywords ?? []),
      ].filter(Boolean)),
    ],
    status: 'draft',
    targetAudienceName: getTaskAudienceName(task) || existingArticle?.targetAudienceName || '',
    tdk,
    title: finalArticle.headline,
    updatedAt: getTodayString(),
    updatedBy: 'Angel',
  };

  upsertBlogArticle(project, nextArticle);
  const nextTask = updateAiCreationTask(project.id, task.id, {
    errorMessage: '',
    stage: 'content-completed',
    content: {
      ...(task.content ?? {}),
      ...(options.content ?? {}),
      finalArticle,
      finalEvaluationReport: demoData.latestEvaluationReport,
      latestEvaluationReportId: demoData.latestEvaluationReportId,
      latestFinalArticleId: demoData.latestFinalArticleId,
      latestTdkId: demoData.latestTdkId,
      savedArticleId: nextArticle.id,
      tdk,
      updatedAt: getTodayString(),
    },
  });

  return {
    article: nextArticle,
    demoData,
    task: nextTask ?? task,
  };
}
