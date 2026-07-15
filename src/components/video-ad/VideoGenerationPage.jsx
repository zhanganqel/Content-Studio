import { ArrowLeft, Clapperboard } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function VideoGenerationPage({ onBack, t }) {
  const copy = t.videoAd.generation;

  return (
    /* 视频生成页保留完整页面骨架，后续接入生成流程。 */
    <main className="flex h-screen min-h-0 flex-col bg-white text-slate-900">
      <header className="flex h-[72px] flex-none items-center justify-between border-b border-slate-200 bg-white px-7">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            onClick={onBack}
            aria-label={copy.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-400">{copy.label}</p>
            <h1 className="truncate text-xl font-bold tracking-normal text-slate-800">{copy.title}</h1>
          </div>
        </div>

        <Button variant="neutral" onClick={onBack}>
          {copy.back}
        </Button>
      </header>

      <section className="min-h-0 flex-1 bg-slate-50 p-8">
        <div className="mx-auto flex h-full max-w-[1180px] min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-7">
          <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div>
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Clapperboard className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-bold tracking-normal text-slate-800">
                {copy.placeholderTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                {copy.placeholderBody}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
