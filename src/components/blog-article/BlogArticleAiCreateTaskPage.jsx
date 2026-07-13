import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Box,
  Check,
  ChevronDown,
  Database,
  FilePenLine,
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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getAudiencePersonaDrafts } from '../../services/audiencePersonaStore.js';
import { createBlogArticleId } from '../../services/blogArticleStore.js';
import { getAiTaskArticleContext } from '../../services/blogArticleAiArticleStore.js';
import { getBrandProfileDraft } from '../../services/brandProfileStore.js';
import AiCreationStepLabel from './AiCreationStepLabel.jsx';
import {
  aiArticleLanguageOptions,
  aiArticleLengthOptions,
  aiArticleTypeOptions,
  aiModelOptions,
  aiPersonOptions,
  aiReferenceSearchAnalyses,
  aiToneOptions,
  saveAiCreationTask,
  splitAiKeywordText,
} from '../../services/blogArticleAiStore.js';
import { listChunks, listFiles } from '../../services/fileLibraryApi.js';
import { getKnowledgeItemDraft } from '../../services/knowledgeItemStore.js';
import { getKnowledgeSelectionData } from '../../services/knowledgeSelectionData.js';
import {
  createKnowledgeSelectionLabels,
  KnowledgeFileSelectionModal,
  KnowledgeItemSelectionModal,
} from '../knowledge-selection/KnowledgeSelectionModals.jsx';

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

function normalizeArticleLanguage(value) {
  if (value === 'EN（英文）') return 'EN';
  if (value === 'CN（中文）') return 'CN';
  return value;
}

function joinKeywordTags(tags) {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(', ');
}

function getRowValue(row, field) {
  if (field.key === 'knowledgeId') {
    return row.knowledgeId ?? '';
  }

  return getDisplayValue(row.cells?.[field.key]);
}

// 从知识表草稿中拉平所有可选知识条目，供创建任务时选择。
function flattenKnowledgeItems(draft) {
  return draft.types.flatMap((type) => {
    const rows = draft.rows[type.id] ?? [];
    const nameField = type.fields.find((field) => field.key === type.nameFieldKey) ?? type.fields[1];
    const bodyField = type.fields.find((field) => field.aiRole === 'body') ?? type.fields[2];
    const sourceUrlField = type.fields.find((field) => field.aiRole === 'sourceUrl');
    const tagsField = type.fields.find((field) => field.aiRole === 'tags');

    return rows.map((row) => ({
      id: row.id,
      typeId: type.id,
      typeName: type.name,
      title: getRowValue(row, nameField) || row.knowledgeId || 'Untitled knowledge',
      summary: getRowValue(row, bodyField),
      sourceUrl: sourceUrlField ? getRowValue(row, sourceUrlField) : '',
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

// 创建任务默认值来自品牌档案、受众画像、知识条目、知识资料和内容种子。
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
    articleLanguage: normalizeArticleLanguage(aiArticleLanguageOptions[0]),
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

function normalizeReferenceArticles(referenceArticles) {
  if (!Array.isArray(referenceArticles)) {
    return [];
  }

  return referenceArticles
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `recreated-reference-${index + 1}`,
          title: '',
          url: item,
          source: 'manual',
        };
      }

      return {
        id: item?.id ?? `recreated-reference-${index + 1}`,
        title: item?.title ?? '',
        url: item?.url ?? '',
        source: item?.source ?? 'manual',
      };
    })
    .filter((item) => item.url);
}

function getIdsFromItems(items) {
  return Array.isArray(items) ? items.map((item) => item?.id).filter(Boolean) : [];
}

// 重新创作会复用原任务输入，并保留当前项目可用的默认知识选择。
function getInitialFormWithRecreateContext(defaultForm, recreateContext) {
  const input = recreateContext?.taskInput;
  if (!input || typeof input !== 'object') {
    return defaultForm;
  }

  const {
    articleTypeForStore,
    knowledgeAssets,
    knowledgeItems,
    targetAudience,
    targetAudienceName,
    ...inputForm
  } = input;
  const recreatedKnowledgeItemIds = Array.isArray(input.knowledgeItemIds)
    ? input.knowledgeItemIds
    : getIdsFromItems(knowledgeItems);
  const recreatedKnowledgeAssetIds = Array.isArray(input.knowledgeAssetIds)
    ? input.knowledgeAssetIds
    : getIdsFromItems(knowledgeAssets);

  return {
    ...defaultForm,
    ...inputForm,
    articleLanguage: normalizeArticleLanguage(input.articleLanguage ?? defaultForm.articleLanguage),
    knowledgeAssetIds: recreatedKnowledgeAssetIds.length ? recreatedKnowledgeAssetIds : defaultForm.knowledgeAssetIds,
    knowledgeItemIds: recreatedKnowledgeItemIds.length ? recreatedKnowledgeItemIds : defaultForm.knowledgeItemIds,
    model: input.model ?? recreateContext.model ?? defaultForm.model,
    referenceArticles: normalizeReferenceArticles(input.referenceArticles),
    searchQuery: input.searchQuery || input.articleTopic || defaultForm.searchQuery,
    secondaryKeywords: Array.isArray(input.secondaryKeywords)
      ? input.secondaryKeywords
      : splitAiKeywordText(input.secondaryKeywords),
    targetAudienceId: input.targetAudienceId || targetAudience?.id || defaultForm.targetAudienceId,
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

function TextArea({
  autoResize = false,
  error,
  maxRows = 10,
  minHeight = 94,
  minRows = 5,
  onBlur,
  onChange,
  placeholder,
  value,
}) {
  const textareaRef = useRef(null);
  const rowLineHeight = 22;
  const verticalChrome = 16;
  const autoMinHeight = minRows * rowLineHeight + verticalChrome;
  const autoMaxHeight = maxRows * rowLineHeight + verticalChrome;
  const resolvedMinHeight = autoResize ? autoMinHeight : minHeight;

  useLayoutEffect(() => {
    if (!autoResize) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';

    const contentHeight = textarea.scrollHeight + 2;
    const nextHeight = Math.min(Math.max(contentHeight, autoMinHeight), autoMaxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = contentHeight > autoMaxHeight ? 'auto' : 'hidden';
  }, [autoMaxHeight, autoMinHeight, autoResize, value]);

  return (
    <textarea
      ref={textareaRef}
      className={`${controlBase} resize-none py-[7px] ${autoResize ? 'overflow-hidden' : ''} ${
        error ? controlError : controlNormal
      }`}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{
        minHeight: resolvedMinHeight,
        ...(autoResize ? { maxHeight: autoMaxHeight } : {}),
      }}
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

function TagInput({ error, limitText = '已达到上限', maxTags, onChange, placeholder, removeLabel = '删除', value }) {
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
      className={`h-[86px] rounded-[6px] border bg-white px-3 py-2 transition hover:border-[#C8D2FF] focus-within:border-[#365EFF] focus-within:ring-2 focus-within:ring-[#365EFF]/10 ${
        error ? controlError : controlNormal
      }`}
    >
      <div className="flex h-full min-w-0 flex-wrap content-start items-start gap-2 overflow-y-auto pr-1">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-7 min-w-0 max-w-full items-center gap-1 rounded-full border border-[#CCD6FF] bg-[#F4F6FF] px-2.5 text-[14px] leading-[20px] text-[#365EFF]"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="rounded-full text-[#365EFF] hover:bg-white"
              onClick={() => removeTag(tag)}
              aria-label={`${removeLabel} ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="h-7 min-w-[120px] flex-1 border-none bg-transparent px-1 text-[14px] leading-[22px] text-[#303133] outline-none placeholder:text-[#A8ABB2] disabled:cursor-not-allowed"
          disabled={isFull}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={value.length ? '' : isFull ? limitText : placeholder}
          value={draft}
        />
      </div>
    </div>
  );
}

function SegmentedControl({ getOptionLabel = (option) => option, onChange, options, value }) {
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
          {getOptionLabel(option)}
        </button>
      ))}
    </div>
  );
}

function SummaryButton({ count, disabled, icon: Icon, label, onClick, placeholder, selectedLabel }) {
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
        <span className="truncate">{count ? selectedLabel(count) : placeholder}</span>
      </span>
      <ChevronDown className="h-4 w-4 flex-none text-[#909399]" />
    </button>
  );
}

function UrlList({ addLabel, emptyText, errorPrefix, label, onChange, placeholder, removeLabel, values }) {
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
                  aria-label={`${removeLabel ?? '删除'}${label}`}
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
          {emptyText ?? `暂未添加${label}`}
        </div>
      )}
      <IconButton icon={Plus} onClick={() => onChange([...values, ''])}>
        {addLabel ?? `添加${label}`}
      </IconButton>
    </div>
  );
}

function AudienceSelect({ error, locale, onChange, personas, value }) {
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
          {selected?.name ?? (locale === 'en-US' ? 'Select audience' : '请选择目标受众')}
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
              placeholder={locale === 'en-US' ? 'Search audience' : '搜索受众'}
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

function KnowledgeModal({ copy, items, locale, onClose, onConfirm, selectedIds, types }) {
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
                    <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">
                      {locale === 'en-US' ? `${count} items` : `${count} 个条目`}
                    </span>
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
    <ModalShell title={locale === 'en-US' ? copy.fields.knowledgeItems : '选择知识条目'} widthClass="max-w-[980px]" onClose={onClose}>
      <div className="grid h-[560px] grid-cols-[340px_minmax(0,1fr)_320px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
            <input
              className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === 'en-US' ? 'Search knowledge types' : '搜索知识类型'}
              value={query}
            />
          </div>
          <div className="h-[494px] space-y-5 overflow-y-auto pr-1">
            {renderTypeGroup(
              locale === 'en-US' ? 'Presets' : '系统预设',
              presetTypes,
              locale === 'en-US' ? 'No matching presets' : '暂无匹配预设类型',
            )}
            {renderTypeGroup(
              locale === 'en-US' ? 'Custom' : '自定义',
              customTypes,
              locale === 'en-US'
                ? typeQuery
                  ? 'No matching custom types'
                  : 'No custom types'
                : typeQuery
                  ? '暂无匹配自定义类型'
                  : '暂无自定义类型',
            )}
          </div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">
            {locale === 'en-US' ? 'Item List' : '条目列表'}
          </div>
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
                {locale === 'en-US' ? 'No matching knowledge items' : '暂无匹配知识条目'}
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden px-6 py-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">
            {locale === 'en-US' ? 'Selected Items' : '已选知识条目'}
          </div>
          <SelectedList
            emptyText={locale === 'en-US' ? 'No knowledge items selected' : '暂未选择知识条目'}
            items={selectedItems}
            onRemove={toggle}
          />
        </div>
      </div>
      <ModalActions copy={copy} onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}

function KnowledgeFileModal({ copy, files, locale, onClose, onConfirm, selectedIds }) {
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
    const allLabel =
      type === 'tag'
        ? locale === 'en-US'
          ? 'All Tags'
          : '全部标签'
        : locale === 'en-US'
          ? 'All Types'
          : '全部类型';
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
                    <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">
                      {locale === 'en-US' ? `${row.count} files` : `${row.count} 个文件`}
                    </span>
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
    <ModalShell title={locale === 'en-US' ? copy.fields.knowledgeAssets : '选择知识资料'} widthClass="max-w-[1180px]" onClose={onClose}>
      <div className="grid h-[600px] grid-cols-[300px_minmax(0,1fr)_360px] overflow-hidden border-t border-[#EBEEF5]">
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
            <input
              className="h-[34px] w-full rounded-[6px] border border-[#DCDFE6] pl-9 pr-3 text-[13px] outline-none focus:border-[#365EFF]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === 'en-US' ? 'Search files' : '搜索资料库文件'}
              value={query}
            />
          </div>
          <div className="h-[530px] space-y-5 overflow-y-auto pr-1">
            {renderFilterGroup({
              emptyText: locale === 'en-US' ? 'No file types' : '暂无可筛选文件类型',
              icon: FileText,
              label: locale === 'en-US' ? 'File Type' : '文件类型',
              options: fileTypeOptions,
              type: 'fileType',
            })}
            {renderFilterGroup({
              emptyText: locale === 'en-US' ? 'No tags' : '暂无可筛选标签',
              icon: Layers3,
              label: locale === 'en-US' ? 'Tags' : '标签',
              options: tagOptions,
              type: 'tag',
            })}
          </div>
        </div>
        <div className="min-w-0 border-r border-[#EBEEF5] px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold leading-[22px] text-[#303133]">
            <ChevronDown className="h-4 w-4 text-[#909399]" />
            <span>{locale === 'en-US' ? 'File List' : '资料库文件'}</span>
            <span className="text-[12px] font-normal text-[#909399]">
              {locale === 'en-US' ? `${visibleFiles.length} files` : `共 ${visibleFiles.length} 个`}
            </span>
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
                {locale === 'en-US' ? 'No matching files' : '暂无匹配资料库文件'}
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden px-6 py-4">
          <div className="mb-3 text-[14px] font-semibold leading-[22px] text-[#303133]">
            {locale === 'en-US' ? 'Selected Files' : '已选知识库文件'}
          </div>
          <SelectedList
            emptyText={locale === 'en-US' ? 'No knowledge files selected' : '暂未选择知识资料'}
            items={selectedFiles}
            onRemove={toggle}
          />
        </div>
      </div>
      <ModalActions copy={copy} onCancel={onClose} onConfirm={() => onConfirm(draftSelected)} />
    </ModalShell>
  );
}

function ModalShell({ children, onClose, title, widthClass }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className={`max-h-[calc(100vh-80px)] w-full overflow-hidden rounded-[8px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${widthClass}`}>
        <div className="flex h-[64px] items-center justify-between px-8">
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

function ModalActions({ copy, onCancel, onConfirm }) {
  return (
    <div className="flex h-[64px] items-center justify-end gap-3 border-t border-[#EBEEF5] px-8">
      <button
        type="button"
        className="h-8 rounded-[6px] border border-[#365EFF] bg-white px-4 text-[14px] font-medium text-[#365EFF] transition hover:bg-[#F4F6FF]"
        onClick={onCancel}
      >
        {copy.actions.cancel}
      </button>
      <button
        type="button"
        className="h-8 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-medium text-white transition hover:bg-[#2448E8]"
        onClick={onConfirm}
      >
        {copy.actions.confirm}
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

function SelectedFilePreview({ files }) {
  if (!files.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2">
      {files.map((file) => (
        <div key={file.id} className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[4px] bg-[#365EFF] text-white">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-[18px] text-[#303133]">
            {file.fileName || file.title}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConfirmLeaveDialog({ copy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[500px] rounded-[8px] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
        <h3 className="text-[18px] font-bold leading-[26px] text-[#303133]">{copy.dialog.leaveTitle}</h3>
        <p className="mt-3 text-[14px] leading-[22px] text-[#606266]">
          {copy.dialog.leaveBody}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="h-8 whitespace-nowrap rounded-[6px] border border-[#DCDFE6] bg-white px-4 text-[14px] text-[#303133] transition hover:bg-[#F5F7FA]"
            onClick={onCancel}
          >
            {copy.actions.continue}
          </button>
          <button
            type="button"
            className="h-8 whitespace-nowrap rounded-[6px] bg-[#365EFF] px-4 text-[14px] text-white transition hover:bg-[#2448E8]"
            onClick={onConfirm}
          >
            {copy.actions.leave}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ added, copy, locale, result, onToggle }) {
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
          {added ? copy.actions.added : copy.actions.addReference}
        </button>
      </div>
      <p className="line-clamp-3 text-[13px] leading-[20px] text-[#606266]">{result.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#E4E7ED] bg-[#F7F8FB] px-2.5 py-1 text-[12px] font-medium leading-[18px] text-[#606266]">
          {result.articleType}
        </span>
        <span className="text-[12px] font-medium leading-[18px] text-[#909399]">
          {locale === 'en-US' ? 'Relevance' : '相关度'} {result.relevance}
        </span>
        <span className="text-[12px] font-medium leading-[18px] text-[#909399]">
          {result.relevanceLabel}
        </span>
      </div>
    </article>
  );
}

export default function BlogArticleAiCreateTaskPage({
  locale,
  mode = 'collaborative',
  onClose,
  onCreated,
  project,
  recreateContext,
  t,
}) {
  // 创建页只收集任务输入，真正的生成过程由后续阶段页面负责展示。
  const copy = t.blogArticle.aiCreation;
  const isAutoMode = mode === 'auto';
  const selectedLabel = (count) => (locale === 'en-US' ? `${count} selected` : `已选择 ${count} 项`);
  const knowledgeSelectionLabels = useMemo(
    () => createKnowledgeSelectionLabels(locale, {
      cancel: copy.actions.cancel,
      confirm: copy.actions.confirm,
      knowledgeFiles: copy.fields.knowledgeAssets,
      knowledgeItems: copy.fields.knowledgeItems,
    }),
    [copy, locale],
  );
  const brandProfile = useMemo(() => getBrandProfileDraft(project), [project]);
  const personas = useMemo(() => getAudiencePersonaDrafts(project), [project]);
  const knowledgeSelectionData = useMemo(() => getKnowledgeSelectionData(project), [project]);
  const knowledgeDraft = useMemo(() => ({ types: knowledgeSelectionData.types }), [knowledgeSelectionData.types]);
  const knowledgeItems = knowledgeSelectionData.items;
  const knowledgeFiles = knowledgeSelectionData.files;
  const initialForm = useMemo(
    () =>
      getInitialFormWithRecreateContext(
        getInitialForm({ brandProfile, knowledgeFiles, knowledgeItems, personas, project }),
        recreateContext,
      ),
    [brandProfile, knowledgeFiles, knowledgeItems, personas, project, recreateContext],
  );
  const initialSnapshot = useRef(JSON.stringify(initialForm));
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    // 项目或重新创作上下文变化时，重置表单和脏数据基准。
    const normalizedInitialForm = {
      ...initialForm,
      articleLanguage: normalizeArticleLanguage(initialForm.articleLanguage),
    };
    setForm(normalizedInitialForm);
    initialSnapshot.current = JSON.stringify(normalizedInitialForm);
  }, [initialForm]);

  const selectedKnowledgeItems = knowledgeItems.filter((item) => form.knowledgeItemIds.includes(item.id));
  const selectedAssets = knowledgeFiles.filter((file) => form.knowledgeAssetIds.includes(file.id));
  const selectedAudience = personas.find((persona) => persona.id === form.targetAudienceId);
  const hasDirtyChanges = JSON.stringify(form) !== initialSnapshot.current;
  const addedReferenceUrls = new Set(form.referenceArticles.map((item) => item.url));
  const referenceSearchAnalyses = recreateContext?.searchAnalyses?.length
    ? recreateContext.searchAnalyses
    : aiReferenceSearchAnalyses;

  function updateField(field, value) {
    // 字段更新后清除对应错误，语言字段统一压缩为 EN/CN。
    setForm((current) => ({ ...current, [field]: field === 'articleLanguage' ? normalizeArticleLanguage(value) : value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    // 校验失败时滚动到首个错误字段，减少长表单定位成本。
    const nextErrors = {};
    const requiredFields = [
      ['targetRegion', copy.fields.targetRegion],
      ['articleLanguage', copy.fields.articleLanguage],
      ['targetAudienceId', copy.fields.targetAudience],
      ['businessGoal', copy.fields.businessGoal],
      ['articleTopic', copy.fields.articleTopic],
      ['primaryKeyword', copy.fields.primaryKeyword],
      ['articleType', copy.fields.articleType],
      ['articleLength', copy.fields.articleLength],
      ['tone', copy.fields.tone],
      ['person', copy.fields.person],
    ];

    requiredFields.forEach(([field, label]) => {
      const value = form[field];
      if (Array.isArray(value) ? !value.length : !String(value ?? '').trim()) {
        nextErrors[field] = locale === 'en-US' ? `Enter ${label}` : `请输入「${label}」`;
      }
    });

    const invalidReference = form.referenceArticles.some((item) => item.url.trim() && !isValidUrl(item.url));
    if (invalidReference) {
      nextErrors.referenceArticles =
        locale === 'en-US' ? 'Reference URL format is invalid.' : '参考文章链接格式错误，请检查链接格式。';
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
    // 表单有改动时先确认离开，避免任务输入草稿丢失。
    if (hasDirtyChanges) {
      setLeaveConfirmOpen(true);
      return;
    }

    onClose();
  }

  function handleAnalyze() {
    // 参考文章分析当前使用本地模拟延迟，后续可替换为真实检索。
    setAnalyzing(true);
    window.setTimeout(() => setAnalyzing(false), 650);
  }

  function toggleReference(result) {
    // 搜索结果重复点击会从参考文章列表中移除。
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
    // 手动输入 URL 时尽量保留已有标题和来源标记。
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
    // 创建任务时固化当前选中的受众、知识条目和资料快照。
    if (!validate()) {
      return;
    }

    const task = saveAiCreationTask(project.id, {
      articleId: createBlogArticleId(),
      model: form.model,
      mode,
      stage: isAutoMode ? 'auto-generating' : 'planning',
      taskInput: {
        ...form,
        targetAudience: selectedAudience,
        targetAudienceName: selectedAudience?.name ?? selectedAudience?.title ?? '',
        articleTypeForStore: getArticleTypeForStore(form.articleType),
        knowledgeItems: selectedKnowledgeItems,
        knowledgeAssets: selectedAssets,
      },
      searchAnalyses: referenceSearchAnalyses,
    });
    const article = getAiTaskArticleContext(project, task);

    onCreated({ article, mode, task });
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
          <h1 className="w-[360px] text-[18px] font-bold leading-[28px] text-[#232E45]">
            {isAutoMode ? copy.titles.autoCreate : copy.titles.create}
          </h1>
          {isAutoMode ? (
            <div className="flex-1" />
          ) : (
            <div className="flex flex-1 items-center justify-center gap-5">
              {copy.steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-bold ${
                      index === 0 ? 'bg-[#365EFF] text-white' : 'bg-[#EEF0F4] text-[#A8ABB2]'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <AiCreationStepLabel active={index === 0} step={step} />
                  {index < 3 ? <span className="h-px w-12 bg-[#E4E7ED]" /> : null}
                </div>
              ))}
            </div>
          )}
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
          <FormCard icon={FileText} title={copy.form.goalTitle} subtitle={copy.form.goalSubtitle}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field error={errors.targetRegion} fieldKey="targetRegion" label={copy.fields.targetRegion} required>
                <SelectField
                  error={errors.targetRegion}
                  onChange={(value) => updateField('targetRegion', value)}
                  options={targetRegionOptions}
                  value={form.targetRegion}
                />
              </Field>
              <Field error={errors.articleLanguage} fieldKey="articleLanguage" label={copy.fields.articleLanguage} required>
                <SelectField
                  error={errors.articleLanguage}
                  onChange={(value) => updateField('articleLanguage', value)}
                  options={aiArticleLanguageOptions}
                  value={form.articleLanguage}
                />
              </Field>
              <div className="col-span-2">
                <Field error={errors.targetAudienceId} fieldKey="targetAudienceId" label={copy.fields.targetAudience} required>
                  <AudienceSelect
                    error={errors.targetAudienceId}
                    locale={locale}
                    onChange={(value) => updateField('targetAudienceId', value)}
                    personas={personas}
                    value={form.targetAudienceId}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field error={errors.businessGoal} fieldKey="businessGoal" label={copy.fields.businessGoal} required>
                  <TextArea
                    error={errors.businessGoal}
                    minHeight={64}
                    onChange={(value) => updateField('businessGoal', value)}
                    placeholder={copy.placeholders.businessGoal}
                    value={form.businessGoal}
                  />
                </Field>
              </div>
            </div>
          </FormCard>

          <FormCard icon={Database} title={copy.form.sourcesTitle} subtitle={copy.form.sourcesSubtitle}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field fieldKey="knowledgeItemIds" label={copy.fields.knowledgeItems}>
                <SummaryButton
                  count={form.knowledgeItemIds.length}
                  icon={Layers3}
                  onClick={() => setModal('knowledge')}
                  placeholder={copy.placeholders.knowledgeItems}
                  selectedLabel={selectedLabel}
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
              <Field fieldKey="knowledgeAssetIds" label={copy.fields.knowledgeAssets}>
                <SummaryButton
                  count={form.knowledgeAssetIds.length}
                  icon={Database}
                  onClick={() => setModal('asset')}
                  placeholder={copy.placeholders.knowledgeAssets}
                  selectedLabel={selectedLabel}
                />
                <SelectedFilePreview files={selectedAssets} />
              </Field>
              <div className="col-span-2">
                <Field error={errors.referenceArticles} fieldKey="referenceArticles" label={copy.fields.referenceArticles}>
                  <UrlList
                    addLabel={locale === 'en-US' ? 'Add Article URL' : undefined}
                    emptyText={locale === 'en-US' ? 'No article URLs added' : undefined}
                    errorPrefix={
                      locale === 'en-US' ? 'Reference URL format is invalid.' : '参考文章链接格式错误，请检查链接格式。'
                    }
                    label={locale === 'en-US' ? 'Article URL' : '文章链接'}
                    onChange={updateReferenceUrlList}
                    placeholder="https://example.com/article"
                    removeLabel={locale === 'en-US' ? 'Remove ' : undefined}
                    values={form.referenceArticles.map((item) => item.url)}
                  />
                </Field>
              </div>
            </div>
          </FormCard>

          <FormCard icon={FilePenLine} title={copy.form.directionTitle} subtitle={copy.form.directionSubtitle}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <Field error={errors.articleTopic} fieldKey="articleTopic" label={copy.fields.articleTopic} required>
                  <TextInput
                    error={errors.articleTopic}
                    onChange={(value) => {
                      updateField('articleTopic', value);
                      updateField('searchQuery', value);
                    }}
                    placeholder={copy.placeholders.articleTopic}
                    value={form.articleTopic}
                  />
                </Field>
              </div>
              <Field error={errors.primaryKeyword} fieldKey="primaryKeyword" label={copy.fields.primaryKeyword} required>
                <TagInput
                  error={errors.primaryKeyword}
                  limitText={locale === 'en-US' ? 'Limit reached' : undefined}
                  maxTags={2}
                  onChange={(tags) => updateField('primaryKeyword', joinKeywordTags(tags))}
                  placeholder={copy.placeholders.primaryKeyword}
                  value={splitAiKeywordText(form.primaryKeyword)}
                />
              </Field>
              <Field fieldKey="secondaryKeywords" label={copy.fields.secondaryKeywords}>
                <TagInput
                  limitText={locale === 'en-US' ? 'Limit reached' : undefined}
                  onChange={(tags) => updateField('secondaryKeywords', tags)}
                  placeholder={copy.placeholders.secondaryKeywords}
                  value={form.secondaryKeywords}
                />
              </Field>
              <Field error={errors.articleType} fieldKey="articleType" label={copy.fields.articleType} required>
                <SelectField
                  error={errors.articleType}
                  onChange={(value) => updateField('articleType', value)}
                  options={aiArticleTypeOptions}
                  value={form.articleType}
                />
              </Field>
              <Field error={errors.articleLength} fieldKey="articleLength" label={copy.fields.articleLength} required>
                <SelectField
                  error={errors.articleLength}
                  onChange={(value) => updateField('articleLength', value)}
                  options={aiArticleLengthOptions}
                  value={form.articleLength}
                />
              </Field>
              <Field error={errors.tone} fieldKey="tone" label={copy.fields.tone} required>
                <SelectField
                  error={errors.tone}
                  onChange={(value) => updateField('tone', value)}
                  options={aiToneOptions}
                  value={form.tone}
                />
              </Field>
              <Field error={errors.person} fieldKey="person" label={copy.fields.person} required>
                <SegmentedControl
                  getOptionLabel={(option) => {
                    if (locale !== 'en-US') return option;
                    return {
                      第一人称: 'First',
                      第二人称: 'Second',
                      第三人称: 'Third',
                    }[option] ?? option;
                  }}
                  onChange={(value) => updateField('person', value)}
                  options={aiPersonOptions}
                  value={form.person}
                />
              </Field>
              <div className="col-span-2">
                <Field
                  fieldKey="brandRequirements"
                  hint={
                    locale === 'en-US'
                      ? 'Auto-filled from the brand profile. You can adjust it for this brief.'
                      : '已从品牌档案自动带入，可按本次任务调整'
                  }
                  label={copy.fields.brandRequirements}
                >
                  <TextArea
                    autoResize
                    maxRows={10}
                    minRows={5}
                    onChange={(value) => updateField('brandRequirements', value)}
                    placeholder={copy.placeholders.brandRequirements}
                    value={form.brandRequirements}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field fieldKey="additionalRequirements" label={copy.fields.additionalRequirements}>
                  <TextArea
                    autoResize
                    maxRows={10}
                    minRows={5}
                    onChange={(value) => updateField('additionalRequirements', value)}
                    placeholder={copy.placeholders.additionalRequirements}
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
              <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">
                {copy.form.topArticlesTitle}
              </h2>
              <p className="text-[13px] leading-[20px] text-[#909399]">{copy.form.topArticlesSubtitle}</p>
            </div>
            <div className="flex gap-2">
              <span className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8ABB2]" />
                <input
                  className={`${controlBase} ${controlNormal} pl-9`}
                  onChange={(event) => updateField('searchQuery', event.target.value)}
                  placeholder={copy.placeholders.searchTopic}
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
                <span className="whitespace-nowrap">{analyzing ? copy.actions.searching : copy.actions.search}</span>
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-[18px] text-[#909399]">
              {locale === 'en-US' ? copy.fields.articleLanguage : '语言'}：{form.articleLanguage}　
              {locale === 'en-US' ? copy.fields.targetRegion : '地区'}：{form.targetRegion}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {analyzing ? (
              <div className="grid h-full place-items-center rounded-[8px] border border-dashed border-[#DCDFE6]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#365EFF]" />
                  <p className="mt-3 text-[14px] leading-[22px] text-[#606266]">
                    {locale === 'en-US' ? 'Searching and analyzing references' : '正在检索并分析参考文章'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {referenceSearchAnalyses.map((result) => (
                  <SearchResultCard
                    added={addedReferenceUrls.has(result.url)}
                    copy={copy}
                    key={result.id}
                    locale={locale}
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
            className="h-8 whitespace-nowrap rounded-[6px] border border-[#365EFF] bg-white px-4 text-[14px] font-medium text-[#365EFF] transition hover:bg-[#F4F6FF]"
            onClick={handleBack}
          >
            {copy.actions.back}
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
              className="h-8 whitespace-nowrap rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-medium text-white transition hover:bg-[#2448E8]"
              onClick={handleCreateTask}
            >
              {copy.actions.createTask}
            </button>
          </div>
        </div>
      </footer>

      {modal === 'knowledge' ? (
        <KnowledgeItemSelectionModal
          items={knowledgeItems}
          labels={knowledgeSelectionLabels}
          locale={locale}
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
        <KnowledgeFileSelectionModal
          files={knowledgeFiles}
          labels={knowledgeSelectionLabels}
          locale={locale}
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
          copy={copy}
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
