import AiCreationStepLabel from './AiCreationStepLabel.jsx';
import { collaborativeStages } from './collaborativeStages.js';

const stageStyles = {
  completed: {
    circle: 'bg-[#009B62] text-white',
    label: 'text-[#00A85F]',
  },
  running: {
    circle: 'bg-[#365EFF] text-white',
    label: 'text-[#303133]',
  },
  stopped: {
    circle: 'bg-[#F2F4F7] text-[#909399]',
    label: 'text-[#909399]',
  },
  unavailable: {
    circle: 'bg-[#E9ECF2] text-[#A8ABB2]',
    label: 'text-[#A8ABB2]',
  },
};

// 协同创作唯一阶段导航组件；圆点承载状态色，步骤文字始终透明背景。
export default function CollaborativeCreationStepper({
  copy,
  onStageChange,
  stageStatuses,
  viewStage,
}) {
  return (
    <nav aria-label="协同创作阶段" className="flex items-center justify-center gap-5">
      {copy.steps.map((step, index) => {
        const stage = collaborativeStages[index];
        const status = stageStatuses?.[stage] ?? 'unavailable';
        const active = stage === viewStage;
        const disabled = status === 'unavailable' || active;
        const styles = stageStyles[status] ?? stageStyles.unavailable;

        return (
          <div key={stage} className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-3 px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#365EFF]/30 disabled:cursor-default ${
                disabled ? '' : 'cursor-pointer'
              }`}
              disabled={disabled}
              onClick={() => onStageChange?.(stage)}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold ${styles.circle} ${
                  active ? 'ring-2 ring-[#B8D3FF] ring-offset-2' : ''
                }`}
              >
                {index + 1}
              </span>
              <AiCreationStepLabel className={styles.label} step={step} />
            </button>
            {index < copy.steps.length - 1 ? <span className="h-px w-16 bg-[#E4E7ED]" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
