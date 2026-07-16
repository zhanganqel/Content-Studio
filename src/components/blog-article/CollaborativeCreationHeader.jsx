import { ArrowLeft } from 'lucide-react';
import CollaborativeCreationStepper from './CollaborativeCreationStepper.jsx';

// 协同创作四页共用的固定三栏页头，保证阶段条始终位于相同位置。
export default function CollaborativeCreationHeader({
  copy,
  onBack,
  onStageChange,
  rightSlot = null,
  stageStatuses,
  title,
  viewStage,
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-[52px] border-b border-[#EBEEF5] bg-white">
      <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[minmax(280px,1fr)_auto_minmax(280px,1fr)] items-center gap-4 px-6">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            className="mr-3 inline-flex h-8 w-8 flex-none items-center justify-center rounded-[6px] text-[#232E45] transition hover:bg-[#F5F7FA]"
            onClick={onBack}
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-[18px] font-bold leading-[28px] text-[#232E45]">{title}</h1>
        </div>
        <CollaborativeCreationStepper
          copy={copy}
          onStageChange={onStageChange}
          stageStatuses={stageStatuses}
          viewStage={viewStage}
        />
        <div className="flex min-w-0 justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
