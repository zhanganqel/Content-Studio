export const taskCatalog = {
  copilot_reply: { agentId: 'copilot', name: '处理当前请求', nameEn: 'Process current request' },
  keyword_strategy: { agentId: 'seo_strategist', name: '生成关键词策略', nameEn: 'Generate keyword strategy' },
  article_strategy: { agentId: 'seo_strategist', name: '制定内容策划', nameEn: 'Create content plan' },
  article_goal_analysis: { agentId: 'seo_strategist', name: '分析文章目标', nameEn: 'Analyze article goals' },
  reference_article_analysis: { agentId: 'seo_strategist', name: '分析参考文章', nameEn: 'Analyze reference articles' },
  copy_model_strategy: { agentId: 'seo_strategist', name: '选择营销文案模型与写作思路', nameEn: 'Select copy model and writing approach' },
  keyword_layout: { agentId: 'seo_strategist', name: '制定关键词布局', nameEn: 'Plan keyword placement' },
  internal_link_plan: { agentId: 'seo_strategist', name: '制定内链插入建议', nameEn: 'Plan internal links' },
  faq_plan: { agentId: 'seo_strategist', name: '制定 FAQ 建议', nameEn: 'Plan FAQ topics' },
  title_generation: { agentId: 'content_operator', name: '撰写文章标题', nameEn: 'Write article titles' },
  article_outline: { agentId: 'content_operator', name: '撰写文章大纲', nameEn: 'Write article outline' },
  article_content: { agentId: 'content_operator', name: '撰写文章内容', nameEn: 'Write article content' },
  content_evaluation: { agentId: 'content_evaluator', name: '文章质量评估', nameEn: 'Evaluate article quality' },
  content_enrichment: { agentId: 'content_operator', name: '补充文章素材与链接', nameEn: 'Enrich article content' },
  tdk_generation: { agentId: 'content_operator', name: '撰写 TDK', nameEn: 'Write TDK' },
  load_brand_information: { agentId: 'researcher', name: '加载品牌信息', nameEn: 'Load brand information' },
  load_knowledge_items: { agentId: 'researcher', name: '加载知识条目', nameEn: 'Load knowledge items' },
  parse_knowledge_files: { agentId: 'researcher', name: '解析知识资料', nameEn: 'Parse knowledge files' },
  extract_relevant_information: { agentId: 'researcher', name: '提取相关信息', nameEn: 'Extract relevant information' },
  review_project_report: { agentId: 'seo_strategist', name: '查看项目分析报告', nameEn: 'Review project report' },
  analyze_market_audience: { agentId: 'seo_strategist', name: '分析目标市场与受众', nameEn: 'Analyze market and audience' },
  analyze_reference_articles: { agentId: 'seo_strategist', name: '分析参考文章', nameEn: 'Analyze reference articles' },
  create_article_strategy: { agentId: 'seo_strategist', name: '制定文章策略', nameEn: 'Create article strategy' },
  review_article_strategy: { agentId: 'content_operator', name: '阅读文章策划方案', nameEn: 'Review article strategy' },
  write_article_titles: { agentId: 'content_operator', name: '撰写文章标题', nameEn: 'Write article titles' },
  write_article_outline: { agentId: 'content_operator', name: '撰写文章大纲', nameEn: 'Write article outline' },
  review_title_outline: { agentId: 'content_operator', name: '查看标题大纲', nameEn: 'Review title and outline' },
  write_article_draft: { agentId: 'content_operator', name: '撰写文章初稿', nameEn: 'Write article draft' },
  review_revision_request: { agentId: 'content_operator', name: '阅读修改要求', nameEn: 'Review revision request' },
  review_suggestions: { agentId: 'content_operator', name: '阅读修改建议', nameEn: 'Review suggestions' },
  revise_article: { agentId: 'content_operator', name: '修改文章', nameEn: 'Revise article' },
  insert_media: { agentId: 'content_operator', name: '插入合适素材', nameEn: 'Insert relevant media' },
  insert_links: { agentId: 'content_operator', name: '插入相关链接', nameEn: 'Insert relevant links' },
  finalize_content_tdk: { agentId: 'content_operator', name: '整合内容并撰写 TDK', nameEn: 'Finalize content and write TDK' },
  evaluate_draft: { agentId: 'content_evaluator', name: '文章初稿评估', nameEn: 'Evaluate article draft' },
  plan_optimization: { agentId: 'content_evaluator', name: '思考优化方向', nameEn: 'Plan optimization' },
  evaluate_final_draft: { agentId: 'content_evaluator', name: '文章终稿评估', nameEn: 'Evaluate final draft' },
};

export function getTaskDefinition(task, locale = 'zh-CN') {
  const definition = taskCatalog[task?.taskKey] ?? {};
  return {
    agentId: task?.agentId || definition.agentId || 'copilot',
    name:
      locale === 'en-US'
        ? task?.taskNameEn || definition.nameEn || task?.taskName || 'Task'
        : task?.taskName || definition.name || task?.taskNameEn || '任务',
  };
}

export function formatTaskStatus(task, locale = 'zh-CN') {
  const { name } = getTaskDefinition(task, locale);
  const status = task?.status || 'done';

  if (locale === 'en-US') {
    if (status === 'running') return `${name} in progress...`;
    if (status === 'waiting_input') return `Waiting for user input: ${task?.clarification || ''}`.trim();
    if (status === 'error') return `${name} failed.`;
    if (status === 'interrupted') return `${name} was unexpectedly interrupted.`;
    if (status === 'cancelled') return `${name} was stopped.`;
    return `${name} completed.`;
  }

  if (status === 'running') return `正在${name}...`;
  if (status === 'waiting_input') return `等待用户输入：${task?.clarification || ''}`;
  if (status === 'error') return `${name}失败。`;
  if (status === 'interrupted') return `${name}意外中断。`;
  if (status === 'cancelled') return `${name}已中止。`;
  return `${name}完毕。`;
}
