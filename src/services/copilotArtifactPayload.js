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
