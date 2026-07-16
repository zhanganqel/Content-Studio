import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { createServer } from 'vite';

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

let articleStore;
let aiArticleStore;
let aiStore;
let copilotStorage;
let demoRegistry;
let demoSessionStore;
let projects;
let viteServer;

before(async () => {
  viteServer = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });

  demoRegistry = await viteServer.ssrLoadModule('/src/data/demo/database/registry.js');
  demoSessionStore = await viteServer.ssrLoadModule('/src/services/demoSessionStore.js');
  articleStore = await viteServer.ssrLoadModule('/src/services/blogArticleStore.js');
  aiStore = await viteServer.ssrLoadModule('/src/services/blogArticleAiStore.js');
  aiArticleStore = await viteServer.ssrLoadModule('/src/services/blogArticleAiArticleStore.js');
  copilotStorage = await viteServer.ssrLoadModule('/src/features/copilot/storage.js');
  ({ projectRegistryProjects: projects } = await viteServer.ssrLoadModule('/src/data/demo/projectRegistry.js'));
});
after(async () => {
  await viteServer?.close();
  delete globalThis.window;
});

beforeEach(() => {
  globalThis.window = {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
  };
});

function getProject(projectId) {
  return projects.find((project) => project.id === projectId);
}

test('both complete projects expose four article statuses and four task states', () => {
  for (const projectId of ['rejin-cnc', 'gowe-group']) {
    const database = demoRegistry.getDemoDatabase(projectId);
    const articleStatuses = new Set(database.tables.blogArticles.map((article) => article.status));
    const taskStages = database.tables.articleCreationTasks.map((task) => task.stage);

    assert.deepEqual(articleStatuses, new Set(['draft', 'pending', 'published', 'review']));
    assert.deepEqual(taskStages, ['auto-generating', 'content-completed', 'auto-stopped', 'auto-failed']);
    assert.equal(database.tables.articleCreationTasks[1].content.savedArticleId, '');
  }
});

test('session snapshots survive reload reads and do not leak into a new tab session', () => {
  const projectId = 'rejin-cnc';
  const originalTasks = aiStore.getAiCreationTasks(projectId);
  aiStore.saveAiCreationTask(projectId, {
    mode: 'auto',
    stage: 'auto-generating',
    taskInput: { articleTopic: 'Session-only article task' },
  });

  assert.equal(aiStore.getAiCreationTasks(projectId).length, originalTasks.length + 1);
  assert.equal(aiStore.getAiCreationTasks(projectId)[0].taskInput.articleTopic, 'Session-only article task');

  globalThis.window.sessionStorage = new MemoryStorage();
  assert.equal(aiStore.getAiCreationTasks(projectId).length, originalTasks.length);
});

test('successful task becomes an article only after save and writes the task relation', () => {
  const project = getProject('rejin-cnc');
  const task = aiStore.getAiCreationTasks(project.id).find((item) => item.stage === 'content-completed');
  const initialArticles = articleStore.getBlogArticleDrafts(project);

  assert.ok(task);
  assert.equal(task.content.savedArticleId, '');
  assert.equal(initialArticles.some((article) => article.id === task.articleId), false);

  const saved = aiArticleStore.saveAiTaskAsBlogArticle(project, task);
  const nextArticles = articleStore.getBlogArticleDrafts(project);
  const nextTask = aiStore.getAiCreationTasks(project.id).find((item) => item.id === task.id);

  assert.equal(saved.article.id, task.articleId);
  assert.equal(nextArticles.some((article) => article.id === saved.article.id), true);
  assert.equal(nextTask.content.savedArticleId, saved.article.id);
});

test('legacy cleanup removes business data but preserves locale and sidebar preferences', () => {
  globalThis.window.localStorage = new MemoryStorage({
    'content-studio-audience-personas:rejin-cnc': 'legacy',
    'content-studio-blog-articles:rejin-cnc': 'legacy',
    'content-studio-edgeone-copilot:v2:user-id': 'legacy-user',
    'content-studio-locale': 'zh-CN',
    'content-studio-sidebar-collapsed': 'true',
  });

  demoSessionStore.cleanupLegacyDemoLocalStorage();

  assert.equal(globalThis.window.localStorage.getItem('content-studio-audience-personas:rejin-cnc'), null);
  assert.equal(globalThis.window.localStorage.getItem('content-studio-blog-articles:rejin-cnc'), null);
  assert.equal(globalThis.window.localStorage.getItem('content-studio-edgeone-copilot:v2:user-id'), null);
  assert.equal(globalThis.window.localStorage.getItem('content-studio-locale'), 'zh-CN');
  assert.equal(globalThis.window.localStorage.getItem('content-studio-sidebar-collapsed'), 'true');
});

test('Copilot identity is stable in one tab and changes with a new sessionStorage', () => {
  const firstUserId = copilotStorage.getProjectUserId('rejin-cnc');
  assert.equal(copilotStorage.getProjectUserId('rejin-cnc'), firstUserId);

  globalThis.window.sessionStorage = new MemoryStorage();
  const nextUserId = copilotStorage.getProjectUserId('rejin-cnc');

  assert.notEqual(nextUserId, firstUserId);
  assert.match(nextUserId, /^content-studio\.rejin-cnc\./);
});
