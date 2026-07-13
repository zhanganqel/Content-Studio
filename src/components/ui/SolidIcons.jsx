export function SolidDashboardIcon({ className = '' }) {
  return (
    /* 仪表盘图标用于返回主工作台入口。 */
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="currentColor" height="8" rx="2" width="8" x="3" y="3" />
      <rect fill="currentColor" height="5" rx="1.5" width="8" x="13" y="3" />
      <rect fill="currentColor" height="11" rx="2" width="8" x="13" y="10" />
      <rect fill="currentColor" height="8" rx="2" width="8" x="3" y="13" />
    </svg>
  );
}

export function SolidSparklesIcon({ className = '' }) {
  return (
    /* 闪光图标用于 AI 和 Copilot 相关入口。 */
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.15 2.78a.9.9 0 0 1 1.7 0l1.45 4.3a3.3 3.3 0 0 0 2.08 2.08l4.3 1.45a.9.9 0 0 1 0 1.7l-4.3 1.45a3.3 3.3 0 0 0-2.08 2.08l-1.45 4.3a.9.9 0 0 1-1.7 0l-1.45-4.3a3.3 3.3 0 0 0-2.08-2.08l-4.3-1.45a.9.9 0 0 1 0-1.7l4.3-1.45A3.3 3.3 0 0 0 9.7 7.08l1.45-4.3Z"
        fill="currentColor"
      />
      <path
        d="M4.45 2.5a.62.62 0 0 1 1.1 0l.43 1.05c.2.5.59.89 1.08 1.09l1.06.43a.62.62 0 0 1 0 1.1l-1.06.43c-.49.2-.88.59-1.08 1.08l-.43 1.06a.62.62 0 0 1-1.1 0l-.43-1.06A1.92 1.92 0 0 0 2.94 6.6l-1.06-.43a.62.62 0 0 1 0-1.1l1.06-.43c.49-.2.88-.59 1.08-1.09l.43-1.05Z"
        fill="currentColor"
      />
      <path
        d="M18.55 16.2a.62.62 0 0 1 1.1 0l.34.84c.15.36.43.65.8.8l.83.34a.62.62 0 0 1 0 1.1l-.84.34c-.36.15-.64.43-.79.8l-.34.83a.62.62 0 0 1-1.1 0l-.34-.84a1.4 1.4 0 0 0-.8-.79l-.83-.34a.62.62 0 0 1 0-1.1l.84-.34c.36-.15.64-.44.79-.8l.34-.84Z"
        fill="currentColor"
      />
    </svg>
  );
}
