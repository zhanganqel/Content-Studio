import { AlertCircle, Check, Info, X } from 'lucide-react';
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

export default function Toast({ message, testId = 'toast', type = 'info' }) {
  const styles = toastTypeStyles[type] ?? toastTypeStyles.info;
  const Icon = styles.Icon;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-24 z-50 flex -translate-x-1/2 justify-center">
      <div
        data-testid={testId}
        className={`pointer-events-auto flex min-h-10 w-[25vw] min-w-[280px] max-w-[420px] items-center gap-2.5 rounded-xl px-5 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${styles.background} ${styles.text}`}
        role="status"
      >
        <span
          className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-white ${styles.iconBackground}`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="min-w-0 break-words text-base font-semibold leading-6 tracking-normal">
          {message}
        </span>
      </div>
    </div>,
    document.body,
  );
}
