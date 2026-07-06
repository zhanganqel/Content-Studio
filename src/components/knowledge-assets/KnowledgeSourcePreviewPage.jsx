import { ArrowLeft, FileText } from 'lucide-react';

export default function KnowledgeSourcePreviewPage({ block, project }) {
  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <header className="h-[56px] border-b border-[#EBEEF5] bg-white">
        <div className="mx-auto flex h-full max-w-[1180px] items-center px-6">
          <button
            type="button"
            className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#232E45] transition hover:bg-[#F5F7FA]"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.close();
              }
            }}
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-[18px] font-bold leading-[28px] text-[#232E45]">
            知识资料预览
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <section className="rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
          <div className="flex items-center gap-3 border-b border-[#EBEEF5] px-6 py-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#EEF3FF] text-[#365EFF]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-bold leading-[24px] text-[#303133]">
                {block?.sourceFileName || block?.sourceName || '未找到资料'}
              </div>
              <div className="mt-0.5 truncate text-[13px] leading-[20px] text-[#909399]">
                {project?.name || 'Content Studio'} / 来源文本块
              </div>
            </div>
          </div>

          {block ? (
            <div className="px-6 py-5">
              <div className="rounded-[8px] border border-[#DCDFE6] bg-white p-5">
                <div className="text-[14px] font-bold leading-[22px] text-[#303133]">标题：{block.title}</div>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-[24px] text-[#606266]">
                  {block.fullContent || block.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-[14px] leading-[22px] text-[#909399]">
              未找到对应的知识资料文本块，请从文章创作页面重新打开。
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
