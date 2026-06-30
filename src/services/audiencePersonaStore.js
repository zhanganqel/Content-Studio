const storageKeyPrefix = 'content-studio-audience-personas:';
const storageSchemaVersion = 3;

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

function getStorageKey(projectId) {
  return `${storageKeyPrefix}${projectId}`;
}

function serializePersonas(personas) {
  return JSON.stringify({
    schemaVersion: storageSchemaVersion,
    personas,
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

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

function getDemoPersonas(project) {
  const demoPersonas = project?.demoProject?.audiencePersonas ?? [];

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
  };

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
  ];
  const selectedPersonas = preferredOrder
    .map((id) => mapped.find((persona) => persona.id === id))
    .filter(Boolean);

  return (selectedPersonas.length ? selectedPersonas : mapped).slice(0, 4);
}

function isLegacyGeneratedPersonaSet(personas) {
  if (!Array.isArray(personas) || personas.length !== 3) {
    return false;
  }

  const legacyNames = ['企业采购决策者', '初次了解访客', '技术评估用户'];
  const legacyIds = [
    'hardware-startup-founder',
    'mechanical-engineer',
    'overseas-procurement-manager',
  ];

  const names = personas.map((persona) => persona.name).sort();
  const ids = personas.map((persona) => persona.id).sort();

  return (
    JSON.stringify(names) === JSON.stringify(legacyNames.sort()) &&
    JSON.stringify(ids) === JSON.stringify(legacyIds.sort())
  );
}

function shouldMigrateLegacyPersonas(personas, project) {
  if (isLegacyGeneratedPersonaSet(personas)) {
    return true;
  }

  return Boolean(project?.demoProject) && personas.length === 0;
}

function shouldRefreshDemoPersonas(personas, project, schemaVersion) {
  if (!project?.demoProject) {
    return false;
  }

  return schemaVersion !== storageSchemaVersion || personas.length < 3;
}

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

export function getAudiencePersonaDrafts(project) {
  if (typeof window === 'undefined') {
    return createDefaultAudiencePersonas(project);
  }

  const stored = window.localStorage.getItem(getStorageKey(project.id));

  if (!stored) {
    return createDefaultAudiencePersonas(project);
  }

  try {
    const parsed = JSON.parse(stored);

    if (parsed && Array.isArray(parsed.personas)) {
      if (shouldRefreshDemoPersonas(parsed.personas, project, parsed.schemaVersion)) {
        const nextPersonas = createDefaultAudiencePersonas(project);
        window.localStorage.setItem(getStorageKey(project.id), serializePersonas(nextPersonas));
        return nextPersonas;
      }

      return parsed.personas;
    }

    if (!Array.isArray(parsed)) {
      return createDefaultAudiencePersonas(project);
    }

    if (shouldMigrateLegacyPersonas(parsed, project)) {
      const nextPersonas = createDefaultAudiencePersonas(project);
      window.localStorage.setItem(getStorageKey(project.id), serializePersonas(nextPersonas));
      return nextPersonas;
    }

    if (shouldRefreshDemoPersonas(parsed, project)) {
      const nextPersonas = createDefaultAudiencePersonas(project);
      window.localStorage.setItem(getStorageKey(project.id), serializePersonas(nextPersonas));
      return nextPersonas;
    }

    return parsed;
  } catch {
    return createDefaultAudiencePersonas(project);
  }
}

export function saveAudiencePersonaDrafts(projectId, personas) {
  if (typeof window === 'undefined') {
    return personas;
  }

  window.localStorage.setItem(getStorageKey(projectId), serializePersonas(personas));
  return personas;
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
