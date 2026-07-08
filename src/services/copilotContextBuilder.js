import { getAudiencePersonaDrafts } from './audiencePersonaStore.js';
import { getBrandProfileDraft } from './brandProfileStore.js';
import { getConversationMessages } from './copilotConversationStore.js';
import { listChunks, listFiles } from './fileLibraryApi.js';
import { getKnowledgeItemDraft } from './knowledgeItemStore.js';
import { listMediaAssets } from './mediaLibraryApi.js';

const defaultMaxTokens = 7000;

const contextPriorities = {
  brandProfile: 100,
  audiencePersona: 90,
  knowledgeItem: 80,
  fileChunk: 70,
  conversation: 55,
  mediaAsset: 40,
};

function estimateTokens(value) {
  return Math.ceil(String(value ?? '').length / 4);
}

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatList(values) {
  return (Array.isArray(values) ? values : String(values ?? '').split(/[,，\n]/))
    .map((item) => compact(item))
    .filter(Boolean)
    .join(', ');
}

function createContextItem({ content, id, metadata = {}, priority, title, type }) {
  const contentText = compact(content);

  return {
    content: contentText,
    id,
    metadata,
    priority,
    title,
    tokenCount: estimateTokens(contentText),
    type,
  };
}

function addItem(items, item) {
  if (!item?.content) return;
  items.push(item);
}

function formatKnowledgeRow(row, typeLabel = 'Knowledge') {
  const cells = row.cells ?? {};
  const cellText = Object.entries(cells)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  return [
    `Type: ${typeLabel}`,
    row.knowledgeId ? `Knowledge ID: ${row.knowledgeId}` : '',
    cellText,
  ]
    .filter(Boolean)
    .join('\n');
}

function getKnowledgeTypeTitle(types = [], typeId) {
  const type = types.find((item) => item.id === typeId);
  return type?.name ?? type?.title ?? typeId ?? 'Knowledge';
}

function getKnowledgeRows(rows) {
  if (Array.isArray(rows)) {
    return rows;
  }

  if (!rows || typeof rows !== 'object') {
    return [];
  }

  return Object.entries(rows).flatMap(([typeId, typeRows]) =>
    (Array.isArray(typeRows) ? typeRows : []).map((row) => ({
      ...row,
      typeId: row.typeId ?? typeId,
    })),
  );
}

function buildPromptContext(items) {
  return items
    .map((item) => {
      const sourceLabel = `[${item.type}:${item.id}] ${item.title}`;
      return `${sourceLabel}\n${item.content}`;
    })
    .join('\n\n');
}

function truncateByPriority(items, maxTokens) {
  const selected = [];
  const seenIds = new Set();
  let totalTokens = 0;

  for (const item of [...items].sort((a, b) => b.priority - a.priority)) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    if (totalTokens + item.tokenCount > maxTokens && selected.length) {
      continue;
    }

    selected.push(item);
    totalTokens += item.tokenCount;
  }

  return selected;
}

export function buildCopilotProjectContext(project, options = {}) {
  const maxTokens = options.maxTokens ?? defaultMaxTokens;
  const items = [];
  const projectId = project?.id ?? 'default';
  const demoProject = project?.demoProject ?? {};

  const brandProfile = getBrandProfileDraft(project);
  addItem(
    items,
    createContextItem({
      content: [
        `Company: ${brandProfile.companyName}`,
        `Brand: ${brandProfile.brandName}`,
        `Website: ${brandProfile.website}`,
        `Industry: ${brandProfile.industry}`,
        `Markets: ${formatList(brandProfile.coreMarkets)}`,
        `Categories: ${formatList(brandProfile.coreCategories)}`,
        `Introduction: ${brandProfile.companyIntroduction}`,
        `Positioning: ${brandProfile.brandPositioning}`,
        `Capabilities: ${formatList(brandProfile.coreAdvantages)}`,
        `Certifications: ${formatList(brandProfile.certifications)}`,
        `Requirements: ${formatList(brandProfile.brandRequirements)}`,
      ].join('\n'),
      id: `${projectId}-brand-profile`,
      metadata: { projectId },
      priority: contextPriorities.brandProfile,
      title: 'Brand profile',
      type: 'brandProfile',
    }),
  );

  getAudiencePersonaDrafts(project)
    .slice(0, 8)
    .forEach((persona) => {
      addItem(
        items,
        createContextItem({
          content: [
            `Persona: ${persona.title}`,
            `Summary: ${persona.summary}`,
            `Content preferences: ${formatList(persona.contentPreferences)}`,
          ].join('\n'),
          id: persona.id || `${projectId}-persona-${persona.title}`,
          metadata: { projectId },
          priority: contextPriorities.audiencePersona,
          title: persona.title,
          type: 'audiencePersona',
        }),
      );
    });

  const knowledgeDraft = getKnowledgeItemDraft(project);
  const knowledgeRows = getKnowledgeRows(knowledgeDraft.rows);
  knowledgeRows.slice(0, 24).forEach((row) => {
    const rawTitle =
      row.cells?.title ||
      row.cells?.name ||
      row.cells?.question ||
      row.cells?.serviceName ||
      row.cells?.productName ||
      row.knowledgeId ||
      'Knowledge item';
    const title = compact(Array.isArray(rawTitle) ? rawTitle.join(', ') : rawTitle) || 'Knowledge item';
    addItem(
      items,
      createContextItem({
        content: formatKnowledgeRow(row, getKnowledgeTypeTitle(knowledgeDraft.types, row.typeId)),
        id: row.id || `${projectId}-knowledge-${title}`,
        metadata: { projectId, typeId: row.typeId },
        priority: contextPriorities.knowledgeItem,
        title,
        type: 'knowledgeItem',
      }),
    );
  });

  listFiles(project)
    .slice(0, 8)
    .forEach((file) => {
      const chunks = listChunks(project, file.id).slice(0, 2);
      chunks.forEach((chunk) => {
        addItem(
          items,
          createContextItem({
            content: [
              `File: ${file.title}`,
              `Usage: ${file.usage ?? ''}`,
              `Chunk: ${chunk.title ?? chunk.id}`,
              chunk.content ?? chunk.text ?? '',
            ].join('\n'),
            id: chunk.id || `${file.id}-chunk`,
            metadata: { fileId: file.id, projectId },
            priority: contextPriorities.fileChunk,
            title: `${file.title} / ${chunk.title ?? 'Chunk'}`,
            type: 'fileChunk',
          }),
        );
      });
    });

  listMediaAssets(project)
    .slice(0, 12)
    .forEach((asset) => {
      addItem(
        items,
        createContextItem({
          content: [
            `Asset: ${asset.title}`,
            `Category: ${asset.category ?? asset.assetType ?? ''}`,
            `Tags: ${formatList(asset.tags)}`,
            `Usage: ${asset.usage ?? ''}`,
          ].join('\n'),
          id: asset.id,
          metadata: { projectId, sourcePageUrl: asset.sourcePageUrl ?? '' },
          priority: contextPriorities.mediaAsset,
          title: asset.title,
          type: 'mediaAsset',
        }),
      );
    });

  if (options.conversationState && options.conversationId) {
    getConversationMessages(options.conversationState, options.conversationId)
      .slice(-6)
      .forEach((message) => {
        addItem(
          items,
          createContextItem({
            content: `${message.role}: ${message.content}`,
            id: message.id,
            metadata: { conversationId: options.conversationId, projectId },
            priority: contextPriorities.conversation,
            title: 'Recent conversation',
            type: 'conversation',
          }),
        );
      });
  }

  const selectedItems = truncateByPriority(items, maxTokens);
  const totalTokens = selectedItems.reduce((sum, item) => sum + item.tokenCount, 0);

  return {
    items: selectedItems,
    metadata: {
      brandName: demoProject.brandName ?? brandProfile.brandName,
      itemCount: selectedItems.length,
      maxTokens,
      projectId,
      projectName: project?.name ?? '',
      totalTokens,
    },
    promptContext: buildPromptContext(selectedItems),
    sources: selectedItems.map((item) => ({
      id: item.id,
      metadata: item.metadata,
      snippet: item.content.slice(0, 260),
      title: item.title,
      type: item.type,
    })),
  };
}
