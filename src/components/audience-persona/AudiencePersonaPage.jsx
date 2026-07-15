import {
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  SearchCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptivePageLayout } from '../layoutClasses.js';
import Button from '../ui/Button.jsx';
import ListCard from '../ui/ListCard.jsx';
import Toast from '../ui/Toast.jsx';
import {
  contentDepthOptions,
  contentTypeOptions,
  createEmptyAudiencePersona,
  createPersonaId,
  expressionStyleOptions,
  getAudiencePersonaDrafts,
  getTodayString,
  jobTitleOptions,
  organizationScaleOptions,
  organizationTypeOptions,
  saveAudiencePersonaDrafts,
} from '../../services/audiencePersonaStore.js';

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// 抽屉编辑对象始终补齐空画像字段，避免旧数据缺字段导致表单失控。
function createEditablePersona(persona = createEmptyAudiencePersona()) {
  return {
    ...createEmptyAudiencePersona(),
    ...persona,
    preferredContentTypes: persona.preferredContentTypes ?? [],
    preferredExpressionStyles: persona.preferredExpressionStyles ?? [],
  };
}

// 筛选搜索只匹配画像名称、行业和职位，保持搜索范围可预期。
function getFieldText(persona) {
  return [persona.name, persona.industry, persona.jobTitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

// 保存前校验所有必填字段，多选字段使用独立错误文案。
function validatePersona(data, copy) {
  const errors = {};

  if (!data.name.trim()) errors.name = copy.validation.required;
  if (!data.organizationType) errors.organizationType = copy.validation.required;
  if (!data.organizationScale) errors.organizationScale = copy.validation.required;
  if (!data.industry.trim()) errors.industry = copy.validation.required;
  if (!data.jobTitle) errors.jobTitle = copy.validation.required;
  if (!data.searchGoal.trim()) errors.searchGoal = copy.validation.required;
  if (!data.preferredContentTypes.length) {
    errors.preferredContentTypes = copy.validation.multiRequired;
  }
  if (!data.preferredContentDepth) errors.preferredContentDepth = copy.validation.required;
  if (!data.preferredExpressionStyles.length) {
    errors.preferredExpressionStyles = copy.validation.multiRequired;
  }

  return errors;
}

function IconBadge({ children, tone = 'blue' }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-500',
    slate: 'bg-slate-100 text-slate-500',
  }[tone];

  return (
    <span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

function Tag({ children, disabled, onRemove, t }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
      <span className="truncate">{children}</span>
      {!disabled ? (
        <button
          type="button"
          className="rounded-full text-slate-400 transition hover:text-slate-700"
          onClick={onRemove}
          aria-label={`${t.remove}: ${children}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

function FieldLabel({ children, required }) {
  return (
    <span className="mb-2 block text-sm font-medium text-slate-500">
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </span>
  );
}

function FieldError({ error }) {
  return error ? <span className="mt-1 block text-xs font-medium text-red-500">{error}</span> : null;
}

function TextField({ error, fieldId, label, onChange, placeholder, required, value }) {
  return (
    <label className="block" data-field={fieldId}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        className={`h-11 w-full rounded-md border px-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      <FieldError error={error} />
    </label>
  );
}

function TextAreaField({ error, fieldId, label, onChange, placeholder, required, rows = 5, value }) {
  return (
    <label className="block" data-field={fieldId}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        className={`w-full resize-none rounded-md border px-3 py-3 text-base leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      <FieldError error={error} />
    </label>
  );
}

function SelectField({ error, fieldId, label, onChange, options, placeholder, required, value }) {
  return (
    <label className="block" data-field={fieldId}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <span className="relative block">
        <select
          className={`h-11 w-full appearance-none rounded-md border bg-white px-3 pr-10 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error ? 'border-red-400' : 'border-slate-200'
          } ${value ? '' : 'text-slate-400'}`}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </span>
      <FieldError error={error} />
    </label>
  );
}

function MultiSelectField({
  error,
  fieldId,
  label,
  onChange,
  options,
  placeholder,
  required,
  t,
  values,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // 多选下拉点击外部关闭，避免标签移除后下拉残留。
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleValue(value) {
    // 已选项再次点击即取消，保持多选字段和标签移除逻辑一致。
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <div ref={ref} data-field={fieldId}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          className={`flex min-h-[44px] w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error ? 'border-red-400' : 'border-slate-200'
          }`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen((current) => !current);
            }
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="flex min-w-0 flex-wrap gap-2">
            {values.length ? (
              values.map((value) => (
                <Tag
                  key={value}
                  onRemove={(event) => {
                    event.stopPropagation();
                    toggleValue(value);
                  }}
                  t={t}
                >
                  {value}
                </Tag>
              ))
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="ml-3 h-4 w-4 flex-none text-slate-400" />
        </div>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-menu">
            {options.map((option) => {
              const selected = values.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => toggleValue(option)}
                >
                  {option}
                  {selected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <FieldError error={error} />
    </div>
  );
}

function FilterSelect({ className = 'w-full sm:w-56', label, onChange, options, value }) {
  return (
    <span className={`relative block ${className}`}>
      <select
        className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-10 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </span>
  );
}

function PersonaCard({ copy, onDelete, onDuplicate, onEdit, persona }) {
  // 画像卡片只展示摘要字段，完整画像内容通过编辑抽屉查看。
  return (
    <ListCard
      title={persona.name}
      leadingIcon={<UsersRound aria-hidden="true" className="h-5 w-5" />}
      padding="comfortable"
      metaItems={[
        {
          icon: Building2,
          key: 'organization',
          label: `${copy.fields.organizationType.label}/${copy.fields.organizationScale.label}`,
          value: [persona.organizationType, persona.organizationScale].filter(Boolean),
        },
        {
          icon: Layers,
          key: 'industry',
          label: copy.fields.industry.label,
          value: persona.industry,
        },
        {
          icon: BriefcaseBusiness,
          key: 'jobTitle',
          label: copy.fields.jobTitle.label,
          value: persona.jobTitle,
        },
      ]}
      actions={[
        {
          icon: Pencil,
          key: 'edit',
          label: copy.edit,
          onClick: () => onEdit(persona),
        },
        {
          icon: Copy,
          key: 'duplicate',
          label: copy.duplicate,
          onClick: () => onDuplicate(persona),
        },
        {
          icon: Trash2,
          key: 'delete',
          label: copy.delete,
          onClick: () => onDelete(persona),
          tone: 'danger',
        },
      ]}
    />
  );
}

function UsagePanel({ copy }) {
  return (
    <aside className="h-full min-h-0 overflow-y-auto rounded-lg bg-slate-50 p-7">
      <div className="flex items-center gap-3">
        <IconBadge tone="amber">
          <Lightbulb className="h-5 w-5" />
        </IconBadge>
        <h3 className="text-xl font-bold text-slate-800">{copy.usage.title}</h3>
      </div>
      <div className="mt-7 space-y-7">
        {copy.usage.steps.map((step, index) => (
          <div key={step.title} className="flex gap-4">
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 ring-1 ring-slate-200">
              {index + 1}
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-800">{step.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function FormSection({ children, description, icon: Icon, title, tone = 'blue' }) {
  const iconColor = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    violet: 'text-indigo-600 bg-indigo-50',
  }[tone];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-7">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-normal text-slate-800">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function PersonaDrawer({
  copy,
  data,
  errors,
  mode,
  onCancel,
  onChange,
  onSave,
  sidebarWidth,
}) {
  const title = mode === 'edit' ? copy.drawer.editTitle : copy.drawer.createTitle;

  return (
    <div
      className="fixed bottom-0 right-0 top-0 z-40 bg-slate-950/40 transition-[left] duration-200"
      style={{ left: sidebarWidth }}
    >
      <form
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-[860px] flex-col bg-white shadow-menu"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex h-[72px] flex-none items-center justify-between border-b border-slate-200 px-7">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            onClick={onCancel}
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-7 py-7">
          {/* 基础身份信息：定义画像所属组织和职位 */}
          <FormSection
            description={copy.sections.identity.description}
            icon={UserRound}
            title={copy.sections.identity.title}
            tone="blue"
          >
            <div className="space-y-4">
              <TextField
                error={errors.name}
                fieldId="name"
                label={copy.fields.name.label}
                onChange={(value) => onChange('name', value)}
                placeholder={copy.fields.name.placeholder}
                required
                value={data.name}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  error={errors.organizationType}
                  fieldId="organizationType"
                  label={copy.fields.organizationType.label}
                  onChange={(value) => onChange('organizationType', value)}
                  options={organizationTypeOptions}
                  placeholder={copy.selectPlaceholder}
                  required
                  value={data.organizationType}
                />
                <SelectField
                  error={errors.organizationScale}
                  fieldId="organizationScale"
                  label={copy.fields.organizationScale.label}
                  onChange={(value) => onChange('organizationScale', value)}
                  options={organizationScaleOptions}
                  placeholder={copy.selectPlaceholder}
                  required
                  value={data.organizationScale}
                />
                <TextField
                  error={errors.industry}
                  fieldId="industry"
                  label={copy.fields.industry.label}
                  onChange={(value) => onChange('industry', value)}
                  placeholder={copy.fields.industry.placeholder}
                  required
                  value={data.industry}
                />
                <SelectField
                  error={errors.jobTitle}
                  fieldId="jobTitle"
                  label={copy.fields.jobTitle.label}
                  onChange={(value) => onChange('jobTitle', value)}
                  options={jobTitleOptions}
                  placeholder={copy.selectPlaceholder}
                  required
                  value={data.jobTitle}
                />
              </div>
              <TextAreaField
                fieldId="businessDescription"
                label={copy.fields.businessDescription.label}
                onChange={(value) => onChange('businessDescription', value)}
                placeholder={copy.fields.businessDescription.placeholder}
                value={data.businessDescription}
              />
            </div>
          </FormSection>

          {/* 搜索偏好：描述画像的痛点、目标和常见问题 */}
          <FormSection
            description={copy.sections.searchPreference.description}
            icon={SearchCheck}
            title={copy.sections.searchPreference.title}
            tone="green"
          >
            <div className="space-y-4">
              <TextAreaField
                fieldId="painPoints"
                label={copy.fields.painPoints.label}
                onChange={(value) => onChange('painPoints', value)}
                placeholder={copy.fields.painPoints.placeholder}
                value={data.painPoints}
              />
              <TextAreaField
                error={errors.searchGoal}
                fieldId="searchGoal"
                label={copy.fields.searchGoal.label}
                onChange={(value) => onChange('searchGoal', value)}
                placeholder={copy.fields.searchGoal.placeholder}
                required
                value={data.searchGoal}
              />
              <TextAreaField
                fieldId="commonQuestions"
                label={copy.fields.commonQuestions.label}
                onChange={(value) => onChange('commonQuestions', value)}
                placeholder={copy.fields.commonQuestions.placeholder}
                value={data.commonQuestions}
              />
            </div>
          </FormSection>

          {/* 内容偏好：用于后续内容策略和文章生成约束 */}
          <FormSection
            description={copy.sections.readingPreference.description}
            icon={BookOpenText}
            title={copy.sections.readingPreference.title}
            tone="violet"
          >
            <div className="space-y-4">
              <MultiSelectField
                error={errors.preferredContentTypes}
                fieldId="preferredContentTypes"
                label={copy.fields.preferredContentTypes.label}
                onChange={(value) => onChange('preferredContentTypes', value)}
                options={contentTypeOptions}
                placeholder={copy.fields.preferredContentTypes.placeholder}
                required
                t={copy}
                values={data.preferredContentTypes}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  error={errors.preferredContentDepth}
                  fieldId="preferredContentDepth"
                  label={copy.fields.preferredContentDepth.label}
                  onChange={(value) => onChange('preferredContentDepth', value)}
                  options={contentDepthOptions}
                  placeholder={copy.selectPlaceholder}
                  required
                  value={data.preferredContentDepth}
                />
                <MultiSelectField
                  error={errors.preferredExpressionStyles}
                  fieldId="preferredExpressionStyles"
                  label={copy.fields.preferredExpressionStyles.label}
                  onChange={(value) => onChange('preferredExpressionStyles', value)}
                  options={expressionStyleOptions}
                  placeholder={copy.fields.preferredExpressionStyles.placeholder}
                  required
                  t={copy}
                  values={data.preferredExpressionStyles}
                />
              </div>
              <TextAreaField
                fieldId="audienceFocus"
                label={copy.fields.audienceFocus.label}
                onChange={(value) => onChange('audienceFocus', value)}
                placeholder={copy.fields.audienceFocus.placeholder}
                value={data.audienceFocus}
              />
            </div>
          </FormSection>
        </div>

        <div className="flex flex-none justify-end gap-3 border-t border-slate-200 bg-white px-7 py-5">
          <Button
            variant="neutral"
            onClick={onCancel}
          >
            {copy.cancel}
          </Button>
          <Button
            type="submit"
            icon={Check}
          >
            {copy.save}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({ cancelLabel, confirmLabel, danger = false, message, onCancel, onConfirm, title }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-menu">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="neutral"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AudiencePersonaPage({ project, sidebarWidth = 300, t }) {
  // 页面状态分为已保存列表、筛选草稿、抽屉草稿和确认弹窗。
  const [personas, setPersonas] = useState(() => getAudiencePersonaDrafts(project));
  const [searchQuery, setSearchQuery] = useState('');
  const [depthFilter, setDepthFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [draftDepthFilter, setDraftDepthFilter] = useState('all');
  const [draftTypeFilter, setDraftTypeFilter] = useState('all');
  const [drawerState, setDrawerState] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const filterRef = useRef(null);
  const copy = t.audiencePersona;

  useEffect(() => {
    // 切换项目时重新读取该项目画像，并清空当前页面临时状态。
    setPersonas(getAudiencePersonaDrafts(project));
    setSearchQuery('');
    setDepthFilter('all');
    setTypeFilter('all');
    setDraftSearchQuery('');
    setDraftDepthFilter('all');
    setDraftTypeFilter('all');
    setFilterOpen(false);
    setDrawerState(null);
    setErrors({});
  }, [project]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // 筛选弹层只在打开时监听外部点击，关闭后移除监听。
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }

    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const filteredPersonas = useMemo(() => {
    // 应用后的筛选条件才影响列表，弹层草稿不直接改动结果。
    const query = searchQuery.trim().toLowerCase();

    return personas.filter((persona) => {
      const matchesQuery = !query || getFieldText(persona).includes(query);
      const matchesDepth = depthFilter === 'all' || persona.preferredContentDepth === depthFilter;
      const matchesType =
        typeFilter === 'all' || persona.preferredContentTypes.includes(typeFilter);

      return matchesQuery && matchesDepth && matchesType;
    });
  }, [depthFilter, personas, searchQuery, typeFilter]);

  const hasDrawerChanges = drawerState
    ? !valuesEqual(drawerState.initialData, drawerState.data)
    : false;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || depthFilter !== 'all' || typeFilter !== 'all';

  function persist(nextPersonas, message) {
    // 所有增删改都通过 persist 写入当前项目缓存并触发提示。
    const saved = saveAudiencePersonaDrafts(project.id, nextPersonas);
    setPersonas(saved);
    setToast({ id: Date.now(), message, type: 'success' });
  }

  function openCreateDrawer() {
    const data = createEditablePersona(createEmptyAudiencePersona());
    setDrawerState({ mode: 'create', data, initialData: data });
    setErrors({});
  }

  function openEditDrawer(persona) {
    const data = createEditablePersona(persona);
    setDrawerState({ mode: 'edit', data, initialData: data });
    setErrors({});
  }

  function openDuplicateDrawer(persona) {
    // 复制画像先清空 id，保存时会生成新的画像 ID。
    const data = createEditablePersona({
      ...persona,
      id: '',
      name: `${persona.name} ${copy.copySuffix}`,
      updatedAt: getTodayString(),
    });
    setDrawerState({ mode: 'duplicate', data, initialData: data });
    setErrors({});
  }

  function updateDrawerField(field, value) {
    setDrawerState((current) => ({
      ...current,
      data: {
        ...current.data,
        [field]: value,
      },
    }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  }

  function closeDrawer() {
    // 有未保存改动时先弹出确认框，避免关闭抽屉直接丢失草稿。
    if (hasDrawerChanges) {
      setShowDiscardDialog(true);
      return;
    }

    setDrawerState(null);
    setErrors({});
  }

  function discardDrawerChanges() {
    setDrawerState(null);
    setShowDiscardDialog(false);
    setErrors({});
  }

  function saveDrawer() {
    // 校验失败时滚动到首个错误字段，方便直接修正。
    const nextErrors = validatePersona(drawerState.data, copy);
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-field="${firstError}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
      return;
    }

    const savedPersona = {
      ...drawerState.data,
      id: drawerState.data.id || createPersonaId(),
      updatedAt: getTodayString(),
    };

    if (drawerState.mode === 'edit') {
      persist(
        personas.map((persona) => (persona.id === savedPersona.id ? savedPersona : persona)),
        copy.toast.saved,
      );
    } else {
      persist([savedPersona, ...personas], copy.toast.created);
    }

    setDrawerState(null);
    setErrors({});
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    persist(
      personas.filter((persona) => persona.id !== deleteTarget.id),
      copy.toast.deleted,
    );
    setDeleteTarget(null);
  }

  function toggleFilterPopover() {
    // 打开筛选弹层时同步当前已应用条件，取消后不影响列表。
    setDraftSearchQuery(searchQuery);
    setDraftDepthFilter(depthFilter);
    setDraftTypeFilter(typeFilter);
    setFilterOpen((current) => !current);
  }

  function applyFilters() {
    setSearchQuery(draftSearchQuery);
    setDepthFilter(draftDepthFilter);
    setTypeFilter(draftTypeFilter);
    setFilterOpen(false);
  }

  function clearFilters() {
    setSearchQuery('');
    setDepthFilter('all');
    setTypeFilter('all');
    setDraftSearchQuery('');
    setDraftDepthFilter('all');
    setDraftTypeFilter('all');
    setFilterOpen(false);
  }

  const depthFilterOptions = [
    { value: 'all', label: copy.filters.allDepths },
    ...contentDepthOptions.map((option) => ({ value: option, label: option })),
  ];
  const typeFilterOptions = [
    { value: 'all', label: copy.filters.allTypes },
    ...contentTypeOptions.map((option) => ({ value: option, label: option })),
  ];

  return (
    <div className={`mx-auto max-w-[1600px] ${adaptivePageLayout.pageStack}`}>
      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          testId="audience-persona-toast"
          type={toast.type}
        />
      ) : null}

      {drawerState ? (
        <PersonaDrawer
          copy={copy}
          data={drawerState.data}
          errors={errors}
          mode={drawerState.mode}
          onCancel={closeDrawer}
          onChange={updateDrawerField}
          onSave={saveDrawer}
          sidebarWidth={sidebarWidth}
        />
      ) : null}

      {showDiscardDialog ? (
        <ConfirmDialog
          cancelLabel={copy.continueEditing}
          confirmLabel={copy.discardChanges}
          danger
          message={copy.discardBody}
          onCancel={() => setShowDiscardDialog(false)}
          onConfirm={discardDrawerChanges}
          title={copy.discardTitle}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.deleteBody(deleteTarget.name)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title={copy.deleteTitle}
        />
      ) : null}

      <header className="flex items-start justify-between gap-6 rounded-lg bg-slate-50 px-7 py-6">
        <div>
          <h2 className="text-2xl font-bold tracking-normal text-slate-800">{copy.title}</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-500">
            {copy.description}
          </p>
        </div>
      </header>

      <div className={`${adaptivePageLayout.workArea} xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]`}>
        <section className={`${adaptivePageLayout.scrollPanel} p-7`}>
          <div className="mb-5 flex flex-none flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{copy.title}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div ref={filterRef} className="relative">
                <button
                  type="button"
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition ${
                    hasActiveFilters || filterOpen
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  onClick={toggleFilterPopover}
                  aria-expanded={filterOpen}
                  aria-label={copy.filters.title}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasActiveFilters ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
                  ) : null}
                </button>

                {filterOpen ? (
                  <form
                    className="absolute right-0 top-[calc(100%+8px)] z-40 w-[calc(100vw-64px)] rounded-lg border border-slate-200 bg-white p-4 shadow-menu sm:w-[360px]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      applyFilters();
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-800">{copy.filters.title}</h4>
                      <button
                        type="button"
                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                        onClick={() => setFilterOpen(false)}
                        aria-label={copy.filters.close}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.searchLabel}
                        </span>
                        <span className="relative block">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            onChange={(event) => setDraftSearchQuery(event.target.value)}
                            placeholder={copy.filters.searchPlaceholder}
                            type="search"
                            value={draftSearchQuery}
                          />
                        </span>
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-500">
                            {copy.filters.depthLabel}
                          </span>
                          <FilterSelect
                            className="w-full"
                            label={copy.filters.depthLabel}
                            onChange={setDraftDepthFilter}
                            options={depthFilterOptions}
                            value={draftDepthFilter}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-500">
                            {copy.filters.typeLabel}
                          </span>
                          <FilterSelect
                            className="w-full"
                            label={copy.filters.typeLabel}
                            onChange={setDraftTypeFilter}
                            options={typeFilterOptions}
                            value={draftTypeFilter}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                      <Button
                        variant="neutral"
                        onClick={clearFilters}
                      >
                        {copy.filters.clear}
                      </Button>
                      <Button
                        type="submit"
                      >
                        {copy.filters.apply}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>

              {filteredPersonas.length ? (
                <Button
                  icon={Plus}
                  onClick={openCreateDrawer}
                >
                  {copy.create}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredPersonas.length ? (
              <div className="space-y-6">
                {filteredPersonas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    copy={copy}
                    onDelete={setDeleteTarget}
                    onDuplicate={openDuplicateDrawer}
                    onEdit={openEditDrawer}
                    persona={persona}
                  />
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <div>
                  <IconBadge tone="slate">
                    <UsersRound className="h-5 w-5" />
                  </IconBadge>
                  <h3 className="mt-5 text-xl font-bold text-slate-800">{copy.empty.title}</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                    {copy.empty.body}
                  </p>
                  <Button
                    className="mt-6"
                    icon={Plus}
                    onClick={openCreateDrawer}
                  >
                    {copy.create}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <UsagePanel copy={copy} />
      </div>
    </div>
  );
}
