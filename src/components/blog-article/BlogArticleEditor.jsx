import { ArrowLeft, CalendarClock, FileText, Save, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Toast from '../ui/Toast.jsx';
import { getTodayString, upsertBlogArticle } from '../../services/blogArticleStore.js';

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// 编辑器用本地草稿和已保存草稿比较，判断关闭前是否需要确认。
function StatusBadge({ copy, status }) {
  const classes = {
    draft: 'bg-slate-100 text-slate-600 ring-slate-200',
    review: 'bg-amber-50 text-amber-600 ring-amber-200',
    pending: 'bg-blue-50 text-blue-600 ring-blue-200',
    published: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${classes[status]}`}>
      {copy.status[status]}
    </span>
  );
}

function ConfirmDialog({
  cancelLabel,
  confirmLabel,
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
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BlogArticleEditor({ article, onClose, project, t }) {
  // draft 是当前编辑内容，savedDraft 是最近一次保存后的内容。
  const copy = t.blogArticle;
  const [draft, setDraft] = useState(article);
  const [savedDraft, setSavedDraft] = useState(article);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [toast, setToast] = useState(null);
  const hasChanges = useMemo(() => !valuesEqual(draft, savedDraft), [draft, savedDraft]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveArticle() {
    // 保存时补齐标题、更新时间和更新人，再写入文章草稿列表。
    const updatedArticle = {
      ...draft,
      title: draft.title.trim() || copy.untitledTitle,
      updatedAt: getTodayString(),
      updatedBy: 'Angel',
    };

    upsertBlogArticle(project, updatedArticle);
    setDraft(updatedArticle);
    setSavedDraft(updatedArticle);
    setToast({ id: Date.now(), message: copy.toast.saved, type: 'success' });
  }

  function requestClose() {
    // 有未保存改动时先确认，避免直接返回丢失正文草稿。
    if (hasChanges) {
      setShowDiscardDialog(true);
      return;
    }

    onClose();
  }

  return (
    <main className="flex h-screen min-h-0 flex-col bg-white text-slate-900">
      {toast ? (
        <Toast key={toast.id} message={toast.message} testId="blog-article-editor-toast" type={toast.type} />
      ) : null}

      {showDiscardDialog ? (
        <ConfirmDialog
          cancelLabel={copy.continueEditing}
          confirmLabel={copy.discardChanges}
          message={copy.discardBody}
          onCancel={() => setShowDiscardDialog(false)}
          onConfirm={onClose}
          title={copy.discardTitle}
        />
      ) : null}

      <header className="flex h-[72px] flex-none items-center justify-between border-b border-slate-200 bg-white px-7">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            onClick={requestClose}
            aria-label={copy.editor.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-400">{copy.editor.label}</p>
            <h1 className="truncate text-xl font-bold text-slate-800">{draft.title || copy.untitledTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge copy={copy} status={draft.status} />
          <Button icon={Save} onClick={saveArticle}>
            {copy.save}
          </Button>
        </div>
      </header>

      <section className="min-h-0 flex-1 bg-slate-50 p-8">
        <div className="mx-auto flex h-full max-w-[1180px] min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-7">
          <div className="grid flex-none gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-medium text-slate-500">
                {copy.fields.title}
              </span>
              <input
                className="h-12 w-full rounded-md border border-slate-200 px-4 text-xl font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => updateField('title', event.target.value)}
                placeholder={copy.editor.titlePlaceholder}
                value={draft.title}
              />
            </label>

            <div className="grid content-end gap-2 text-sm font-medium text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                {copy.fields.updatedAt}: {draft.updatedAt}
              </span>
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {copy.fields.updatedBy}: {draft.updatedBy}
              </span>
            </div>
          </div>

          <label className="mt-6 flex min-h-0 flex-1 flex-col">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <FileText className="h-4 w-4" />
              {copy.fields.content}
            </span>
            <textarea
              className="min-h-[420px] flex-1 resize-none rounded-md border border-slate-200 px-4 py-4 text-base leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField('content', event.target.value)}
              placeholder={copy.editor.contentPlaceholder}
              value={draft.content}
            />
          </label>
        </div>
      </section>
    </main>
  );
}
