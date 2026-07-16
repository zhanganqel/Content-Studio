import { ChevronDown, Database, Layers3, X } from 'lucide-react';
import { useState } from 'react';

const controlClass =
  'h-[34px] w-full rounded-[6px] border border-[#DCDFE6] bg-white px-3 text-[14px] leading-[22px] text-[#303133] outline-none transition placeholder:text-[#A8ABB2] hover:border-[#C8D2FF] focus:border-[#365EFF] focus:ring-2 focus:ring-[#365EFF]/10';

export function FormField({ children, error, hint, label, required = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-1 text-[14px] font-medium leading-[22px] text-[#303133]">
        {label}
        {required ? <span className="text-[#FF4346]">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[12px] leading-[18px] text-[#FF4346]">{error}</span> : null}
      {hint && !error ? <span className="mt-1 block text-[12px] leading-[18px] text-[#909399]">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ onChange, placeholder = '', value = '' }) {
  return <input className={controlClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

export function SelectInput({ onChange, options = [], placeholder = '', value = '' }) {
  return (
    <span className="relative block">
      <select className={`${controlClass} appearance-none pr-9`} value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const normalized = typeof option === 'string' ? { label: option, value: option } : option;
          return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#909399]" />
    </span>
  );
}

export function TextArea({ minHeight = 72, onChange, placeholder = '', value = '' }) {
  return (
    <textarea
      className={`${controlClass} h-auto resize-none py-2`}
      style={{ minHeight }}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function KeywordTagInput({ maxTags, onChange, placeholder = '', value = [] }) {
  const [draft, setDraft] = useState('');
  const full = Boolean(maxTags && value.length >= maxTags);

  function addTag() {
    const nextTag = draft.trim();
    if (!nextTag || value.includes(nextTag) || full) {
      setDraft('');
      return;
    }
    onChange([...value, nextTag]);
    setDraft('');
  }

  return (
    <div className="h-[86px] rounded-[6px] border border-[#DCDFE6] bg-white px-3 py-2 transition hover:border-[#C8D2FF] focus-within:border-[#365EFF] focus-within:ring-2 focus-within:ring-[#365EFF]/10">
      <div className="flex h-full min-w-0 flex-wrap content-start items-start gap-2 overflow-y-auto pr-1">
        {value.map((tag) => (
          <span key={tag} className="inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-[#CCD6FF] bg-[#F4F6FF] px-2.5 text-[14px] text-[#365EFF]">
            <span className="truncate">{tag}</span>
            <button type="button" className="grid h-4 w-4 place-items-center rounded-full hover:bg-white" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`删除 ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="h-7 min-w-[120px] flex-1 border-none bg-transparent px-1 text-[14px] text-[#303133] outline-none placeholder:text-[#A8ABB2]"
          disabled={full}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
        />
      </div>
    </div>
  );
}

export function ResourceSelectField({ count, icon: Icon, items = [], label, onOpen, placeholder }) {
  return (
    <div>
      <button type="button" className="flex h-[34px] w-full items-center justify-between rounded-[6px] border border-[#DCDFE6] bg-white px-3 text-left text-[14px] text-[#303133] transition hover:border-[#365EFF]" onClick={onOpen}>
        <span className="inline-flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 flex-none text-[#365EFF]" />
          <span className="truncate">{count ? `已选择 ${count} 项` : placeholder}</span>
        </span>
        <ChevronDown className="h-4 w-4 flex-none text-[#909399]" />
      </button>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#F4F6FF] px-2.5 py-1 text-[12px] text-[#365EFF]">
              <span className="truncate">{item.title || item.fileName}</span>
            </span>
          ))}
        </div>
      ) : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function TitleSelector({ locale = 'zh-CN', onSelect, options = [], selectedTitleId = '' }) {
  return (
    <div className="border-l-2 border-[#E4E7ED] pl-5">
      <div className="text-[14px] font-semibold leading-[22px] text-[#303133]">
        {locale === 'en-US' ? 'Choose a title:' : '请在以下标题中进行选择：'}
      </div>
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const selected = option.id === selectedTitleId;
          return (
            <button
              key={option.id}
              type="button"
              className={`flex min-h-[42px] w-full items-center rounded-[6px] border px-3 text-left text-[14px] leading-[22px] transition ${selected ? 'border-[#365EFF] bg-white text-[#303133] shadow-[0_0_0_1px_rgba(54,94,255,0.04)]' : 'border-[#DCDFE6] bg-white text-[#606266] hover:border-[#C8D2FF]'}`}
              onClick={() => onSelect(option)}
            >
              <span className="min-w-0 flex-1 break-words">{option.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ArticleTaskForm({ block, knowledgeFiles, knowledgeItems, locale = 'zh-CN', onChange, onOpenKnowledge, onSubmit }) {
  const values = block.values ?? {};
  const update = (field, value) => onChange({ ...values, [field]: value });
  const selectedItems = knowledgeItems.filter((item) => block.knowledgeItemIds?.includes(item.id));
  const selectedFiles = knowledgeFiles.filter((item) => block.knowledgeFileIds?.includes(item.id));
  const zh = locale !== 'en-US';
  const articleLanguage = values.articleLanguage ?? values.language ?? '';
  const articleTopic = values.articleTopic ?? values.topic ?? '';
  const additionalRequirements = values.additionalRequirements ?? values.requirements ?? '';
  const requiredValues = {
    articleLanguage,
    articleLength: values.articleLength,
    articleTopic,
    articleType: values.articleType,
    businessGoal: values.businessGoal,
    person: values.person,
    primaryKeywords: values.primaryKeywords,
    targetAudience: values.targetAudience,
    targetRegion: values.targetRegion,
    tone: values.tone,
  };
  const missingFields = Object.entries(requiredValues)
    .filter(([, value]) => (Array.isArray(value) ? !value.length : !String(value ?? '').trim()))
    .map(([field]) => field);
  const referenceText = (values.referenceArticles ?? []).map((item) => item.url).filter(Boolean).join('\n');
  if (
    block.missingFields?.includes('referenceArticles') &&
    !referenceText &&
    !selectedItems.length &&
    !selectedFiles.length
  ) {
    missingFields.push('referenceArticles');
  }
  const withCurrentOption = (options, current) => current && !options.includes(current) ? [current, ...options] : options;

  function updateReferences(text) {
    const previousByUrl = new Map((values.referenceArticles ?? []).map((item) => [item.url, item]));
    const referenceArticles = text.split('\n').map((url) => url.trim()).filter(Boolean).map((url, index) => ({
      ...(previousByUrl.get(url) ?? {}),
      id: previousByUrl.get(url)?.id ?? `copilot-reference-${index + 1}`,
      url,
    }));
    update('referenceArticles', referenceArticles);
  }

  const normalizedValues = {
    ...values,
    additionalRequirements,
    articleLanguage,
    articleTopic,
    primaryKeywords: values.primaryKeywords ?? [],
    referenceArticles: values.referenceArticles ?? [],
    secondaryKeywords: values.secondaryKeywords ?? [],
  };

  return (
    <div className="rounded-[8px] border border-[#EBEEF5] bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
        <FormField label={zh ? '目标地区' : 'Target region'} required><SelectInput placeholder={zh ? '请选择目标地区' : 'Select target region'} value={values.targetRegion ?? ''} onChange={(value) => update('targetRegion', value)} options={withCurrentOption(['Global', 'United States', 'Europe'], values.targetRegion)} /></FormField>
        <FormField label={zh ? '文章语言' : 'Language'} required><SelectInput placeholder={zh ? '请选择文章语言' : 'Select language'} value={articleLanguage} onChange={(value) => update('articleLanguage', value)} options={withCurrentOption(['EN', 'CN'], articleLanguage)} /></FormField>
        <div className="lg:col-span-2"><FormField label={zh ? '目标受众' : 'Target audience'} required><TextArea minHeight={72} value={values.targetAudience ?? ''} onChange={(value) => update('targetAudience', value)} placeholder={zh ? '描述目标读者及其关注点' : 'Describe the target audience'} /></FormField></div>
        <div className="lg:col-span-2"><FormField label={zh ? '业务目标' : 'Business goal'} required><TextArea minHeight={72} value={values.businessGoal ?? ''} onChange={(value) => update('businessGoal', value)} placeholder={zh ? '说明文章希望推动的业务结果' : 'Describe the desired business outcome'} /></FormField></div>
        <div className="lg:col-span-2"><FormField label={zh ? '文章主题' : 'Article topic'} required><TextInput value={articleTopic} onChange={(value) => update('articleTopic', value)} placeholder={zh ? '请输入文章主题' : 'Enter article topic'} /></FormField></div>
        <FormField label={zh ? '主要关键词' : 'Primary keywords'} required><KeywordTagInput maxTags={2} value={values.primaryKeywords ?? []} onChange={(value) => update('primaryKeywords', value)} placeholder={zh ? '输入后按回车添加' : 'Type and press Enter'} /></FormField>
        <FormField label={zh ? '次要关键词' : 'Secondary keywords'}><KeywordTagInput value={values.secondaryKeywords ?? []} onChange={(value) => update('secondaryKeywords', value)} placeholder={zh ? '输入后按回车添加' : 'Type and press Enter'} /></FormField>
        <FormField label={zh ? '知识条目' : 'Knowledge items'}><ResourceSelectField count={selectedItems.length} icon={Layers3} items={selectedItems} label="knowledge items" placeholder={zh ? '选择知识条目' : 'Select knowledge items'} onOpen={() => onOpenKnowledge('items')} /></FormField>
        <FormField label={zh ? '知识文件' : 'Knowledge files'}><ResourceSelectField count={selectedFiles.length} icon={Database} items={selectedFiles} label="knowledge files" placeholder={zh ? '选择知识文件' : 'Select knowledge files'} onOpen={() => onOpenKnowledge('files')} /></FormField>
        <div className="lg:col-span-2"><FormField label={zh ? '参考文章' : 'Reference articles'} hint={zh ? '每行填写一个 URL；只有链接且没有正文时，后端不会推测页面内容。' : 'One URL per line.'}><TextArea minHeight={72} value={referenceText} onChange={updateReferences} placeholder="https://example.com/article" /></FormField></div>
        <FormField label={zh ? '文章类型' : 'Article type'} required><SelectInput placeholder={zh ? '请选择文章类型' : 'Select article type'} value={values.articleType ?? ''} onChange={(value) => update('articleType', value)} options={withCurrentOption(zh ? ['产品介绍', '比较指南', '行业洞察'] : ['Product Review', 'Comparison Guide', 'Industry Insight'], values.articleType)} /></FormField>
        <FormField label={zh ? '文章长度' : 'Article length'} required><SelectInput placeholder={zh ? '请选择文章长度' : 'Select article length'} value={values.articleLength ?? ''} onChange={(value) => update('articleLength', value)} options={withCurrentOption(['1200-1400', '1600-1800', '2000+'], values.articleLength)} /></FormField>
        <FormField label={zh ? '语气' : 'Tone'} required><SelectInput placeholder={zh ? '请选择语气' : 'Select tone'} value={values.tone ?? ''} onChange={(value) => update('tone', value)} options={withCurrentOption(zh ? ['专业', '客观', '易理解'] : ['Professional', 'Objective', 'Accessible'], values.tone)} /></FormField>
        <FormField label={zh ? '人称' : 'Point of view'} required><SelectInput placeholder={zh ? '请选择人称' : 'Select point of view'} value={values.person ?? ''} onChange={(value) => update('person', value)} options={withCurrentOption(zh ? ['第一人称', '第二人称', '第三人称'] : ['First person', 'Second person', 'Third person'], values.person)} /></FormField>
        <div className="lg:col-span-2"><FormField label={zh ? '品牌要求' : 'Brand requirements'}><TextArea minHeight={72} value={values.brandRequirements ?? ''} onChange={(value) => update('brandRequirements', value)} placeholder={zh ? '仅填写本次任务需要遵循的品牌表达要求。' : 'Add explicit brand requirements for this task.'} /></FormField></div>
        <div className="lg:col-span-2"><FormField label={zh ? '补充生成要求' : 'Additional requirements'}><TextArea minHeight={94} value={additionalRequirements} onChange={(value) => update('additionalRequirements', value)} placeholder={zh ? '补充格式、FAQ、标题结构或禁用词等要求。' : 'Add formatting, FAQ, structure, or forbidden-word requirements.'} /></FormField></div>
      </div>
      {block.uncertainFields?.length ? <p className="mt-4 rounded-[6px] bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-700">{zh ? '以下字段来自自动提取，请重点确认：' : 'Please verify extracted fields: '}{block.uncertainFields.join('、')}</p> : null}
      {onSubmit ? (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#EBEEF5] pt-4">
          <span className="text-[12px] text-[#909399]">{missingFields.length ? (zh ? `还需补充 ${missingFields.length} 个必填字段` : `${missingFields.length} required fields missing`) : (zh ? '字段已完整，请确认后开始执行。' : 'Ready to start after confirmation.')}</span>
          <button type="button" disabled={missingFields.length > 0 || block.submitted} className="inline-flex h-9 items-center rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#C0C4CC]" onClick={() => onSubmit(normalizedValues)}>{block.submitted ? (zh ? '已提交' : 'Submitted') : block.submitLabel || (zh ? '确认并生成策划' : 'Confirm and generate')}</button>
        </div>
      ) : null}
    </div>
  );
}
