import { listChunks, listFiles } from './fileLibraryApi.js';
import { getKnowledgeItemDraft } from './knowledgeItemStore.js';

export const copilotAttachmentLimits = {
  maxAttachments: 8,
  maxCharactersPerAttachment: 12000,
  maxTotalCharacters: 48000,
};

function getDisplayValue(value) {
  return Array.isArray(value) ? value.join(', ') : String(value ?? '');
}

function getRowValue(row, field) {
  if (!field) return '';
  if (field.key === 'knowledgeId') return row.knowledgeId ?? '';
  return getDisplayValue(row.cells?.[field.key]);
}

function getChunkText(chunk) {
  return String(chunk?.editedText || chunk?.originalText || '').replace(/\r/g, '').trim();
}

export function flattenKnowledgeItems(draft) {
  return draft.types.flatMap((type) => {
    const rows = draft.rows[type.id] ?? [];
    const nameField = type.fields.find((field) => field.key === type.nameFieldKey) ?? type.fields[1];
    const bodyField = type.fields.find((field) => field.aiRole === 'body') ?? type.fields[2];
    const sourceUrlField = type.fields.find((field) => field.aiRole === 'sourceUrl');
    const tagsField = type.fields.find((field) => field.aiRole === 'tags');

    return rows.map((row) => ({
      id: row.id,
      sourceUrl: sourceUrlField ? getRowValue(row, sourceUrlField) : '',
      summary: getRowValue(row, bodyField),
      tags: tagsField
        ? getRowValue(row, tagsField).split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      title: getRowValue(row, nameField) || row.knowledgeId || 'Untitled knowledge',
      typeId: type.id,
      typeName: type.name,
    }));
  });
}

export function getKnowledgeFileName(file) {
  if (file.fileName) return file.fileName;
  if (file.title && file.fileType && !file.title.toLowerCase().endsWith(`.${file.fileType.toLowerCase()}`)) {
    return `${file.title}.${file.fileType}`;
  }
  return file.title || '未命名资料文件';
}

export function getKnowledgeFileOption(project, file) {
  const chunks = file?.id ? listChunks(project, file.id) : [];
  const content = chunks.map(getChunkText).filter(Boolean).join('\n\n');
  const onlyFallbackContent = Boolean(content) && chunks.every((chunk) =>
    getChunkText(chunk).includes('This fallback chunk is available for demo browsing'),
  );
  const ignoredLines = new Set(
    [file.title, file.fileName, file.usage, getKnowledgeFileName(file)]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean),
  );
  const previewLines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !ignoredLines.has(line))
    .filter((line) => !/^tags:/i.test(line))
    .filter((line) => !/^source urls?:/i.test(line))
    .filter((line) => !/^https?:\/\//i.test(line))
    .filter((line) => !/^this fallback chunk/i.test(line));

  return {
    ...file,
    content,
    fileName: getKnowledgeFileName(file),
    fileType: String(file.fileType || '').toLowerCase(),
    hasUsableContent: Boolean(content) && !onlyFallbackContent,
    statusLabel: {
      chunked: '已解析',
      failed: '解析失败',
      pending: '待解析',
      processing: '解析中',
    }[file.processingStatus] ?? '未知状态',
    summary: previewLines.slice(0, 2).join(' ') || '暂无可预览内容',
    title: getKnowledgeFileName(file),
  };
}

export function getKnowledgeSelectionData(project) {
  const draft = getKnowledgeItemDraft(project);
  return {
    files: listFiles(project).map((file) => getKnowledgeFileOption(project, file)),
    items: flattenKnowledgeItems(draft),
    types: draft.types,
  };
}

export function buildCopilotKnowledgeAttachments({ fileIds = [], files = [], itemIds = [], items = [] }) {
  const selectedItems = itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => ({
      content: [
        item.title,
        item.summary,
        item.tags?.length ? `Tags: ${item.tags.join(', ')}` : '',
        item.sourceUrl ? `Source URL: ${item.sourceUrl}` : '',
      ].filter(Boolean).join('\n'),
      id: item.id,
      kind: 'knowledge_item',
      sourceUrl: item.sourceUrl || undefined,
      title: item.title,
    }));
  const selectedFiles = fileIds
    .map((id) => files.find((file) => file.id === id))
    .filter((file) => file?.hasUsableContent)
    .map((file) => ({
      content: file.content,
      id: file.id,
      kind: 'knowledge_file',
      sourceUrl: file.sourceUrls?.[0] || undefined,
      title: file.title,
    }));
  let totalCharacters = 0;

  return [...selectedItems, ...selectedFiles]
    .slice(0, copilotAttachmentLimits.maxAttachments)
    .map((attachment) => {
      const remaining = copilotAttachmentLimits.maxTotalCharacters - totalCharacters;
      const content = attachment.content.slice(
        0,
        Math.max(0, Math.min(copilotAttachmentLimits.maxCharactersPerAttachment, remaining)),
      );
      totalCharacters += content.length;
      return { ...attachment, content };
    })
    .filter((attachment) => attachment.content.trim());
}
