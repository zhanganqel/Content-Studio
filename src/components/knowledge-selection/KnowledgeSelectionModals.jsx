import {
  Box,
  Check,
  ChevronDown,
  FileText,
  HelpCircle,
  Layers3,
  Lightbulb,
  Search,
  Table2,
  Trash2,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const typeCopy = {
  products: ['主营产品.xlsx', '公司主营售卖的实物型产品'],
  services: ['主要服务.xlsx', '记录公司提供的服务型产品'],
  solutions: ['解决方案.xlsx', '记录公司可提供的解决方案'],
  cases: ['公司案例.xlsx', '记录客户公司的真实案例'],
  faqs: ['FAQ.xlsx', '记录客户公司的常见问答对'],
};
const typeIcons = { product: Box, service: Wrench, solution: Lightbulb, case: Trophy, faq: HelpCircle, custom: Table2 };
const toneClasses = {
  blue: 'border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]', green: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]',
  violet: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]', orange: 'border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]',
  sky: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7]', slate: 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]',
};
const statusClasses = {
  chunked: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]', failed: 'border-[#FFD0D1] bg-[#FFF1F0] text-[#F56C6C]',
  pending: 'border-[#E4E7ED] bg-[#F7F8FB] text-[#909399]', processing: 'border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]',
};
const fileStyles = {
  docx: ['border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]', FileText], pdf: ['border-[#FFD0D1] bg-[#FFF1F0] text-[#F56C6C]', FileText],
  xls: ['border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]', Table2], xlsx: ['border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]', Table2],
  md: ['border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]', FileText], txt: ['border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]', FileText],
};

export function createKnowledgeSelectionLabels(locale, overrides = {}) {
  const english = locale === 'en-US';
  return {
    allTypes: english ? 'All Types' : '全部类型',
    cancel: english ? 'Cancel' : '取消',
    confirm: english ? 'Confirm' : '确定',
    custom: english ? 'Custom' : '自定义',
    fileList: english ? 'File List' : '资料库文件',
    fileType: english ? 'File Type' : '文件类型',
    fileUnavailable: english ? 'No parsed content is available' : '该文件暂无可用内容',
    itemList: english ? 'Item List' : '条目列表',
    knowledgeFiles: english ? 'Select Knowledge Files' : '选择知识资料',
    knowledgeItems: english ? 'Select Knowledge Items' : '选择知识条目',
    noFilesSelected: english ? 'No knowledge files selected' : '暂未选择知识资料',
    noItemsSelected: english ? 'No knowledge items selected' : '暂未选择知识条目',
    presets: english ? 'Presets' : '系统预设',
    searchFiles: english ? 'Search files' : '搜索资料库文件',
    searchKnowledgeTypes: english ? 'Search knowledge types' : '搜索知识类型',
    selectedFiles: english ? 'Selected Files' : '已选知识库文件',
    selectedItems: english ? 'Selected Items' : '已选知识条目',
    ...overrides,
  };
}

function ModalShell({ children, onClose, title, widthClass }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6" role="presentation">
      <div aria-modal="true" className={`max-h-[calc(100vh-80px)] w-full overflow-hidden rounded-[8px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${widthClass}`} role="dialog">
        <div className="flex h-[64px] items-center justify-between px-8">
          <h3 className="text-[18px] font-bold leading-[26px] text-[#303133]">{title}</h3>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#606266] transition hover:bg-[#F5F7FA]" onClick={onClose} aria-label="关闭弹窗">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ labels, onCancel, onConfirm }) {
  return (
    <div className="flex h-[64px] items-center justify-end gap-3 border-t border-[#EBEEF5] px-8">
      <button type="button" className="h-8 rounded-[6px] border border-[#365EFF] bg-white px-4 text-[14px] font-medium text-[#365EFF] hover:bg-[#F4F6FF]" onClick={onCancel}>{labels.cancel}</button>
      <button type="button" className="h-8 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-medium text-white hover:bg-[#2448E8]" onClick={onConfirm}>{labels.confirm}</button>
    </div>
  );
}

function SelectedList({ emptyText, items, onRemove }) {
  if (!items.length) return <div className="rounded-[6px] border border-dashed border-[#DCDFE6] py-8 text-center text-[13px] text-[#909399]">{emptyText}</div>;
  return (
    <div className="min-w-0 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 455 }}>
      {items.map((item) => (
        <div key={item.id} className="flex min-w-0 items-start justify-between gap-3 overflow-hidden rounded-[6px] border border-[#E7EAF0] bg-[#FAFBFC] px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium leading-[22px] text-[#303133]">{item.title}</div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-[#909399]">{item.summary || item.usage}</p>
          </div>
          <button type="button" className="mt-0.5 text-[#909399] hover:text-[#FF4346]" onClick={() => onRemove(item.id)} aria-label={`移除 ${item.title}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function useDraftSelection(selectedIds, maxSelected) {
  const [draftSelected, setDraftSelected] = useState(selectedIds);
  function toggle(id, disabled = false) {
    if (disabled) return;
    setDraftSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= maxSelected) return current;
      return [...current, id];
    });
  }
  return [draftSelected, toggle];
}

export function KnowledgeItemSelectionModal({ items, labels, locale, maxSelected = Number.POSITIVE_INFINITY, onClose, onConfirm, selectedIds, types }) {
  const [query, setQuery] = useState('');
  const [activeTypeId, setActiveTypeId] = useState(types[0]?.id ?? '');
  const [draftSelected, toggle] = useDraftSelection(selectedIds, maxSelected);
  const visibleTypes = types.filter((type) => {
    const [name, description] = type.preset ? typeCopy[type.id] ?? [`${type.name}.xlsx`, ''] : [`${type.name}.xlsx`, type.description || '自定义知识表'];
    return `${name} ${description}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const activeItems = items.filter((item) => item.typeId === activeTypeId);
  const selectedItems = items.filter((item) => draftSelected.includes(item.id));

  function renderTypeGroup(title, group) {
    return (
      <section className="space-y-2">
        <div className="flex h-9 items-center justify-between rounded-[6px] bg-[#F7F8FB] px-3 text-[13px] font-bold text-[#303133]"><span>{title}</span><ChevronDown className="h-4 w-4 text-[#909399]" /></div>
        {group.map((type) => {
          const selected = type.id === activeTypeId;
          const [name, description] = type.preset ? typeCopy[type.id] ?? [`${type.name}.xlsx`, ''] : [`${type.name}.xlsx`, type.description || '自定义知识表'];
          const Icon = typeIcons[type.icon] ?? Table2;
          return (
            <button type="button" key={type.id} className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left ${selected ? 'bg-[#EEF2FF] text-[#365EFF]' : 'hover:bg-[#F7F8FB]'}`} onClick={() => setActiveTypeId(type.id)}>
              <span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border ${toneClasses[type.tone] ?? toneClasses.slate}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-bold">{name}</span><span className="mt-0.5 block truncate text-[13px] text-[#606F85]">{description}</span><span className="mt-1 block text-[12px] text-[#909399]">{items.filter((item) => item.typeId === type.id).length} {locale === 'en-US' ? 'items' : '个条目'}</span></span>
            </button>
          );
        })}
      </section>
    );
  }

  return (
    <ModalShell title={labels.knowledgeItems} widthClass="max-w-[980px]" onClose={onClose}>
      <div className="grid h-[560px] grid-cols-[340px_minmax(0,1fr)_320px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <label className="relative mb-3 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" /><input className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]" onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchKnowledgeTypes} value={query} /></label>
          <div className="h-[494px] space-y-5 overflow-y-auto pr-1">{renderTypeGroup(labels.presets, visibleTypes.filter((type) => type.preset))}{renderTypeGroup(labels.custom, visibleTypes.filter((type) => !type.preset))}</div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4"><div className="mb-3 text-[14px] font-semibold text-[#303133]">{labels.itemList}</div><div className="h-[494px] space-y-2 overflow-y-auto pr-1">{activeItems.map((item) => { const selected = draftSelected.includes(item.id); return <button type="button" key={item.id} className={`w-full rounded-[6px] border px-3 py-2 text-left ${selected ? 'border-[#365EFF] bg-[#F4F6FF]' : 'border-[#E7EAF0] hover:border-[#365EFF]'}`} onClick={() => toggle(item.id)}><span className="flex items-start gap-2"><span className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded border ${selected ? 'border-[#365EFF] bg-[#365EFF]' : 'border-[#DCDFE6]'}`}>{selected ? <Check className="h-3 w-3 text-white" /> : null}</span><span className="min-w-0"><span className="block truncate text-[14px] font-medium text-[#303133]">{item.title}</span><span className="line-clamp-2 text-[12px] text-[#909399]">{item.summary}</span></span></span></button>; })}</div></div>
        <div className="min-w-0 overflow-hidden px-6 py-4"><div className="mb-3 text-[14px] font-semibold text-[#303133]">{labels.selectedItems}</div><SelectedList emptyText={labels.noItemsSelected} items={selectedItems} onRemove={toggle} /></div>
      </div>
      <ModalActions labels={labels} onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}

export function KnowledgeFileSelectionModal({ files, labels, locale, maxSelected = Number.POSITIVE_INFINITY, onClose, onConfirm, selectedIds, requireUsableContent = false }) {
  const [query, setQuery] = useState('');
  const [activeFileType, setActiveFileType] = useState('__all__');
  const [activeTag, setActiveTag] = useState('__all__');
  const [draftSelected, toggle] = useDraftSelection(selectedIds, maxSelected);
  const fileTypes = useMemo(() => Array.from(new Set(files.map((file) => file.fileType).filter(Boolean))).sort(), [files]);
  const tags = useMemo(() => Array.from(new Set(files.flatMap((file) => file.tags ?? []))).sort(), [files]);
  const visibleFiles = files.filter((file) => {
    const matchesQuery = [file.title, file.summary, ...(file.tags ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase());
    const matchesType = activeFileType === '__all__' || file.fileType === activeFileType;
    const matchesTag = activeTag === '__all__' || file.tags?.includes(activeTag);
    return matchesQuery && matchesType && matchesTag;
  });
  const selectedFiles = files.filter((file) => draftSelected.includes(file.id));

  return (
    <ModalShell title={labels.knowledgeFiles} widthClass="max-w-[1180px]" onClose={onClose}>
      <div className="grid h-[600px] grid-cols-[300px_minmax(0,1fr)_360px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <label className="relative mb-3 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" /><input className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]" onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchFiles} value={query} /></label>
          <div className="flex h-9 items-center justify-between rounded-[6px] bg-[#F7F8FB] px-3 text-[13px] font-bold text-[#303133]"><span>{labels.fileType}</span><ChevronDown className="h-4 w-4 text-[#909399]" /></div>
          <div className="mt-2 max-h-[230px] space-y-2 overflow-y-auto">{['__all__', ...fileTypes].map((type) => <button type="button" key={type} className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left ${activeFileType === type ? 'bg-[#EEF2FF] text-[#365EFF]' : 'hover:bg-[#F7F8FB]'}`} onClick={() => setActiveFileType(type)}><span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E7ED] bg-white"><FileText className="h-4 w-4" /></span><span className="text-[14px] font-bold">{type === '__all__' ? labels.allTypes : type.toUpperCase()}</span></button>)}</div>
          <div className="mt-4 flex h-9 items-center justify-between rounded-[6px] bg-[#F7F8FB] px-3 text-[13px] font-bold text-[#303133]"><span>{locale === 'en-US' ? 'Tags' : '标签'}</span><ChevronDown className="h-4 w-4 text-[#909399]" /></div>
          <div className="mt-2 max-h-[180px] space-y-1 overflow-y-auto">{['__all__', ...tags].map((tag) => <button type="button" key={tag} className={`w-full rounded-[6px] px-3 py-2 text-left text-[13px] font-semibold ${activeTag === tag ? 'bg-[#EEF2FF] text-[#365EFF]' : 'text-[#606266] hover:bg-[#F7F8FB]'}`} onClick={() => setActiveTag(tag)}>{tag === '__all__' ? (locale === 'en-US' ? 'All Tags' : '全部标签') : tag}</button>)}</div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4"><div className="mb-3 text-[14px] font-semibold text-[#303133]">{labels.fileList} <span className="text-[12px] font-normal text-[#909399]">{visibleFiles.length}</span></div><div className="h-[530px] space-y-2 overflow-y-auto pr-1">{visibleFiles.map((file) => { const selected = draftSelected.includes(file.id); const disabled = requireUsableContent && !file.hasUsableContent; const [style, Icon] = fileStyles[file.fileType] ?? [toneClasses.slate, FileText]; return <button type="button" key={file.id} disabled={disabled} className={`w-full rounded-[6px] border px-3 py-2 text-left ${disabled ? 'cursor-not-allowed border-[#E7EAF0] bg-[#F7F8FB] opacity-55' : selected ? 'border-[#365EFF] bg-[#F4F6FF]' : 'border-[#E7EAF0] hover:border-[#365EFF]'}`} onClick={() => toggle(file.id, disabled)}><span className="flex items-start gap-2"><span className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded border ${selected ? 'border-[#365EFF] bg-[#365EFF]' : 'border-[#DCDFE6]'}`}>{selected ? <Check className="h-3 w-3 text-white" /> : null}</span><span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border ${style}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-[14px] font-medium text-[#303133]">{file.title}</span><span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClasses[file.processingStatus] ?? statusClasses.pending}`}>{file.statusLabel}</span></span><span className="mt-1 block line-clamp-2 text-[12px] text-[#909399]">{disabled ? labels.fileUnavailable : file.summary}</span></span></span></button>; })}</div></div>
        <div className="min-w-0 overflow-hidden px-6 py-4"><div className="mb-3 text-[14px] font-semibold text-[#303133]">{labels.selectedFiles}</div><SelectedList emptyText={labels.noFilesSelected} items={selectedFiles} onRemove={toggle} /></div>
      </div>
      <ModalActions labels={labels} onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}
