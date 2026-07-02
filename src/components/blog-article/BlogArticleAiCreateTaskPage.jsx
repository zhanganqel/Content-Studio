import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Box,
  Check,
  ChevronDown,
  Database,
  FileText,
  HelpCircle,
  Layers3,
  Link2,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Table2,
  Trash2,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAudiencePersonaDrafts } from '../../services/audiencePersonaStore.js';
import { createBlankBlogArticle, upsertBlogArticle } from '../../services/blogArticleStore.js';
import { getBrandProfileDraft } from '../../services/brandProfileStore.js';
import {
  aiArticleLanguageOptions,
  aiArticleLengthOptions,
  aiArticleTypeOptions,
  aiModelOptions,
  aiPersonOptions,
  aiReferenceSearchAnalyses,
  aiToneOptions,
  saveAiCreationTask,
} from '../../services/blogArticleAiStore.js';
import { listChunks, listFiles } from '../../services/fileLibraryApi.js';
import { getKnowledgeItemDraft } from '../../services/knowledgeItemStore.js';

const targetRegionOptions = [
  'Global',
  'United States',
  'Europe',
  'United Kingdom',
  'Germany',
  'Canada',
  'Australia',
  'Japan',
  'Singapore',
];

const controlBase =
  'h-[34px] w-full rounded-[6px] border bg-white px-3 text-[14px] leading-[22px] text-[#303133] outline-none transition placeholder:text-[#A8ABB2] hover:border-[#C8D2FF] focus:border-[#365EFF] focus:ring-2 focus:ring-[#365EFF]/10 disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#A8ABB2]';
const controlError = 'border-[#FF4346] focus:border-[#FF4346] focus:ring-[#FF4346]/10';
const controlNormal = 'border-[#DCDFE6]';

const knowledgeTypeCopy = {
  products: {
    name: '主营产品.xlsx',
    description: '公司主营售卖的实物型产品',
  },
  services: {
    name: '主要服务.xlsx',
    description: '记录公司提供的服务型产品',
  },
  solutions: {
    name: '解决方案.xlsx',
    description: '记录公司可提供的解决方案',
  },
  cases: {
    name: '公司案例.xlsx',
    description: '记录客户公司的真实案例',
  },
  faqs: {
    name: 'FAQ.xlsx',
    description: '记录客户公司的常见问答对',
  },
};

const knowledgeTypeIcons = {
  product: Box,
  service: Wrench,
  solution: Lightbulb,
  case: Trophy,
  faq: HelpCircle,
  custom: Table2,
};

const knowledgeToneClasses = {
  blue: 'border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]',
  green: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]',
  violet: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]',
  orange: 'border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]',
  sky: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7]',
  slate: 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]',
};

const knowledgeFileStatusLabels = {
  chunked: '已解析',
  failed: '解析失败',
  pending: '待解析',
  processing: '解析中',
};

const knowledgeFileStatusClasses = {
  chunked: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]',
  failed: 'border-[#FFD0D1] bg-[#FFF1F0] text-[#F56C6C]',
  pending: 'border-[#E4E7ED] bg-[#F7F8FB] text-[#909399]',
  processing: 'border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]',
};

const fileTypeStyles = {
  docx: {
    className: 'border-[#B8D3FF] bg-[#EFF6FF] text-[#365EFF]',
    icon: FileText,
    label: 'DOCX',
  },
  pdf: {
    className: 'border-[#FFD0D1] bg-[#FFF1F0] text-[#F56C6C]',
    icon: FileText,
    label: 'PDF',
  },
  xls: {
    className: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]',
    icon: Table2,
    label: 'XLS',
  },
  xlsx: {
    className: 'border-[#A8F0CF] bg-[#ECFDF5] text-[#00A85F]',
    icon: Table2,
    label: 'XLSX',
  },
  md: {
    className: 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]',
    icon: FileText,
    label: 'MD',
  },
  txt: {
    className: 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]',
    icon: FileText,
    label: 'TXT',
  },
};

function isValidUrl(value) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function getDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value ?? '');
}

function getRowValue(row, field) {
  if (field.key === 'knowledgeId') {
    return row.knowledgeId ?? '';
  }

  return getDisplayValue(row.cells?.[field.key]);
}

function flattenKnowledgeItems(draft) {
  return draft.types.flatMap((type) => {
    const rows = draft.rows[type.id] ?? [];
    const nameField = type.fields.find((field) => field.key === type.nameFieldKey) ?? type.fields[1];
    const bodyField = type.fields.find((field) => field.aiRole === 'body') ?? type.fields[2];
    const tagsField = type.fields.find((field) => field.aiRole === 'tags');

    return rows.map((row) => ({
      id: row.id,
      typeId: type.id,
      typeName: type.name,
      title: getRowValue(row, nameField) || row.knowledgeId || 'Untitled knowledge',
      summary: getRowValue(row, bodyField),
      tags: tagsField ? getRowValue(row, tagsField).split(',').map((item) => item.trim()).filter(Boolean) : [],
    }));
  });
}

function getArticleTypeForStore(value) {
  return value.replace(/（.*$/, '').trim();
}

function getKnowledgeTypeName(type) {
  if (type.preset) {
    return knowledgeTypeCopy[type.id]?.name ?? `${type.name}.xlsx`;
  }

  return `${type.name}.xlsx`;
}

function getKnowledgeTypeDescription(type) {
  if (type.preset) {
    return knowledgeTypeCopy[type.id]?.description ?? '';
  }

  return type.description || '自定义知识表';
}

function KnowledgeTypeIcon({ selected, type }) {
  const Icon = knowledgeTypeIcons[type.icon] ?? knowledgeTypeIcons.custom;
  const toneClass = knowledgeToneClasses[type.tone] ?? knowledgeToneClasses.slate;

  return (
    <span
      className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border ${toneClass} ${
        selected ? 'bg-white' : ''
      }`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function getInitialForm({ brandProfile, knowledgeFiles, knowledgeItems, personas, project }) {
  const seed = project?.demoProject?.contentSeeds?.find((item) => item.type === 'blog');
  const defaultPersona =
    personas.find((persona) => persona.id === 'overseas-procurement-manager') ?? personas[0];
  const preferredKnowledge = ['CNC Turning', 'CNC Milling', 'DFM Support'];
  const defaultKnowledgeIds = preferredKnowledge
    .map((name) => knowledgeItems.find((item) => item.title === name)?.id)
    .filter(Boolean);
  const defaultAssetIds = knowledgeFiles
    .filter((file) => ['service', 'structured-data', 'website-research'].includes(file.category))
    .slice(0, 3)
    .map((file) => file.id);

  return {
    targetRegion: 'Global',
    articleLanguage: aiArticleLanguageOptions[0],
    targetAudienceId: defaultPersona?.id ?? '',
    knowledgeItemIds: defaultKnowledgeIds.length ? defaultKnowledgeIds : knowledgeItems.slice(0, 3).map((item) => item.id),
    knowledgeAssetIds: defaultAssetIds,
    businessGoal:
      'Help overseas procurement teams evaluate Rejin CNC as a reliable custom metal parts supplier and submit a qualified RFQ.',
    articleTopic: seed?.title ?? 'CNC Turning vs. Milling: How to Choose for Your Next Project',
    primaryKeyword: 'CNC machining supplier',
    secondaryKeywords: ['custom metal parts', 'DFM support', 'CNC turning vs milling'],
    articleType: aiArticleTypeOptions[0],
    articleLength: aiArticleLengthOptions[1],
    tone: aiToneOptions[0],
    person: aiPersonOptions[2],
    referenceArticles: [],
    brandRequirements: brandProfile.brandRequirements ?? '',
    additionalRequirements: '',
    model: aiModelOptions[0],
    searchQuery: seed?.title ?? 'CNC machining supplier custom metal parts',
  };
}

function getKnowledgeFileName(file) {
  if (file.fileName) return file.fileName;
  if (file.title && file.fileType && !file.title.toLowerCase().endsWith(`.${file.fileType.toLowerCase()}`)) {
    return `${file.title}.${file.fileType}`;
  }

  return file.title || '未命名资料文件';
}

function getChunkText(chunk) {
  return String(chunk?.editedText || chunk?.originalText || '').replace(/\r/g, '').trim();
}

function getKnowledgeFilePreview(project, file) {
  const chunks = file?.id ? listChunks(project, file.id) : [];
  const firstChunkText = getChunkText(chunks[0]);
  if (!firstChunkText) return '暂无可预览内容';

  const ignoredLines = new Set(
    [file.title, file.fileName, file.usage, getKnowledgeFileName(file)]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean),
  );
  const lines = firstChunkText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !ignoredLines.has(line))
    .filter((line) => !/^tags:/i.test(line))
    .filter((line) => !/^source urls?:/i.test(line))
    .filter((line) => !/^https?:\/\//i.test(line))
    .filter((line) => !/^this fallback chunk/i.test(line));

  return lines.slice(0, 2).join(' ') || '暂无可预览内容';
}

function getKnowledgeFileOption(project, file) {
  return {
    ...file,
    fileName: getKnowledgeFileName(file),
    fileType: String(file.fileType || '').toLowerCase(),
    statusLabel: knowledgeFileStatusLabels[file.processingStatus] ?? '未知状态',
    summary: getKnowledgeFilePreview(project, file),
    title: getKnowledgeFileName(file),
  };
}

function getFileTypeStyle(fileType) {
  return fileTypeStyles[String(fileType || '').toLowerCase()] ?? {
    className: 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]',
    icon: FileText,
    label: String(fileType || 'FILE').toUpperCase(),
  };
}

function Field({ children, error, fieldKey, hint, label, required }) {
  return (
    <label className="block min-w-0" data-ai-field={fieldKey}>
      <span className="mb-2 flex items-center gap-1 text-[14px] font-medium leading-[22px] text-[#303133]">
        {label}
        {required ? <span className="text-[#FF4346]">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">{hint}</span> : null}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-[12px] leading-[18px] text-[#FF4346]">
          <AlertCircle className="h-3.5 w-3.5 flex-none" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FormCard({ children, icon: Icon, subtitle, title }) {
  return (
    <section className="rounded-[8px] bg-white p-6 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-[8px] bg-[#EEF2FF] text-[#365EFF]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">{title}</h2>
          {subtitle ? <p className="mt-1 text-[13px] leading-[20px] text-[#909399]">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SelectField({ error, onChange, options, value }) {
  return (
    <span className="relative block">
      <select
        className={`${controlBase} appearance-none pr-9 ${error ? controlError : controlNormal}`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#909399]" />
    </span>
  );
}

function TextInput({ error, onBlur, onChange, placeholder, value }) {
  return (
    <input
      className={`${controlBase} ${error ? controlError : controlNormal}`}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function TextArea({ error, minHeight = 94, onBlur, onChange, placeholder, value }) {
  return (
    <textarea
      className={`${controlBase} resize-none py-[7px] ${error ? controlError : controlNormal}`}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ minHeight }}
      value={value}
    />
  );
}

function IconButton({ children, className = '', icon: Icon, onClick, selected }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border px-3 text-[14px] font-medium leading-[22px] transition focus:outline-none focus:ring-2 focus:ring-[#365EFF]/10 ${
        selected
          ? 'border-[#365EFF] bg-[#EEF2FF] text-[#365EFF]'
          : 'border-[#DCDFE6] bg-white text-[#303133] hover:border-[#365EFF] hover:text-[#365EFF]'
      } ${className}`}
      onClick={onClick}
    >
      {Icon ? <Icon className="h-4 w-4 flex-none" /> : null}
      {children}
    </button>
  );
}

function TagInput({ error, maxTags, onChange, placeholder, value }) {
  const [draft, setDraft] = useState('');
  const isFull = maxTags ? value.length >= maxTags : false;

  function addTag() {
    const tag = draft.trim();
    if (!tag || value.includes(tag) || isFull) {
      setDraft('');
      return;
    }

    onChange([...value, tag]);
    setDraft('');
  }

  function removeTag(tag) {
    onChange(value.filter((item) => item !== tag));
  }

  return (
    <div
      className={`min-h-[34px] rounded-[6px] border bg-white px-2 py-1 transition hover:border-[#C8D2FF] focus-within:border-[#365EFF] focus-within:ring-2 focus-within:ring-[#365EFF]/10 ${
        error ? controlError : controlNormal
      }`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-6 min-w-0 max-w-full items-center gap-1 rounded-full border border-[#CCD6FF] bg-[#F4F6FF] px-2 text-[12px] leading-[18px] text-[#365EFF]"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="rounded-full text-[#365EFF] hover:bg-white"
              onClick={() => removeTag(tag)}
              aria-label={`删除 ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="h-6 min-w-[120px] flex-1 border-none bg-transparent px-1 text-[14px] leading-[22px] text-[#303133] outline-none placeholder:text-[#A8ABB2] disabled:cursor-not-allowed"
          disabled={isFull}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={isFull ? '已达到上限' : placeholder}
          value={draft}
        />
      </div>
    </div>
  );
}

function SegmentedControl({ onChange, options, value }) {
  return (
    <div className="grid h-[34px] grid-cols-3 overflow-hidden rounded-[6px] border border-[#DCDFE6] bg-[#F5F7FA] p-0.5">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`rounded-[4px] text-[14px] font-medium leading-[22px] transition ${
            option === value
              ? 'bg-white text-[#365EFF] shadow-[0_1px_3px_rgba(54,94,255,0.16)]'
              : 'text-[#606266] hover:text-[#365EFF]'
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SummaryButton({ count, disabled, icon: Icon, label, onClick, placeholder }) {
  return (
    <button
      type="button"
      className={`flex min-h-[34px] w-full items-center justify-between rounded-[6px] border px-3 text-left text-[14px] leading-[22px] transition focus:outline-none focus:ring-2 focus:ring-[#365EFF]/10 ${
        disabled
          ? 'cursor-not-allowed border-[#DCDFE6] bg-[#F5F7FA] text-[#A8ABB2]'
          : 'border-[#DCDFE6] bg-white text-[#303133] hover:border-[#365EFF]'
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 flex-none text-[#365EFF]" /> : null}
        <span className="truncate">{count ? `已选择 ${count} 项` : placeholder}</span>
      </span>
      <ChevronDown className="h-4 w-4 flex-none text-[#909399]" />
    </button>
  );
}

function UrlList({ errorPrefix, label, onChange, placeholder, values }) {
  function updateValue(index, nextValue) {
    onChange(values.map((value, currentIndex) => (currentIndex === index ? nextValue : value)));
  }

  function removeValue(index) {
    onChange(values.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="space-y-2">
      {values.length ? (
        values.map((value, index) => {
          const invalid = Boolean(value.trim()) && !isValidUrl(value);
          return (
            <div key={`${label}-${index}`} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
                  <input
                    className={`${controlBase} pl-9 ${invalid ? controlError : controlNormal}`}
                    onChange={(event) => updateValue(index, event.target.value)}
                    placeholder={placeholder}
                    value={value}
                  />
                </span>
                <button
                  type="button"
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border border-[#DCDFE6] bg-white text-[#909399] transition hover:border-[#FF4346] hover:text-[#FF4346]"
                  onClick={() => removeValue(index)}
                  aria-label={`删除${label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {invalid ? (
                <span className="block text-[12px] leading-[18px] text-[#FF4346]">
                  {errorPrefix}
                </span>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="rounded-[6px] border border-dashed border-[#DCDFE6] bg-[#FAFBFC] px-3 py-3 text-[13px] leading-[20px] text-[#909399]">
          暂未添加{label}
        </div>
      )}
      <IconButton icon={Plus} onClick={() => onChange([...values, ''])}>
        添加{label}
      </IconButton>
    </div>
  );
}

function AudienceSelect({ error, onChange, personas, value }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = personas.find((persona) => persona.id === value);
  const filteredPersonas = personas.filter((persona) =>
    [persona.name, persona.jobTitle, persona.searchGoal].join(' ').toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        className={`${controlBase} flex items-center justify-between text-left ${error ? controlError : controlNormal}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? 'truncate' : 'truncate text-[#A8ABB2]'}>
          {selected?.name ?? '请选择目标受众'}
        </span>
        <ChevronDown className="h-4 w-4 flex-none text-[#909399]" />
      </button>
      {selected ? (
        <div className="mt-2 rounded-[6px] border border-[#E7EAF0] bg-[#FAFBFC] px-3 py-2 text-[12px] leading-[18px] text-[#606266]">
          <div className="font-medium text-[#303133]">{selected.jobTitle || selected.organizationType}</div>
          <p className="mt-1 line-clamp-2">{selected.searchGoal || selected.businessDescription}</p>
        </div>
      ) : null}
      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-[8px] border border-[#DCDFE6] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
            <input
              className="h-[32px] w-full rounded-[6px] border border-[#DCDFE6] pl-8 pr-2 text-[13px] outline-none focus:border-[#365EFF]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索受众"
              value={query}
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filteredPersonas.map((persona) => (
              <button
                type="button"
                key={persona.id}
                className={`w-full rounded-[6px] px-2 py-2 text-left transition ${
                  persona.id === value ? 'bg-[#EEF2FF]' : 'hover:bg-[#F5F7FA]'
                }`}
                onClick={() => {
                  onChange(persona.id);
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-medium leading-[22px] text-[#303133]">
                    {persona.name}
                  </span>
                  {persona.id === value ? <Check className="h-4 w-4 text-[#365EFF]" /> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-[#909399]">
                  {persona.searchGoal || persona.businessDescription}
                </p>
              </button>
            ))}
            {!filteredPersonas.length ? (
              <div className="px-2 py-6 text-center text-[13px] text-[#909399]">暂无匹配受众</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeModal({ items, onClose, onConfirm, selectedIds, types }) {
  const [query, setQuery] = useState('');
  const [activeTypeId, setActiveTypeId] = useState(types[0]?.id ?? '');
  const [draftSelected, setDraftSelected] = useState(selectedIds);
  const typeQuery = query.trim().toLowerCase();
  const visibleTypes = types.filter((type) =>
    [getKnowledgeTypeName(type), getKnowledgeTypeDescription(type)]
      .join(' ')
      .toLowerCase()
      .includes(typeQuery),
  );
  const presetTypes = visibleTypes.filter((type) => type.preset);
  const customTypes = visibleTypes.filter((type) => !type.preset);
  const activeItems = items.filter((item) => item.typeId === activeTypeId);
  const selectedItems = items.filter((item) => draftSelected.includes(item.id));

  function toggle(id) {
    setDraftSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function renderTypeGroup(label, groupTypes, emptyText) {
    return (
      <section className="space-y-2">
        <div className="flex h-9 items-center justify-between rounded-[6px] bg-[#F7F8FB] px-3 text-[13px] font-bold leading-[20px] text-[#303133]">
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 text-[#909399]" />
        </div>
        {groupTypes.length ? (
          <div className="space-y-2">
            {groupTypes.map((type) => {
              const selected = type.id === activeTypeId;
              const count = items.filter((item) => item.typeId === type.id).length;

              return (
                <button
                  type="button"
                  key={type.id}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left transition ${
                    selected ? 'bg-[#EEF2FF] text-[#365EFF]' : 'text-[#303133] hover:bg-[#F7F8FB]'
                  }`}
                  onClick={() => setActiveTypeId(type.id)}
                >
                  <KnowledgeTypeIcon selected={selected} type={type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold leading-[22px]">
                      {getKnowledgeTypeName(type)}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] leading-[20px] text-[#606F85]">
                      {getKnowledgeTypeDescription(type)}
                    </span>
                    <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">{count} 个条目</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[6px] border border-dashed border-[#DCDFE6] px-3 py-4 text-center text-[13px] leading-[20px] text-[#909399]">
            {emptyText}
          </div>
        )}
      </section>
    );
  }

  return (
    <ModalShell title="选择知识条目" widthClass="max-w-[980px]" onClose={onClose}>
      <div className="grid h-[560px] grid-cols-[340px_minmax(0,1fr)_320px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
            <input
              className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索知识类型"
              value={query}
            />
          </div>
          <div className="h-[494px] space-y-5 overflow-y-auto pr-1">
            {renderTypeGroup('系统预设', presetTypes, '暂无匹配预设类型')}
            {renderTypeGroup('自定义', customTypes, typeQuery ? '暂无匹配自定义类型' : '暂无自定义类型')}
          </div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] p-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">条目列表</div>
          <div className="h-[494px] space-y-2 overflow-y-auto pr-1">
            {activeItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`w-full rounded-[6px] border px-3 py-2 text-left transition ${
                  draftSelected.includes(item.id)
                    ? 'border-[#365EFF] bg-[#F4F6FF]'
                    : 'border-[#E7EAF0] bg-white hover:border-[#365EFF]'
                }`}
                onClick={() => toggle(item.id)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded border ${
                      draftSelected.includes(item.id) ? 'border-[#365EFF] bg-[#365EFF]' : 'border-[#DCDFE6]'
                    }`}
                  >
                    {draftSelected.includes(item.id) ? <Check className="h-3 w-3 text-white" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium leading-[22px] text-[#303133]">
                      {item.title}
                    </span>
                    <span className="line-clamp-2 text-[12px] leading-[18px] text-[#909399]">{item.summary}</span>
                  </span>
                </div>
              </button>
            ))}
            {!activeItems.length ? (
              <div className="rounded-[6px] border border-dashed border-[#DCDFE6] py-8 text-center text-[13px] text-[#909399]">
                暂无匹配知识条目
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden p-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">已选知识条目</div>
          <SelectedList emptyText="暂未选择知识条目" items={selectedItems} onRemove={toggle} />
        </div>
      </div>
      <ModalActions onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}

function KnowledgeFileModal({ files, onClose, onConfirm, selectedIds }) {
  const allTagValue = '__all_tags__';
  const allTypeValue = '__all_types__';
  const [activeTag, setActiveTag] = useState(allTagValue);
  const [activeFileType, setActiveFileType] = useState(allTypeValue);
  const [query, setQuery] = useState('');
  const [draftSelected, setDraftSelected] = useState(selectedIds);
  const normalizedQuery = query.trim().toLowerCase();
  const queryMatchedFiles = files.filter((file) =>
    [file.title, file.fileName, file.summary, file.category, ...(file.tags ?? []), ...(file.sourceUrls ?? [])]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  );
  const tagOptions = Array.from(new Set(files.flatMap((file) => file.tags ?? []))).sort((a, b) => a.localeCompare(b));
  const fileTypeOptions = Array.from(new Set(files.map((file) => file.fileType).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  const visibleFiles = queryMatchedFiles.filter((file) => {
    const matchesTag = activeTag === allTagValue || file.tags?.includes(activeTag);
    const matchesFileType = activeFileType === allTypeValue || file.fileType === activeFileType;
    return matchesTag && matchesFileType;
  });
  const selectedFiles = files.filter((file) => draftSelected.includes(file.id));

  function toggle(id) {
    setDraftSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function countByFilter({ fileType, tag }) {
    return queryMatchedFiles.filter((file) => {
      const matchesTag = tag ? file.tags?.includes(tag) : activeTag === allTagValue || file.tags?.includes(activeTag);
      const matchesFileType =
        fileType ? file.fileType === fileType : activeFileType === allTypeValue || file.fileType === activeFileType;
      return matchesTag && matchesFileType;
    }).length;
  }

  function renderFilterGroup({ emptyText, icon: Icon, label, options, type }) {
    const activeValue = type === 'tag' ? activeTag : activeFileType;
    const setActiveValue = type === 'tag' ? setActiveTag : setActiveFileType;
    const allValue = type === 'tag' ? allTagValue : allTypeValue;
    const allLabel = type === 'tag' ? '全部标签' : '全部类型';
    const allCount = queryMatchedFiles.filter((file) => {
      if (type === 'tag') {
        return activeFileType === allTypeValue || file.fileType === activeFileType;
      }
      return activeTag === allTagValue || file.tags?.includes(activeTag);
    }).length;
    const rows = [{ count: allCount, label: allLabel, value: allValue }, ...options.map((option) => ({
      count: type === 'tag' ? countByFilter({ tag: option }) : countByFilter({ fileType: option }),
      label: type === 'tag' ? option : option.toUpperCase(),
      value: option,
    }))];

    return (
      <section className="space-y-2">
        <div className="flex h-9 items-center justify-between rounded-[6px] bg-[#F7F8FB] px-3 text-[13px] font-bold leading-[20px] text-[#303133]">
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 text-[#909399]" />
        </div>
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((row) => {
              const selected = row.value === activeValue;
              return (
                <button
                  type="button"
                  key={row.value}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-3 text-left transition ${
                    selected ? 'bg-[#EEF2FF] text-[#365EFF]' : 'text-[#303133] hover:bg-[#F7F8FB]'
                  }`}
                  onClick={() => setActiveValue(row.value)}
                >
                  <span
                    className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border ${
                      selected
                        ? 'border-[#B8D3FF] bg-white text-[#365EFF]'
                        : 'border-[#E4E7ED] bg-[#FAFBFC] text-[#909399]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold leading-[22px]">{row.label}</span>
                    <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">{row.count} 个文件</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[6px] border border-dashed border-[#DCDFE6] px-3 py-4 text-center text-[13px] leading-[20px] text-[#909399]">
            {emptyText}
          </div>
        )}
      </section>
    );
  }

  return (
    <ModalShell title="选择知识资料" widthClass="max-w-[1180px]" onClose={onClose}>
      <div className="grid h-[600px] grid-cols-[300px_minmax(0,1fr)_360px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
            <input
              className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索资料库文件"
              value={query}
            />
          </div>
          <div className="h-[530px] space-y-5 overflow-y-auto pr-1">
            {renderFilterGroup({
              emptyText: '暂无可筛选文件类型',
              icon: FileText,
              label: '文件类型',
              options: fileTypeOptions,
              type: 'fileType',
            })}
            {renderFilterGroup({
              emptyText: '暂无可筛选标签',
              icon: Layers3,
              label: '标签',
              options: tagOptions,
              type: 'tag',
            })}
          </div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] p-4">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold leading-[22px] text-[#303133]">
            <ChevronDown className="h-4 w-4 text-[#909399]" />
            <span>资料库文件</span>
            <span className="text-[12px] font-normal text-[#909399]">共 {visibleFiles.length} 个</span>
          </div>
          <div className="h-[530px] space-y-2 overflow-y-auto pr-1">
            {visibleFiles.map((file) => {
              const typeStyle = getFileTypeStyle(file.fileType);
              const TypeIcon = typeStyle.icon;
              return (
                <button
                  type="button"
                  key={file.id}
                  className={`w-full rounded-[6px] border px-3 py-2 text-left transition ${
                    draftSelected.includes(file.id)
                      ? 'border-[#365EFF] bg-[#F4F6FF]'
                      : 'border-[#E7EAF0] bg-white hover:border-[#365EFF]'
                  }`}
                  onClick={() => toggle(file.id)}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded border ${
                        draftSelected.includes(file.id) ? 'border-[#365EFF] bg-[#365EFF]' : 'border-[#DCDFE6]'
                      }`}
                    >
                      {draftSelected.includes(file.id) ? <Check className="h-3 w-3 text-white" /> : null}
                    </span>
                    <span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border ${typeStyle.className}`}>
                      <TypeIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[14px] font-medium leading-[22px] text-[#303133]">
                          {file.title}
                        </span>
                        <span className={`flex-none rounded-full border px-2 py-0.5 text-[11px] leading-[16px] ${knowledgeFileStatusClasses[file.processingStatus] ?? knowledgeFileStatusClasses.pending}`}>
                          {file.statusLabel}
                        </span>
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[12px] leading-[18px] text-[#909399]">
                        {file.summary}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
            {!visibleFiles.length ? (
              <div className="rounded-[6px] border border-dashed border-[#DCDFE6] py-8 text-center text-[13px] text-[#909399]">
                暂无匹配资料库文件
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden p-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">已选知识库文件</div>
          <SelectedList emptyText="暂未选择知识资料" items={selectedFiles} onRemove={toggle} />
        </div>
      </div>
      <ModalActions onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}

function ModalShell({ children, onClose, title, widthClass }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className={`max-h-[calc(100vh-80px)] w-full overflow-hidden rounded-[8px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${widthClass}`}>
        <div className="flex h-[64px] items-center justify-between px-6">
          <h3 className="text-[18px] font-bold leading-[26px] text-[#303133]">{title}</h3>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#606266] transition hover:bg-[#F5F7FA] hover:text-[#303133]"
            onClick={onClose}
            aria-label="关闭弹窗"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm }) {
  return (
    <div className="flex h-[64px] items-center justify-end gap-3 border-t border-[#EBEEF5] px-6">
      <button
        type="button"
        className="h-8 rounded-[6px] border border-[#365EFF] bg-white px-4 text-[14px] font-medium text-[#365EFF] transition hover:bg-[#F4F6FF]"
        onClick={onCancel}
      >
        取消
      </button>
      <button
        type="button"
        className="h-8 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-medium text-white transition hover:bg-[#2448E8]"
        onClick={onConfirm}
      >
        确定
      </button>
    </div>
  );
}

function SelectedList({ emptyText, items, onRemove }) {
  if (!items.length) {
    return (
      <div className="rounded-[6px] border border-dashed border-[#DCDFE6] py-8 text-center text-[13px] text-[#909399]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 455 }}>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex min-w-0 items-start justify-between gap-3 overflow-hidden rounded-[6px] border border-[#E7EAF0] bg-[#FAFBFC] px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium leading-[22px] text-[#303133]">{item.title}</div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-[#909399]">{item.summary || item.usage}</p>
          </div>
          <button
            type="button"
            className="mt-0.5 text-[#909399] transition hover:text-[#FF4346]"
            onClick={() => onRemove(item.id)}
            aria-label={`移除 ${item.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmLeaveDialog({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[500px] rounded-[8px] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
        <h3 className="text-[18px] font-bold leading-[26px] text-[#303133]">离开 AI 创作流程？</h3>
        <p className="mt-3 text-[14px] leading-[22px] text-[#606266]">
          当前创建任务内容尚未保存，离开后本次填写的内容将丢失。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="h-8 rounded-[6px] border border-[#DCDFE6] bg-white px-4 text-[14px] text-[#303133] transition hover:bg-[#F5F7FA]"
            onClick={onCancel}
          >
            继续填写
          </button>
          <button
            type="button"
            className="h-8 rounded-[6px] bg-[#365EFF] px-4 text-[14px] text-white transition hover:bg-[#2448E8]"
            onClick={onConfirm}
          >
            确认离开
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ added, result, onToggle }) {
  return (
    <article
      className={`rounded-[8px] border bg-white px-4 py-3.5 transition ${
        added ? 'border-[#B7C6FF] bg-[#FCFDFF]' : 'border-[#E7EAF0] hover:border-[#C8D2FF]'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="line-clamp-2 text-[15px] font-bold leading-[22px] text-[#1F55E5]">{result.title}</h4>
          <p className="mt-1 truncate text-[12px] leading-[18px] text-[#909399]">{result.url}</p>
        </div>
        <button
          type="button"
          className={`h-8 flex-none rounded-[6px] border px-3 text-[13px] font-medium transition ${
            added
              ? 'border-[#C8D2FF] bg-[#EEF2FF] text-[#365EFF]'
              : 'border-[#365EFF] bg-[#365EFF] text-white hover:bg-[#2448E8]'
          }`}
          onClick={() => onToggle(result)}
        >
          {added ? '已添加' : '+ 添加引用'}
        </button>
      </div>
      <p className="line-clamp-3 text-[13px] leading-[20px] text-[#606266]">{result.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#E4E7ED] bg-[#F7F8FB] px-2.5 py-1 text-[12px] font-medium leading-[18px] text-[#606266]">
          {result.articleType}
        </span>
        <span className="text-[12px] font-medium leading-[18px] text-[#909399]">
          相关度 {result.relevance}
        </span>
        <span className="text-[12px] font-medium leading-[18px] text-[#909399]">
          {result.relevanceLabel}
        </span>
      </div>
    </article>
  );
}

export default function BlogArticleAiCreateTaskPage({ onClose, onCreated, project }) {
  const brandProfile = useMemo(() => getBrandProfileDraft(project), [project]);
  const personas = useMemo(() => getAudiencePersonaDrafts(project), [project]);
  const knowledgeDraft = useMemo(() => getKnowledgeItemDraft(project), [project]);
  const knowledgeItems = useMemo(() => flattenKnowledgeItems(knowledgeDraft), [knowledgeDraft]);
  const knowledgeFiles = useMemo(() => listFiles(project).map((file) => getKnowledgeFileOption(project, file)), [project]);
  const initialForm = useMemo(
    () => getInitialForm({ brandProfile, knowledgeFiles, knowledgeItems, personas, project }),
    [brandProfile, knowledgeFiles, knowledgeItems, personas, project],
  );
  const initialSnapshot = useRef(JSON.stringify(initialForm));
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    setForm(initialForm);
    initialSnapshot.current = JSON.stringify(initialForm);
  }, [initialForm]);

  const selectedKnowledgeItems = knowledgeItems.filter((item) => form.knowledgeItemIds.includes(item.id));
  const selectedAssets = knowledgeFiles.filter((file) => form.knowledgeAssetIds.includes(file.id));
  const selectedAudience = personas.find((persona) => persona.id === form.targetAudienceId);
  const hasDirtyChanges = JSON.stringify(form) !== initialSnapshot.current;
  const addedReferenceUrls = new Set(form.referenceArticles.map((item) => item.url));

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {};
    const requiredFields = [
      ['targetRegion', '目标地区'],
      ['articleLanguage', '文章语言'],
      ['targetAudienceId', '目标受众'],
      ['businessGoal', '业务目标'],
      ['articleTopic', '文章主题'],
      ['primaryKeyword', '主要关键词'],
      ['articleType', '文章类型'],
      ['articleLength', '文章长度'],
      ['tone', '语气'],
      ['person', '人称'],
    ];

    requiredFields.forEach(([field, label]) => {
      const value = form[field];
      if (Array.isArray(value) ? !value.length : !String(value ?? '').trim()) {
        nextErrors[field] = `请输入「${label}」`;
      }
    });

    const invalidReference = form.referenceArticles.some((item) => item.url.trim() && !isValidUrl(item.url));
    if (invalidReference) {
      nextErrors.referenceArticles = '参考文章链接格式错误，请检查链接格式。';
    }

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-ai-field="${firstError}"]`)?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      });
    }

    return !firstError;
  }

  function handleBack() {
    if (hasDirtyChanges) {
      setLeaveConfirmOpen(true);
      return;
    }

    onClose();
  }

  function handleAnalyze() {
    setAnalyzing(true);
    window.setTimeout(() => setAnalyzing(false), 650);
  }

  function toggleReference(result) {
    const exists = form.referenceArticles.some((item) => item.url === result.url);
    updateField(
      'referenceArticles',
      exists
        ? form.referenceArticles.filter((item) => item.url !== result.url)
        : [
            ...form.referenceArticles,
            {
              id: result.id,
              title: result.title,
              url: result.url,
              source: 'search-analysis',
            },
          ],
    );
  }

  function updateReferenceUrlList(urls) {
    updateField(
      'referenceArticles',
      urls.map((url, index) => ({
        id: form.referenceArticles[index]?.id ?? `manual-reference-${index + 1}`,
        title: form.referenceArticles[index]?.title ?? '',
        url,
        source: form.referenceArticles[index]?.source ?? 'manual',
      })),
    );
  }

  function handleCreateTask() {
    if (!validate()) {
      return;
    }

    const article = {
      ...createBlankBlogArticle(form.articleTopic || 'AI 创作任务'),
      title: form.articleTopic,
      articleType: getArticleTypeForStore(form.articleType),
      targetAudiencePersonaId: form.targetAudienceId,
      targetAudienceName: selectedAudience?.name ?? '',
      keywords: [form.primaryKeyword, ...form.secondaryKeywords].filter(Boolean),
      updatedBy: 'Angel',
    };
    upsertBlogArticle(project, article);

    const task = saveAiCreationTask(project.id, {
      articleId: article.id,
      model: form.model,
      taskInput: {
        ...form,
        targetAudience: selectedAudience,
        knowledgeItems: selectedKnowledgeItems,
        knowledgeAssets: selectedAssets,
      },
      searchAnalyses: aiReferenceSearchAnalyses,
    });

    onCreated({ article, task });
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <header className="fixed left-0 right-0 top-0 z-40 h-[52px] border-b border-[#EBEEF5] bg-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center px-6">
          <button
            type="button"
            className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#232E45] transition hover:bg-[#F5F7FA]"
            onClick={handleBack}
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="w-[360px] text-[18px] font-bold leading-[28px] text-[#232E45]">AI 创作-创建任务</h1>
          <div className="flex flex-1 items-center justify-center gap-5">
            {['创建任务', '文章策划', '标题大纲', '内容生成'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-bold ${
                    index === 0 ? 'bg-[#365EFF] text-white' : 'bg-[#EEF0F4] text-[#A8ABB2]'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-[14px] font-semibold ${index === 0 ? 'text-[#303133]' : 'text-[#A8ABB2]'}`}>
                  {step}
                </span>
                {index < 3 ? <span className="h-px w-12 bg-[#E4E7ED]" /> : null}
              </div>
            ))}
          </div>
          <div className="w-[260px]" />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-2 gap-4 px-6 pb-[84px] pt-[68px]">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateTask();
          }}
        >
          <FormCard icon={FileText} title="文章目标" subtitle="确定文章面向的市场与人群，描述文章的业务目标。">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field error={errors.targetRegion} fieldKey="targetRegion" label="目标地区" required>
                <SelectField
                  error={errors.targetRegion}
                  onChange={(value) => updateField('targetRegion', value)}
                  options={targetRegionOptions}
                  value={form.targetRegion}
                />
              </Field>
              <Field error={errors.articleLanguage} fieldKey="articleLanguage" label="文章语言" required>
                <SelectField
                  error={errors.articleLanguage}
                  onChange={(value) => updateField('articleLanguage', value)}
                  options={aiArticleLanguageOptions}
                  value={form.articleLanguage}
                />
              </Field>
              <div className="col-span-2">
                <Field error={errors.targetAudienceId} fieldKey="targetAudienceId" label="目标受众" required>
                  <AudienceSelect
                    error={errors.targetAudienceId}
                    onChange={(value) => updateField('targetAudienceId', value)}
                    personas={personas}
                    value={form.targetAudienceId}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field error={errors.businessGoal} fieldKey="businessGoal" label="业务目标" required>
                  <TextArea
                    error={errors.businessGoal}
                    minHeight={64}
                    onChange={(value) => updateField('businessGoal', value)}
                    placeholder="请输入文章要在业务上达到的效果，如推广产品、宣传公司形象、介绍展会信息等"
                    value={form.businessGoal}
                  />
                </Field>
              </div>
            </div>
          </FormCard>

          <FormCard icon={Database} title="引用与检索" subtitle="将品牌知识与外部参考文章纳入 AI 参考来源。">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field fieldKey="knowledgeItemIds" label="引用知识条目">
                <SummaryButton
                  count={form.knowledgeItemIds.length}
                  icon={Layers3}
                  onClick={() => setModal('knowledge')}
                  placeholder="请选择知识条目"
                />
                {selectedKnowledgeItems.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedKnowledgeItems.slice(0, 4).map((item) => (
                      <span key={item.id} className="rounded-full bg-[#F4F6FF] px-2.5 py-1 text-[12px] text-[#365EFF]">
                        {item.title}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Field>
              <Field fieldKey="knowledgeAssetIds" label="引用知识资料">
                <SummaryButton
                  count={form.knowledgeAssetIds.length}
                  icon={Database}
                  onClick={() => setModal('asset')}
                  placeholder="请选择知识资料"
                />
              </Field>
              <div className="col-span-2">
                <Field error={errors.referenceArticles} fieldKey="referenceArticles" label="参考文章">
                  <UrlList
                    errorPrefix="参考文章链接格式错误，请检查链接格式。"
                    label="文章链接"
                    onChange={updateReferenceUrlList}
                    placeholder="https://example.com/article"
                    values={form.referenceArticles.map((item) => item.url)}
                  />
                </Field>
              </div>
            </div>
          </FormCard>

          <FormCard icon={Bot} title="文章方向" subtitle="定义主题、关键词，选择生成内容的类型、篇幅、语气与叙述视角。">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <Field error={errors.articleTopic} fieldKey="articleTopic" label="文章主题" required>
                  <TextInput
                    error={errors.articleTopic}
                    onChange={(value) => {
                      updateField('articleTopic', value);
                      updateField('searchQuery', value);
                    }}
                    placeholder="请输入文章主题"
                    value={form.articleTopic}
                  />
                </Field>
              </div>
              <Field error={errors.primaryKeyword} fieldKey="primaryKeyword" label="主要关键词" required>
                <TagInput
                  error={errors.primaryKeyword}
                  maxTags={1}
                  onChange={(tags) => updateField('primaryKeyword', tags[0] ?? '')}
                  placeholder="请选择"
                  value={form.primaryKeyword ? [form.primaryKeyword] : []}
                />
              </Field>
              <Field fieldKey="secondaryKeywords" label="次要关键词">
                <TagInput
                  onChange={(tags) => updateField('secondaryKeywords', tags)}
                  placeholder="请输入要布局到文章内容中的关键词"
                  value={form.secondaryKeywords}
                />
              </Field>
              <Field error={errors.articleType} fieldKey="articleType" label="文章类型" required>
                <SelectField
                  error={errors.articleType}
                  onChange={(value) => updateField('articleType', value)}
                  options={aiArticleTypeOptions}
                  value={form.articleType}
                />
              </Field>
              <Field error={errors.articleLength} fieldKey="articleLength" label="文章长度" required>
                <SelectField
                  error={errors.articleLength}
                  onChange={(value) => updateField('articleLength', value)}
                  options={aiArticleLengthOptions}
                  value={form.articleLength}
                />
              </Field>
              <Field error={errors.tone} fieldKey="tone" label="语气" required>
                <SelectField
                  error={errors.tone}
                  onChange={(value) => updateField('tone', value)}
                  options={aiToneOptions}
                  value={form.tone}
                />
              </Field>
              <Field error={errors.person} fieldKey="person" label="人称" required>
                <SegmentedControl
                  onChange={(value) => updateField('person', value)}
                  options={aiPersonOptions}
                  value={form.person}
                />
              </Field>
              <div className="col-span-2">
                <Field
                  fieldKey="brandRequirements"
                  hint="已从品牌档案自动带入，可按本次任务调整"
                  label="品牌要求"
                >
                  <TextArea
                    minHeight={94}
                    onChange={(value) => updateField('brandRequirements', value)}
                    placeholder="客户特殊要求、品牌表达原则、禁用说法等"
                    value={form.brandRequirements}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field fieldKey="additionalRequirements" label="补充生成要求">
                  <TextArea
                    minHeight={94}
                    onChange={(value) => updateField('additionalRequirements', value)}
                    placeholder="可补充本次文章的格式、FAQ、禁用词、标题结构、案例引用等要求。"
                    value={form.additionalRequirements}
                  />
                </Field>
              </div>
            </div>
          </FormCard>
        </form>

        <aside className="sticky top-[68px] flex h-[calc(100vh-152px)] min-w-0 flex-col rounded-[8px] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
          <div className="border-b border-[#EBEEF5] p-5">
            <div className="mb-3">
              <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">TOP 10 文章</h2>
              <p className="text-[13px] leading-[20px] text-[#909399]">根据文章主题检索，可快速添加为参考文章。</p>
            </div>
            <div className="flex gap-2">
              <span className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
                <input
                  className={`${controlBase} ${controlNormal} pl-9`}
                  onChange={(event) => updateField('searchQuery', event.target.value)}
                  placeholder="输入主题或关键词"
                  value={form.searchQuery}
                />
              </span>
              <button
                type="button"
                className="inline-flex h-[34px] w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-[6px] bg-[#365EFF] px-3 text-[14px] font-medium text-white transition hover:bg-[#2448E8] disabled:cursor-wait disabled:bg-[#97ABFF]"
                disabled={analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>{analyzing ? '搜索中' : '搜索'}</span>
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-[18px] text-[#909399]">
              语言：{form.articleLanguage}　地区：{form.targetRegion}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {analyzing ? (
              <div className="grid h-full place-items-center rounded-[8px] border border-dashed border-[#DCDFE6]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#365EFF]" />
                  <p className="mt-3 text-[14px] leading-[22px] text-[#606266]">正在检索并分析参考文章</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {aiReferenceSearchAnalyses.map((result) => (
                  <SearchResultCard
                    added={addedReferenceUrls.has(result.url)}
                    key={result.id}
                    onToggle={toggleReference}
                    result={result}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#E4E7ED] bg-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-6">
          <button
            type="button"
            className="h-8 rounded-[6px] border border-[#365EFF] bg-white px-4 text-[14px] font-medium text-[#365EFF] transition hover:bg-[#F4F6FF]"
            onClick={handleBack}
          >
            返回
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-[34px] w-[160px] items-center justify-between rounded-[6px] border border-[#DCDFE6] bg-white px-3 text-[14px] text-[#303133] transition hover:border-[#365EFF]"
                onClick={() => setModelOpen((current) => !current)}
              >
                <span className="inline-flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#00A85F]" />
                  {form.model}
                </span>
                <ChevronDown className="h-4 w-4 text-[#909399]" />
              </button>
              {modelOpen ? (
                <div className="absolute bottom-[42px] right-0 w-[160px] rounded-[8px] border border-[#DCDFE6] bg-white p-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                  {aiModelOptions.map((model) => (
                    <button
                      type="button"
                      key={model}
                      className={`flex h-8 w-full items-center justify-between rounded-[6px] px-2 text-[14px] ${
                        model === form.model ? 'bg-[#EEF2FF] text-[#365EFF]' : 'text-[#303133] hover:bg-[#F5F7FA]'
                      }`}
                      onClick={() => {
                        updateField('model', model);
                        setModelOpen(false);
                      }}
                    >
                      {model}
                      {model === form.model ? <Check className="h-4 w-4" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="h-8 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-medium text-white transition hover:bg-[#2448E8]"
              onClick={handleCreateTask}
            >
              创建任务
            </button>
          </div>
        </div>
      </footer>

      {modal === 'knowledge' ? (
        <KnowledgeModal
          items={knowledgeItems}
          onClose={() => setModal(null)}
          onConfirm={(ids) => {
            updateField('knowledgeItemIds', ids);
            setModal(null);
          }}
          selectedIds={form.knowledgeItemIds}
          types={knowledgeDraft.types}
        />
      ) : null}
      {modal === 'asset' ? (
        <KnowledgeFileModal
          files={knowledgeFiles}
          onClose={() => setModal(null)}
          onConfirm={(ids) => {
            updateField('knowledgeAssetIds', ids);
            setModal(null);
          }}
          selectedIds={form.knowledgeAssetIds}
        />
      ) : null}
      {leaveConfirmOpen ? (
        <ConfirmLeaveDialog
          onCancel={() => setLeaveConfirmOpen(false)}
          onConfirm={() => {
            setLeaveConfirmOpen(false);
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}
