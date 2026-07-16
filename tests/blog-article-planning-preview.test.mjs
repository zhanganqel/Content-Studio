import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createServer } from 'vite';

let createPlanningDemoData;
let rejinCncProject;
let viteServer;

before(async () => {
  viteServer = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });

  ({ createPlanningDemoData } = await viteServer.ssrLoadModule('/src/services/blogArticleAiStore.js'));
  ({ rejinCncProject } = await viteServer.ssrLoadModule('/src/data/demo/rejinCncProject.js'));
});

after(async () => {
  await viteServer?.close();
});

function createCompletePlanningTask() {
  return {
    taskInput: {
      additionalRequirements: '',
      articleLanguage: 'EN',
      articleLength: '1200 -1400（5-6个H2）',
      articleTopic: 'CNC Turning vs. Milling: How to Choose for Your Next Project',
      articleType: 'Product Reviews（产品介绍）',
      brandRequirements: rejinCncProject.brandProfile.brandStyle.messagingPrinciples.join('\n'),
      businessGoal:
        'Help overseas procurement teams evaluate Rejin CNC as a reliable custom metal parts supplier and submit a qualified RFQ.',
      knowledgeItems: rejinCncProject.knowledgeItems.filter((item) =>
        ['cnc-turning', 'cnc-milling', 'dfm-support'].includes(item.id),
      ),
      person: '第三人称',
      primaryKeyword: 'CNC machining supplier',
      secondaryKeywords: ['custom metal parts', 'DFM support', 'CNC turning vs milling'],
      targetAudience: {
        name: 'Overseas Procurement Manager',
        summary:
          'Needs reliable supplier evaluation, stable quality, clear RFQ communication, and practical process-selection guidance.',
      },
      targetAudienceName: 'Overseas Procurement Manager',
      targetRegion: 'Global',
      tone: 'professional（专业）',
    },
  };
}

function createProject() {
  return {
    demoProject: rejinCncProject,
    id: 'rejin-cnc',
    name: rejinCncProject.name,
  };
}

test('planning demo uses three completed competitor analyses', () => {
  const data = createPlanningDemoData(createCompletePlanningTask(), createProject());
  const references = data.artifacts.references.references;
  const content = data.artifacts.strategy.content;

  assert.equal(references.length, 3);
  assert.deepEqual(
    references.map((item) => item.url),
    [
      'https://www.rapiddirect.com/blog/cnc-turning-vs-milling-differences/',
      'https://www.hubs.com/knowledge-base/what-is-cnc-turning/',
      'https://www.fictiv.com/articles/cnc-milling-explained',
    ],
  );
  assert.match(content, /RapidDirect/);
  assert.match(content, /Protolabs Network/);
  assert.match(content, /Fictiv/);
  assert.match(content, /### 2\.3 差异化写作要点/);
  assert.doesNotMatch(content, /竞对案例总结/);
});

test('planning basic information keeps the required twelve rows and actual requirements', () => {
  const content = createPlanningDemoData(createCompletePlanningTask(), createProject()).artifacts.strategy.content;
  const section = content
    .split('### 3.1 文章基础信息')[1]
    .split('### 3.2 营销文案模型与写作思路')[0];
  const rows = section
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.startsWith('| ---') && line !== '| 字段 | 值 |');
  const fields = rows.map((line) => line.split('|')[1].trim().replaceAll('**', ''));

  assert.deepEqual(fields, [
    '目标市场',
    '目标语言',
    '目标受众',
    '业务目标',
    '文章主题',
    '主要关键词',
    '次要关键词',
    '文章类型',
    '文章长度',
    '语气',
    '人称',
    '生成要求',
  ]);
  assert.match(section, /custom metal parts<br>DFM support<br>CNC turning vs milling/);
  assert.match(section, /品牌要求：Lead with manufacturing capability and quality control\.<br>/);
  assert.doesNotMatch(section, /补充生成要求：/);
});

test('planning FAQ and generation rules are complete and contain no process placeholders', () => {
  const content = createPlanningDemoData(createCompletePlanningTask(), createProject()).artifacts.strategy.content;

  assert.match(content, /Q1（比较任务界定）/);
  assert.match(content, /Q2（统一评估标准）/);
  assert.match(content, /Q3（方案适配比较）/);
  assert.match(content, /Q4（证据与限制）/);
  assert.match(content, /Q7（信任建立与 CTA）/);
  assert.match(content, /> \*\*生成规范\*\*/);
  assert.doesNotMatch(content, /未调用|未爬取|未获取正文|仅提供链接|待验证|待补充/);
});
