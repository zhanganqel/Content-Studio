// 固定页面布局用于顶部控制区不滚动、主体区域独立滚动的管理页。
export default function FixedPageLayout({
  bodyClassName = '',
  children,
  className = '',
  controls,
  header,
  scrollRef,
}) {
  // 外层控制整体高度，body 区域单独承担滚动，避免页面双滚动条。
  const classes = [
    'mx-auto flex h-full min-h-0 max-w-[1600px] flex-col',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClasses = [
    'min-h-0 flex-1 overflow-y-auto pr-1',
    bodyClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="flex-none space-y-7 pb-7">
        {header}
        {controls}
      </div>
      <div ref={scrollRef} className={bodyClasses}>
        {children}
      </div>
    </div>
  );
}
