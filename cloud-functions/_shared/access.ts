function pickItems(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.conversations)) return value.conversations;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export async function canAccessConversation(store: any, conversationId: string, userId: string) {
  const result = await store.listConversations({ limit: 100, order: 'desc', userId });
  return pickItems(result).some((item) =>
    String(item?.id ?? item?.conversationId ?? item?.conversation_id ?? '') === conversationId,
  );
}
