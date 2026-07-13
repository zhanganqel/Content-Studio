// 页面头部统一标题、说明和右侧操作区的间距。
export default function PageHeader({ actions, className = '', description, title }) {
  const classes = [
    'flex flex-col gap-5 rounded-lg bg-slate-50 px-7 py-6 xl:flex-row xl:items-start xl:justify-between',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-normal text-slate-800">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-none flex-wrap items-start gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
