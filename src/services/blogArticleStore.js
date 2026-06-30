const storageKeyPrefix = 'content-studio-blog-articles:';
const storageSchemaVersion = 1;

export const articleStatusOptions = ['draft', 'review', 'pending', 'published'];

export const articleTypeOptions = [
  'How-to Guide',
  'Comparison',
  'Ultimate Guide',
  'Product Review',
  'Industry Insight',
  'News',
  'FAQ',
];

function getStorageKey(projectId) {
  return `${storageKeyPrefix}${projectId}`;
}

function serializeArticles(articles) {
  return JSON.stringify({
    schemaVersion: storageSchemaVersion,
    articles,
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getPersonaName(project, personaId) {
  const persona = project?.demoProject?.audiencePersonas?.find((item) => item.id === personaId);
  return persona?.title ?? '';
}

function guessArticleType(seed) {
  const title = seed.title?.toLowerCase() ?? '';

  if (title.includes(' vs ') || title.includes('compare') || title.includes('choose')) {
    return 'Comparison';
  }

  if (title.includes('how to')) {
    return 'How-to Guide';
  }

  return 'How-to Guide';
}

function getKeywordsFromTitle(title) {
  return title
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 6);
}

function getDefaultContent(seed, project) {
  const personaName = getPersonaName(project, seed.audiencePersonaId) || 'Target audience';
  return [
    seed.title,
    '',
    `Target audience: ${personaName}`,
    '',
    'Draft outline:',
    '1. Introduce the search scenario and decision context.',
    '2. Explain the key comparison points with practical manufacturing details.',
    '3. Summarize next steps for requesting a quote or validating requirements.',
  ].join('\n');
}

function articleFromSeed(seed, index, project) {
  const title = seed.title ?? `Blog Article ${index + 1}`;

  return {
    id: seed.id ?? `blog-article-${index + 1}`,
    title,
    status: index === 0 ? 'pending' : 'draft',
    articleType: guessArticleType(seed),
    targetAudiencePersonaId: seed.audiencePersonaId ?? '',
    targetAudienceName: getPersonaName(project, seed.audiencePersonaId),
    keywords: getKeywordsFromTitle(title),
    content: getDefaultContent(seed, project),
    updatedAt: index === 0 ? '2026-06-29' : today(),
    updatedBy: 'Angel',
  };
}

export function createDefaultBlogArticles(project) {
  const seeds = project?.demoProject?.contentSeeds?.filter((seed) => seed.type === 'blog') ?? [];
  return seeds.map((seed, index) => articleFromSeed(seed, index, project));
}

export function createBlankBlogArticle(title) {
  return {
    id: createBlogArticleId(),
    title,
    status: 'draft',
    articleType: '',
    targetAudiencePersonaId: '',
    targetAudienceName: '',
    keywords: [],
    content: '',
    updatedAt: today(),
    updatedBy: 'Angel',
  };
}

export function getBlogArticleDrafts(project) {
  if (typeof window === 'undefined') {
    return createDefaultBlogArticles(project);
  }

  const stored = window.localStorage.getItem(getStorageKey(project.id));

  if (!stored) {
    return createDefaultBlogArticles(project);
  }

  try {
    const parsed = JSON.parse(stored);

    if (parsed?.schemaVersion === storageSchemaVersion && Array.isArray(parsed.articles)) {
      return parsed.articles;
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return createDefaultBlogArticles(project);
  } catch {
    return createDefaultBlogArticles(project);
  }
}

export function saveBlogArticleDrafts(projectId, articles) {
  if (typeof window === 'undefined') {
    return articles;
  }

  window.localStorage.setItem(getStorageKey(projectId), serializeArticles(articles));
  return articles;
}

export function upsertBlogArticle(project, article) {
  const currentArticles = getBlogArticleDrafts(project);
  const exists = currentArticles.some((item) => item.id === article.id);
  const nextArticles = exists
    ? currentArticles.map((item) => (item.id === article.id ? article : item))
    : [article, ...currentArticles];

  return saveBlogArticleDrafts(project.id, nextArticles);
}

export function createBlogArticleId(prefix = 'blog-article') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTodayString() {
  return today();
}
