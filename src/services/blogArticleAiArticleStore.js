import { createContentDemoData, splitAiKeywordText, updateAiCreationTask } from './blogArticleAiStore.js';
import {
  createBlogArticleId,
  getBlogArticleDrafts,
  getTodayString,
  saveBlogArticleDrafts,
  upsertBlogArticle,
} from './blogArticleStore.js';

// 文章类型会带中文说明，保存到文章草稿前只保留类型名称。
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

// 从 AI 任务合成文章上下文，供策划、大纲、正文和编辑器共用。
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

// 保存 AI 任务为正式文章，同时回写任务的正文完成状态。
export function saveAiTaskAsBlogArticle(project, task, options = {}) {
  const demoData = createContentDemoData(task, project);
  const finalArticle = options.content?.finalArticle ?? demoData.latestFinalArticle;
  const tdk = options.content?.tdk ?? demoData.latestTdk;
  const finalEvaluationReport = options.content?.finalEvaluationReport ?? demoData.latestEvaluationReport;
  const existingArticle =
    options.article ?? getBlogArticleDrafts(project).find((article) => article.id === task.articleId);
  const nextArticle = {
    ...createArticleContextFromAiTask(task, existingArticle),
    aiTaskId: task.id,
    articleType: getTaskArticleType(task) || existingArticle?.articleType || 'Comparison',
    content: finalArticle.content,
    embeddedMediaAssets: finalArticle.images ?? [],
    evaluationReport: finalEvaluationReport,
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

  const previousArticles = getBlogArticleDrafts(project);
  let nextTask;

  try {
    upsertBlogArticle(project, nextArticle);
    nextTask = updateAiCreationTask(project.id, task.id, {
      errorMessage: '',
      stage: 'content-completed',
      content: {
        ...(task.content ?? {}),
        ...(options.content ?? {}),
        finalArticle,
        finalEvaluationReport,
        latestEvaluationReportId: options.content?.latestEvaluationReportId ?? demoData.latestEvaluationReportId,
        latestFinalArticleId: options.content?.latestFinalArticleId ?? demoData.latestFinalArticleId,
        latestTdkId: options.content?.latestTdkId ?? demoData.latestTdkId,
        savedArticleId: nextArticle.id,
        tdk,
        updatedAt: getTodayString(),
      },
    });
  } catch (error) {
    // 任务回写失败时恢复文章表，避免出现任务未成文但文章已创建的半完成状态。
    saveBlogArticleDrafts(project.id, previousArticles);
    throw error;
  }

  return {
    article: nextArticle,
    demoData,
    task: nextTask ?? task,
  };
}
