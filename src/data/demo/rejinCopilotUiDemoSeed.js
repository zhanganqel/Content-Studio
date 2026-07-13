const ids = {
  form: 'rejin-cnc-demo-ui-form',
  titles: 'rejin-cnc-demo-ui-titles',
  workflow: 'rejin-cnc-demo-ui-workflow',
  states: 'rejin-cnc-demo-ui-states',
  research: 'rejin-cnc-demo-ui-research',
  artifacts: 'rejin-cnc-demo-ui-artifacts',
};

const artifactIds = {
  outline: 'rejin-cnc-demo-ui-artifact-outline',
  strategy: 'rejin-cnc-demo-ui-artifact-strategy',
  draft: 'rejin-cnc-demo-ui-artifact-draft',
  evaluation: 'rejin-cnc-demo-ui-artifact-evaluation',
  search: 'rejin-cnc-demo-ui-artifact-search',
  keyword: 'rejin-cnc-demo-ui-artifact-keyword',
  revision: 'rejin-cnc-demo-ui-artifact-revision',
  tdk: 'rejin-cnc-demo-ui-artifact-tdk',
};

function conversation(id, title, messageIds, artifacts, updatedAt) {
  return {
    artifactIds: artifacts,
    createdAt: updatedAt,
    id,
    messageIds,
    pinned: false,
    projectId: 'rejin-cnc',
    threadId: '',
    title,
    updatedAt,
  };
}

function message(id, conversationId, createdAt, input) {
  return { id, conversationId, createdAt, status: 'done', ...input };
}

function artifact(id, conversationId, type, title, summary, content, previewData = {}) {
  return {
    content,
    contentFormat: type === 'outline' ? 'json' : 'markdown',
    conversationId,
    createdAt: '2026-07-12T08:00:00.000Z',
    id,
    metadata: { demo: true, language: 'zh-CN' },
    previewData,
    sourceIds: [],
    sourceMessageId: '',
    status: 'ready',
    summary,
    taskType: type,
    title,
    type,
    updatedAt: '2026-07-12T08:00:00.000Z',
  };
}

const formMessages = [
  message('rejin-cnc-demo-ui-form-user', ids.form, '2026-07-12T08:00:00.000Z', {
    content: '帮我创建一篇面向海外采购经理的 CNC Turning vs. Milling SEO 文章。',
    role: 'user',
    userName: 'Angel',
  }),
  message('rejin-cnc-demo-ui-form-assistant', ids.form, '2026-07-12T08:01:00.000Z', {
    agentId: 'copilot',
    content: '',
    role: 'assistant',
    uiBlocks: [
      {
        agentId: 'copilot',
        id: 'rejin-cnc-demo-ui-form-block',
        knowledgeFileIds: ['service-cnc-turning', 'service-cnc-milling'],
        knowledgeItemIds: ['services-row-001', 'services-row-002'],
        type: 'article_task_form',
        values: {
          articleLength: '1200-1400',
          articleType: '比较指南',
          language: 'EN',
          person: '第三人称',
          primaryKeywords: ['CNC machining supplier'],
          requirements: '重点说明工艺选择、质量控制和 RFQ 准备，避免无法验证的性能数据。',
          secondaryKeywords: ['custom metal parts', 'DFM support', 'CNC turning vs milling'],
          targetRegion: 'Global',
          tone: '专业',
          topic: 'CNC Turning vs. Milling: How to Choose for Your Next Project',
        },
      },
    ],
  }),
];

const titleMessages = [
  message('rejin-cnc-demo-ui-title-user', ids.titles, '2026-07-12T07:40:00.000Z', {
    content: '请给这篇 CNC Turning vs. Milling 文章提供标题，并整理文章大纲。',
    role: 'user',
    userName: 'Angel',
  }),
  message('rejin-cnc-demo-ui-title-tasks', ids.titles, '2026-07-12T07:42:00.000Z', {
    agentId: 'content_operator',
    artifactIds: [artifactIds.outline],
    content: '',
    role: 'assistant',
    uiBlocks: [
      {
        agentId: 'content_operator',
        id: 'rejin-cnc-demo-ui-title-task-group',
        tasks: [
          { id: 'title-task-1', taskKey: 'review_article_strategy', status: 'done', processItems: [{ id: 'title-process-1', text: '已确认文章面向海外工程师与采购经理，内容目标是帮助用户选择合适的加工工艺。' }] },
          { id: 'title-task-2', taskKey: 'write_article_titles', status: 'done', processItems: [{ id: 'title-process-2', text: '标题候选同时覆盖主要关键词、决策意图和采购场景。' }] },
          { id: 'title-task-3', taskKey: 'write_article_outline', status: 'done', artifactIds: [artifactIds.outline], processItems: [{ id: 'title-process-3', text: '大纲采用工艺差异、适用场景、选择框架和 RFQ 准备四层结构。' }] },
        ],
        type: 'task_group',
      },
    ],
  }),
  message('rejin-cnc-demo-ui-title-selector', ids.titles, '2026-07-12T07:43:00.000Z', {
    agentId: 'content_operator',
    content: '',
    role: 'assistant',
    uiBlocks: [
      {
        agentId: 'content_operator',
        id: 'rejin-cnc-demo-ui-title-selector-block',
        options: [
          { id: 'title-1', title: 'CNC Turning vs. Milling: How to Choose for Your Next Project' },
          { id: 'title-2', title: 'CNC Turning vs. Milling: Which Process Fits Your Custom Metal Parts?' },
          { id: 'title-3', title: 'How to Choose Between CNC Turning and Milling Before Requesting a Quote' },
          { id: 'title-4', title: 'CNC Turning or Milling? A Procurement Guide for Custom Metal Components' },
          { id: 'title-5', title: 'CNC Turning vs. Milling: Reduce Supplier Risk with the Right Process Choice' },
        ],
        selectedTitleId: 'title-1',
        type: 'title_selector',
      },
    ],
  }),
];

const workflowMessages = [
  message('rejin-cnc-demo-ui-workflow-user', ids.workflow, '2026-07-12T07:00:00.000Z', {
    attachments: [
      { id: 'cnc-turning', kind: 'knowledge_item', title: 'CNC Turning' },
      { id: 'service-cnc-turning', kind: 'knowledge_file', title: 'Service-CNC Turning.docx' },
    ],
    content: '使用这些资料完成文章策略、草稿和内容评估。',
    role: 'user',
    userName: 'Angel',
  }),
  message('rejin-cnc-demo-ui-workflow-assistant', ids.workflow, '2026-07-12T07:08:00.000Z', {
    agentId: 'copilot',
    artifactIds: [artifactIds.strategy, artifactIds.draft, artifactIds.evaluation],
    content: '',
    role: 'assistant',
    uiBlocks: [
      {
        agentId: 'researcher', id: 'workflow-researcher', type: 'task_group', tasks: [
          { id: 'workflow-r1', taskKey: 'load_knowledge_items', status: 'done', processItems: [{ id: 'workflow-r1-p1', text: '已加载 CNC Turning、CNC Milling 与 DFM Support 三项知识。' }] },
          { id: 'workflow-r2', taskKey: 'parse_knowledge_files', status: 'done', processItems: [{ id: 'workflow-r2-p1', text: '已整理 8 个来源文本块，提取工艺边界、质量控制和 RFQ 准备信息。' }] },
          { id: 'workflow-r3', taskKey: 'extract_relevant_information', status: 'done', processItems: [{ id: 'workflow-r3-p1', text: '核心依据已准备，可供策略和文章创作使用。', emphasis: true }] },
        ],
      },
      {
        agentId: 'seo_strategist', id: 'workflow-strategist', type: 'task_group', tasks: [
          { id: 'workflow-s1', taskKey: 'analyze_market_audience', status: 'done', processItems: [{ id: 'workflow-s1-p1', text: '目标受众需要快速判断工艺适配性、供应商能力和询价资料完整度。' }] },
          { id: 'workflow-s2', taskKey: 'create_article_strategy', status: 'done', artifactIds: [artifactIds.strategy], processItems: [{ id: 'workflow-s2-p1', text: '文章采用比较型搜索意图，并将工艺选择转化为采购决策框架。' }] },
        ],
      },
      {
        agentId: 'content_operator', id: 'workflow-writer', type: 'task_group', tasks: [
          { id: 'workflow-w1', taskKey: 'review_title_outline', status: 'done', processItems: [{ id: 'workflow-w1-p1', text: '标题、大纲和关键词位置已确认。' }] },
          { id: 'workflow-w2', taskKey: 'write_article_draft', status: 'done', artifactIds: [artifactIds.draft], processItems: [{ id: 'workflow-w2-p1', text: '初稿已整合工艺差异、适用场景、选择清单和 RFQ 建议。' }] },
        ],
      },
      {
        agentId: 'content_evaluator', id: 'workflow-evaluator', type: 'task_group', tasks: [
          { id: 'workflow-o1', taskKey: 'evaluate_draft', status: 'done', artifactIds: [artifactIds.evaluation], processItems: [{ id: 'workflow-o1-p1', text: '文章结构、关键词覆盖、证据边界和可读性已完成检查。' }] },
        ],
      },
    ],
  }),
];

const stateMessages = [
  message('rejin-cnc-demo-ui-state-user', ids.states, '2026-07-12T06:20:00.000Z', { content: '展示任务进行中、等待、失败、中断和停止状态。', role: 'user', userName: 'Angel' }),
  message('rejin-cnc-demo-ui-state-assistant', ids.states, '2026-07-12T06:21:00.000Z', {
    agentId: 'copilot', content: '', role: 'assistant', uiBlocks: [
      { agentId: 'researcher', id: 'state-running', type: 'task_group', tasks: [{ id: 'state-r1', taskKey: 'parse_knowledge_files', status: 'running', processItems: [{ id: 'state-r1-p1', text: '正在读取已选择知识文件中的可用文本块。' }] }] },
      { agentId: 'seo_strategist', id: 'state-waiting', type: 'task_group', tasks: [{ id: 'state-s1', taskKey: 'analyze_market_audience', status: 'waiting_input', clarification: '请选择目标地区和目标受众。' }] },
      { agentId: 'content_operator', id: 'state-cancelled', type: 'task_group', tasks: [{ id: 'state-w1', taskKey: 'write_article_draft', status: 'cancelled', processItems: [{ id: 'state-w1-p1', text: '用户主动停止，已保留当前收到的内容。' }] }] },
      { agentId: 'content_evaluator', id: 'state-error', type: 'task_group', tasks: [{ id: 'state-o1', taskKey: 'evaluate_final_draft', status: 'error', processItems: [{ id: 'state-o1-p1', text: '缺少可评估的文章终稿。' }] }, { id: 'state-o2', taskKey: 'plan_optimization', status: 'interrupted', processItems: [{ id: 'state-o2-p1', text: '页面刷新导致本次任务没有正常结束。' }] }] },
    ],
  }),
];

const researchMessages = [
  message('rejin-cnc-demo-ui-research-user', ids.research, '2026-07-12T05:50:00.000Z', { content: '搜索与 CNC 工艺选择、供应商评估相关的参考内容。', role: 'user', userName: 'Angel' }),
  message('rejin-cnc-demo-ui-research-assistant', ids.research, '2026-07-12T05:54:00.000Z', {
    agentId: 'researcher', artifactIds: [artifactIds.search], content: '', role: 'assistant', uiBlocks: [
      { agentId: 'researcher', id: 'research-task-group', type: 'task_group', tasks: [{ id: 'research-task-1', taskKey: 'analyze_reference_articles', status: 'done', artifactIds: [artifactIds.search], processItems: [{ id: 'research-process-1', text: '已按工艺选择、DFM 与供应商可信度筛选参考页面。' }] }] },
    ],
  }),
];

const artifactMessages = [
  message('rejin-cnc-demo-ui-artifacts-user', ids.artifacts, '2026-07-12T05:00:00.000Z', { content: '展示关键词策略、文章修订、TDK 和评估产物。', role: 'user', userName: 'Angel' }),
  message('rejin-cnc-demo-ui-artifacts-assistant', ids.artifacts, '2026-07-12T05:08:00.000Z', {
    agentId: 'copilot', artifactIds: [artifactIds.keyword, artifactIds.revision, artifactIds.tdk], content: '', role: 'assistant', uiBlocks: [
      { agentId: 'seo_strategist', id: 'artifact-strategy-group', type: 'task_group', tasks: [{ id: 'artifact-s1', taskKey: 'create_article_strategy', status: 'done', artifactIds: [artifactIds.keyword], processItems: [{ id: 'artifact-s1-p1', text: '关键词已按商业意图、信息意图和长尾场景分组。' }] }] },
      { agentId: 'content_operator', id: 'artifact-writer-group', type: 'task_group', tasks: [{ id: 'artifact-w1', taskKey: 'revise_article', status: 'done', artifactIds: [artifactIds.revision], processItems: [{ id: 'artifact-w1-p1', text: '已缩短开头，并将工艺选择章节改为五项决策清单。' }] }, { id: 'artifact-w2', taskKey: 'finalize_content_tdk', status: 'done', artifactIds: [artifactIds.tdk], processItems: [{ id: 'artifact-w2-p1', text: 'TDK 已与文章主题、主要关键词和询价 CTA 对齐。' }] }] },
    ],
  }),
];

export const rejinCopilotUiDemoSeed = {
  artifacts: [
    artifact(artifactIds.outline, ids.titles, 'outline', 'CNC Turning vs. Milling 文章大纲', '六部分工艺比较与采购决策结构。', JSON.stringify({ summary: '帮助海外工程师和采购团队从几何、精度、材料、数量与成本维度选择加工工艺。', sections: [{ heading: '1. Turning vs. Milling: The Core Difference', estimatedWords: 220, keyPoints: ['工件与刀具运动方式', '两种工艺的典型几何特征'] }, { heading: '2. When CNC Turning Is the Better Choice', estimatedWords: 300, keyPoints: ['回转类零件', '同轴度和循环时间'] }, { heading: '3. When CNC Milling Is the Better Choice', estimatedWords: 300, keyPoints: ['平面、型腔和多面特征', '多轴加工场景'] }, { heading: '4. A Practical Selection Framework', estimatedWords: 380, keyPoints: ['几何、精度、材料、数量和成本', '复合工艺判断'] }, { heading: '5. RFQ Preparation Checklist', estimatedWords: 240, keyPoints: ['图纸、材料、公差和检验要求'] }, { heading: 'Conclusion', estimatedWords: 160, keyPoints: ['总结决策逻辑与 CTA'] }] })),
    artifact(artifactIds.strategy, ids.workflow, 'strategy', 'CNC 工艺对比文章策略', '以采购决策框架承接比较型搜索意图。', '## 搜索意图\n帮助用户在 CNC Turning 和 CNC Milling 之间做出选择。\n\n## 内容角度\n- 使用几何、精度、材料、数量和成本作为决策维度\n- 强调 DFM 评审和完整 RFQ 的价值\n- 避免未经验证的公差、交期和成本数字'),
    artifact(artifactIds.draft, ids.workflow, 'draft', 'CNC Turning vs. Milling: How to Choose', '面向工程师与采购经理的英文文章初稿。', '# CNC Turning vs. Milling: How to Choose\n\nChoosing the right process starts with part geometry, tolerance relationships, material, production quantity, and the operations required after machining.\n\n## When Turning Fits\nTurning is usually the first process to evaluate for cylindrical components and concentric features.\n\n## When Milling Fits\nMilling is suited to flat faces, pockets, slots, irregular contours, and multi-face geometries.\n\n## Prepare a Complete RFQ\nProvide drawings, models, materials, tolerances, quantities, finishes, and inspection requirements.'),
    artifact(artifactIds.evaluation, ids.workflow, 'evaluation', '文章初稿评估', '整体通过，仍需补充企业级案例证据。', '', { groups: [{ name: 'SEO 基础', items: [{ name: '关键词覆盖', pass: true, suggestion: '主要关键词已进入标题和开头。' }, { name: '搜索意图', pass: true, suggestion: '文章完整回答工艺选择问题。' }] }, { name: '证据与可信度', items: [{ name: '可验证主张', pass: false, suggestion: '发布前补充经过验证的案例或检测能力来源。' }] }] }),
    artifact(artifactIds.search, ids.research, 'search_results', 'CNC 工艺选择参考页面', '4 条可用于文章结构和证据补充的搜索结果。', '', { items: [{ id: 'result-1', title: 'How to Choose a Reliable CNC Machining Supplier', url: 'https://www.rejincnc.com/service/', summary: '从能力覆盖、质量体系、交期沟通和询价准备角度说明供应商选择。', tags: ['供应商评估', '商业意图'] }, { id: 'result-2', title: 'CNC Turning vs. Milling: Process Selection Guide', url: 'https://www.rejincnc.com/service/cnc-turning/', summary: '比较几何、材料、公差和成本维度，可用于构建决策框架。', tags: ['比较指南', '工艺选择'] }, { id: 'result-3', title: 'How DFM Support Reduces Machining Risk', url: 'https://www.rejincnc.com/service/support-dfm-service/', summary: '说明可制造性评审、图纸检查与原型验证的业务价值。', tags: ['DFM', '风险控制'] }, { id: 'result-4', title: '5-Axis CNC Machining for Complex Components', url: 'https://www.rejincnc.com/service/5-axis-cnc-machining/', summary: '补充复杂几何、多面加工和减少装夹次数的场景。', tags: ['5-Axis', '复杂零件'] }] }),
    artifact(artifactIds.keyword, ids.artifacts, 'keyword_strategy', 'CNC Turning vs. Milling 关键词策略', '商业、信息和长尾关键词分组。', '## 主要关键词\n- CNC turning vs milling\n- CNC machining process selection\n\n## 次要关键词\n- custom metal parts\n- CNC machining supplier\n- DFM support\n\n## 长尾关键词\n- when to choose CNC turning over milling\n- CNC turning vs milling cost factors'),
    { ...artifact(artifactIds.revision, ids.artifacts, 'revision', '文章精简修订记录', '缩短引言并增加五项工艺选择清单。', ''), changeSummary: '引言由三段压缩为一段；工艺选择章节改为可扫描清单。', previewData: { changes: [{ before: 'Choosing the correct process requires reviewing a wide range of manufacturing considerations before production begins.', after: 'Choose the process by reviewing geometry, tolerance, material, quantity, and secondary operations.' }, { before: 'The selection section used three long explanatory paragraphs.', after: 'The selection section now uses a five-factor decision checklist.' }] } },
    artifact(artifactIds.tdk, ids.artifacts, 'tdk', '文章元信息', 'Title、Description 与关键词已整理。', '', { tdk: { title: 'CNC Turning vs. Milling: How to Choose the Right Process', keywords: ['CNC turning vs milling', 'CNC machining supplier', 'custom metal parts'], description: 'Compare CNC turning and milling by geometry, tolerance, material, quantity, and cost to choose the right process for your custom part project.' } }),
  ],
  conversations: [
    conversation(ids.form, 'UI演示｜文章任务表单', formMessages.map((item) => item.id), [], '2026-07-12T08:01:00.000Z'),
    conversation(ids.titles, 'UI演示｜标题选择与大纲', titleMessages.map((item) => item.id), [artifactIds.outline], '2026-07-12T07:43:00.000Z'),
    conversation(ids.workflow, 'UI演示｜多智能体创作流程', workflowMessages.map((item) => item.id), [artifactIds.strategy, artifactIds.draft, artifactIds.evaluation], '2026-07-12T07:08:00.000Z'),
    conversation(ids.states, 'UI演示｜任务状态', stateMessages.map((item) => item.id), [], '2026-07-12T06:21:00.000Z'),
    conversation(ids.research, 'UI演示｜检索与引用', researchMessages.map((item) => item.id), [artifactIds.search], '2026-07-12T05:54:00.000Z'),
    conversation(ids.artifacts, 'UI演示｜产物与版本', artifactMessages.map((item) => item.id), [artifactIds.keyword, artifactIds.revision, artifactIds.tdk], '2026-07-12T05:08:00.000Z'),
  ],
  messages: [...formMessages, ...titleMessages, ...workflowMessages, ...stateMessages, ...researchMessages, ...artifactMessages],
  runs: [
    { acknowledgedAt: '2026-07-12T08:02:00.000Z', conversationId: ids.form, endedAt: '2026-07-12T08:01:00.000Z', id: 'rejin-cnc-demo-ui-run-form', startedAt: '2026-07-12T08:00:00.000Z', status: 'done' },
    { conversationId: ids.titles, endedAt: '2026-07-12T07:43:00.000Z', id: 'rejin-cnc-demo-ui-run-title', startedAt: '2026-07-12T07:40:00.000Z', status: 'done' },
    { conversationId: ids.workflow, endedAt: '2026-07-12T07:08:00.000Z', id: 'rejin-cnc-demo-ui-run-workflow', startedAt: '2026-07-12T07:00:00.000Z', status: 'done' },
    { conversationId: ids.states, endedAt: '2026-07-12T06:21:00.000Z', id: 'rejin-cnc-demo-ui-run-states', startedAt: '2026-07-12T06:20:00.000Z', status: 'cancelled' },
    { conversationId: ids.research, endedAt: '2026-07-12T05:54:00.000Z', id: 'rejin-cnc-demo-ui-run-research', originalMessage: '搜索参考内容', requiredField: 'targetRegion', startedAt: '2026-07-12T05:50:00.000Z', status: 'waiting_input' },
    { conversationId: ids.artifacts, endedAt: '2026-07-12T05:08:00.000Z', error: 'UI demo error state', errorCode: 'demo_error', id: 'rejin-cnc-demo-ui-run-artifacts', startedAt: '2026-07-12T05:00:00.000Z', status: 'error' },
  ],
  sources: [
    { conversationId: ids.workflow, id: 'rejin-cnc-demo-ui-source-turning', originId: 'cnc-turning', snippet: 'CNC Turning service knowledge.', title: 'CNC Turning', type: 'knowledge_item', url: 'https://www.rejincnc.com/service/cnc-turning/' },
    { conversationId: ids.workflow, id: 'rejin-cnc-demo-ui-source-milling', originId: 'cnc-milling', snippet: 'CNC Milling service knowledge.', title: 'CNC Milling', type: 'knowledge_item', url: 'https://www.rejincnc.com/service/cnc-milling/' },
  ],
};
