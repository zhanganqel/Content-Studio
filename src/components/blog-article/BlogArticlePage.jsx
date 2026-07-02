import {
  Bot,
  CalendarClock,
  ChevronDown,
  Copy,
  FilePlus2,
  FileText,
  Search,
  Settings2,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { adaptivePageLayout } from '../layoutClasses.js';
import Button from '../ui/Button.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Toast from '../ui/Toast.jsx';
import {
  articleStatusOptions,
  articleTypeOptions,
  createBlankBlogArticle,
  createBlogArticleId,
  getBlogArticleDrafts,
  getTodayString,
  saveBlogArticleDrafts,
} from '../../services/blogArticleStore.js';

const emptyAdvancedFilters = {
  audiencePersonaId: 'all',
  articleType: 'all',
  updatedFrom: '',
  updatedTo: '',
  updatedBy: 'all',
};

function hasAdvancedFilterValue(filters) {
  return (
    filters.audiencePersonaId !== 'all' ||
    filters.articleType !== 'all' ||
    Boolean(filters.updatedFrom) ||
    Boolean(filters.updatedTo) ||
    filters.updatedBy !== 'all'
  );
}

function getSearchText(article) {
  return [
    article.title,
    article.targetAudienceName,
    article.articleType,
    article.updatedBy,
    ...(article.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function StatusBadge({ copy, status }) {
  const classes = {
    draft: 'bg-slate-100 text-slate-600 ring-slate-200',
    review: 'bg-amber-50 text-amber-600 ring-amber-200',
    pending: 'bg-blue-50 text-blue-600 ring-blue-200',
    published: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  };

  return (
    <span className={`inline-flex flex-none items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${classes[status]}`}>
      {copy.status[status]}
    </span>
  );
}

function SelectControl({ label, onChange, options, value }) {
  return (
    <span className="relative block">
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

function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  danger,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-menu">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="neutral" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  article,
  copy,
  onDelete,
  onDuplicate,
  onOpenEditor,
  onPublishSettings,
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-7 py-5 transition hover:border-blue-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-w-0 truncate text-left text-xl font-bold tracking-normal text-slate-800 transition hover:text-blue-600"
              onClick={() => onOpenEditor(article)}
            >
              {article.title}
            </button>
            <StatusBadge copy={copy} status={article.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base font-medium text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4" />
              {copy.fields.targetAudience}: {article.targetAudienceName || '-'}
            </span>
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {copy.fields.articleType}: {article.articleType || '-'}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              {copy.fields.updatedAt}: {article.updatedAt}
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {copy.fields.updatedBy}: {article.updatedBy}
            </span>
          </div>
        </div>

        <div className="flex flex-none items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 transition hover:text-red-400"
            onClick={() => onDelete(article)}
          >
            <Trash2 className="h-4 w-4" />
            {copy.delete}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-500"
            onClick={() => onDuplicate(article)}
          >
            <Copy className="h-4 w-4" />
            {copy.duplicate}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-500"
            onClick={() => onPublishSettings(article)}
          >
            <Settings2 className="h-4 w-4" />
            {copy.publishSettings}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function BlogArticlePage({ creationNotice, onOpenAiCreation, onOpenEditor, project, t }) {
  const copy = t.blogArticle;
  const [articles, setArticles] = useState(() => getBlogArticleDrafts(project));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState(emptyAdvancedFilters);
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState(emptyAdvancedFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    setArticles(getBlogArticleDrafts(project));
    setSearchQuery('');
    setStatusFilter('all');
    setAdvancedFilters(emptyAdvancedFilters);
    setDraftAdvancedFilters(emptyAdvancedFilters);
    setFilterOpen(false);
    setDeleteTarget(null);
  }, [project]);

  useEffect(() => {
    if (!creationNotice) {
      return;
    }

    setArticles(getBlogArticleDrafts(project));
    setToast({
      id: creationNotice.id,
      message: creationNotice.message,
      type: creationNotice.type ?? 'success',
    });
  }, [creationNotice, project]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
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

  const audienceOptions = useMemo(() => {
    const personas = project?.demoProject?.audiencePersonas ?? [];
    const seen = new Set();
    const options = [{ value: 'all', label: copy.filters.allAudiences }];

    personas.forEach((persona) => {
      if (!seen.has(persona.id)) {
        seen.add(persona.id);
        options.push({ value: persona.id, label: persona.title });
      }
    });

    articles.forEach((article) => {
      if (article.targetAudiencePersonaId && !seen.has(article.targetAudiencePersonaId)) {
        seen.add(article.targetAudiencePersonaId);
        options.push({
          value: article.targetAudiencePersonaId,
          label: article.targetAudienceName || article.targetAudiencePersonaId,
        });
      }
    });

    return options;
  }, [articles, copy.filters.allAudiences, project]);

  const updatedByOptions = useMemo(() => {
    const users = Array.from(new Set(articles.map((article) => article.updatedBy).filter(Boolean)));
    return [
      { value: 'all', label: copy.filters.allUpdatedBy },
      ...users.map((user) => ({ value: user, label: user })),
    ];
  }, [articles, copy.filters.allUpdatedBy]);

  const statusOptions = [
    { value: 'all', label: copy.filters.allStatuses },
    ...articleStatusOptions.map((status) => ({ value: status, label: copy.status[status] })),
  ];
  const typeOptions = [
    { value: 'all', label: copy.filters.allTypes },
    ...articleTypeOptions.map((type) => ({ value: type, label: type })),
  ];

  const hasAdvancedFilters = hasAdvancedFilterValue(advancedFilters);
  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all' || hasAdvancedFilters;

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesQuery = !query || getSearchText(article).includes(query);
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesAudience =
        advancedFilters.audiencePersonaId === 'all' ||
        article.targetAudiencePersonaId === advancedFilters.audiencePersonaId;
      const matchesType =
        advancedFilters.articleType === 'all' || article.articleType === advancedFilters.articleType;
      const matchesUpdatedBy =
        advancedFilters.updatedBy === 'all' || article.updatedBy === advancedFilters.updatedBy;
      const matchesUpdatedFrom =
        !advancedFilters.updatedFrom || article.updatedAt >= advancedFilters.updatedFrom;
      const matchesUpdatedTo =
        !advancedFilters.updatedTo || article.updatedAt <= advancedFilters.updatedTo;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesAudience &&
        matchesType &&
        matchesUpdatedBy &&
        matchesUpdatedFrom &&
        matchesUpdatedTo
      );
    });
  }, [advancedFilters, articles, searchQuery, statusFilter]);

  function persist(nextArticles, message, type = 'success') {
    const saved = saveBlogArticleDrafts(project.id, nextArticles);
    setArticles(saved);

    if (message) {
      setToast({ id: Date.now(), message, type });
    }

    return saved;
  }

  function createBlankArticle() {
    const article = createBlankBlogArticle(copy.untitledTitle);
    persist([article, ...articles]);
    onOpenEditor(article);
  }

  function duplicateArticle(article) {
    const duplicatedArticle = {
      ...article,
      id: createBlogArticleId(),
      title: `${article.title} ${copy.copySuffix}`,
      status: 'draft',
      updatedAt: getTodayString(),
      updatedBy: 'Angel',
    };

    persist([duplicatedArticle, ...articles], copy.toast.duplicated);
    onOpenEditor(duplicatedArticle);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    persist(
      articles.filter((article) => article.id !== deleteTarget.id),
      copy.toast.deleted,
    );
    setDeleteTarget(null);
  }

  function toggleAdvancedFilter() {
    setDraftAdvancedFilters(advancedFilters);
    setFilterOpen((current) => !current);
  }

  function updateDraftAdvancedFilter(field, value) {
    setDraftAdvancedFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyAdvancedFilters() {
    setAdvancedFilters(draftAdvancedFilters);
    setFilterOpen(false);
  }

  function clearAdvancedFilters() {
    setAdvancedFilters(emptyAdvancedFilters);
    setDraftAdvancedFilters(emptyAdvancedFilters);
    setFilterOpen(false);
  }

  function clearAllFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    clearAdvancedFilters();
  }

  function openAiCreation() {
    if (onOpenAiCreation) {
      onOpenAiCreation();
      return;
    }

    setToast({ id: Date.now(), message: copy.toast.aiComingSoon, type: 'info' });
  }

  function openPublishSettings() {
    setToast({ id: Date.now(), message: copy.toast.publishSettingsComingSoon, type: 'info' });
  }

  return (
    <div className={`mx-auto max-w-[1600px] ${adaptivePageLayout.pageStack}`}>
      {toast ? <Toast key={toast.id} message={toast.message} testId="blog-article-toast" type={toast.type} /> : null}

      {deleteTarget ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirmDelete}
          danger
          message={copy.deleteBody(deleteTarget.title)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title={copy.deleteTitle}
        />
      ) : null}

      <PageHeader
        actions={
          <>
            <Button icon={FilePlus2} variant="neutral" onClick={createBlankArticle}>
              {copy.createBlank}
            </Button>
            <Button icon={Bot} onClick={openAiCreation}>
              {copy.aiCreate}
            </Button>
          </>
        }
        description={copy.description}
        title={copy.title}
      />

      <div className={adaptivePageLayout.workArea}>
        <section className={`${adaptivePageLayout.scrollPanel} p-7`}>
          <div className="mb-5 flex flex-none flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h3 className="text-xl font-bold text-slate-800">{copy.listTitle}</h3>

            <div className="flex flex-wrap items-center gap-3">
              <label className="relative block w-full sm:w-[360px]">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={copy.filters.searchPlaceholder}
                  type="search"
                  value={searchQuery}
                />
              </label>

              <div className="w-[180px]">
                <SelectControl
                  label={copy.filters.statusLabel}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  value={statusFilter}
                />
              </div>

              <div ref={filterRef} className="relative">
                <button
                  type="button"
                  className={`relative inline-flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold transition ${
                    hasAdvancedFilters || filterOpen
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  onClick={toggleAdvancedFilter}
                  aria-expanded={filterOpen}
                  aria-label={copy.filters.advancedTitle}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasAdvancedFilters ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
                  ) : null}
                </button>

                {filterOpen ? (
                  <form
                    className="absolute right-0 top-[calc(100%+8px)] z-40 w-[calc(100vw-64px)] rounded-lg border border-slate-200 bg-white p-4 shadow-menu sm:w-[520px]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      applyAdvancedFilters();
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-800">{copy.filters.advancedTitle}</h4>
                      <button
                        type="button"
                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                        onClick={() => setFilterOpen(false)}
                        aria-label={copy.filters.close}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.audienceLabel}
                        </span>
                        <SelectControl
                          label={copy.filters.audienceLabel}
                          onChange={(value) => updateDraftAdvancedFilter('audiencePersonaId', value)}
                          options={audienceOptions}
                          value={draftAdvancedFilters.audiencePersonaId}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.typeLabel}
                        </span>
                        <SelectControl
                          label={copy.filters.typeLabel}
                          onChange={(value) => updateDraftAdvancedFilter('articleType', value)}
                          options={typeOptions}
                          value={draftAdvancedFilters.articleType}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.updatedFrom}
                        </span>
                        <input
                          className="h-11 w-full rounded-md border border-slate-200 px-3 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          onChange={(event) => updateDraftAdvancedFilter('updatedFrom', event.target.value)}
                          type="date"
                          value={draftAdvancedFilters.updatedFrom}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.updatedTo}
                        </span>
                        <input
                          className="h-11 w-full rounded-md border border-slate-200 px-3 text-base text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          onChange={(event) => updateDraftAdvancedFilter('updatedTo', event.target.value)}
                          type="date"
                          value={draftAdvancedFilters.updatedTo}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-500">
                          {copy.filters.updatedByLabel}
                        </span>
                        <SelectControl
                          label={copy.filters.updatedByLabel}
                          onChange={(value) => updateDraftAdvancedFilter('updatedBy', value)}
                          options={updatedByOptions}
                          value={draftAdvancedFilters.updatedBy}
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                      <Button variant="neutral" onClick={clearAdvancedFilters}>
                        {copy.filters.clearAdvanced}
                      </Button>
                      <Button type="submit">
                        {copy.filters.apply}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>

              {hasActiveFilters ? (
                <Button variant="neutral" onClick={clearAllFilters}>
                  {copy.filters.clearAll}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredArticles.length ? (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    copy={copy}
                    onDelete={setDeleteTarget}
                    onDuplicate={duplicateArticle}
                    onOpenEditor={onOpenEditor}
                    onPublishSettings={openPublishSettings}
                  />
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-800">
                    {articles.length ? copy.empty.filteredTitle : copy.empty.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                    {articles.length ? copy.empty.filteredBody : copy.empty.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
