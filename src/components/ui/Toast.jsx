import { AlertCircle, Check, Info, RefreshCw, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const toastTypeStyles = {
  success: {
    background: 'bg-emerald-50',
    text: 'text-emerald-600',
    iconBackground: 'bg-emerald-500',
    Icon: Check,
  },
  info: {
    background: 'bg-blue-50',
    text: 'text-blue-600',
    iconBackground: 'bg-blue-500',
    Icon: Info,
  },
  warning: {
    background: 'bg-orange-50',
    text: 'text-orange-500',
    iconBackground: 'bg-orange-500',
    Icon: AlertCircle,
  },
  error: {
    background: 'bg-red-50',
    text: 'text-red-500',
    iconBackground: 'bg-red-500',
    Icon: X,
  },
};

// Toast 通过 portal 挂载到 body，避免被页面滚动容器裁剪。
export default function Toast({
  actionLabel,
  actions = [],
  message,
  onAction,
  onClose,
  testId = 'toast',
  type = 'info',
}) {
  const styles = toastTypeStyles[type] ?? toastTypeStyles.info;
  const Icon = styles.Icon;
  const hasAction = Boolean(actionLabel && onAction);
  const actionItems = actions.length
    ? actions
    : hasAction
      ? [{ icon: RefreshCw, label: actionLabel, onClick: onAction }]
      : [];
  const canClose = Boolean(onClose);

  if (typeof document === 'undefined') {
    return null;
  }

  // 根据是否传入操作和关闭回调，决定展示操作按钮和关闭按钮。
  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-24 z-50 flex -translate-x-1/2 justify-center">
      <div
        data-testid={testId}
        className={`pointer-events-auto inline-flex min-h-10 w-fit max-w-[calc(100vw-48px)] items-center gap-3 rounded-xl px-6 py-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${styles.background} ${styles.text}`}
        role="status"
      >
        <span
          className={`inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${styles.iconBackground}`}
        >
          <Icon className="h-3 w-3" strokeWidth={3} />
        </span>
        <span className="line-clamp-2 min-w-0 max-w-[640px] flex-1 whitespace-normal break-words text-base font-semibold leading-6 tracking-normal">
          {message}
        </span>
        {actionItems.length ? (
          <div className="ml-2 flex flex-none items-center gap-3">
            {actionItems.map((action) => {
              const ActionIcon = action.icon;
              const toneClass =
                action.tone === 'danger'
                  ? 'text-red-500 hover:text-red-600'
                  : action.tone === 'neutral'
                    ? 'text-[#606266] hover:text-[#303133]'
                    : 'text-[#365EFF] hover:text-[#2547D0]';

              return (
                <button
                  key={action.label}
                  type="button"
                  className={`inline-flex h-7 flex-none items-center gap-1.5 whitespace-nowrap px-0 text-sm font-semibold transition ${toneClass}`}
                  onClick={action.onClick}
                >
                  {ActionIcon ? <ActionIcon className="h-3.5 w-3.5 flex-none" /> : null}
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
        {canClose ? (
          <button
            type="button"
            className="ml-1 inline-flex h-7 w-7 flex-none items-center justify-center text-current opacity-75 transition hover:opacity-100"
            onClick={onClose}
            aria-label="关闭提示"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
