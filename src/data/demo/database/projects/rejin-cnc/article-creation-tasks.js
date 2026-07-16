import { createArticleTaskSeeds } from '../seedFactories.js';

export const rejinCncArticleCreationTasks = createArticleTaskSeeds({
  idPrefix: 'rejin-cnc',
  audienceId: 'overseas-procurement-manager',
  audienceName: 'Overseas Procurement Manager',
  brandRequirements:
    'Keep the tone professional and evidence-based. Avoid exaggerated claims. Highlight engineering communication, stable quality control, and RFQ response speed.',
  knowledgeAssets: [],
  knowledgeItems: [
    { id: 'cnc-turning', title: 'CNC Turning' },
    { id: 'cnc-milling', title: 'CNC Milling' },
    { id: 'dfm-support', title: 'DFM Support' },
  ],
  tasks: [
    {
      status: 'generating',
      title: 'CNC Turning vs. Milling for Custom Metal Parts',
      businessGoal: 'Help buyers choose the right process and prepare a qualified RFQ.',
      primaryKeyword: 'CNC turning vs milling',
      secondaryKeywords: ['custom metal parts', 'CNC machining supplier', 'RFQ checklist'],
    },
    {
      status: 'success',
      title: 'How DFM Support Reduces CNC Machining Cost and Rework',
      businessGoal: 'Explain the commercial value of drawing review and convert readers into RFQ enquiries.',
      primaryKeyword: 'DFM support',
      secondaryKeywords: ['CNC machining cost', 'drawing review', 'prototype validation'],
      articleType: 'How-to Guides（操作指南）',
    },
    {
      status: 'stopped',
      title: 'Surface Finishing Options for Aluminum CNC Parts',
      businessGoal: 'Help engineering buyers compare finishing options before quotation.',
      primaryKeyword: 'surface finishing aluminum',
      secondaryKeywords: ['anodizing', 'aluminum CNC parts', 'surface treatment'],
      articleType: 'Ultimate Guides（深度科普）',
    },
    {
      status: 'failed',
      title: 'Custom Metal Parts Sourcing Checklist',
      businessGoal: 'Provide an actionable supplier evaluation checklist for overseas procurement teams.',
      primaryKeyword: 'custom metal parts supplier',
      secondaryKeywords: ['supplier evaluation', 'quality inspection', 'delivery risk'],
      errorMessage: '模型调用超时，正文评估阶段未完成。',
      articleType: 'Listicles（清单列表）',
    },
  ],
});
