import {
  AlertCircle,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  HelpCircle,
  Lightbulb,
  Pencil,
  Plus,
  Save,
  Table2,
  Trash2,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adaptivePageLayout } from '../layoutClasses.js';
import Button from '../ui/Button.jsx';
import Toast from '../ui/Toast.jsx';
import {
  createBlankRow,
  createCustomField,
  createCustomKnowledgeType,
  getKnowledgeItemDraft,
  getNextKnowledgeId,
  knowledgeFieldTypes,
  normalizeCellValue,
  saveKnowledgeItemDraft,
} from '../../services/knowledgeItemStore.js';

const blankRowCount = 8;

const typeIcons = {
  product: Box,
  service: Wrench,
  solution: Lightbulb,
  case: Trophy,
  faq: HelpCircle,
  custom: Table2,
};

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  violet: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
  orange: 'bg-orange-50 text-orange-500 ring-orange-200',
  sky: 'bg-sky-50 text-sky-600 ring-sky-200',
  slate: 'bg-slate-100 text-slate-500 ring-slate-300',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isValidUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getDisplayTypeName(type, copy) {
  if (type.preset) {
    return copy.presetTypes[type.id]?.name ?? type.id;
  }

  return `${type.name}.xlsx`;
}

function getDisplayTypeDescription(type, copy) {
  if (type.preset) {
    return copy.presetTypes[type.id]?.description ?? '';
  }

  return type.description || 'Custom knowledge table';
}

function getFieldLabel(field, type, copy) {
  const label = type.preset
    ? copy.presetFields?.[type.id]?.[field.key] ?? copy.presetFields?.common?.[field.key] ?? field.label
    : field.label;

  return `${label}${field.required ? '*' : ''}`;
}

function getCellValue(row, field) {
  if (field.key === 'knowledgeId') {
    return row.knowledgeId ?? '';
  }

  const value = row.cells?.[field.key];
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value ?? '';
}

function getDisplayCellValue(row, field, type, copy) {
  if (row.draft && field.key === 'knowledgeId' && rowHasAnyValue(row, type)) {
    return copy.generatedAfterSave;
  }

  return getCellValue(row, field);
}

function getColumnName(index) {
  let current = index + 1;
  let name = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function getVisibleFields(type, viewMode) {
  if (viewMode === 'required') {
    return type.fields.filter((field) => field.readOnly || field.required);
  }

  return type.fields;
}

function rowHasAnyValue(row, type) {
  return type.fields
    .filter((field) => !field.readOnly)
    .some((field) => String(getCellValue(row, field)).trim());
}

function ensureDisplayRows(rows, count = blankRowCount) {
  const nextRows = clone(rows);

  for (let index = 0; index < count; index += 1) {
    nextRows.push(createBlankRow());
  }

  return nextRows;
}

function getComparisonRows(rows, type) {
  return rows
    .filter((row) => !row.draft || rowHasAnyValue(row, type))
    .map((row) => ({
      id: row.draft ? 'draft' : row.id,
      knowledgeId: row.knowledgeId,
      cells: row.cells,
    }));
}

function validateAndNormalizeRows(rows, type, copy) {
  const errors = {};
  const normalizedRows = [];
  let hasErrors = false;

  rows.forEach((row) => {
    const isEmptyDraft = row.draft && !rowHasAnyValue(row, type);
    if (isEmptyDraft) return;

    const nextCells = {};

    type.fields.forEach((field) => {
      if (field.readOnly) return;

      const rawValue = getCellValue(row, field);
      const normalizedValue = normalizeCellValue(rawValue, field.type);
      const isEmpty =
        Array.isArray(normalizedValue) ? normalizedValue.length === 0 : !String(normalizedValue).trim();

      if (field.required && isEmpty) {
        errors[`${row.id}:${field.key}`] = copy.validation.required;
        hasErrors = true;
      }

      if (field.type === 'url' && !isValidUrl(String(rawValue).trim())) {
        errors[`${row.id}:${field.key}`] = copy.validation.invalidUrl;
        hasErrors = true;
      }

      nextCells[field.key] = normalizedValue;
    });

    normalizedRows.push({
      id: row.draft ? '' : row.id,
      knowledgeId: row.knowledgeId,
      cells: nextCells,
      draft: row.draft,
    });
  });

  if (hasErrors) {
    return { errors, rows: [] };
  }

  const rowsWithIds = [];

  normalizedRows.forEach((row, index) => {
    if (!row.draft) {
      rowsWithIds.push({
        id: row.id,
        knowledgeId: row.knowledgeId,
        cells: row.cells,
      });
      return;
    }

    rowsWithIds.push({
      id: `${type.id}-row-${Date.now()}-${index}`,
      knowledgeId: getNextKnowledgeId(type, rowsWithIds),
      cells: row.cells,
    });
  });

  return { errors: {}, rows: rowsWithIds };
}

function IconBadge({ icon, tone, selected }) {
  const Icon = typeIcons[icon] ?? Table2;
  const toneClass = toneClasses[tone] ?? toneClasses.slate;

  return (
    <span
      className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg ring-1 ${toneClass} ${
        selected ? 'bg-white' : ''
      }`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function PageIntro({ copy }) {
  return (
    <section className="rounded-lg bg-slate-50 px-7 py-6">
      <h2 className="text-2xl font-bold tracking-normal text-slate-800">{copy.title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-500">{copy.description}</p>
    </section>
  );
}

function KnowledgeTypePanel({
  activeTypeId,
  copy,
  expandedGroups,
  onCreate,
  onSelectType,
  onToggleGroup,
  types,
}) {
  const presetTypes = types.filter((type) => type.preset);
  const customTypes = types.filter((type) => !type.preset);

  return (
    <aside className={`${adaptivePageLayout.scrollPanel} p-6`}>
      <div className="flex flex-none items-center justify-between gap-4">
        <h3 className="text-xl font-bold tracking-normal text-slate-800">{copy.typePanelTitle}</h3>
        <Button
          className="flex-none"
          icon={Plus}
          onClick={onCreate}
        >
          {copy.createType}
        </Button>
      </div>

      <div className="mt-7 min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
        <TypeGroup
          activeTypeId={activeTypeId}
          copy={copy}
          expanded={expandedGroups.preset}
          label={copy.presetGroup}
          onSelectType={onSelectType}
          onToggle={() => onToggleGroup('preset')}
          types={presetTypes}
        />
        <TypeGroup
          activeTypeId={activeTypeId}
          copy={copy}
          expanded={expandedGroups.custom}
          label={copy.customGroup}
          onSelectType={onSelectType}
          onToggle={() => onToggleGroup('custom')}
          types={customTypes}
        />

        <div className="rounded-lg bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon="solution" tone="orange" />
            <h3 className="text-lg font-bold text-slate-800">{copy.usageTitle}</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">{copy.usageBody}</p>
        </div>
      </div>
    </aside>
  );
}

function TypeGroup({ activeTypeId, copy, expanded, label, onSelectType, onToggle, types }) {
  const ToggleIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <section>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md bg-slate-50 px-4 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-100"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span>{label}</span>
        <ToggleIcon className="h-4 w-4 text-slate-400" />
      </button>
      {expanded ? (
        <div className="mt-3 space-y-2">
          {types.map((type) => {
            const selected = activeTypeId === type.id;

            return (
              <button
                key={type.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                  selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => onSelectType(type.id)}
              >
                <IconBadge icon={type.icon} selected={selected} tone={type.tone} />
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold">{getDisplayTypeName(type, copy)}</span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {getDisplayTypeDescription(type, copy)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function SheetToolbar({ copy, editing, fieldView, onFieldViewChange }) {
  const fieldViewOptions = ['all', 'required'];

  return (
    <div className="flex h-12 items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 text-slate-500">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <span className="inline-flex h-7 items-center rounded-md bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          {editing ? copy.table.editMode : copy.table.browseMode}
        </span>
        <div className="flex h-7 items-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {fieldViewOptions.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`h-full border-r border-slate-200 px-3 text-xs font-bold last:border-r-0 ${
                fieldView === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 transition hover:bg-slate-50 hover:text-slate-800'
              }`}
              onClick={() => onFieldViewChange(mode)}
            >
              {copy.table.fieldViews[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormulaRow({ canEdit, coordinate, copy, fieldLabel, onChange, value }) {
  return (
    <div className="flex h-10 items-center border-b border-slate-200 bg-white text-sm text-slate-400">
      <span className="flex h-full w-28 flex-none items-center border-r border-slate-200 px-5 font-semibold text-slate-500">
        {coordinate || '-'}
      </span>
      <label className="flex h-full min-w-0 flex-1 items-center gap-4 px-5">
        <span className="flex-none font-semibold text-slate-400">fx</span>
        <input
          aria-label={copy.table.formulaInputLabel}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 read-only:text-slate-500"
          onChange={(event) => onChange(event.target.value)}
          placeholder={fieldLabel ? copy.table.formulaPlaceholder(fieldLabel) : copy.table.selectCell}
          readOnly={!canEdit}
          title={fieldLabel || copy.table.selectCell}
          value={value}
        />
      </label>
    </div>
  );
}

function KnowledgeTable({
  copy,
  editing,
  errors,
  onCellChange,
  onDeleteField,
  rows,
  type,
}) {
  const [fieldView, setFieldView] = useState('all');
  const [selectedCell, setSelectedCell] = useState(null);
  const visibleRows = useMemo(() => (editing ? rows : ensureRowsForBrowsing(rows)), [editing, rows]);
  const visibleFields = useMemo(() => getVisibleFields(type, fieldView), [fieldView, type]);
  const tableMinWidth = visibleFields.reduce((width, field) => width + field.width, 0);
  const selectedRowIndex = selectedCell ? visibleRows.findIndex((row) => row.id === selectedCell.rowId) : -1;
  const selectedFieldIndex = selectedCell ? visibleFields.findIndex((field) => field.key === selectedCell.fieldKey) : -1;
  const selectedRow = selectedRowIndex >= 0 ? visibleRows[selectedRowIndex] : null;
  const selectedField = selectedFieldIndex >= 0 ? visibleFields[selectedFieldIndex] : null;
  const selectedValue =
    selectedRow && selectedField ? String(getDisplayCellValue(selectedRow, selectedField, type, copy)) : '';
  const selectedCoordinate =
    selectedRowIndex >= 0 && selectedFieldIndex >= 0 ? `${getColumnName(selectedFieldIndex)}${selectedRowIndex + 1}` : '';
  const selectedCanEdit = Boolean(editing && selectedField && !selectedField.readOnly);
  const selectedFieldLabel =
    selectedField && type ? getFieldLabel(selectedField, type, copy).replace(/\*$/, '') : '';

  useEffect(() => {
    const selectedExists =
      selectedCell &&
      visibleRows.some((row) => row.id === selectedCell.rowId) &&
      visibleFields.some((field) => field.key === selectedCell.fieldKey);

    if (!selectedExists && visibleRows[0] && visibleFields[0]) {
      setSelectedCell({ fieldKey: visibleFields[0].key, rowId: visibleRows[0].id });
    }
  }, [selectedCell, type.id, visibleFields, visibleRows]);

  function updateSelectedValue(value) {
    if (!selectedCanEdit || !selectedRow || !selectedField) return;
    onCellChange(selectedRow.id, selectedField.key, value);
  }

  function getBodyCellBackground(field) {
    const isNameColumn = field.key === type.nameFieldKey;
    const isSystemField = field.key === 'knowledgeId';

    if (editing) {
      if (isNameColumn) return 'bg-slate-50';
      if (isSystemField) return 'bg-slate-50';
      return 'bg-white';
    }

    if (isNameColumn) return 'bg-slate-100/80';
    if (isSystemField) return 'bg-slate-50';
    return 'bg-white';
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <SheetToolbar copy={copy} editing={editing} fieldView={fieldView} onFieldViewChange={setFieldView} />
      <FormulaRow
        canEdit={selectedCanEdit}
        coordinate={selectedCoordinate}
        copy={copy}
        fieldLabel={selectedFieldLabel}
        onChange={updateSelectedValue}
        value={selectedValue}
      />
      <div
        className="min-h-0 flex-1 overflow-auto"
      >
        <div className="min-h-full" style={{ minWidth: tableMinWidth }}>
          <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white">
            {visibleFields.map((field) => {
              const isNameColumn = field.key === type.nameFieldKey;
              const isSystemField = field.key === 'knowledgeId';

              return (
                <div
                  key={field.key}
                  className={`group relative flex h-12 flex-none items-center border-r border-slate-200 px-3 text-sm font-bold text-slate-700 ${
                    isNameColumn ? 'bg-slate-100' : 'bg-slate-50'
                  }`}
                  style={{ width: field.width }}
                >
                  <span className="min-w-0 truncate">{getFieldLabel(field, type, copy)}</span>
                  {!type.preset && editing && !isSystemField ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-white text-slate-400 opacity-0 ring-1 ring-slate-200 transition hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                      onClick={() => onDeleteField(field)}
                      aria-label={`${copy.drawer.deleteField}: ${field.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <span className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize bg-transparent group-hover:bg-blue-100" />
                </div>
              );
            })}
          </div>

          {visibleRows.map((row) => (
            <div key={row.id} className="group flex border-b border-slate-200">
              {visibleFields.map((field) => {
                const isSystemField = field.key === 'knowledgeId';
                const error = errors[`${row.id}:${field.key}`];
                const value = getDisplayCellValue(row, field, type, copy);
                const isSelected = selectedCell?.rowId === row.id && selectedCell?.fieldKey === field.key;
                const backgroundClass = error ? 'bg-red-50' : getBodyCellBackground(field);

                return (
                  <div
                    key={field.key}
                    className={`relative flex h-12 flex-none items-center border-r border-slate-200 px-3 text-sm ${
                      error ? 'ring-1 ring-inset ring-red-300' : ''
                    } ${backgroundClass} ${
                      isSelected ? 'z-[1] ring-2 ring-inset ring-blue-500' : ''
                    }`}
                    onMouseDown={() => setSelectedCell({ fieldKey: field.key, rowId: row.id })}
                    style={{ width: field.width }}
                  >
                    {editing && !field.readOnly ? (
                      <input
                        className="h-full w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                        onChange={(event) => onCellChange(row.id, field.key, event.target.value)}
                        onFocus={() => setSelectedCell({ fieldKey: field.key, rowId: row.id })}
                        placeholder={copy.table.emptyCell}
                        value={getCellValue(row, field)}
                      />
                    ) : (
                      <span
                        className={`min-w-0 truncate ${
                          isSystemField && row.draft ? 'text-orange-500' : 'text-slate-700'
                        }`}
                        title={String(value)}
                      >
                        {value}
                      </span>
                    )}
                    <span className="absolute bottom-0 left-0 h-1 w-8 cursor-row-resize bg-transparent group-hover:bg-blue-100" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ensureRowsForBrowsing(rows) {
  const nextRows = clone(rows);
  while (nextRows.length < 12) {
    nextRows.push(createBlankRow());
  }
  return nextRows;
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

function FieldTypeSelect({ copy, disabled = false, error, onChange, value }) {
  return (
    <span className="relative block">
      <select
        className={`h-10 w-full appearance-none rounded-md border bg-white px-3 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{copy.drawer.fieldType}</option>
        {knowledgeFieldTypes.map((type) => (
          <option key={type} value={type}>
            {copy.fieldTypes[type]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </span>
  );
}

function KnowledgeTypeDrawer({
  copy,
  data,
  errors,
  onAddField,
  onCancel,
  onChange,
  onDeleteField,
  onFieldChange,
  onSave,
}) {
  return (
    <div className="fixed bottom-0 left-[300px] right-0 top-0 z-40 bg-slate-950/40">
      <form
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-[860px] flex-col bg-white shadow-menu"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="flex h-[72px] flex-none items-center justify-between border-b border-slate-200 px-7">
          <h2 className="text-xl font-bold text-slate-800">{copy.drawer.createTitle}</h2>
          <button
            type="button"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            onClick={onCancel}
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
          <div className="space-y-7">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                {copy.drawer.typeName}
                <span className="ml-1 text-red-500">*</span>
              </span>
              <input
                className={`h-11 w-full rounded-md border px-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                  errors.name ? 'border-red-400' : 'border-slate-200'
                }`}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder={copy.drawer.typeNamePlaceholder}
                value={data.name}
              />
              {errors.name ? <span className="mt-1 block text-xs font-medium text-red-500">{errors.name}</span> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">{copy.drawer.typeDescription}</span>
              <textarea
                className="min-h-[110px] w-full resize-none rounded-md border border-slate-200 px-3 py-3 text-base leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => onChange('description', event.target.value)}
                placeholder={copy.drawer.typeDescriptionPlaceholder}
                value={data.description}
              />
            </label>

            <section>
              <h3 className="text-lg font-bold text-slate-800">{copy.drawer.fieldConfig}</h3>
              {errors.fields ? (
                <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                  {errors.fields}
                </div>
              ) : null}
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[1.4fr_1fr_90px_90px_52px] bg-slate-50 text-sm font-bold text-slate-800">
                  <div className="px-4 py-3">{copy.drawer.fieldName}</div>
                  <div className="px-4 py-3">{copy.drawer.fieldType}</div>
                  <div className="px-4 py-3 text-center">{copy.drawer.fieldLength}</div>
                  <div className="px-4 py-3 text-center">{copy.drawer.required}</div>
                  <div className="px-4 py-3" />
                </div>
                {data.fields.map((field) => (
                  <div
                    key={field.id}
                    className="group grid min-h-[56px] grid-cols-[1.4fr_1fr_90px_90px_52px] items-center border-t border-slate-200 bg-white"
                  >
                    <div className="px-4 py-2">
                      <input
                        className={`h-10 w-full rounded-md border px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                          errors[`field:${field.id}:label`] ? 'border-red-400' : 'border-slate-200'
                        }`}
                        onChange={(event) => onFieldChange(field.id, 'label', event.target.value)}
                        placeholder={copy.drawer.fieldNamePlaceholder}
                        maxLength={field.primary ? 20 : undefined}
                        value={field.label}
                      />
                    </div>
                    <div className="px-4 py-2">
                      <FieldTypeSelect
                        copy={copy}
                        disabled={field.primary}
                        error={errors[`field:${field.id}:type`]}
                        onChange={(value) => onFieldChange(field.id, 'type', value)}
                        value={field.type}
                      />
                    </div>
                    <div className="px-4 py-2 text-center text-sm font-semibold text-slate-500">
                      {field.maxLength ? `≤${field.maxLength}` : copy.drawer.noLengthLimit}
                    </div>
                    <div className="flex justify-center px-4 py-2">
                      <input
                        checked={field.required}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={field.primary}
                        onChange={(event) => onFieldChange(field.id, 'required', event.target.checked)}
                        type="checkbox"
                      />
                    </div>
                    <div className="relative flex h-full items-center justify-center px-3">
                      {!field.primary ? (
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                          onClick={() => onDeleteField(field.id)}
                          aria-label={copy.drawer.deleteField}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="mt-4"
                icon={Plus}
                variant="secondary"
                onClick={onAddField}
              >
                {copy.addField}
              </Button>
            </section>
          </div>
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

function FieldDialog({ copy, data, errors, onCancel, onChange, onSave }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <form
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-menu"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <h3 className="text-xl font-bold text-slate-900">{copy.addFieldDialog.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{copy.addFieldDialog.description}</p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">{copy.drawer.fieldName}</span>
            <input
              className={`h-11 w-full rounded-md border px-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                errors.label ? 'border-red-400' : 'border-slate-200'
              }`}
              onChange={(event) => onChange('label', event.target.value)}
              placeholder={copy.drawer.fieldNamePlaceholder}
              value={data.label}
            />
            {errors.label ? <span className="mt-1 block text-xs font-medium text-red-500">{errors.label}</span> : null}
          </label>
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-500">{copy.drawer.fieldType}</span>
            <FieldTypeSelect
              copy={copy}
              error={errors.type}
              onChange={(value) => onChange('type', value)}
              value={data.type}
            />
            {errors.type ? <span className="mt-1 block text-xs font-medium text-red-500">{errors.type}</span> : null}
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              checked={data.required}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              onChange={(event) => onChange('required', event.target.checked)}
              type="checkbox"
            />
            {copy.drawer.required}
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="neutral"
            onClick={onCancel}
          >
            {copy.cancel}
          </Button>
          <Button
            type="submit"
          >
            {copy.saveField}
          </Button>
        </div>
      </form>
    </div>
  );
}

function createDrawerField({ primary = false } = {}) {
  return {
    id: `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: '',
    type: 'shortText',
    required: primary,
    maxLength: primary ? 20 : null,
    primary,
  };
}

function validateFieldList(fields, copy) {
  const errors = {};
  const names = new Set();

  if (!fields.length) {
    errors.fields = copy.validation.oneFieldRequired;
  }

  fields.forEach((field, index) => {
    const name = field.label.trim().toLowerCase();
    if (!name) {
      errors[`field:${field.id}:label`] = copy.validation.fieldNameRequired;
    }

    if (index === 0) {
      if (field.label.trim().length > 20) {
        errors[`field:${field.id}:label`] = copy.validation.firstFieldMaxLength;
      }

      if (field.type !== 'shortText' || !field.required) {
        errors.fields = copy.validation.primaryFieldLocked;
      }
    }

    if (!field.type) {
      errors[`field:${field.id}:type`] = copy.validation.fieldTypeRequired;
    }

    if (name && names.has(name)) {
      errors[`field:${field.id}:label`] = copy.validation.duplicateFieldName;
    }

    if (name) names.add(name);
  });

  return errors;
}

export default function KnowledgeItemsPage({ project, t }) {
  const [draft, setDraft] = useState(() => getKnowledgeItemDraft(project));
  const [activeTypeId, setActiveTypeId] = useState(() => getKnowledgeItemDraft(project).types[0]?.id);
  const [editing, setEditing] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [cellErrors, setCellErrors] = useState({});
  const [validationMessage, setValidationMessage] = useState('');
  const [toast, setToast] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ preset: true, custom: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDraft, setDrawerDraft] = useState(() => ({
    name: '',
    description: '',
    fields: [createDrawerField({ primary: true })],
  }));
  const [drawerErrors, setDrawerErrors] = useState({});
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldDraft, setFieldDraft] = useState(createDrawerField);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteFieldTarget, setDeleteFieldTarget] = useState(null);
  const copy = t.knowledgeItems;

  useEffect(() => {
    const nextDraft = getKnowledgeItemDraft(project);
    setDraft(nextDraft);
    setActiveTypeId(nextDraft.types[0]?.id);
    setEditing(false);
    setEditRows([]);
    setCellErrors({});
    setValidationMessage('');
  }, [project]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeType = useMemo(
    () => draft.types.find((type) => type.id === activeTypeId) ?? draft.types[0],
    [activeTypeId, draft.types],
  );
  const activeRows = draft.rows[activeType?.id] ?? [];
  const rowsForComparison = editing ? getComparisonRows(editRows, activeType) : [];
  const hasUnsavedTableChanges = editing && !valuesEqual(rowsForComparison, activeRows);

  function persist(nextDraft, message) {
    const saved = saveKnowledgeItemDraft(project.id, nextDraft);
    setDraft(saved);
    if (message) setToast({ id: Date.now(), message, type: 'success' });
    return saved;
  }

  function selectType(typeId) {
    if (editing && hasUnsavedTableChanges) {
      setShowDiscardDialog(true);
      return;
    }

    setActiveTypeId(typeId);
    setEditing(false);
    setCellErrors({});
    setValidationMessage('');
  }

  function toggleGroup(group) {
    setExpandedGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  }

  function startEditing() {
    setEditing(true);
    setEditRows(ensureDisplayRows(activeRows));
    setCellErrors({});
    setValidationMessage('');
  }

  function cancelEditing() {
    if (hasUnsavedTableChanges) {
      setShowDiscardDialog(true);
      return;
    }

    setEditing(false);
    setEditRows([]);
    setCellErrors({});
    setValidationMessage('');
  }

  function discardTableChanges() {
    setShowDiscardDialog(false);
    setEditing(false);
    setEditRows([]);
    setCellErrors({});
    setValidationMessage('');
  }

  function updateCell(rowId, fieldKey, value) {
    setEditRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cells: {
                ...row.cells,
                [fieldKey]: value,
              },
            }
          : row,
      ),
    );

    const errorKey = `${rowId}:${fieldKey}`;
    if (cellErrors[errorKey]) {
      setCellErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[errorKey];
        return nextErrors;
      });
    }
  }

  function saveRows() {
    const result = validateAndNormalizeRows(editRows, activeType, copy);
    if (Object.keys(result.errors).length) {
      setCellErrors(result.errors);
      setValidationMessage(copy.validationSummary);
      return;
    }

    const nextDraft = {
      ...draft,
      rows: {
        ...draft.rows,
        [activeType.id]: result.rows,
      },
    };
    persist(nextDraft, copy.saveSuccess);
    setEditing(false);
    setEditRows([]);
    setCellErrors({});
    setValidationMessage('');
  }

  function openCreateTypeDrawer() {
    setDrawerDraft({ name: '', description: '', fields: [createDrawerField({ primary: true })] });
    setDrawerErrors({});
    setDrawerOpen(true);
  }

  function updateDrawerField(field, value) {
    setDrawerDraft((current) => ({ ...current, [field]: value }));
    if (drawerErrors[field]) setDrawerErrors((current) => ({ ...current, [field]: '' }));
  }

  function updateDrawerConfigField(fieldId, field, value) {
    setDrawerDraft((current) => ({
      ...current,
      fields: current.fields.map((item) =>
        item.id === fieldId
          ? {
              ...item,
              [field]:
                item.primary && field === 'type'
                  ? 'shortText'
                  : item.primary && field === 'required'
                    ? true
                    : value,
            }
          : item,
      ),
    }));

    setDrawerErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[`field:${fieldId}:${field === 'label' ? 'label' : 'type'}`];
      delete nextErrors.fields;
      return nextErrors;
    });
  }

  function addDrawerField() {
    setDrawerDraft((current) => ({ ...current, fields: [...current.fields, createDrawerField()] }));
    setDrawerErrors((current) => ({ ...current, fields: '' }));
  }

  function deleteDrawerField(fieldId) {
    const target = drawerDraft.fields.find((field) => field.id === fieldId);
    if (target?.primary) {
      setDrawerErrors((current) => ({ ...current, fields: copy.validation.primaryFieldLocked }));
      return;
    }

    if (drawerDraft.fields.length <= 1) {
      setDrawerErrors((current) => ({ ...current, fields: copy.validation.oneFieldRequired }));
      return;
    }

    setDrawerDraft((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
  }

  function saveCustomType() {
    const errors = {
      ...validateFieldList(drawerDraft.fields, copy),
    };

    if (!drawerDraft.name.trim()) {
      errors.name = copy.validation.typeNameRequired;
    }

    if (Object.values(errors).some(Boolean)) {
      setDrawerErrors(errors);
      return;
    }

    const normalizedFields = drawerDraft.fields.map((field, index) => ({
      ...field,
      type: index === 0 ? 'shortText' : field.type,
      required: index === 0 ? true : field.required,
      maxLength: index === 0 ? 20 : (field.maxLength ?? null),
    }));

    const type = createCustomKnowledgeType({
      description: drawerDraft.description.trim(),
      fields: normalizedFields,
      name: drawerDraft.name.trim(),
    });
    const nextDraft = {
      ...draft,
      types: [...draft.types, type],
      rows: {
        ...draft.rows,
        [type.id]: [],
      },
    };
    persist(nextDraft, copy.typeCreated);
    setActiveTypeId(type.id);
    setDrawerOpen(false);
  }

  function openFieldDialog() {
    setFieldDraft(createDrawerField());
    setFieldErrors({});
    setFieldDialogOpen(true);
  }

  function updateFieldDraft(field, value) {
    setFieldDraft((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }));
  }

  function saveField() {
    const errors = {};
    const normalizedName = fieldDraft.label.trim().toLowerCase();
    const existingNames = new Set(activeType.fields.map((field) => field.label.trim().toLowerCase()));

    if (!fieldDraft.label.trim()) errors.label = copy.validation.fieldNameRequired;
    if (!fieldDraft.type) errors.type = copy.validation.fieldTypeRequired;
    if (normalizedName && existingNames.has(normalizedName)) errors.label = copy.validation.duplicateFieldName;

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const nextField = createCustomField(fieldDraft, activeType.fields);
    const nextTypes = draft.types.map((type) =>
      type.id === activeType.id
        ? {
            ...type,
            fields: [...type.fields, nextField],
          }
        : type,
    );
    persist({ ...draft, types: nextTypes }, copy.fieldAdded);
    setFieldDialogOpen(false);
  }

  function confirmDeleteField() {
    if (!deleteFieldTarget) return;

    const editableFieldCount = activeType.fields.filter((field) => !field.readOnly).length;
    if (editableFieldCount <= 1) {
      setToast({ id: Date.now(), message: copy.validation.oneFieldRequired, type: 'warning' });
      setDeleteFieldTarget(null);
      return;
    }

    const remainingFields = activeType.fields.filter((field) => field.key !== deleteFieldTarget.key);
    const nextNameFieldKey =
      activeType.nameFieldKey === deleteFieldTarget.key
        ? remainingFields.find((field) => !field.readOnly)?.key
        : activeType.nameFieldKey;
    const nextTypes = draft.types.map((type) =>
      type.id === activeType.id
        ? {
            ...type,
            fields: remainingFields,
            nameFieldKey: nextNameFieldKey,
          }
        : type,
    );
    const nextRows = (draft.rows[activeType.id] ?? []).map((row) => {
      const nextCells = { ...row.cells };
      delete nextCells[deleteFieldTarget.key];
      return { ...row, cells: nextCells };
    });

    if (editing) {
      setEditRows((current) =>
        current.map((row) => {
          const nextCells = { ...row.cells };
          delete nextCells[deleteFieldTarget.key];
          return { ...row, cells: nextCells };
        }),
      );
    }

    persist(
      {
        ...draft,
        types: nextTypes,
        rows: {
          ...draft.rows,
          [activeType.id]: nextRows,
        },
      },
      copy.fieldDeleted,
    );
    setDeleteFieldTarget(null);
  }

  if (!activeType) return null;

  return (
    <div className={adaptivePageLayout.pageStack}>
      <PageIntro copy={copy} />

      <div className={`${adaptivePageLayout.workArea} xl:grid-cols-[300px_minmax(0,1fr)]`}>
        <KnowledgeTypePanel
          activeTypeId={activeType.id}
          copy={copy}
          expandedGroups={expandedGroups}
          onCreate={openCreateTypeDrawer}
          onSelectType={selectType}
          onToggleGroup={toggleGroup}
          types={draft.types}
        />

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-5 flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="truncate text-2xl font-bold tracking-normal text-slate-800">
              {getDisplayTypeName(activeType, copy)}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              {editing && !activeType.preset ? (
                <Button
                  icon={Plus}
                  variant="secondary"
                  onClick={openFieldDialog}
                >
                  {copy.addField}
                </Button>
              ) : null}
              {!editing ? (
                <>
                  <Button icon={Download} variant="secondary">
                    {copy.export}
                  </Button>
                  <Button
                    icon={Pencil}
                    onClick={startEditing}
                  >
                    {copy.edit}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    icon={X}
                    variant="neutral"
                    onClick={cancelEditing}
                  >
                    {copy.cancel}
                  </Button>
                  <Button
                    icon={Save}
                    onClick={saveRows}
                  >
                    {copy.save}
                  </Button>
                </>
              )}
            </div>
          </div>

          {validationMessage ? (
            <div className="mb-4 flex flex-none items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
              <AlertCircle className="h-5 w-5" />
              {validationMessage}
            </div>
          ) : null}

          <KnowledgeTable
            copy={copy}
            editing={editing}
            errors={cellErrors}
            onCellChange={updateCell}
            onDeleteField={setDeleteFieldTarget}
            rows={editing ? editRows : activeRows}
            type={activeType}
          />
        </section>
      </div>

      {drawerOpen ? (
        <KnowledgeTypeDrawer
          copy={copy}
          data={drawerDraft}
          errors={drawerErrors}
          onAddField={addDrawerField}
          onCancel={() => setDrawerOpen(false)}
          onChange={updateDrawerField}
          onDeleteField={deleteDrawerField}
          onFieldChange={updateDrawerConfigField}
          onSave={saveCustomType}
        />
      ) : null}

      {fieldDialogOpen ? (
        <FieldDialog
          copy={copy}
          data={fieldDraft}
          errors={fieldErrors}
          onCancel={() => setFieldDialogOpen(false)}
          onChange={updateFieldDraft}
          onSave={saveField}
        />
      ) : null}

      {showDiscardDialog ? (
        <ConfirmDialog
          cancelLabel={copy.continueEditing}
          confirmLabel={copy.discardChanges}
          danger
          message={copy.discardBody}
          onCancel={() => setShowDiscardDialog(false)}
          onConfirm={discardTableChanges}
          title={copy.discardTitle}
        />
      ) : null}

      {deleteFieldTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.deleteFieldDialog.body(deleteFieldTarget.label)}
          onCancel={() => setDeleteFieldTarget(null)}
          onConfirm={confirmDeleteField}
          title={copy.deleteFieldDialog.title}
        />
      ) : null}

      {toast ? <Toast key={toast.id} message={toast.message} type={toast.type} /> : null}
    </div>
  );
}
