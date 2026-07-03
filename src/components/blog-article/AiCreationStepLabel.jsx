export default function AiCreationStepLabel({ active, step }) {
  const words = String(step ?? '').split(/\s+/).filter(Boolean);

  return (
    <span
      className={`flex flex-col text-center text-[14px] font-semibold leading-[16px] ${
        active ? 'text-[#303133]' : 'text-[#A8ABB2]'
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
