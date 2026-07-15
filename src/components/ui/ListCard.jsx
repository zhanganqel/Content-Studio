const cardPaddingClasses = {
  comfortable: 'px-7 py-6',
  default: 'px-7 py-5',
};

const actionToneClasses = {
  danger: 'text-red-500 hover:text-red-400',
  default: 'text-blue-600 hover:text-blue-500',
};

const leadingToneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-500',
  violet: 'bg-indigo-50 text-indigo-600',
};

// meta 项为空时不渲染，避免列表卡片出现无意义占位。
function hasMetaValue(item) {
  if (!item || item.hidden) return false;
  if (item.children) return true;
  if (Array.isArray(item.value)) return item.value.length > 0;
  return item.value !== undefined && item.value !== null && item.value !== '';
}

// 卡片操作只负责展示和触发，权限、禁用和文案由页面层决定。
function ListCardAction({ action }) {
  if (!action || action.hidden) {
    return null;
  }

  const Icon = action.icon;
  const classes = [
    'inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    actionToneClasses[action.tone] ?? actionToneClasses.default,
    action.className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={action.disabled}
      onClick={action.onClick}
      aria-label={action.ariaLabel}
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 flex-none" /> : null}
      {action.label}
    </button>
  );
}

// meta 支持纯文本、数组和自定义 children，统一处理截断和图标。
function ListCardMetaItem({ item }) {
  if (!hasMetaValue(item)) {
    return null;
  }

  const Icon = item.icon;
  const value = Array.isArray(item.value) ? item.value.join(' / ') : item.value;

  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 flex-none" /> : null}
      <span className="min-w-0 truncate">
        {item.children ?? (
          <>
            {item.label ? <span>{item.label}: </span> : null}
            <span>{value}</span>
          </>
        )}
      </span>
    </span>
  );
}

// 通用列表卡片承载标题、状态、元信息、标签、操作和扩展内容。
export default function ListCard({
  actions = [],
  children,
  className = '',
  leadingIcon,
  leadingTone = 'blue',
  metaItems = [],
  padding = 'default',
  statusTag,
  tags = [],
  title,
  titleAriaLabel,
  onTitleClick,
}) {
  // 先过滤不可见数据，再计算布局，保证空区块不会占用空间。
  const visibleMetaItems = metaItems.filter(hasMetaValue);
  const visibleActions = actions.filter((action) => action && !action.hidden);
  const visibleTags = tags.filter(Boolean);

  const cardClasses = [
    'rounded-lg border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]',
    cardPaddingClasses[padding] ?? cardPaddingClasses.default,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const titleClasses = [
    'min-w-0 truncate text-left text-xl font-bold tracking-normal text-slate-800',
    onTitleClick ? 'transition hover:text-blue-600' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 有点击行为时使用按钮，否则使用标题标签保留语义。
  const titleNode = onTitleClick ? (
    <button
      type="button"
      className={titleClasses}
      onClick={onTitleClick}
      aria-label={titleAriaLabel}
    >
      {title}
    </button>
  ) : (
    <h3 className={titleClasses}>{title}</h3>
  );

  return (
    <article className={cardClasses}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className={leadingIcon ? 'flex items-start gap-3' : ''}>
            {leadingIcon ? (
              <span
                className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                  leadingToneClasses[leadingTone] ?? leadingToneClasses.blue
                }`}
              >
                {leadingIcon}
              </span>
            ) : null}

            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                {titleNode}
                {statusTag}
              </div>

              {visibleMetaItems.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-medium text-slate-500">
                  {visibleMetaItems.map((item) => (
                    <ListCardMetaItem key={item.key ?? `${item.label}-${item.value}`} item={item} />
                  ))}
                </div>
              ) : null}

              {visibleTags.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">{visibleTags}</div>
              ) : null}

              {children ? <div className="mt-4">{children}</div> : null}
            </div>
          </div>
        </div>

        {visibleActions.length ? (
          <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2 lg:justify-end">
            {visibleActions.map((action) => (
              <ListCardAction key={action.key ?? action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
