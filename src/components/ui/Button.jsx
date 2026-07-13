import { forwardRef } from 'react';

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500',
  secondary:
    'border border-blue-600 bg-white text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
  neutral:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
};

// 通用按钮只封装视觉变体和可选图标，具体业务动作由调用方传入。
const Button = forwardRef(function Button({
  children,
  className = '',
  icon: Icon,
  type = 'button',
  variant = 'primary',
  ...props
}, ref) {
  // 允许调用方追加 className，但基础尺寸、焦点态和禁用态保持一致。
  const classes = [
    'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant] ?? variantClasses.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} type={type} {...props}>
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 flex-none" /> : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
