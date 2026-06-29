import { AlertCircle, Check, Info, X } from 'lucide-react';

const toastTypeStyles = {
  success: {
    border: 'border-emerald-200',
    background: 'bg-emerald-50',
    text: 'text-emerald-600',
    iconBackground: 'bg-emerald-500',
    Icon: Check,
  },
  info: {
    border: 'border-blue-200',
    background: 'bg-blue-50',
    text: 'text-blue-600',
    iconBackground: 'bg-blue-500',
    Icon: Info,
  },
  warning: {
    border: 'border-orange-200',
    background: 'bg-orange-50',
    text: 'text-orange-500',
    iconBackground: 'bg-orange-500',
    Icon: AlertCircle,
  },
  error: {
    border: 'border-red-200',
    background: 'bg-red-50',
    text: 'text-red-500',
    iconBackground: 'bg-red-500',
    Icon: X,
  },
};

export default function Toast({ message, testId = 'toast', type = 'info' }) {
  const styles = toastTypeStyles[type] ?? toastTypeStyles.info;
  const Icon = styles.Icon;

  return (
    <div className="pointer-events-none fixed left-[300px] right-0 top-24 z-50 flex justify-center">
      <div
        data-testid={testId}
        className={`pointer-events-auto flex min-h-[52px] w-1/4 min-w-[280px] max-w-[420px] items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${styles.border} ${styles.background} ${styles.text}`}
        role="status"
      >
        <span
          className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-white ${styles.iconBackground}`}
        >
          <Icon className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="min-w-0 break-words text-base font-semibold leading-6 tracking-normal">
          {message}
        </span>
      </div>
    </div>
  );
}
