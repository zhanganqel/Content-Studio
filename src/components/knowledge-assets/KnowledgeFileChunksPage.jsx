import { ArrowLeft, FileText, Info, Pencil, RefreshCw, Save, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  listChunks,
  listFiles,
  reprocessFile,
  saveChunk,
} from '../../services/fileLibraryApi.js';
import Button from '../ui/Button.jsx';
import FixedPageLayout from '../ui/FixedPageLayout.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Toast from '../ui/Toast.jsx';

function StatusBadge({ copy, status }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-600',
    processing: 'bg-blue-50 text-blue-600',
    chunked: 'bg-emerald-50 text-emerald-600',
    failed: 'bg-red-50 text-red-500',
  };

  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${styles[status] ?? styles.pending}`}>
      {copy.fileStatuses[status] ?? status}
    </span>
  );
}

function ConfirmDialog({ copy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-6">
      <div className="w-full max-w-[480px] rounded-lg bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <h3 className="text-xl font-bold text-slate-800">{copy.chunks.reprocessConfirmTitle}</h3>
        <p className="mt-3 text-base leading-7 text-slate-500">{copy.chunks.reprocessConfirmBody}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="neutral" onClick={onCancel}>
            {copy.actions.cancel}
          </Button>
          <Button variant="primary" icon={RefreshCw} onClick={onConfirm}>
            {copy.chunks.confirmReprocess}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DiscardDialog({ copy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-6">
      <div className="w-full max-w-[480px] rounded-lg bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <h3 className="text-xl font-bold text-slate-800">{copy.chunks.discardTitle}</h3>
        <p className="mt-3 text-base leading-7 text-slate-500">{copy.chunks.discardBody}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="neutral" onClick={onCancel}>
            {copy.chunks.continueEditing}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {copy.chunks.discardChanges}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeFileChunksPage({ fileId, onBack, project, t }) {
  const copy = t.knowledgeAssets;
  const [files, setFiles] = useState(() => listFiles(project));
  const file = files.find((item) => item.id === fileId);
  const [chunks, setChunks] = useState([]);
  const [activeChunkId, setActiveChunkId] = useState('');
  const [draftText, setDraftText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const nextFiles = listFiles(project);
    const nextFile = nextFiles.find((item) => item.id === fileId);
    const nextChunks = nextFile ? listChunks(project, fileId) : [];
    setFiles(nextFiles);
    setChunks(nextChunks);
    setActiveChunkId(nextChunks[0]?.id ?? '');
    setDraftText(nextChunks[0]?.editedText ?? '');
    setIsEditing(false);
    setPendingAction(null);
    setSearchQuery('');
  }, [fileId, project]);

  function showToast(message, type = 'success') {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2200);
  }

  const filteredChunks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return chunks.filter((chunk) => {
      const text = [chunk.title, chunk.originalText, chunk.editedText]
        .join(' ')
        .toLowerCase();
      return !query || text.includes(query);
    });
  }, [chunks, searchQuery]);

  const activeChunk = chunks.find((chunk) => chunk.id === activeChunkId) ?? filteredChunks[0] ?? chunks[0];
  const hasUnsavedDraft = Boolean(isEditing && activeChunk && draftText !== activeChunk.editedText);

  useEffect(() => {
    if (!isEditing) {
      setDraftText(activeChunk?.editedText ?? '');
    }
  }, [activeChunk?.editedText, activeChunk?.id, isEditing]);

  function requestDiscard(action) {
    setPendingAction(action);
    setDiscardOpen(true);
  }

  function runPendingAction(action) {
    if (!action) return;

    if (action.type === 'cancel') {
      setDraftText(activeChunk?.editedText ?? '');
      setIsEditing(false);
      return;
    }

    if (action.type === 'chunk') {
      setIsEditing(false);
      setActiveChunkId(action.chunkId);
      return;
    }

    if (action.type === 'back') {
      setIsEditing(false);
      onBack();
    }
  }

  function handleSave() {
    if (!file || !activeChunk) return;
    const savedChunk = saveChunk(project, file.id, activeChunk.id, {
      editedText: draftText,
      charCount: draftText.length,
    });
    setChunks((current) =>
      current.map((chunk) => (chunk.id === activeChunk.id ? { ...chunk, ...savedChunk } : chunk)),
    );
    setFiles(listFiles(project));
    setIsEditing(false);
    showToast(copy.toast.chunksSaved, 'success');
  }

  function handleCancelEdit() {
    if (hasUnsavedDraft) {
      requestDiscard({ type: 'cancel' });
      return;
    }

    setDraftText(activeChunk?.editedText ?? '');
    setIsEditing(false);
  }

  function handleSelectChunk(chunkId) {
    if (chunkId === activeChunk?.id) return;
    if (hasUnsavedDraft) {
      requestDiscard({ type: 'chunk', chunkId });
      return;
    }

    setIsEditing(false);
    setActiveChunkId(chunkId);
  }

  function handleBack() {
    if (hasUnsavedDraft) {
      requestDiscard({ type: 'back' });
      return;
    }

    onBack();
  }

  async function handleReprocess() {
    if (!file) return;
    setConfirmOpen(false);
    try {
      const nextChunks = await reprocessFile(project, file.id);
      setChunks(nextChunks);
      setActiveChunkId(nextChunks[0]?.id ?? '');
      setDraftText(nextChunks[0]?.editedText ?? '');
      setIsEditing(false);
      setFiles(listFiles(project));
      showToast(copy.toast.reprocessed, 'success');
    } catch {
      setFiles(listFiles(project));
      showToast(copy.toast.processFailed, 'error');
    }
  }

  if (!file) {
    return (
      <FixedPageLayout
        header={
          <PageHeader
            title={copy.chunks.titleFallback}
            description={copy.chunks.notFound}
            actions={
              <Button variant="neutral" icon={ArrowLeft} onClick={handleBack}>
                {copy.chunks.backToLibrary}
              </Button>
            }
          />
        }
      >
        <div />
      </FixedPageLayout>
    );
  }

  return (
    <div className="h-full min-h-0">
      <FixedPageLayout
        bodyClassName="pb-8"
        header={
          <PageHeader
            title={file.title}
            description={copy.chunks.description(copy.fileStatuses[file.processingStatus] ?? file.processingStatus)}
            actions={
              <>
                <Button variant="neutral" icon={ArrowLeft} onClick={handleBack}>
                  {copy.chunks.backToLibrary}
                </Button>
                <Button variant="secondary" icon={RefreshCw} onClick={() => setConfirmOpen(true)}>
                  {copy.chunks.reprocess}
                </Button>
              </>
            }
          />
        }
      >
      <section className="grid min-h-[560px] gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{copy.chunks.listTitle}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{copy.chunks.count(chunks.length)}</p>
              </div>
              <StatusBadge copy={copy} status={file.processingStatus} />
            </div>

            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={copy.chunks.searchPlaceholder}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filteredChunks.map((chunk) => (
              <button
                key={chunk.id}
                type="button"
                className={`mb-2 w-full rounded-lg p-4 text-left transition ${
                  activeChunk?.id === chunk.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => handleSelectChunk(chunk.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{chunk.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      {chunk.editedText}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-slate-800">
                {activeChunk?.title ?? copy.chunks.noChunkSelected}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{activeChunk?.sourceLocator}</p>
            </div>
            {activeChunk ? (
              <div className="flex flex-none flex-wrap items-center justify-end gap-3">
                {isEditing ? (
                  <>
                    <Button variant="neutral" icon={X} onClick={handleCancelEdit}>
                      {copy.actions.cancel}
                    </Button>
                    <Button variant="primary" icon={Save} onClick={handleSave}>
                      {copy.actions.save}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" icon={Pencil} onClick={() => setIsEditing(true)}>
                    {copy.chunks.edit}
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 xl:grid-cols-2">
            <div className="flex min-h-[420px] flex-col">
              <label className="mb-2 text-sm font-bold text-slate-700">{copy.chunks.originalText}</label>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-7 text-slate-600 whitespace-pre-wrap">
                {activeChunk?.originalText ?? ''}
              </div>
            </div>

            <div className="flex min-h-[420px] flex-col">
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                {copy.chunks.proofreadText}
                <span className="group relative inline-flex text-slate-400">
                  <Info className="h-4 w-4" />
                  <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 hidden w-72 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold leading-5 text-white shadow-menu group-hover:block">
                    {copy.chunks.proofreadTooltip}
                  </span>
                </span>
              </label>
              <textarea
                className={`min-h-0 flex-1 resize-none rounded-lg border border-slate-200 p-4 text-sm font-medium leading-7 outline-none transition ${
                  isEditing
                    ? 'bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    : 'bg-slate-50 text-slate-600'
                }`}
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                disabled={!activeChunk}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </section>
      </section>
      </FixedPageLayout>

      {confirmOpen ? (
        <ConfirmDialog copy={copy} onCancel={() => setConfirmOpen(false)} onConfirm={handleReprocess} />
      ) : null}
      {discardOpen ? (
        <DiscardDialog
          copy={copy}
          onCancel={() => {
            setDiscardOpen(false);
            setPendingAction(null);
          }}
          onConfirm={() => {
            const action = pendingAction;
            setDiscardOpen(false);
            setPendingAction(null);
            runPendingAction(action);
          }}
        />
      ) : null}
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
    </div>
  );
}
