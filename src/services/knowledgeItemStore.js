const storageKeyPrefix = 'content-studio-knowledge-items:v2';

export const knowledgeFieldTypes = [
  'shortText',
  'longText',
  'url',
  'tags',
  'multiSelect',
  'number',
];

export const presetTypeIds = ['products', 'services', 'solutions', 'cases', 'faqs'];

const presetTypes = [
  {
    id: 'products',
    preset: true,
    icon: 'product',
    tone: 'blue',
    prefix: 'prod',
    nameFieldKey: 'productName',
    fields: [
      systemIdField(),
      field('productName', 'Product Name', 'shortText', { required: true, width: 260, aiRole: 'name' }),
      field('productAlias', 'Product Alias', 'shortText', { width: 220, aiRole: 'alias' }),
      field('productUrl', 'Product URL', 'url', { width: 340, aiRole: 'sourceUrl' }),
      field('tags', 'Tags', 'tags', { width: 220, aiRole: 'tags' }),
      field('description', 'Description', 'longText', { required: true, width: 360, aiRole: 'body' }),
    ],
  },
  {
    id: 'services',
    preset: true,
    icon: 'service',
    tone: 'green',
    prefix: 'svc',
    nameFieldKey: 'serviceName',
    fields: [
      systemIdField(),
      field('serviceName', 'Service Name', 'shortText', { required: true, width: 260, aiRole: 'name' }),
      field('serviceUrl', 'Service URL', 'url', { width: 340, aiRole: 'sourceUrl' }),
      field('tags', 'Tags', 'tags', { width: 220, aiRole: 'tags' }),
      field('description', 'Service Description', 'longText', { required: true, width: 420, aiRole: 'body' }),
    ],
  },
  {
    id: 'solutions',
    preset: true,
    icon: 'solution',
    tone: 'violet',
    prefix: 'sol',
    nameFieldKey: 'solutionName',
    fields: [
      systemIdField(),
      field('solutionName', 'Solution Name', 'shortText', { required: true, width: 260, aiRole: 'name' }),
      field('targetScenario', 'Target Scenario', 'shortText', { width: 240, aiRole: 'scenario' }),
      field('solutionContent', 'Solution Content', 'longText', { required: true, width: 420, aiRole: 'body' }),
      field('relatedService', 'Related Service', 'shortText', { width: 220, aiRole: 'relation' }),
      field('tags', 'Tags', 'tags', { width: 220, aiRole: 'tags' }),
    ],
  },
  {
    id: 'cases',
    preset: true,
    icon: 'case',
    tone: 'orange',
    prefix: 'case',
    nameFieldKey: 'caseName',
    fields: [
      systemIdField(),
      field('caseName', 'Case Name', 'shortText', { required: true, width: 280, aiRole: 'name' }),
      field('industry', 'Industry', 'shortText', { width: 200, aiRole: 'scenario' }),
      field('caseUrl', 'Case URL', 'url', { width: 340, aiRole: 'sourceUrl' }),
      field('tags', 'Tags', 'tags', { width: 220, aiRole: 'tags' }),
      field('summary', 'Case Summary', 'longText', { required: true, width: 420, aiRole: 'body' }),
    ],
  },
  {
    id: 'faqs',
    preset: true,
    icon: 'faq',
    tone: 'sky',
    prefix: 'faq',
    nameFieldKey: 'question',
    fields: [
      systemIdField(),
      field('question', 'Question', 'shortText', { required: true, width: 340, aiRole: 'name' }),
      field('answer', 'Answer', 'longText', { required: true, width: 460, aiRole: 'body' }),
      field('faqUrl', 'FAQ URL', 'url', { width: 340, aiRole: 'sourceUrl' }),
      field('tags', 'Tags', 'tags', { width: 220, aiRole: 'tags' }),
    ],
  },
];

function systemIdField() {
  return {
    id: 'knowledgeId',
    key: 'knowledgeId',
    label: 'Knowledge ID',
    type: 'system',
    required: false,
    readOnly: true,
    width: 150,
    aiRole: 'id',
  };
}

function field(key, label, type, options = {}) {
  return {
    id: key,
    key,
    label,
    type,
    required: false,
    readOnly: false,
    width: 220,
    aiRole: 'attribute',
    ...options,
  };
}

function getStorageKey(projectId) {
  return `${storageKeyPrefix}:${projectId}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value, fallback = 'field') {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function compactTags(values) {
  if (Array.isArray(values)) {
    return values.map((value) => String(value).trim()).filter(Boolean);
  }

  return String(values ?? '')
    .split(/[,，\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function inferTags(item) {
  return compactTags([item.type, item.title.split(' ')[0]]).slice(0, 3);
}

function getTypeId(itemType) {
  return {
    product: 'products',
    service: 'services',
    case: 'cases',
    faq: 'faqs',
    solution: 'solutions',
  }[itemType];
}

function getAlias(title) {
  return title
    .replace(/^Custom\s+/i, '')
    .replace(/^Precision\s+/i, '')
    .replace(/^CNC\s+/i, '')
    .slice(0, 36);
}

function createRow(type, index, cells) {
  return {
    id: `${type.id}-row-${String(index + 1).padStart(3, '0')}`,
    knowledgeId: `ki-${type.prefix}-${String(index + 1).padStart(3, '0')}`,
    cells,
  };
}

function createRowsForProject(project) {
  const rows = Object.fromEntries(presetTypes.map((type) => [type.id, []]));
  const sourceItems = project?.demoProject?.knowledgeItems ?? project?.knowledgeItems ?? [];

  sourceItems.forEach((item) => {
    const typeId = getTypeId(item.type);
    if (!typeId) return;

    const type = presetTypes.find((candidate) => candidate.id === typeId);
    const index = rows[typeId].length;
    const tags = inferTags(item);

    if (typeId === 'products') {
      rows[typeId].push(
        createRow(type, index, {
          productName: item.title,
          productAlias: getAlias(item.title),
          productUrl: item.sourceUrl,
          tags,
          description: item.summary,
        }),
      );
      return;
    }

    if (typeId === 'services') {
      rows[typeId].push(
        createRow(type, index, {
          serviceName: item.title,
          serviceUrl: item.sourceUrl,
          tags,
          description: item.summary,
        }),
      );
      return;
    }

    if (typeId === 'solutions') {
      rows[typeId].push(
        createRow(type, index, {
          solutionName: item.title,
          targetScenario: inferSolutionScenario(item.title),
          solutionContent: item.summary,
          relatedService: inferRelatedService(item.title),
          tags,
        }),
      );
      return;
    }

    if (typeId === 'cases') {
      rows[typeId].push(
        createRow(type, index, {
          caseName: item.title,
          industry: inferCaseIndustry(item.title),
          caseUrl: item.sourceUrl,
          tags,
          summary: item.summary,
        }),
      );
      return;
    }

    if (typeId === 'faqs') {
      rows[typeId].push(
        createRow(type, index, {
          question: item.title,
          answer: item.summary,
          faqUrl: item.sourceUrl,
          tags,
        }),
      );
    }
  });

  return rows;
}

function inferSolutionScenario(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('startup') || lowerTitle.includes('prototype')) {
    return 'Prototype validation and low-volume production';
  }
  if (lowerTitle.includes('sourcing') || lowerTitle.includes('overseas')) {
    return 'Export sourcing and supplier consolidation';
  }
  if (lowerTitle.includes('robotics') || lowerTitle.includes('automation')) {
    return 'Robotics and automation component manufacturing';
  }
  return 'Custom metal parts manufacturing';
}

function inferRelatedService(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('startup') || lowerTitle.includes('prototype')) {
    return 'DFM Support';
  }
  if (lowerTitle.includes('sourcing') || lowerTitle.includes('overseas')) {
    return 'CNC Machining and Sheet Metal Fabrication';
  }
  if (lowerTitle.includes('robotics') || lowerTitle.includes('automation')) {
    return '5-Axis CNC Machining';
  }
  return 'Custom CNC Machining';
}

function inferCaseIndustry(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('automotive')) return 'Automotive';
  if (lowerTitle.includes('audio')) return 'Audio Hardware';
  if (lowerTitle.includes('medical')) return 'Medical Devices';
  if (lowerTitle.includes('robot')) return 'Robotics';
  return 'Industrial Manufacturing';
}

function createDefaultDraft(project) {
  return {
    types: clone(presetTypes),
    rows: createRowsForProject(project),
  };
}

export function getKnowledgeItemDraft(project) {
  if (typeof window === 'undefined') {
    return createDefaultDraft(project);
  }

  const storedValue = window.localStorage.getItem(getStorageKey(project.id));
  if (!storedValue) {
    return createDefaultDraft(project);
  }

  try {
    const parsed = JSON.parse(storedValue);
    return normalizeDraft(parsed, project);
  } catch {
    return createDefaultDraft(project);
  }
}

export function saveKnowledgeItemDraft(projectId, data) {
  const normalized = normalizeDraft(data);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(normalized));
  }
  return normalized;
}

export function createBlankRow() {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    knowledgeId: '',
    cells: {},
    draft: true,
  };
}

export function createCustomKnowledgeType({ description, fields, name }) {
  const timestamp = Date.now();
  const id = `custom-${slugify(name, 'knowledge-type')}-${timestamp}`;
  const normalizedFields = fields.map((item, index) => {
    const key = `${slugify(item.label, 'field')}-${index + 1}`;
    return {
      id: key,
      key,
      label: item.label.trim(),
      type: item.type,
      required: Boolean(item.required),
      maxLength: item.maxLength ?? null,
      readOnly: false,
      width: getDefaultFieldWidth(item.type),
      aiRole: index === 0 ? 'name' : item.type === 'tags' ? 'tags' : 'attribute',
    };
  });

  return {
    id,
    preset: false,
    icon: 'custom',
    tone: 'slate',
    prefix: `cus${timestamp.toString().slice(-4)}`,
    name,
    description,
    nameFieldKey: normalizedFields[0].key,
    fields: [systemIdField(), ...normalizedFields],
  };
}

export function createCustomField(rawField, existingFields) {
  const baseKey = slugify(rawField.label, 'field');
  const usedKeys = new Set(existingFields.map((item) => item.key));
  let key = baseKey;
  let index = 2;

  while (usedKeys.has(key)) {
    key = `${baseKey}-${index}`;
    index += 1;
  }

  return {
    id: key,
    key,
    label: rawField.label.trim(),
    type: rawField.type,
    required: Boolean(rawField.required),
    maxLength: rawField.maxLength ?? null,
    readOnly: false,
    width: getDefaultFieldWidth(rawField.type),
    aiRole: rawField.type === 'tags' ? 'tags' : 'attribute',
  };
}

export function getNextKnowledgeId(type, rows) {
  const prefix = `ki-${type.prefix}-`;
  const max = rows.reduce((currentMax, row) => {
    if (!row.knowledgeId?.startsWith(prefix)) return currentMax;
    const number = Number(row.knowledgeId.replace(prefix, ''));
    return Number.isFinite(number) ? Math.max(currentMax, number) : currentMax;
  }, 0);

  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function normalizeCellValue(value, fieldType) {
  if (fieldType === 'tags' || fieldType === 'multiSelect') {
    return compactTags(value);
  }

  if (fieldType === 'number') {
    const normalized = String(value ?? '').trim();
    return normalized ? Number(normalized) : '';
  }

  return String(value ?? '').trim();
}

function getDefaultFieldWidth(fieldType) {
  return {
    shortText: 220,
    longText: 360,
    url: 320,
    tags: 220,
    multiSelect: 240,
    number: 160,
  }[fieldType] ?? 220;
}

function normalizeDraft(data, project) {
  const fallback = project ? createDefaultDraft(project) : { types: clone(presetTypes), rows: {} };
  const types = Array.isArray(data?.types) ? data.types : fallback.types;
  const rows = data?.rows && typeof data.rows === 'object' ? data.rows : fallback.rows;

  types.forEach((type) => {
    if (!rows[type.id]) {
      rows[type.id] = [];
    }
  });

  return { types, rows };
}
