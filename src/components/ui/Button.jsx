const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500',
  secondary:
    'border border-blue-600 bg-white text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
  neutral:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
};

export default function Button({
  children,
  className = '',
  icon: Icon,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = [
    'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant] ?? variantClasses.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} {...props}>
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 flex-none" /> : null}
      {children}
    </button>
  );
}
