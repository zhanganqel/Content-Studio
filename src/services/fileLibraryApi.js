import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const storageVersion = 1;
const storagePrefix = 'content-studio-file-library';
const maxFileSize = 20 * 1024 * 1024;
const allowedExtensions = new Set(['docx', 'xlsx', 'xls', 'pdf', 'txt', 'md']);
const uploadedBlobStore = new Map();

export const fileProcessingStatuses = {
  pending: 'pending',
  processing: 'processing',
  chunked: 'chunked',
  failed: 'failed',
};

function getProjectId(projectOrId) {
  return typeof projectOrId === 'string' ? projectOrId : projectOrId?.id ?? 'default';
}

function getDemoFiles(projectOrId) {
  return typeof projectOrId === 'string' ? [] : projectOrId?.demoProject?.fileAssets ?? [];
}

function getStorageKey(projectId) {
  return `${storagePrefix}:v${storageVersion}:${projectId}`;
}

function readState(projectId) {
  if (typeof window === 'undefined') {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(projectId));
    if (!raw) return createEmptyState();
    return { ...createEmptyState(), ...JSON.parse(raw) };
  } catch {
    return createEmptyState();
  }
}

function writeState(projectId, state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(state));
}

function createEmptyState() {
  return {
    chunks: {},
    statuses: {},
    tagOverrides: {},
    uploadedFiles: [],
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function getExtension(fileName = '') {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return extension === fileName.toLowerCase() ? '' : extension;
}

function removeExtension(fileName = '') {
  return fileName.replace(/\.[^.]+$/, '');
}

function inferCategory(fileType) {
  if (fileType === 'docx') return 'word';
  if (fileType === 'xlsx' || fileType === 'xls') return 'excel';
  if (fileType === 'pdf') return 'pdf';
  return 'text';
}

function normalizeFile(file, projectId, state, source = 'demo') {
  const tags = state.tagOverrides[file.id] ?? file.tags ?? [];
  const storedStatus = state.statuses[file.id];
  const fallbackStatus =
    source === 'demo' ? fileProcessingStatuses.chunked : fileProcessingStatuses.pending;
  const sourceKind = file.sourceKind ?? source;

  return {
    ...file,
    canDelete: source === 'uploaded',
    category: file.category ?? inferCategory(file.fileType),
    fileName: file.fileName ?? `${file.title}.${file.fileType}`,
    processingStatus: storedStatus ?? file.processingStatus ?? fallbackStatus,
    projectId,
    size: file.size ?? null,
    source,
    sourceKind,
    tags,
  };
}

export function listFiles(projectOrId) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const demoFiles = getDemoFiles(projectOrId).map((file) => normalizeFile(file, projectId, state, 'demo'));
  const uploadedFiles = state.uploadedFiles
    .filter((file) => uploadedBlobStore.has(file.id))
    .map((file) => normalizeFile(file, projectId, state, 'uploaded'));

  return [...demoFiles, ...uploadedFiles];
}

export async function uploadFiles(projectOrId, files) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const uploaded = [];

  for (const file of Array.from(files ?? [])) {
    const extension = getExtension(file.name);
    if (!allowedExtensions.has(extension)) {
      throw Object.assign(new Error('Unsupported file type'), { code: 'unsupportedType', fileName: file.name });
    }

    if (file.size > maxFileSize) {
      throw Object.assign(new Error('File is too large'), { code: 'fileTooLarge', fileName: file.name });
    }

    const id = `upload-${Date.now()}-${slugify(removeExtension(file.name))}-${Math.random()
      .toString(16)
      .slice(2, 7)}`;
    const metadata = {
      id,
      title: removeExtension(file.name),
      fileName: file.name,
      fileType: extension,
      category: inferCategory(extension),
      tags: ['uploaded'],
      usage: 'Uploaded source file for AI retrieval testing and content generation.',
      sourceUrls: [],
      sourceKind: 'uploaded',
      localPath: 'Uploaded in browser session',
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    uploadedBlobStore.set(id, file);
    state.uploadedFiles.push(metadata);
    state.statuses[id] = fileProcessingStatuses.pending;
    uploaded.push(normalizeFile(metadata, projectId, state, 'uploaded'));
  }

  writeState(projectId, state);
  return uploaded;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function parseWebPage(projectOrId, url) {
  getProjectId(projectOrId);
  const normalizedUrl = String(url ?? '').trim();

  if (!isValidHttpUrl(normalizedUrl)) {
    throw Object.assign(new Error('Invalid URL'), { code: 'invalidUrl' });
  }

  throw Object.assign(new Error('Web page parser service is not configured'), {
    code: 'webParserNotConfigured',
  });
}

export function updateFileTags(projectOrId, fileId, tags) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  state.tagOverrides[fileId] = [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  writeState(projectId, state);
  return listFiles(projectOrId).find((file) => file.id === fileId) ?? null;
}

export function deleteUploadedFile(projectOrId, fileId) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const target = state.uploadedFiles.find((file) => file.id === fileId);
  if (!target) {
    throw Object.assign(new Error('Demo files cannot be deleted'), { code: 'demoFileProtected' });
  }

  state.uploadedFiles = state.uploadedFiles.filter((file) => file.id !== fileId);
  delete state.chunks[fileId];
  delete state.statuses[fileId];
  delete state.tagOverrides[fileId];
  uploadedBlobStore.delete(fileId);
  writeState(projectId, state);
}

export async function processFile(projectOrId, fileId, options = {}) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const previousChunks = state.chunks[fileId];
  const file = listFiles(projectOrId).find((item) => item.id === fileId);

  if (!file) {
    throw Object.assign(new Error('File not found'), { code: 'fileNotFound' });
  }

  state.statuses[fileId] = fileProcessingStatuses.processing;
  writeState(projectId, state);

  try {
    const text = await extractTextFromFile(file);
    const chunks = buildChunks(file, text);
    const latestState = readState(projectId);
    latestState.chunks[fileId] = chunks;
    latestState.statuses[fileId] = fileProcessingStatuses.chunked;
    writeState(projectId, latestState);
    return chunks;
  } catch (error) {
    const latestState = readState(projectId);
    if (!options.preserveOnFailure && !previousChunks?.length) {
      latestState.chunks[fileId] = createSeedChunks(file);
    }
    latestState.statuses[fileId] = fileProcessingStatuses.failed;
    writeState(projectId, latestState);
    throw error;
  }
}

export async function reprocessFile(projectOrId, fileId) {
  return processFile(projectOrId, fileId, { preserveOnFailure: true });
}

export function listChunks(projectOrId, fileId) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  if (state.chunks[fileId]?.length) {
    return state.chunks[fileId];
  }

  const file = listFiles(projectOrId).find((item) => item.id === fileId);
  return file ? createSeedChunks(file) : [];
}

export function saveChunk(projectOrId, fileId, chunkId, patch) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const currentChunks = state.chunks[fileId]?.length
    ? state.chunks[fileId]
    : listChunks(projectOrId, fileId);

  state.chunks[fileId] = currentChunks.map((chunk) =>
    chunk.id === chunkId
      ? {
          ...chunk,
          ...patch,
          updatedAt: new Date().toISOString(),
        }
      : chunk,
  );
  state.statuses[fileId] = fileProcessingStatuses.chunked;
  writeState(projectId, state);
  return state.chunks[fileId].find((chunk) => chunk.id === chunkId);
}

export function saveChunks(projectOrId, fileId, chunks) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  state.chunks[fileId] = chunks.map((chunk) => ({
    ...chunk,
    updatedAt: new Date().toISOString(),
  }));
  state.statuses[fileId] = fileProcessingStatuses.chunked;
  writeState(projectId, state);
  return state.chunks[fileId];
}

async function extractTextFromFile(file) {
  const blob = await loadBlob(file);
  const arrayBuffer = await blob.arrayBuffer();
  const fileType = file.fileType?.toLowerCase();

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (fileType === 'xlsx' || fileType === 'xls') {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return workbook.SheetNames.map((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        blankrows: false,
        defval: '',
        header: 1,
        raw: false,
      });
      const body = rows
        .map((row) => row.map((cell) => String(cell).trim()).filter(Boolean).join('\t'))
        .filter(Boolean)
        .join('\n');
      return [`Sheet: ${sheetName}`, body].filter(Boolean).join('\n');
    }).join('\n\n');
  }

  if (fileType === 'pdf') {
    const document = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageTexts = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(' ');
      pageTexts.push(`Page ${pageNumber}\n${text}`);
    }
    return pageTexts.join('\n\n');
  }

  return new TextDecoder('utf-8').decode(arrayBuffer);
}

async function loadBlob(file) {
  if (file.source === 'uploaded') {
    const uploadedFile = uploadedBlobStore.get(file.id);
    if (!uploadedFile) {
      throw Object.assign(new Error('Uploaded file is not available in this browser session'), {
        code: 'uploadedFileUnavailable',
      });
    }
    return uploadedFile;
  }

  if (!file.url) {
    throw Object.assign(new Error('File URL is missing'), { code: 'fileUrlMissing' });
  }

  const response = await fetch(file.url);
  if (!response.ok) {
    throw Object.assign(new Error('Failed to load source file'), { code: 'fileLoadFailed' });
  }
  return await response.blob();
}

function buildChunks(file, text) {
  const normalizedText = String(text ?? '').replace(/\r/g, '').trim();
  if (!normalizedText) {
    return createSeedChunks(file);
  }

  const paragraphs = normalizedText.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  let buffer = '';
  const maxLength = 900;

  for (const paragraph of paragraphs.length ? paragraphs : [normalizedText]) {
    if ((buffer + '\n\n' + paragraph).trim().length > maxLength && buffer) {
      chunks.push(buffer.trim());
      buffer = paragraph;
    } else {
      buffer = [buffer, paragraph].filter(Boolean).join('\n\n');
    }
  }

  if (buffer.trim()) chunks.push(buffer.trim());

  return chunks.map((chunkText, index) => createChunk(file, chunkText, index));
}

function createSeedChunks(file) {
  const sourceUrls = (file.sourceUrls ?? []).join('\n');
  const seedText = [
    `${file.title}`,
    file.usage,
    file.tags?.length ? `Tags: ${file.tags.join(', ')}` : '',
    sourceUrls ? `Source URLs:\n${sourceUrls}` : '',
    'This fallback chunk is available for demo browsing before the original source file is parsed in the browser.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return [createChunk(file, seedText, 0)];
}

function createChunk(file, text, index) {
  const safeText = text.trim();
  return {
    id: `${file.id}-chunk-${index + 1}`,
    fileId: file.id,
    index: index + 1,
    title: `${file.title} - Chunk ${index + 1}`,
    originalText: safeText,
    editedText: safeText,
    tags: [...new Set([...(file.tags ?? []), file.category].filter(Boolean))],
    sourceLocator: `${file.fileName ?? file.title} / Chunk ${index + 1}`,
    charCount: safeText.length,
    updatedAt: new Date().toISOString(),
  };
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
