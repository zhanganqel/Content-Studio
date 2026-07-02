const storageVersion = 1;
const storagePrefix = 'content-studio-media-library';
const maxMediaFileSize = 100 * 1024 * 1024;
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);
const videoExtensions = new Set(['mp4', 'webm', 'mov']);
const uploadedMediaBlobStore = new Map();

function getProjectId(projectOrId) {
  return typeof projectOrId === 'string' ? projectOrId : projectOrId?.id ?? 'default';
}

function getDemoMedia(projectOrId) {
  return typeof projectOrId === 'string' ? [] : projectOrId?.demoProject?.mediaAssets ?? [];
}

function getStorageKey(projectId) {
  return `${storagePrefix}:v${storageVersion}:${projectId}`;
}

function createEmptyState() {
  return {
    tagOverrides: {},
    uploadedAssets: [],
  };
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

function getAssetType(fileType) {
  return videoExtensions.has(fileType) ? 'video' : 'image';
}

function normalizeMediaAsset(asset, projectId, state, source = 'demo') {
  const tags = state.tagOverrides[asset.id] ?? asset.tags ?? [];
  const uploadedBlob = source === 'uploaded' ? uploadedMediaBlobStore.get(asset.id) : null;

  return {
    ...asset,
    assetType: asset.assetType ?? getAssetType(asset.fileType ?? ''),
    canDelete: source === 'uploaded',
    imageUrl: uploadedBlob ? uploadedBlob.url : asset.imageUrl,
    projectId,
    source,
    sourceKind: asset.sourceKind ?? source,
    tags,
  };
}

export function listMediaAssets(projectOrId) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const demoAssets = getDemoMedia(projectOrId).map((asset) =>
    normalizeMediaAsset({ ...asset, sourceKind: asset.sourceKind ?? 'demo' }, projectId, state, 'demo'),
  );
  const uploadedAssets = state.uploadedAssets
    .filter((asset) => uploadedMediaBlobStore.has(asset.id))
    .map((asset) => normalizeMediaAsset(asset, projectId, state, 'uploaded'));

  return [...demoAssets, ...uploadedAssets];
}

export async function uploadMediaFiles(projectOrId, files) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const uploaded = [];

  for (const file of Array.from(files ?? [])) {
    const extension = getExtension(file.name);
    if (!imageExtensions.has(extension) && !videoExtensions.has(extension)) {
      throw Object.assign(new Error('Unsupported media type'), {
        code: 'unsupportedType',
        fileName: file.name,
      });
    }

    if (file.size > maxMediaFileSize) {
      throw Object.assign(new Error('Media file is too large'), {
        code: 'mediaFileTooLarge',
        fileName: file.name,
      });
    }

    const id = `media-upload-${Date.now()}-${slugify(removeExtension(file.name))}-${Math.random()
      .toString(16)
      .slice(2, 7)}`;
    const objectUrl = URL.createObjectURL(file);
    const fileType = extension;
    const metadata = {
      id,
      title: removeExtension(file.name),
      category: 'uploaded',
      tags: ['uploaded'],
      usage: 'Uploaded media file for reusable content generation assets.',
      sourceKind: 'uploaded',
      sourcePageUrl: '',
      originalImageUrl: '',
      localPath: 'Uploaded in browser session',
      fileName: file.name,
      fileType,
      assetType: getAssetType(fileType),
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    uploadedMediaBlobStore.set(id, { file, url: objectUrl });
    state.uploadedAssets.push(metadata);
    uploaded.push(normalizeMediaAsset(metadata, projectId, state, 'uploaded'));
  }

  writeState(projectId, state);
  return uploaded;
}

export function updateMediaAssetTags(projectOrId, assetId, tags) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  state.tagOverrides[assetId] = [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  writeState(projectId, state);
  return listMediaAssets(projectOrId).find((asset) => asset.id === assetId) ?? null;
}

export function deleteUploadedMediaAsset(projectOrId, assetId) {
  const projectId = getProjectId(projectOrId);
  const state = readState(projectId);
  const target = state.uploadedAssets.find((asset) => asset.id === assetId);
  if (!target) {
    throw Object.assign(new Error('Demo media cannot be deleted'), { code: 'demoMediaProtected' });
  }

  const uploadedBlob = uploadedMediaBlobStore.get(assetId);
  if (uploadedBlob?.url) {
    URL.revokeObjectURL(uploadedBlob.url);
  }

  state.uploadedAssets = state.uploadedAssets.filter((asset) => asset.id !== assetId);
  delete state.tagOverrides[assetId];
  uploadedMediaBlobStore.delete(assetId);
  writeState(projectId, state);
}
