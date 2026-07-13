import { useEffect, useId, useRef } from 'react';
import Button from './Button.jsx';

// 通用确认弹窗承载删除、退出和多分支决策，业务副作用只在用户选择操作后执行。
export default function ConfirmDialog({
  actions = [],
  cancelLabel,
  confirmLabel,
  danger = false,
  message,
  onCancel,
  onConfirm,
  testId,
  title,
}) {
  const cancelButtonRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const actionItems = actions.length
    ? actions
    : [
        { label: cancelLabel, onClick: onCancel, variant: 'neutral' },
        { label: confirmLabel, onClick: onConfirm, variant: danger ? 'danger' : 'primary' },
      ];

  useEffect(() => {
    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 px-4"
      data-testid={testId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-bold text-slate-900">{title}</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          {actionItems.map((action, index) => (
            <Button
              key={action.key ?? action.label}
              ref={index === 0 ? cancelButtonRef : undefined}
              variant={action.variant ?? 'neutral'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
