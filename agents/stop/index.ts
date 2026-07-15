/**
 * 中止指定会话的活动 Agent 运行。
 * 停止请求只通过请求体传递 conversation_id，不能携带会话绑定请求头。
 */

import { createLogger } from '../_logger';

const logger = createLogger('stop');

export async function onRequest(context: any) {
  const { request } = context;
  const conversationId = request?.body?.conversation_id as string | undefined;

  logger.log('conversationId:', conversationId);

  if (!conversationId) {
    logger.error('Missing conversation_id');
    return new Response('Missing conversation_id', { status: 400 });
  }

  const ret = context.utils.abortActiveRun(conversationId);

  logger.log('abortActiveRun result:', ret);

  const data = {
    status: ret?.aborted ? 'aborting' : 'idle',
    conversationId,
    ...ret,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });
}
