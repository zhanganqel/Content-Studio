const sizeClasses = {
  xs: {
    button: 'h-[32px] w-[32px] rounded-md',
    icon: 'h-4 w-4',
  },
  sm: {
    button: 'h-9 w-9 rounded-lg',
    icon: 'h-4 w-4',
  },
  md: {
    button: 'h-11 w-11 rounded-xl',
    icon: 'h-5 w-5',
  },
};

const variantClasses = {
  outline: {
    neutral:
      'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:ring-blue-500',
    active:
      'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 focus-visible:ring-blue-500',
  },
  ghost: {
    neutral:
      'border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-blue-500',
    active:
      'border-transparent bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus-visible:ring-blue-500',
  },
};

// 方形图标按钮用于工具栏和卡片操作，固定尺寸避免 hover 时布局跳动。
export default function SquareIconButton({
  active = false,
  children,
  className = '',
  icon: Icon,
  size = 'md',
  type = 'button',
  variant = 'outline',
  ...props
}) {
  // 组合尺寸和视觉变体，aria-label 由调用方提供。
  const selectedSize = sizeClasses[size] ?? sizeClasses.md;
  const selectedVariant = variantClasses[variant] ?? variantClasses.outline;
  const classes = [
    'inline-grid flex-none place-items-center border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    selectedSize.button,
    active ? selectedVariant.active : selectedVariant.neutral,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} {...props}>
      {Icon ? <Icon aria-hidden="true" className={selectedSize.icon} /> : children}
    </button>
  );
}
