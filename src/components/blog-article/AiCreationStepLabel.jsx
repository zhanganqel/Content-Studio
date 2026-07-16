export default function AiCreationStepLabel({ active = false, className = '', step }) {
  // 英文步骤名按单词换行，保证顶部步骤条宽度稳定。
  const words = String(step ?? '').split(/\s+/).filter(Boolean);

  return (
    <span
      className={`flex flex-col text-center text-[14px] font-semibold leading-[16px] ${
        className || (active ? 'text-[#303133]' : 'text-[#A8ABB2]')
      }`}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="whitespace-nowrap">
          {word}
        </span>
      ))}
    </span>
  );
}
