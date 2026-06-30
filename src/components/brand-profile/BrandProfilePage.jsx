import {
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Link as LinkIcon,
  Palette,
  Pencil,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Toast from '../ui/Toast.jsx';
import {
  getBrandProfileDraft,
  marketOptions,
  saveBrandProfileDraft,
} from '../../services/brandProfileStore.js';

function isValidUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validateProfile(data, t) {
  const errors = {};

  if (!isValidUrl(data.website)) {
    errors.website = t.brandProfile.validation.invalidWebsite;
  }

  const invalidCompanyLink = data.companyLinks.find((link) => !isValidUrl(link));
  if (invalidCompanyLink) {
    errors.companyLinks = t.brandProfile.validation.invalidLink;
  }

  const invalidAuthorityLink = data.authorityLinks.find((link) => !isValidUrl(link));
  if (invalidAuthorityLink) {
    errors.authorityLinks = t.brandProfile.validation.invalidLink;
  }

  return errors;
}

function normalizeTag(value) {
  return value.trim();
}

function InfoHint({ text }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 outline-none transition hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={text}
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-50 hidden w-64 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium leading-5 text-white shadow-menu group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function SectionShell({ children, title, hint, icon: Icon, tone = 'blue', className = '' }) {
  const iconClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  }[tone];

  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-7 ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        {Icon ? (
          <span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-xl font-bold tracking-normal text-slate-800">{title}</h3>
          <InfoHint text={hint} />
        </div>
      </div>
      {children}
    </section>
  );
}

function FactPanel({ children, panelClassName = '', title }) {
  return (
    <div className={`rounded-lg bg-slate-50 p-4 ${panelClassName}`}>
      <h4 className="mb-3 h-6 text-base font-bold leading-6 text-slate-800">{title}</h4>
      {children}
    </div>
  );
}

function TextField({ disabled, error, label, onChange, placeholder, testId, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-500">{label}</span>
      <input
        data-testid={testId}
        className={`h-11 w-full rounded-md border px-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          error ? 'border-red-400' : 'border-slate-200'
        } ${disabled ? 'bg-slate-50' : 'bg-white'}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={disabled}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  disabled,
  error,
  label,
  minHeightClass = 'min-h-[152px]',
  minRows = 5,
  onChange,
  placeholder,
  showLabel = true,
  testId,
  value,
}) {
  return (
    <label className="block">
      {showLabel ? <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span> : null}
      <textarea
        data-testid={testId}
        className={`w-full resize-none overflow-y-auto rounded-md border px-3 py-3 text-base leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${minHeightClass} ${
          error ? 'border-red-400' : 'border-slate-200'
        } ${disabled ? 'bg-slate-50' : 'bg-white'}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={disabled}
        rows={minRows}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-500">{error}</span> : null}
    </label>
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
          aria-label={`${t.brandProfile.removeTag}: ${children}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

function TagInput({
  disabled,
  error,
  label,
  minHeightClass,
  onChange,
  placeholder,
  showLabel = true,
  t,
  testId,
  validateAsUrl = false,
  variant = 'panel',
  values,
}) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const compact = variant === 'compact';
  const heightClass = minHeightClass ?? (compact ? 'min-h-[44px]' : 'min-h-[132px]');

  function addTag() {
    const nextValue = normalizeTag(inputValue);

    if (!nextValue) {
      return;
    }

    if (validateAsUrl && !isValidUrl(nextValue)) {
      setInputError(t.brandProfile.validation.invalidLink);
      return;
    }

    if (!values.includes(nextValue)) {
      onChange([...values, nextValue]);
    }

    setInputValue('');
    setInputError('');
  }

  function removeTag(value) {
    onChange(values.filter((item) => item !== value));
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }

  if (compact && disabled) {
    const displayValue = values.join(' / ');

    return (
      <div>
        {showLabel ? <span className="mb-2 block text-sm font-medium text-slate-500">{label}</span> : null}
        <div
          data-testid={testId}
          className={`flex h-11 items-center rounded-md border bg-slate-50 px-3 ${
            error || inputError ? 'border-red-400' : 'border-slate-200'
          }`}
        >
          <span className={`truncate text-base ${displayValue ? 'text-slate-700' : 'text-slate-400'}`}>
            {displayValue || placeholder}
          </span>
        </div>
        {error || inputError ? (
          <span className="mt-1 block text-xs font-medium text-red-500">{error || inputError}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {showLabel ? <span className="mb-2 block text-sm font-medium text-slate-500">{label}</span> : null}
      <div
        data-testid={testId}
        className={`${heightClass} overflow-y-auto rounded-md border ${
          error || inputError ? 'border-red-400' : 'border-slate-200'
        } ${disabled ? 'bg-slate-50' : 'bg-white'} ${compact ? 'px-3 py-2' : 'p-3'}`}
      >
        <div className={`flex flex-wrap items-center gap-2 ${disabled ? 'min-h-full' : ''}`}>
          {values.map((value) => (
            <Tag key={value} disabled={disabled} onRemove={() => removeTag(value)} t={t}>
              {value}
            </Tag>
          ))}
          {disabled && !values.length ? (
            <span className="text-base text-slate-400">{placeholder}</span>
          ) : null}
        </div>
        {!disabled ? (
          <div className={`${values.length || !compact ? 'mt-3' : ''} flex gap-2`}>
            <input
              data-testid={testId ? `${testId}-input` : undefined}
              className={`min-w-0 flex-1 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                compact
                  ? 'bg-transparent py-0 text-base text-slate-700 focus:ring-0'
                  : 'rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'
              }`}
              onChange={(event) => {
                setInputValue(event.target.value);
                setInputError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              value={inputValue}
            />
            <Button
              className="flex-none"
              icon={Plus}
              variant="secondary"
              onClick={addTag}
            >
              {t.brandProfile.add}
            </Button>
          </div>
        ) : null}
      </div>
      {error || inputError ? (
        <span className="mt-1 block text-xs font-medium text-red-500">{error || inputError}</span>
      ) : null}
    </div>
  );
}

function MarketMultiSelect({ disabled, onChange, placeholder, t, testId, values }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleValue(value) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  }

  function handleTriggerKeyDown(event) {
    if (disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  if (disabled) {
    const displayValue = values.join(' / ');

    return (
      <div ref={ref}>
        <span className="mb-2 block text-sm font-medium text-slate-500">
          {t.brandProfile.fields.coreMarkets.label}
        </span>
        <div
          data-testid={testId}
          className="flex h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-base"
        >
          <span className={`truncate ${displayValue ? 'text-slate-700' : 'text-slate-400'}`}>
            {displayValue || placeholder}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <span className="mb-2 block text-sm font-medium text-slate-500">
        {t.brandProfile.fields.coreMarkets.label}
      </span>
      <div className="relative">
        <div
          aria-expanded={open}
          aria-haspopup="listbox"
          data-testid={testId}
          role="button"
          tabIndex={0}
          className="flex min-h-[44px] w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          onClick={() => {
            setOpen((current) => !current);
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="flex min-w-0 flex-wrap gap-2">
            {values.length ? (
              values.map((value) => (
                <Tag
                  key={value}
                  disabled={disabled}
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
          <ChevronDown className="ml-2 h-4 w-4 flex-none text-slate-400" />
        </div>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-menu">
            {marketOptions.map((option) => {
              const selected = values.includes(option);

              return (
                <button
                  key={option}
                  data-testid={`market-option-${option}`}
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
    </div>
  );
}

function ConfirmDialog({ onContinue, onDiscard, t }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div data-testid="discard-dialog" className="w-full max-w-md rounded-lg bg-white p-6 shadow-menu">
        <h3 className="text-xl font-bold text-slate-900">{t.brandProfile.discardTitle}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{t.brandProfile.discardBody}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            data-testid="discard-dialog-continue"
            variant="neutral"
            onClick={onContinue}
          >
            {t.brandProfile.continueEditing}
          </Button>
          <Button
            data-testid="discard-dialog-discard"
            variant="danger"
            onClick={onDiscard}
          >
            {t.brandProfile.discardChanges}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BrandProfilePage({ project, t }) {
  const [savedData, setSavedData] = useState(() => getBrandProfileDraft(project));
  const [draftData, setDraftData] = useState(savedData);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const nextData = getBrandProfileDraft(project);
    setSavedData(nextData);
    setDraftData(nextData);
    setEditing(false);
    setErrors({});
  }, [project]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hasChanges = useMemo(() => !valuesEqual(savedData, draftData), [savedData, draftData]);
  const disabled = !editing;
  const copy = t.brandProfile;
  const fields = copy.fields;

  function updateField(field, value) {
    setDraftData((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  }

  function handleEdit() {
    setEditing(true);
    setErrors({});
  }

  function handleSave() {
    const nextErrors = validateProfile(draftData, t);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const saved = saveBrandProfileDraft(project.id, draftData);
    setSavedData(saved);
    setDraftData(saved);
    setEditing(false);
    setToast({ id: Date.now(), message: copy.saveSuccess });
  }

  function handleCancel() {
    if (hasChanges) {
      setShowDiscardDialog(true);
      return;
    }

    setEditing(false);
    setErrors({});
  }

  function discardChanges() {
    setDraftData(savedData);
    setEditing(false);
    setErrors({});
    setShowDiscardDialog(false);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      {toast ? (
        <Toast key={toast.id} message={toast.message} testId="brand-profile-toast" type="success" />
      ) : null}
      {showDiscardDialog ? (
        <ConfirmDialog
          onContinue={() => setShowDiscardDialog(false)}
          onDiscard={discardChanges}
          t={t}
        />
      ) : null}

      <PageHeader
        actions={
          editing ? (
            <>
              <Button
                data-testid="brand-profile-cancel"
                icon={X}
                variant="neutral"
                onClick={handleCancel}
              >
                {copy.cancel}
              </Button>
              <Button
                data-testid="brand-profile-save"
                icon={Save}
                onClick={handleSave}
              >
                {copy.save}
              </Button>
            </>
          ) : (
            <Button
              data-testid="brand-profile-edit"
              icon={Pencil}
              onClick={handleEdit}
            >
              {copy.edit}
            </Button>
          )
        }
        description={copy.description}
        title={copy.title}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(360px,0.9fr)_minmax(620px,1.8fr)]">
        <SectionShell
          hint={copy.sections.basicInfo.hint}
          icon={Building2}
          title={copy.sections.basicInfo.title}
          tone="blue"
        >
          <div className="space-y-4">
            <TextField
              disabled={disabled}
              label={fields.companyName.label}
              onChange={(value) => updateField('companyName', value)}
              placeholder={fields.companyName.placeholder}
              testId="brand-profile-company-name"
              value={draftData.companyName}
            />
            <TextField
              disabled={disabled}
              label={fields.brandName.label}
              onChange={(value) => updateField('brandName', value)}
              placeholder={fields.brandName.placeholder}
              testId="brand-profile-brand-name"
              value={draftData.brandName}
            />
            <TextField
              disabled={disabled}
              error={errors.website}
              label={fields.website.label}
              onChange={(value) => updateField('website', value)}
              placeholder={fields.website.placeholder}
              testId="brand-profile-website"
              value={draftData.website}
            />
            <TextField
              disabled={disabled}
              label={fields.industry.label}
              onChange={(value) => updateField('industry', value)}
              placeholder={fields.industry.placeholder}
              testId="brand-profile-industry"
              value={draftData.industry}
            />
            <MarketMultiSelect
              disabled={disabled}
              onChange={(value) => updateField('coreMarkets', value)}
              placeholder={fields.coreMarkets.placeholder}
              t={t}
              testId="brand-profile-core-markets"
              values={draftData.coreMarkets}
            />
            <TagInput
              disabled={disabled}
              label={fields.coreCategories.label}
              onChange={(value) => updateField('coreCategories', value)}
              placeholder={fields.coreCategories.placeholder || copy.tagInputPlaceholder}
              t={t}
              testId="brand-profile-core-categories"
              variant="compact"
              values={draftData.coreCategories}
            />
          </div>
        </SectionShell>

        <SectionShell
          hint={copy.sections.brandFacts.hint}
          icon={FileText}
          title={copy.sections.brandFacts.title}
          tone="green"
        >
          <div className="space-y-6">
            <FactPanel title={fields.companyIntroduction.label}>
              <TextAreaField
                disabled={disabled}
                label={fields.companyIntroduction.label}
                minHeightClass="min-h-[190px]"
                minRows={7}
                onChange={(value) => updateField('companyIntroduction', value)}
                placeholder={fields.companyIntroduction.placeholder}
                showLabel={false}
                testId="brand-profile-company-introduction"
                value={draftData.companyIntroduction}
              />
            </FactPanel>
            <div className="grid gap-6 lg:grid-cols-2">
              <FactPanel title={fields.certifications.label}>
                <TextAreaField
                  disabled={disabled}
                  label={fields.certifications.label}
                  minHeightClass="min-h-[160px]"
                  minRows={6}
                  onChange={(value) => updateField('certifications', value)}
                  placeholder={fields.certifications.placeholder}
                  showLabel={false}
                  testId="brand-profile-certifications"
                  value={draftData.certifications}
                />
              </FactPanel>
              <FactPanel title={fields.coreAdvantages.label}>
                <TextAreaField
                  disabled={disabled}
                  label={fields.coreAdvantages.label}
                  minHeightClass="min-h-[160px]"
                  minRows={6}
                  onChange={(value) => updateField('coreAdvantages', value)}
                  placeholder={fields.coreAdvantages.placeholder}
                  showLabel={false}
                  testId="brand-profile-core-advantages"
                  value={draftData.coreAdvantages}
                />
              </FactPanel>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          hint={copy.sections.referenceLinks.hint}
          icon={LinkIcon}
          title={copy.sections.referenceLinks.title}
          tone="cyan"
        >
          <div className="space-y-6">
            <FactPanel panelClassName="h-[238px]" title={fields.companyLinks.label}>
              <TagInput
                disabled={disabled}
                error={errors.companyLinks}
                label={fields.companyLinks.label}
                minHeightClass="h-[164px]"
                onChange={(value) => updateField('companyLinks', value)}
                placeholder={fields.companyLinks.placeholder || copy.linkInputPlaceholder}
                showLabel={false}
                t={t}
                testId="brand-profile-company-links"
                validateAsUrl
                values={draftData.companyLinks}
              />
            </FactPanel>
            <FactPanel panelClassName="h-[238px]" title={fields.authorityLinks.label}>
              <TagInput
                disabled={disabled}
                error={errors.authorityLinks}
                label={fields.authorityLinks.label}
                minHeightClass="h-[164px]"
                onChange={(value) => updateField('authorityLinks', value)}
                placeholder={fields.authorityLinks.placeholder || copy.linkInputPlaceholder}
                showLabel={false}
                t={t}
                testId="brand-profile-authority-links"
                validateAsUrl
                values={draftData.authorityLinks}
              />
            </FactPanel>
          </div>
        </SectionShell>

        <SectionShell
          hint={copy.sections.brandStyle.hint}
          icon={Palette}
          title={copy.sections.brandStyle.title}
          tone="violet"
        >
          <div className="space-y-6">
            <FactPanel panelClassName="h-[238px]" title={fields.brandPositioning.label}>
              <TextAreaField
                disabled={disabled}
                label={fields.brandPositioning.label}
                minHeightClass="h-[164px]"
                minRows={6}
                onChange={(value) => updateField('brandPositioning', value)}
                placeholder={fields.brandPositioning.placeholder}
                showLabel={false}
                testId="brand-profile-brand-positioning"
                value={draftData.brandPositioning}
              />
            </FactPanel>
            <FactPanel panelClassName="h-[238px]" title={fields.brandRequirements.label}>
              <TextAreaField
                disabled={disabled}
                label={fields.brandRequirements.label}
                minHeightClass="h-[164px]"
                minRows={6}
                onChange={(value) => updateField('brandRequirements', value)}
                placeholder={fields.brandRequirements.placeholder}
                showLabel={false}
                testId="brand-profile-brand-requirements"
                value={draftData.brandRequirements}
              />
            </FactPanel>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
