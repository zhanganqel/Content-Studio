// 只截取修订目标需要的产物字段，避免把完整会话状态传给后端。
export function createTargetArtifactSnapshot(artifact) {
  if (!artifact) return undefined;

  return {
    content: artifact.content ?? '',
    id: artifact.id,
    parentArtifactId: artifact.parentArtifactId ?? '',
    sourceIds: artifact.sourceIds ?? [],
    summary: artifact.summary ?? '',
    title: artifact.title ?? 'Untitled artifact',
    type: artifact.type ?? 'reply',
  };
}
