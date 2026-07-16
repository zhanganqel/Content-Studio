import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  createToastState,
  dismissAllToasts,
  dismissToast,
  dismissToastScope,
  enqueueToast,
  findToast,
} from './toastState.js';

const ToastContext = createContext(null);

const toastStyles = {
  error: {
    background: 'bg-[#FFF1F1]',
    icon: CircleX,
    text: 'text-[#FF4346]',
  },
  info: {
    background: 'bg-[#F4F4F5]',
    icon: Info,
    text: 'text-[#606266]',
  },
  loading: {
    background: 'bg-[#EEF3FF]',
    icon: Loader2,
    text: 'text-[#365EFF]',
  },
  success: {
    background: 'bg-[#F0FAF5]',
    icon: CircleCheck,
    text: 'text-[#00A85F]',
  },
  warning: {
    background: 'bg-[#FFF8E6]',
    icon: CircleAlert,
    text: 'text-[#C98600]',
  },
};

function normalizeToast(input, existing, nextVersion) {
  const duration = input.duration ?? existing?.duration ?? (input.type === 'loading' ? 0 : 3000);

  return {
    ...existing,
    ...input,
    actions: input.actions ?? existing?.actions ?? [],
    duration,
    showClose: input.showClose ?? existing?.showClose ?? duration === 0,
    type: input.type ?? existing?.type ?? 'info',
    version: nextVersion,
  };
}

function ToastItem({ onAction, onDismiss, toast }) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef(0);
  const styles = toastStyles[toast.type] ?? toastStyles.info;
  const Icon = styles.icon;
  const isAlert = toast.type === 'error' || toast.type === 'warning';

  useEffect(() => {
    remainingRef.current = toast.duration;
    startedAtRef.current = 0;
    setPaused(false);
  }, [toast.id, toast.version, toast.duration]);

  useEffect(() => {
    if (!toast.duration || paused) return undefined;

    startedAtRef.current = performance.now();
    const timer = window.setTimeout(() => onDismiss(toast.id, 'timeout'), remainingRef.current);

    return () => {
      window.clearTimeout(timer);
      if (startedAtRef.current) {
        remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAtRef.current));
      }
      startedAtRef.current = 0;
    };
  }, [onDismiss, paused, toast.duration, toast.id, toast.version]);

  function pauseTimer() {
    setPaused(true);
  }

  function resumeTimer() {
    setPaused(false);
  }

  return (
    <div
      aria-atomic="true"
      aria-live={isAlert ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex w-fit max-w-[min(640px,calc(100vw-32px))] flex-wrap items-center gap-x-2 gap-y-2 rounded-md px-3 py-2.5 shadow-[0_4px_12px_rgba(44,42,74,0.05)] ${styles.background} ${styles.text}`}
      data-testid={toast.testId ?? 'toast'}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) resumeTimer();
      }}
      onFocusCapture={pauseTimer}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role={isAlert ? 'alert' : 'status'}
    >
      <Icon className={`h-4 w-4 flex-none ${toast.type === 'loading' ? 'animate-spin' : ''}`} strokeWidth={2.2} />
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm font-normal leading-5 tracking-normal">
        {toast.message}
      </span>
      {toast.actions.length ? (
        <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1">
          {toast.actions.map((action) => {
            const toneClass =
              action.tone === 'danger'
                ? 'text-[#FF4346] hover:text-[#EA453A]'
                : action.tone === 'neutral'
                  ? 'text-[#606266] hover:text-[#303133]'
                  : 'text-[#365EFF] hover:text-[#2547D0]';

            return (
              <button
                key={action.id ?? action.label}
                type="button"
                className={`inline-flex min-h-5 items-center whitespace-nowrap text-sm font-semibold leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#365EFF] focus-visible:ring-offset-1 ${toneClass}`}
                onClick={() => onAction(toast, action)}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {toast.showClose ? (
        <button
          type="button"
          className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-sm opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          onClick={() => onDismiss(toast.id, 'close')}
          aria-label={toast.closeLabel ?? '关闭提示'}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

function ToastViewport({ onAction, onDismiss, toasts }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-24 z-[110] flex w-fit max-w-full -translate-x-1/2 flex-col items-center gap-3 px-4">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          [data-toast-enter] { animation: contentStudioToastEnter 160ms ease-out both; }
        }
        @keyframes contentStudioToastEnter {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {toasts.map((toast) => (
        <div key={toast.id} data-toast-enter>
          <ToastItem onAction={onAction} onDismiss={onDismiss} toast={toast} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState(createToastState);
  const stateRef = useRef(toastState);
  const idRef = useRef(0);
  const versionRef = useRef(0);

  const commit = useCallback((transform) => {
    setToastState((current) => {
      const next = transform(current);
      stateRef.current = next;
      return next;
    });
  }, []);

  const dismiss = useCallback(
    (id, reason = 'programmatic') => {
      const toast = findToast(stateRef.current, id);
      if (!toast) return false;

      commit((current) => dismissToast(current, id));
      toast.onClose?.(reason);
      return true;
    },
    [commit],
  );

  const show = useCallback(
    (input) => {
      const id = input.id ?? `toast-${Date.now()}-${++idRef.current}`;
      const version = ++versionRef.current;

      commit((current) => {
        const existing = findToast(current, id);
        return enqueueToast(current, normalizeToast({ ...input, id }, existing, version));
      });

      return id;
    },
    [commit],
  );

  const update = useCallback(
    (id, patch) => {
      const existing = findToast(stateRef.current, id);
      if (!existing) return false;

      show({ ...existing, ...patch, id });
      return true;
    },
    [show],
  );

  const dismissScope = useCallback(
    (scope) => {
      if (!scope) return;
      commit((current) => dismissToastScope(current, scope));
    },
    [commit],
  );

  const dismissAll = useCallback(() => {
    commit(() => dismissAllToasts());
  }, [commit]);

  const handleAction = useCallback(
    (toast, action) => {
      try {
        action.onClick?.();
      } finally {
        if (action.closeOnClick !== false) dismiss(toast.id, 'action');
      }
    },
    [dismiss],
  );

  const api = useMemo(() => {
    const showWithType = (type) => (message, options = {}) => show({ ...options, message, type });

    return {
      dismiss,
      dismissAll,
      dismissScope,
      error: showWithType('error'),
      info: showWithType('info'),
      loading: showWithType('loading'),
      show,
      success: showWithType('success'),
      update,
      warning: showWithType('warning'),
    };
  }, [dismiss, dismissAll, dismissScope, show, update]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport onAction={handleAction} onDismiss={dismiss} toasts={toastState.visible} />
    </ToastContext.Provider>
  );
}

export function useToast({ scope: providedScope } = {}) {
  const api = useContext(ToastContext);
  const generatedScope = useId();
  const scopeRef = useRef(providedScope ?? `toast-scope-${generatedScope}`);

  if (!api) {
    throw new Error('useToast must be used within ToastProvider.');
  }

  useEffect(() => () => api.dismissScope(scopeRef.current), [api]);

  return useMemo(() => {
    const withScope = (method) => (message, options = {}) => method(message, { ...options, scope: options.scope ?? scopeRef.current });

    return {
      ...api,
      error: withScope(api.error),
      info: withScope(api.info),
      loading: withScope(api.loading),
      show: (options) => api.show({ ...options, scope: options.scope ?? scopeRef.current }),
      success: withScope(api.success),
      update: api.update,
      warning: withScope(api.warning),
    };
  }, [api]);
}

export default ToastProvider;
