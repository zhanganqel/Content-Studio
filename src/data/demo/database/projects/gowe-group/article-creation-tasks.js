import { createArticleTaskSeeds } from '../seedFactories.js';

export const goweGroupArticleCreationTasks = createArticleTaskSeeds({
  idPrefix: 'gowe-group',
  audienceId: 'international-contractor-procurement-manager',
  audienceName: 'International Contractor Procurement Manager',
  brandRequirements:
    'Use project-grounded and engineering-focused language. Highlight lifecycle support, certifications, delivery coordination, and localized service without absolute claims.',
  knowledgeAssets: [],
  knowledgeItems: [
    { id: 'ringlock-scaffolding', title: 'Ringlock Scaffolding' },
    { id: 'aluminium-formwork-system', title: 'Aluminium Formwork System' },
    { id: 'engineering-design-support', title: 'Engineering Design Support' },
  ],
  tasks: [
    {
      status: 'generating',
      title: 'Ringlock Scaffolding Buying Guide for International Contractors',
      businessGoal: 'Help contractor procurement teams compare system configuration and supplier support.',
      primaryKeyword: 'ringlock scaffolding supplier',
      secondaryKeywords: ['scaffolding system', 'contractor procurement', 'project delivery'],
      articleType: 'Ultimate Guides（深度科普）',
    },
    {
      status: 'success',
      title: 'How Aluminium Formwork Supports Faster Floor Cycles',
      businessGoal: 'Explain formwork planning value and generate qualified project enquiries.',
      primaryKeyword: 'aluminium formwork system',
      secondaryKeywords: ['floor cycle', 'formwork planning', 'engineering support'],
      articleType: 'How-to Guides（操作指南）',
    },
    {
      status: 'stopped',
      title: 'Scaffolding Rental vs. Purchase for Long-Term Projects',
      businessGoal: 'Help contractors evaluate procurement and lifecycle service options.',
      primaryKeyword: 'scaffolding rental vs purchase',
      secondaryKeywords: ['project duration', 'scaffolding cost', 'lifecycle support'],
    },
    {
      status: 'failed',
      title: 'Scaffolding Supplier Certification Checklist',
      businessGoal: 'Build trust through an evidence-based supplier verification checklist.',
      primaryKeyword: 'scaffolding supplier certification',
      secondaryKeywords: ['EN 12811', 'supplier audit', 'quality documentation'],
      errorMessage: '模型调用超时，质量评估阶段未完成。',
      articleType: 'Listicles（清单列表）',
    },
  ],
});
