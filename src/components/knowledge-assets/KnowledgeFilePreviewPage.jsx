import { ArrowLeft, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  listChunks,
  listFiles,
  processFile,
} from '../../services/fileLibraryApi.js';
import Button from '../ui/Button.jsx';
import PageHeader from '../ui/PageHeader.jsx';

function closeOrBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

export default function KnowledgeFilePreviewPage({ fileId, project, t }) {
  // 预览页打开后会尝试重新解析文件，失败时展示已有或兜底分块。
  const copy = t.knowledgeAssets;
  const [file, setFile] = useState(() => listFiles(project).find((item) => item.id === fileId));
  const [chunks, setChunks] = useState(() => listChunks(project, fileId));
  const [loading, setLoading] = useState(Boolean(file));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // 使用 disposed 标记避免异步解析完成后更新已卸载页面。
    let disposed = false;
    const currentFile = listFiles(project).find((item) => item.id === fileId);
    setFile(currentFile);
    setChunks(currentFile ? listChunks(project, fileId) : []);
    setFailed(false);

    if (!currentFile) {
      setLoading(false);
      return () => {
        disposed = true;
      };
    }

    setLoading(true);
    processFile(project, fileId, { preserveOnFailure: true })
      .then((nextChunks) => {
        if (disposed) return;
        setChunks(nextChunks);
        setFile(listFiles(project).find((item) => item.id === fileId) ?? currentFile);
      })
      .catch(() => {
        if (disposed) return;
        setChunks(listChunks(project, fileId));
        setFile(listFiles(project).find((item) => item.id === fileId) ?? currentFile);
        setFailed(true);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [fileId, project]);

  const previewText = useMemo(
    // 多个分块使用分隔线合并为预览文本。
    () => chunks.map((chunk) => chunk.originalText).join('\n\n---\n\n'),
    [chunks],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="mx-auto max-w-[1180px] space-y-6 px-6 py-8">
        <PageHeader
          title={file?.title ?? copy.preview.notFoundTitle}
          description={file ? copy.preview.description(file.fileName) : copy.preview.notFoundBody}
          actions={
            <>
              <Button variant="neutral" icon={ArrowLeft} onClick={closeOrBack}>
                {copy.preview.back}
              </Button>
              {file?.url ? (
                <Button
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                >
                  {copy.preview.openSource}
                </Button>
              ) : null}
            </>
          }
        />

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-800">{file?.fileName ?? copy.preview.notFoundTitle}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                {file ? `${file.fileType?.toUpperCase()} / ${copy.fileStatuses[file.processingStatus]}` : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center gap-3 text-base font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              {copy.preview.loading}
            </div>
          ) : (
            <div className="p-6">
              {failed ? (
                <div className="mb-4 rounded-lg bg-orange-50 px-4 py-3 text-sm font-semibold leading-6 text-orange-600">
                  {copy.preview.parseFallback}
                </div>
              ) : null}
              <pre className="min-h-[420px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-700">
                {previewText || copy.preview.empty}
              </pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
