import { getDemoTableSeed } from '../data/demo/database/registry.js';
import { demoTableNames } from '../data/demo/database/schema.js';
import { readDemoSessionTable, writeDemoSessionTable } from './demoSessionStore.js';

// 画像表单选项集中维护，页面只负责渲染和保存。
export const organizationTypeOptions = [
  'B2B Company',
  'Distributor',
  'Agency',
  'Brand Owner',
  'Engineering Contractor',
  'End User',
];

export const organizationScaleOptions = [
  '1-10 employees',
  '10-50 employees',
  '50-199 employees',
  '200-500 employees',
  '500-1000 employees',
  '1000+ employees',
];

export const jobTitleOptions = [
  'Procurement Manager',
  'Technical Manager',
  'Business Owner',
  'Founder / CEO',
  'Mechanical Engineer',
  'Supply Chain Lead',
  'Marketing Manager',
  'Project Manager',
  'Engineering Manager',
  'EPC Director',
];

export const contentTypeOptions = [
  'Product Reviews',
  'How-to Guides',
  'Ultimate Guides',
  'Problem-Solving',
  'Industry Insights',
  'Listicles',
  'Comparison',
  'News',
  'FAQS',
];

export const contentDepthOptions = ['Awareness', 'Understanding', 'Expert'];

export const expressionStyleOptions = [
  'professional',
  'straightforward',
  'friendly',
  'humorous',
  'persuasive',
  'educational',
  'inspirational',
  'urgent',
  'empathetic',
  'objective',
  'storytelling',
  'concise',
  'confident',
  'enthusiastic',
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// demo 画像字段不足时使用统一兜底结构，保证表单字段完整。
function fallbackPersonaFromDemo(persona, index) {
  return {
    id: persona.id ?? `persona-${index + 1}`,
    name: persona.title ?? `Audience Persona ${index + 1}`,
    organizationType: index % 2 === 0 ? 'B2B Company' : 'Distributor',
    organizationScale: index % 2 === 0 ? '50-199 employees' : '10-50 employees',
    industry: '',
    jobTitle: index % 2 === 0 ? 'Procurement Manager' : 'Business Owner',
    businessDescription: persona.summary ?? '',
    painPoints: '',
    searchGoal: persona.summary ?? '',
    commonQuestions: '',
    preferredContentTypes: (persona.contentPreferences ?? [])
      .map((item) => contentTypeOptions.find((option) => item.includes(option)) ?? item)
      .filter(Boolean)
      .slice(0, 3),
    preferredContentDepth: index === 0 ? 'Understanding' : 'Awareness',
    preferredExpressionStyles: ['professional', 'objective'],
    audienceFocus: '',
    updatedAt: today(),
  };
}

// 根据项目 demo 数据生成默认画像，并用模板补齐业务细节。
function getDemoPersonas(project) {
  const databasePersonas = getDemoTableSeed(project?.id, demoTableNames.audiencePersonas);
  const demoPersonas = Array.isArray(databasePersonas)
    ? databasePersonas
    : project?.demoProject?.audiencePersonas ?? [];

  if (!demoPersonas.length) {
    return [];
  }

  const templates = {
    'overseas-procurement-manager': {
      name: 'Overseas Procurement Manager',
      organizationType: 'B2B Company',
      organizationScale: '200-500 employees',
      industry: 'Industrial equipment manufacturing',
      jobTitle: 'Procurement Manager',
      businessDescription:
        'Responsible for evaluating suppliers for custom machined components, including delivery stability, quality systems, export communication, and long-term cooperation risk.',
      painPoints:
        'Unstable lead times, inconsistent quality, slow communication, unclear quotation requirements, and difficulty judging whether a supplier can support repeat orders.',
      searchGoal:
        'Find a reliable export-ready CNC machining supplier with ISO/IATF quality credentials, custom machining capability, predictable lead times, and responsive RFQ support.',
      commonQuestions:
        'How do I evaluate CNC supplier capability? What quality documents should I request? How can I confirm lead time and export communication before placing an order?',
      preferredContentTypes: ['How-to Guides', 'Comparison', 'FAQS'],
      preferredContentDepth: 'Understanding',
      preferredExpressionStyles: ['professional', 'objective', 'confident'],
      audienceFocus:
        'Supplier credibility, quality certification, lead-time reliability, export experience, production capacity, and clear quotation process.',
      updatedAt: '2026-06-28',
    },
    'mechanical-engineer': {
      name: 'Mechanical Design Engineer',
      organizationType: 'B2B Company',
      organizationScale: '50-199 employees',
      industry: 'Hardware product development',
      jobTitle: 'Mechanical Engineer',
      businessDescription:
        'Evaluates part drawings, material selection, tolerance requirements, surface finishing, and manufacturability before sending designs for production.',
      painPoints:
        'Needs to confirm manufacturability quickly, avoid tolerance or finishing mistakes, reduce rework risk, and understand how process choices affect cost and delivery.',
      searchGoal:
        'Understand CNC machining methods, material tradeoffs, achievable tolerances, surface treatment limits, and DFM recommendations for custom metal parts.',
      commonQuestions:
        'Which CNC process is suitable for this part? What tolerance can be achieved? Which surface finish is best for aluminum or stainless steel components?',
      preferredContentTypes: ['Problem-Solving', 'Ultimate Guides'],
      preferredContentDepth: 'Expert',
      preferredExpressionStyles: ['educational', 'objective', 'concise'],
      audienceFocus:
        'Technical detail, tolerance feasibility, material compatibility, process constraints, DFM guidance, and practical engineering examples.',
      updatedAt: '2026-06-25',
    },
    'hardware-startup-founder': {
      name: 'Hardware Startup Founder',
      organizationType: 'Brand Owner',
      organizationScale: '10-50 employees',
      industry: 'Consumer electronics and connected hardware',
      jobTitle: 'Founder / CEO',
      businessDescription:
        'Leads a small hardware team that needs prototype machining, DFM feedback, and practical manufacturing support before committing to larger production runs.',
      painPoints:
        'Limited in-house manufacturing experience, uncertainty about part cost, risk of prototype rework, pressure to validate product-market fit, and limited time to compare suppliers.',
      searchGoal:
        'Find a CNC machining partner that can review drawings, suggest manufacturable improvements, support small batches, and explain the route from prototype to production.',
      commonQuestions:
        'Can a supplier help improve my design before production? What is the minimum order quantity for prototype CNC parts? How can I reduce prototype cost without hurting function?',
      preferredContentTypes: ['How-to Guides', 'Problem-Solving', 'FAQS'],
      preferredContentDepth: 'Understanding',
      preferredExpressionStyles: ['straightforward', 'educational', 'confident'],
      audienceFocus:
        'Prototype feasibility, DFM support, cost-control tradeoffs, small-batch production, fast communication, and clear next steps for RFQ submission.',
      updatedAt: '2026-06-29',
    },
    'supply-chain-lead': {
      name: 'Supply Chain Lead for Hardware Brands',
      organizationType: 'B2B Company',
      organizationScale: '500-1000 employees',
      industry: 'Hardware brand manufacturing operations',
      jobTitle: 'Supply Chain Lead',
      businessDescription:
        'Manages supplier risk, repeat order consistency, delivery planning, quality documentation, and communication across product teams and purchasing stakeholders.',
      painPoints:
        'Needs to reduce supplier fragmentation, avoid inconsistent batches, control delivery risk, and quickly explain supplier capability to internal engineering and procurement teams.',
      searchGoal:
        'Identify a reliable precision manufacturing supplier with broad process coverage, documented quality systems, stable communication, and experience supporting custom metal components.',
      commonQuestions:
        'Can one supplier cover multiple metal manufacturing processes? What quality controls are available for repeat orders? How should we compare CNC machining suppliers?',
      preferredContentTypes: ['Comparison', 'Industry Insights', 'Problem-Solving'],
      preferredContentDepth: 'Understanding',
      preferredExpressionStyles: ['professional', 'objective', 'concise'],
      audienceFocus:
        'Supplier consolidation, repeatability, quality systems, delivery planning, export communication, and industry-specific application proof.',
      updatedAt: '2026-06-29',
    },
    'international-contractor-procurement-manager': {
      name: 'International Contractor Procurement Manager',
      organizationType: 'Engineering Contractor',
      organizationScale: '1000+ employees',
      industry: 'International building and infrastructure construction',
      jobTitle: 'Procurement Manager',
      businessDescription:
        'Sources formwork, scaffolding, steel structure, and bridge or tunnel equipment for overseas projects where supplier reliability affects schedule, safety, and compliance risk.',
      painPoints:
        'Needs credible certification, predictable delivery, complete product categories, regional support, and supplier evidence that can be shared with engineering and project teams.',
      searchGoal:
        'Compare formwork and scaffolding suppliers with integrated design, production, rental, construction guidance, project proof, and overseas service coverage.',
      commonQuestions:
        'Can this supplier support both formwork and scaffolding? What certifications are available? Can the team provide design drawings, delivery support, and on-site guidance?',
      preferredContentTypes: ['Comparison', 'FAQS', 'Industry Insights'],
      preferredContentDepth: 'Understanding',
      preferredExpressionStyles: ['professional', 'objective', 'confident'],
      audienceFocus:
        'Supplier capability, certification, delivery dependability, engineering support, localized service, and project-risk reduction.',
      updatedAt: '2026-07-08',
    },
    'formwork-scaffolding-distributor': {
      name: 'Formwork and Scaffolding Distributor',
      organizationType: 'Distributor',
      organizationScale: '50-199 employees',
      industry: 'Construction equipment distribution',
      jobTitle: 'Business Owner',
      businessDescription:
        'Builds a regional catalog of scaffolding, formwork, props, beams, couplers, and protection systems for contractors and project buyers.',
      painPoints:
        'Needs dependable product breadth, wholesale supply, documentation, certification signals, repeatable quality, and marketing content that explains technical categories clearly.',
      searchGoal:
        'Identify a manufacturer partner with broad formwork and scaffolding coverage, wholesale-ready product information, quality proof, and localized export service.',
      commonQuestions:
        'Which product categories can we distribute? Is rental or purchase supported? What documents and certifications help us sell to contractors?',
      preferredContentTypes: ['Product Reviews', 'Listicles', 'FAQS'],
      preferredContentDepth: 'Understanding',
      preferredExpressionStyles: ['straightforward', 'professional', 'persuasive'],
      audienceFocus:
        'Catalog breadth, wholesale supply, certification proof, product explainability, service responsiveness, and regional partner fit.',
      updatedAt: '2026-07-08',
    },
    'project-engineering-manager': {
      name: 'Project and Structural Engineering Manager',
      organizationType: 'Engineering Contractor',
      organizationScale: '200-500 employees',
      industry: 'Temporary works and structural engineering',
      jobTitle: 'Engineering Manager',
      businessDescription:
        'Reviews formwork, scaffolding, climbing platform, and bridge construction systems for constructability, technical drawings, load path clarity, and project-stage execution.',
      painPoints:
        'Needs practical system details, application scenarios, drawing support, compatibility with complex structures, and confidence that technical guidance is available after purchase.',
      searchGoal:
        'Understand which GOWE systems fit high-rise, bridge, tunnel, industrial, and public building scenarios, and what engineering support is available.',
      commonQuestions:
        'Which formwork system fits this structure? Can the supplier provide material calculations and drawings? How does technical guidance work during construction?',
      preferredContentTypes: ['How-to Guides', 'Problem-Solving', 'Ultimate Guides'],
      preferredContentDepth: 'Expert',
      preferredExpressionStyles: ['educational', 'objective', 'concise'],
      audienceFocus:
        'Technical fit, drawing support, system selection, construction guidance, safety, reuse, and engineering constraints.',
      updatedAt: '2026-07-08',
    },
    'infrastructure-developer-epc-lead': {
      name: 'Infrastructure Developer or EPC Lead',
      organizationType: 'Engineering Contractor',
      organizationScale: '1000+ employees',
      industry: 'Infrastructure development and EPC delivery',
      jobTitle: 'EPC Director',
      businessDescription:
        'Leads supplier evaluation for bridge, tunnel, railway, airport, industrial, and large steel structure projects that need coordinated product, engineering, and service capability.',
      painPoints:
        'Needs project proof, lifecycle service coverage, procurement flexibility, localized support, and confidence that systems scale beyond single-building applications.',
      searchGoal:
        'Validate whether GOWE can support infrastructure-scale formwork, scaffolding, bridge and tunnel equipment, steel structures, and regional project delivery.',
      commonQuestions:
        'Has the supplier supported comparable infrastructure projects? Can one partner cover design, production, construction guidance, and operation support? What overseas service exists?',
      preferredContentTypes: ['Industry Insights', 'Comparison', 'Problem-Solving'],
      preferredContentDepth: 'Expert',
      preferredExpressionStyles: ['professional', 'objective', 'confident'],
      audienceFocus:
        'Project proof, lifecycle capability, regional service, infrastructure fit, construction risk, and multi-category supplier consolidation.',
      updatedAt: '2026-07-08',
    },
  };

  // 先以 demo 数据为底，再用项目模板覆盖更完整的画像字段。
  const mapped = demoPersonas.map((persona, index) => ({
    ...fallbackPersonaFromDemo(persona, index),
    ...(templates[persona.id] ?? {}),
    id: persona.id ?? `persona-${index + 1}`,
  }));

  const preferredOrder = [
    'overseas-procurement-manager',
    'hardware-startup-founder',
    'mechanical-engineer',
    'supply-chain-lead',
    'international-contractor-procurement-manager',
    'formwork-scaffolding-distributor',
    'project-engineering-manager',
    'infrastructure-developer-epc-lead',
  ];
  // 默认只展示前四个优先画像，避免初始列表过长。
  const selectedPersonas = preferredOrder
    .map((id) => mapped.find((persona) => persona.id === id))
    .filter(Boolean);

  return (selectedPersonas.length ? selectedPersonas : mapped).slice(0, 4);
}

// 创建空画像草稿，供新建抽屉和复制流程复用。
export function createEmptyAudiencePersona() {
  return {
    id: '',
    name: '',
    organizationType: '',
    organizationScale: '',
    industry: '',
    jobTitle: '',
    businessDescription: '',
    painPoints: '',
    searchGoal: '',
    commonQuestions: '',
    preferredContentTypes: [],
    preferredContentDepth: '',
    preferredExpressionStyles: [],
    audienceFocus: '',
    updatedAt: today(),
  };
}

export function createDefaultAudiencePersonas(project) {
  return getDemoPersonas(project);
}

// 画像优先读取当前标签页快照，首次进入时使用固定数据库种子。
export function getAudiencePersonaDrafts(project) {
  const fallback = createDefaultAudiencePersonas(project);
  const personas = readDemoSessionTable(project.id, demoTableNames.audiencePersonas, fallback);
  return Array.isArray(personas) ? personas : fallback;
}

// 保存画像草稿只影响当前标签页内的项目表。
export function saveAudiencePersonaDrafts(projectId, personas) {
  return writeDemoSessionTable(projectId, demoTableNames.audiencePersonas, personas);
}

export function createPersonaId(prefix = 'persona') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTodayString() {
  return today();
}
