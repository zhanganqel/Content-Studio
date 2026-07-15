// 私有日志模块不会映射为公开路由。
export function createLogger(tag: string) {
  return {
    log(...args: unknown[]) {
      console.log(`[${tag}][${new Date().toISOString()}]`, ...args);
    },
    error(...args: unknown[]) {
      console.error(`[${tag}][${new Date().toISOString()}]`, ...args);
    },
  };
}
