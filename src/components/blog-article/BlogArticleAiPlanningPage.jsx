import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TaskStatusIcon } from '../ai-workflow/AiWorkflowComponents.jsx';
import { useToast } from '../ui/Toast.jsx';
import CollaborativeCreationHeader from './CollaborativeCreationHeader.jsx';
import { formatTaskState, getTaskCompletedText, getTaskName, getTaskRunningText } from './aiTaskText.js';
import { getCollaborativeStageStatuses } from './collaborativeStages.js';
import { getAgentDisplay } from './agentDisplay.js';
import {
  createPlanningDemoData,
  restartCollaborativePlanningTask,
  startCollaborativeOutlineTask,
  updateAiCreationTask,
} from '../../services/blogArticleAiStore.js';

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getArtifactIcon(type) {
  if (type === 'references') return BookOpen;
  if (type === 'strategy') return ClipboardList;
  return FileText;
}

// 已完成任务直接恢复完整播放状态，未完成任务从第一个步骤开始。
function getInitialPlaybackState(workflow, task) {
  const playback = task?.planning?.playback;
  if (playback) {
    return {
      completedTaskIds: playback.completedTaskIds ?? [],
      currentTaskIndex: playback.currentTaskIndex ?? 0,
      isComplete: Boolean(playback.isComplete),
      selectedArtifactId: playback.selectedArtifactId ?? task?.planning?.currentArtifactId ?? '',
      visibleArtifactIds: playback.visibleArtifactIds ?? [],
      visibleThinkingCounts: playback.visibleThinkingCounts ?? {},
    };
  }

  const alreadyCompleted = task?.stage === 'planning-completed' || task?.stage?.startsWith('outline');

  if (!alreadyCompleted) {
    return {
      completedTaskIds: [],
      currentTaskIndex: 0,
      isComplete: false,
      selectedArtifactId: '',
      visibleArtifactIds: [],
      visibleThinkingCounts: {},
    };
  }

  return {
    completedTaskIds: workflow.map((item) => item.id),
    currentTaskIndex: workflow.length,
    isComplete: true,
    selectedArtifactId: task?.planning?.currentArtifactId ?? '',
    visibleArtifactIds: workflow.map((item) => item.artifactId).filter(Boolean),
    visibleThinkingCounts: Object.fromEntries(workflow.map((item) => [item.id, item.thinking.length])),
  };
}

function AgentAvatar({ agentTitle }) {
  const agentDisplay = getAgentDisplay(agentTitle);

  return (
    <div
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border text-[15px] font-bold ${agentDisplay.avatarClassName}`}
    >
      {agentDisplay.initial}
    </div>
  );
}

function ThinkingBlock({ children }) {
  return (
    <div
      className="ml-2 border-l-2 border-[#E4E7ED] pl-5 text-[14px] leading-[22px] text-[#606266]"
      style={{ animation: 'aiPlanningFadeInUp 180ms ease-out both' }}
    >
      {children}
    </div>
  );
}

function ArtifactCard({ artifact, onClick, selected }) {
  const Icon = getArtifactIcon(artifact.type);

  return (
    <button
      type="button"
      className={`ml-2 flex h-[78px] w-[520px] max-w-full items-center gap-3 rounded-[8px] border p-4 text-left transition hover:border-[#365EFF] hover:bg-[#F5F7FF] ${
        selected ? 'border-[#365EFF] bg-[#EEF3FF]' : 'border-[#DCDFE6] bg-white'
      }`}
      onClick={onClick}
    >
      <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-[8px] bg-[#5B7CFF] text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-[22px] text-[#303133]">{artifact.title}</span>
        <span className="mt-0.5 block truncate text-[13px] leading-[20px] text-[#606266]">{artifact.subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 flex-none text-[#A8ABB2]" />
    </button>
  );
}

function groupWorkflowTasks(tasks) {
  // 连续相同角色的任务合并展示，减少左侧流程重复头像。
  return tasks.reduce((groups, task) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.agentTitle === task.agentTitle) {
      lastGroup.tasks.push(task);
      return groups;
    }

    groups.push({
      agentTitle: task.agentTitle,
      id: `${task.agentTitle}-${task.id}`,
      tasks: [task],
    });
    return groups;
  }, []);
}

function WorkflowTaskItem({
  artifact,
  completed,
  isCurrent,
  isStopped,
  onArtifactClick,
  selectedArtifactId,
  showArtifact,
  task,
  thinkingCount,
  locale,
  copy,
}) {
  const taskName = getTaskName(task, locale);
  const stopped = isStopped && isCurrent && !completed;
  const taskLabel = completed
    ? getTaskCompletedText(task, copy.status.done, locale)
    : stopped
      ? formatTaskState(taskName, copy.status.stopped, locale)
      : getTaskRunningText(task, locale);

  return (
    <div className="flex items-start gap-3">
      <TaskStatusIcon label={taskLabel} status={completed ? 'done' : stopped ? 'cancelled' : 'running'} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-[20px] text-[#303133]">
          {taskLabel}
        </div>
        <div className="mt-3 space-y-4">
          {task.thinking.slice(0, thinkingCount).map((paragraph, index) => (
            <ThinkingBlock key={`${task.id}-thinking-${index}`}>{paragraph}</ThinkingBlock>
          ))}
          {showArtifact && artifact ? (
            <ArtifactCard
              artifact={artifact}
              onClick={() => onArtifactClick(artifact.id)}
              selected={selectedArtifactId === artifact.id}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkflowAgentGroup({
  completedTaskIds,
  copy,
  currentTask,
  demoData,
  group,
  isStopped,
  locale,
  onArtifactClick,
  selectedArtifactId,
  visibleArtifactIds,
  visibleThinkingCounts,
}) {
  const agentDisplay = getAgentDisplay(group.agentTitle, locale);

  return (
    <section className="flex gap-4">
      <AgentAvatar agentTitle={group.agentTitle} />
      <div className="min-w-0 flex-1 pb-8">
        <div className="text-[15px] font-semibold leading-[24px] text-[#303133]">{agentDisplay.name}</div>
        <div className="mt-3 space-y-7">
          {group.tasks.map((workflowTask) => {
            const artifact = workflowTask.artifactId ? demoData.artifacts[workflowTask.artifactId] : null;
            const completed = completedTaskIds.includes(workflowTask.id);
            const isCurrent = workflowTask.id === currentTask?.id && !completed;

            return (
              <WorkflowTaskItem
                key={workflowTask.id}
                artifact={artifact}
                completed={completed}
                copy={copy}
                isCurrent={isCurrent}
                isStopped={isStopped}
                locale={locale}
                onArtifactClick={onArtifactClick}
                selectedArtifactId={selectedArtifactId}
                showArtifact={Boolean(workflowTask.artifactId && visibleArtifactIds.includes(workflowTask.artifactId))}
                task={workflowTask}
                thinkingCount={visibleThinkingCounts[workflowTask.id] ?? 0}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EmptyPreview({ locale }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <div>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] text-[#365EFF]">
          <FileText className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold leading-[28px] text-[#303133]">
          {locale === 'en-US' ? 'Select an Output' : '选择左侧产物查看预览'}
        </h2>
        <p className="mt-2 text-[14px] leading-[22px] text-[#909399]">
          {locale === 'en-US'
            ? 'Generated outputs will not open automatically. Select a card to preview.'
            : '产物生成后不会自动切换，需要手动点击左侧卡片查看。'}
        </p>
      </div>
    </div>
  );
}

function ReportSectionTitle({ children }) {
  return (
    <h3 className="border-l-4 border-[#0EA5E9] pl-3 text-[20px] font-bold leading-[30px] text-[#1F2A44]">
      {children}
    </h3>
  );
}

function ReportTable({ columns, rows }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[6px] border border-[#D8DEE9] text-[13px] leading-[21px]">
      <div className="grid bg-[#F7F9FC] font-semibold text-[#4B5563]" style={{ gridTemplateColumns: columns.template }}>
        {columns.items.map((column) => (
          <div key={column} className="border-r border-[#D8DEE9] px-3 py-2.5 last:border-r-0">
            {column}
          </div>
        ))}
      </div>
      {rows.map((row, index) => (
        <div
          key={`${row.join('-')}-${index}`}
          className="grid border-t border-[#D8DEE9] text-[#303133]"
          style={{ gridTemplateColumns: columns.template }}
        >
          {row.map((cell, cellIndex) => (
            <div key={`${cellIndex}-${cell}`} className="min-w-0 border-r border-[#D8DEE9] px-3 py-2.5 last:border-r-0">
              {typeof cell === 'string' && cell.startsWith('http') ? (
                <a className="break-all text-[#365EFF] hover:underline" href={cell} rel="noreferrer" target="_blank">
                  {cell}
                </a>
              ) : (
                <span className="break-words">{cell || '-'}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ProjectReportPreview({ artifact }) {
  const report = artifact.report;

  return (
    <div className="h-full overflow-y-auto px-7 py-6">
      <div className="rounded-[6px] bg-[#1F456E] px-4 py-3 text-[14px] font-semibold text-white">
        Project analysis report generated from brand profile, official site signals, selected knowledge, and task inputs.
      </div>
      <section className="mt-8">
        <ReportSectionTitle>基础信息</ReportSectionTitle>
        <ReportTable
          columns={{ items: ['字段', '内容', '用途/约束'], template: '160px minmax(0,1fr) minmax(0,1.4fr)' }}
          rows={report.basicInfo.map((item) => [item.label, item.value, item.note])}
        />
      </section>
      <section className="mt-8">
        <ReportSectionTitle>项目摘要</ReportSectionTitle>
        <div className="mt-5 space-y-5">
          {report.summarySections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">{section.title}</h4>
              <p className="mt-2 text-[15px] leading-[28px] text-[#303133]">{section.content}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <ReportSectionTitle>公司资质与优势</ReportSectionTitle>
        <div className="mt-5 space-y-7">
          <div>
            <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">公司资质</h4>
            <ReportTable
              columns={{ items: ['资质/认证', '证明材料', '来源', '可用于哪些内容'], template: '150px 1fr 1fr 1fr' }}
              rows={report.qualificationRows.map((item) => [item.name, item.proof, item.source, item.usage])}
            />
          </div>
          <div>
            <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">服务能力</h4>
            <ReportTable
              columns={{ items: ['能力类型', '能力说明', '来源', '可用于哪些内容'], template: '130px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)' }}
              rows={report.serviceCapabilityRows.map((item) => [item.type, item.description, item.source, item.usage])}
            />
          </div>
          <div>
            <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">服务案例</h4>
            <ReportTable
              columns={{ items: ['案例名称与服务客户', '案例内容', '来源', '可用于哪些内容'], template: '170px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)' }}
              rows={report.caseRows.map((item) => [item.name, item.description, item.source, item.usage])}
            />
          </div>
          <div>
            <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">核心优势</h4>
            <ReportTable
              columns={{ items: ['优势类型', '优势说明', '来源', '可用于哪些内容'], template: '130px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)' }}
              rows={report.strengthRows.map((item) => [item.type, item.description, item.source, item.usage])}
            />
          </div>
        </div>
      </section>
      <section className="mt-8">
        <ReportSectionTitle>产品与服务范围</ReportSectionTitle>
        <div className="mt-5 space-y-7">
          {report.productCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-[16px] font-bold leading-[24px] text-[#303133]">{category.name}</h4>
              <ReportTable
                columns={{ items: ['产品/服务名称', '产品/服务说明', '产品链接', '可用于哪些内容'], template: '170px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)' }}
                rows={category.items.map((item) => [item.name, item.description, item.link, item.usage])}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8 rounded-[8px] border border-[#FDECC8] bg-[#FFFBEB] px-4 py-3">
        <h3 className="text-[15px] font-bold leading-[24px] text-[#9A5B00]">写作约束</h3>
        <ul className="mt-2 space-y-2 text-[14px] leading-[22px] text-[#7C4A03]">
          {report.guardrails.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-1 h-4 w-4 flex-none" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReferenceCard({ expanded, reference, onToggle }) {
  return (
    <article className="rounded-[8px] border border-[#DCDFE6] bg-white">
      <button type="button" className="flex w-full items-start gap-3 p-4 text-left" onClick={onToggle}>
        <span className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-[#10B981] text-[#10B981]">
          <Check className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <a
            className="block truncate text-[13px] leading-[20px] text-[#606266] hover:text-[#365EFF]"
            href={reference.url}
            rel="noreferrer"
            target="_blank"
            onClick={(event) => event.stopPropagation()}
          >
            {reference.url}
          </a>
          <span className="mt-1 block text-[15px] font-semibold leading-[22px] text-[#365EFF]">
            {reference.title}
          </span>
        </span>
        <span className="flex items-center text-[#909399]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-[#EBEEF5] px-8 pb-5 pt-4">
          <p className="text-[14px] leading-[24px] text-[#606266]">{reference.summary}</p>
          <div className="mt-4 space-y-4">
            {reference.outline.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-[14px] font-semibold leading-[22px] text-[#303133]">
                  <span className="rounded-[4px] border border-[#A7C0FF] px-1.5 py-0.5 text-[12px] font-semibold text-[#365EFF]">
                    {section.level}
                  </span>
                  {section.title}
                </div>
                <ul className="mt-2 ml-9 list-disc space-y-1 text-[13px] leading-[21px] text-[#606266]">
                  {section.children.map((child) => (
                    <li key={child}>{child}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-[12px] font-medium text-[#606266]">
              {reference.articleType}
            </span>
            <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[12px] font-medium text-[#008A54]">
              相关度 {reference.relevance}
            </span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ReferencesPreview({ artifact }) {
  const firstReferenceId = artifact.references[0]?.id ?? '';
  const [expandedReferenceId, setExpandedReferenceId] = useState(firstReferenceId);

  useEffect(() => {
    setExpandedReferenceId(firstReferenceId);
  }, [firstReferenceId]);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-5 text-[13px] leading-[20px] text-[#909399]">
        参考文章只读展示，默认展开第一篇。点击链接会在新窗口打开原页面。
      </div>
      <div className="space-y-4">
        {artifact.references.map((reference) => (
          <ReferenceCard
            key={reference.id}
            expanded={expandedReferenceId === reference.id}
            reference={reference}
            onToggle={() =>
              setExpandedReferenceId((current) => (current === reference.id ? '' : reference.id))
            }
          />
        ))}
      </div>
    </div>
  );
}

function StrategyInlineText({ children }) {
  const tokens = String(children ?? '').split(/(\*\*.*?\*\*|<br\s*\/?\s*>|https?:\/\/[^\s）)\]}]+)/gi);

  return tokens.map((token, index) => {
    if (!token) return null;
    if (/^<br\s*\/?\s*>$/i.test(token)) return <br key={`break-${index}`} />;
    if (/^\*\*.*\*\*$/.test(token)) {
      return <strong key={`strong-${index}`} className="font-semibold text-[#303133]">{token.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//i.test(token)) {
      return <a key={`link-${index}`} className="break-all font-medium text-[#365EFF] hover:underline" href={token} target="_blank" rel="noreferrer">{token}</a>;
    }
    return token;
  });
}

function splitStrategyTableRow(line) {
  const content = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];
    if (character === '\\' && nextCharacter === '|') {
      cell += '|';
      index += 1;
      continue;
    }
    if (character === '|') {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += character;
  }

  cells.push(cell.trim());
  return cells;
}

function StrategyTable({ header, rows }) {
  const compact = header.length === 2;

  return (
    <div className="my-3 overflow-x-auto rounded-[6px] border border-[#DCDFE6]">
      <table className="w-full border-collapse text-left text-[13px] leading-[20px]" style={{ minWidth: compact ? 520 : 860 }}>
        <thead className="bg-[#F5F7FA] text-[#303133]">
          <tr>
            {header.map((cell, index) => (
              <th key={`${cell}-${index}`} className={`border-b border-[#DCDFE6] px-3 py-2 font-semibold ${compact && index === 0 ? 'w-[132px]' : ''}`}>
                <StrategyInlineText>{cell}</StrategyInlineText>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="align-top even:bg-[#FAFBFC]">
              {header.map((_, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className={`border-b border-[#EBEEF5] px-3 py-2.5 last:border-b-0 ${cellIndex === 0 ? 'font-medium text-[#303133]' : 'text-[#606266]'}`}>
                  <StrategyInlineText>{row[cellIndex] ?? '-'}</StrategyInlineText>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StrategyHighlight({ lines }) {
  return (
    <aside className="my-4 rounded-[6px] border border-[#F3D19E] border-l-4 border-l-[#E6A23C] bg-[#FDF6EC] px-4 py-3 text-[#7A4E00]">
      <div className="space-y-2.5">
        {lines.map((line, index) => {
          const bullet = line.match(/^-\s+(.*)$/);
          if (!bullet) {
            return <p key={`${line}-${index}`} className="font-semibold"><StrategyInlineText>{line}</StrategyInlineText></p>;
          }
          return (
            <div key={`${line}-${index}`} className="flex items-start gap-2">
              <span className="mt-[10px] h-1.5 w-1.5 flex-none rounded-full bg-[#E6A23C]" />
              <p className="min-w-0 flex-1"><StrategyInlineText>{bullet[1]}</StrategyInlineText></p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function StrategyRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const key = `${index}-${line}`;
    const displayLine = line.replace(/（参考质量评估模型 P0）/g, '');

    if (line.trim().startsWith('>')) {
      const highlightLines = [];
      let cursor = index;
      while (cursor < lines.length && lines[cursor].trim().startsWith('>')) {
        highlightLines.push(lines[cursor].trim().replace(/^>\s?/, ''));
        cursor += 1;
      }
      elements.push(<StrategyHighlight key={`highlight-${index}`} lines={highlightLines} />);
      index = cursor - 1;
      continue;
    }

    if (line.trim().startsWith('|') && lines[index + 1]?.trim().startsWith('|')) {
      const delimiterCells = splitStrategyTableRow(lines[index + 1]);
      const isTable = delimiterCells.length > 0 && delimiterCells.every((cell) => /^:?-{3,}:?$/.test(cell));
      if (isTable) {
        const header = splitStrategyTableRow(line);
        const rows = [];
        let cursor = index + 2;
        while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
          rows.push(splitStrategyTableRow(lines[cursor]));
          cursor += 1;
        }
        elements.push(<StrategyTable key={`table-${index}`} header={header} rows={rows} />);
        index = cursor - 1;
        continue;
      }
    }

    if (!line.trim()) {
      elements.push(<div key={key} className="h-1" />);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h2 key={key} className="text-[22px] font-bold leading-[34px] text-[#1F2A44]"><StrategyInlineText>{displayLine.replace(/^#\s+/, '')}</StrategyInlineText></h2>);
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(<h3 key={key} className="mt-6 border-l-4 border-[#365EFF] pl-3 text-[18px] font-bold leading-[28px] text-[#1F2A44]"><StrategyInlineText>{displayLine.replace(/^##\s+/, '')}</StrategyInlineText></h3>);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={key} className="mt-4 text-[16px] font-semibold leading-[24px] text-[#303133]"><StrategyInlineText>{displayLine.replace(/^###\s+/, '')}</StrategyInlineText></h4>);
      continue;
    }

    const bulletMatch = displayLine.match(/^(\s*)-\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key} className={`flex items-start gap-2 ${bulletMatch[1].length ? 'ml-5' : ''}`}>
          <span className="mt-[11px] h-1.5 w-1.5 flex-none rounded-full bg-[#7B8BAA]" />
          <p className="min-w-0 flex-1"><StrategyInlineText>{bulletMatch[2]}</StrategyInlineText></p>
        </div>,
      );
      continue;
    }

    elements.push(<p key={key}><StrategyInlineText>{displayLine}</StrategyInlineText></p>);
  }

  return <div className="space-y-3 text-[15px] leading-[28px] text-[#303133]">{elements}</div>;
}

function StrategyPreview({
  content,
  copy,
  draft,
  editing,
  locale,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[64px] flex-none items-center justify-between border-b border-[#EBEEF5] px-6">
        <h2 className="text-[16px] font-bold leading-[24px] text-[#303133]">
          {locale === 'en-US' ? 'Plan' : '文章策划方案'}
        </h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#C8D2FF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
              onClick={onCancel}
            >
              {copy.actions.cancel}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0]"
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
              {locale === 'en-US' ? 'Save' : '保存'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0]"
            onClick={onEdit}
          >
            <Edit3 className="h-4 w-4" />
            {locale === 'en-US' ? 'Edit' : '编辑'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div className="mb-3 flex h-9 flex-none items-center gap-2 rounded-[6px] border border-[#EBEEF5] bg-[#F7F8FB] px-3 text-[13px] text-[#606266]">
            <span className="font-semibold text-[#303133]">Heading 1</span>
            <span className="h-4 w-px bg-[#DCDFE6]" />
            <span className="font-bold">B</span>
            <span className="italic">I</span>
            <span className="text-[#365EFF]">左对齐</span>
          </div>
          <textarea
            className="min-h-0 flex-1 resize-none rounded-[8px] border border-[#DCDFE6] bg-white p-4 text-[15px] leading-[26px] text-[#303133] outline-none transition placeholder:text-[#A8ABB2] focus:border-[#365EFF] focus:ring-2 focus:ring-[#365EFF]/10"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          <StrategyRenderer content={content} />
        </div>
      )}
    </div>
  );
}

function PreviewPanel({
  artifact,
  copy,
  isEditingStrategy,
  locale,
  onCancelStrategy,
  onDraftChange,
  onEditStrategy,
  onSaveStrategy,
  strategyContent,
  strategyDraft,
}) {
  if (!artifact) {
    return <EmptyPreview copy={copy} locale={locale} />;
  }

  if (artifact.type === 'project-report') {
    return <ProjectReportPreview artifact={artifact} />;
  }

  if (artifact.type === 'references') {
    return <ReferencesPreview artifact={artifact} />;
  }

  return (
    <StrategyPreview
      content={strategyContent}
      copy={copy}
      draft={strategyDraft}
      editing={isEditingStrategy}
      locale={locale}
      onCancel={onCancelStrategy}
      onDraftChange={onDraftChange}
      onEdit={onEditStrategy}
      onSave={onSaveStrategy}
    />
  );
}

function UnsavedDialog({ copy, onClose, onDiscard }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div className="w-[420px] max-w-full rounded-[12px] border border-[#EBEEF5] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold leading-[28px] text-[#303133]">{copy.dialog.unsavedTitle}</h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#606266] hover:bg-[#F5F7FA]"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-5 text-[14px] leading-[22px] text-[#606266]">{copy.dialog.unsavedBody}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#C8D2FF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF]"
            onClick={onClose}
          >
            {copy.dialog.keepEditing}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] bg-[#365EFF] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2547D0]"
            onClick={onDiscard}
          >
            {copy.dialog.discard}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogArticleAiPlanningPage({
  article,
  isHistoricalView = false,
  locale,
  onClose,
  onGenerateOutline,
  onRestartStage,
  onStageChange,
  onTaskUpdated,
  project,
  t,
  task,
}) {
  // 策划页用播放状态控制左侧任务流，并把策划产物保存回当前任务。
  const copy = t.blogArticle.aiCreation;
  const demoData = useMemo(() => createPlanningDemoData(task, project), [project, task]);
  const workflow = demoData.workflow;
  const initialPlaybackState = useMemo(() => getInitialPlaybackState(workflow, task), [workflow, task]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialPlaybackState.currentTaskIndex);
  const [visibleThinkingCounts, setVisibleThinkingCounts] = useState(initialPlaybackState.visibleThinkingCounts);
  const [visibleArtifactIds, setVisibleArtifactIds] = useState(initialPlaybackState.visibleArtifactIds);
  const [completedTaskIds, setCompletedTaskIds] = useState(initialPlaybackState.completedTaskIds);
  const [isComplete, setIsComplete] = useState(initialPlaybackState.isComplete);
  const [isStopped, setIsStopped] = useState(task?.stage === 'planning-stopped' || Boolean(task?.planning?.isStopped));
  const [selectedArtifactId, setSelectedArtifactId] = useState(initialPlaybackState.selectedArtifactId);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const toast = useToast({ scope: `blog-ai-planning-${task.id}` });
  const [strategyContent, setStrategyContent] = useState(demoData.artifacts.strategy.content);
  const [strategyDraft, setStrategyDraft] = useState(demoData.artifacts.strategy.content);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const workflowRef = useRef(null);

  const visibleTaskList = workflow.slice(0, Math.min(currentTaskIndex + 1, workflow.length));
  const visibleTaskGroups = useMemo(() => groupWorkflowTasks(visibleTaskList), [visibleTaskList]);
  const selectedArtifact = selectedArtifactId ? demoData.artifacts[selectedArtifactId] : null;
  const strategyDirty = isEditingStrategy && strategyDraft !== strategyContent;
  const currentTask = workflow[currentTaskIndex];
  const stoppedToastId = `blog-ai-planning-stopped-${task.id}`;
  const isPlanningStopped = isStopped && task?.stage === 'planning-stopped';

  useEffect(() => {
    // 用户没有手动离开底部时，任务流自动跟随最新步骤。
    const container = workflowRef.current;
    if (!container || !autoScrollEnabled) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [autoScrollEnabled, completedTaskIds, currentTaskIndex, visibleArtifactIds, visibleThinkingCounts]);

  useEffect(() => {
    if (!isPlanningStopped) return;

    toast.show({
      actions: [{ label: copy.actions.regenerate, closeOnClick: false, onClick: handleRegenerate }],
      duration: 0,
      id: stoppedToastId,
      message: locale === 'en-US' ? 'Task stopped. Go back to edit or' : '任务已中止，可返回上一步修改或',
      showClose: false,
      type: 'warning',
    });
  }, [isPlanningStopped, locale, stoppedToastId, task.id]);

  function handleWorkflowScroll() {
    // 距离底部较远说明用户正在查看历史步骤，暂停自动滚动。
    const container = workflowRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceToBottom < 48);
  }

  function executePendingAction(action) {
    // 待执行动作统一从这里分发，便于未保存确认后继续原动作。
    if (!action) return;

    if (action.type === 'select-artifact') {
      setSelectedArtifactId(action.artifactId);
      return;
    }

    if (action.type === 'close') {
      onClose();
      return;
    }

    if (action.type === 'view-stage') {
      onStageChange?.(action.stage);
      return;
    }

    if (action.type === 'generate-outline') {
      goToOutline();
    }
  }

  function requestAction(action) {
    // 正在编辑策划方案时，所有离开或切换动作先进入确认流程。
    if (strategyDirty) {
      setPendingAction(action);
      return;
    }

    executePendingAction(action);
  }

  function handleArtifactClick(artifactId) {
    requestAction({ type: 'select-artifact', artifactId });
  }

  function handleStopTask() {
    // 停止任务会保留已完成步骤和当前策划内容。
    if (isStopped || isComplete) return;

    setIsStopped(true);
    const nextTask = updateAiCreationTask(project.id, task.id, {
      stage: 'planning-stopped',
      planning: {
        completedTaskIds,
        currentArtifactId: selectedArtifactId,
        isStopped: true,
        playback: {
          ...(task?.planning?.playback ?? {}),
          completedTaskIds,
          currentTaskIndex,
          isComplete: false,
          selectedArtifactId,
          visibleArtifactIds,
          visibleThinkingCounts,
        },
        strategyContent,
        updatedAt: getTodayString(),
      },
    });
    onTaskUpdated?.(nextTask ?? task);
  }

  function handleRegenerate() {
    // 从当前任务输入重启策划，同时清空大纲、正文和中止提示。
    const nextTask = restartCollaborativePlanningTask(project.id, task.id);
    toast.dismiss(stoppedToastId);
    onRestartStage?.({ article, stage: 'planning', task: nextTask ?? task });
  }

  function handleSaveStrategy() {
    // 策划方案保存后同步任务 planning payload，供大纲阶段读取。
    const nextContent = strategyDraft.trim();
    if (!nextContent) {
      toast.error(locale === 'en-US' ? 'Plan cannot be empty.' : '文章策划方案不能为空，无法保存');
      return;
    }

    setStrategyContent(nextContent);
    setStrategyDraft(nextContent);
    setIsEditingStrategy(false);
    updateAiCreationTask(project.id, task.id, {
      planning: {
        currentArtifactId: selectedArtifactId,
        strategyContent: nextContent,
        updatedAt: getTodayString(),
      },
    });
    toast.success(locale === 'en-US' ? 'Saved' : '保存成功');
  }

  function handleCancelStrategy() {
    if (strategyDirty) {
      setPendingAction({ type: 'cancel-edit' });
      return;
    }

    setIsEditingStrategy(false);
    setStrategyDraft(strategyContent);
  }

  function handleDiscardUnsaved() {
    const action = pendingAction;
    setPendingAction(null);
    setStrategyDraft(strategyContent);
    setIsEditingStrategy(false);

    if (action?.type !== 'cancel-edit') {
      executePendingAction(action);
    }
  }

  function goToOutline() {
    // 进入大纲前最后一次持久化策划阶段结果。
    if (isPlanningStopped) {
      handleRegenerate();
      return;
    }

    if (!isComplete || isStopped) return;

    const nextTask = startCollaborativeOutlineTask(project.id, task.id, {
      completedTaskIds,
      currentArtifactId: selectedArtifactId,
      isStopped: false,
      playback: {
        completedTaskIds,
        currentTaskIndex,
        isComplete: true,
        selectedArtifactId,
        visibleArtifactIds,
        visibleThinkingCounts,
      },
      strategyContent,
      updatedAt: getTodayString(),
    });

    onGenerateOutline?.({ article, task: nextTask ?? task });
  }

  function handleGenerateOutline() {
    requestAction({ type: 'generate-outline' });
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#303133]">
      <style>
        {`
          @keyframes aiPlanningFadeInUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <CollaborativeCreationHeader
        copy={copy}
        onBack={() => requestAction({ type: 'close' })}
        onStageChange={(stage) => requestAction({ stage, type: 'view-stage' })}
        stageStatuses={getCollaborativeStageStatuses(task)}
        title={copy.titles.planning}
        viewStage="planning"
      />

      <main className="mx-auto grid max-w-[1600px] grid-cols-2 gap-4 px-6 pb-[84px] pt-[68px]">
        <section
          ref={workflowRef}
          className="h-[calc(100vh-152px)] overflow-y-auto rounded-[8px] bg-white px-8 py-7 shadow-[0_2px_10px_rgba(31,45,61,0.04)]"
          onScroll={handleWorkflowScroll}
        >
          <div className="space-y-1">
            {visibleTaskGroups.map((group) => (
              <WorkflowAgentGroup
                key={group.id}
                completedTaskIds={completedTaskIds}
                copy={copy}
                currentTask={currentTask}
                demoData={demoData}
                group={group}
                isStopped={isStopped}
                locale={locale}
                onArtifactClick={handleArtifactClick}
                selectedArtifactId={selectedArtifactId}
                visibleArtifactIds={visibleArtifactIds}
                visibleThinkingCounts={visibleThinkingCounts}
              />
            ))}
          </div>
        </section>

        <section className="h-[calc(100vh-152px)] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_10px_rgba(31,45,61,0.04)]">
          <PreviewPanel
            artifact={selectedArtifact}
            copy={copy}
            isEditingStrategy={isEditingStrategy}
            locale={locale}
            onCancelStrategy={handleCancelStrategy}
            onDraftChange={setStrategyDraft}
            onEditStrategy={() => {
              setStrategyDraft(strategyContent);
              setIsEditingStrategy(true);
            }}
            onSaveStrategy={handleSaveStrategy}
            strategyContent={strategyContent}
            strategyDraft={strategyDraft}
          />
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[#EBEEF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-end px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] border border-[#365EFF] px-4 text-[14px] font-semibold text-[#365EFF] transition hover:bg-[#EEF3FF] disabled:cursor-not-allowed disabled:border-[#DCDFE6] disabled:text-[#A8ABB2] disabled:hover:bg-white"
              disabled={isHistoricalView || isComplete || isStopped}
              onClick={handleStopTask}
            >
              {copy.actions.stop}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[6px] bg-[#365EFF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2547D0] disabled:cursor-not-allowed disabled:bg-[#A8B9FF]"
              disabled={isHistoricalView || (isPlanningStopped ? false : !isComplete || isStopped)}
              onClick={handleGenerateOutline}
            >
              {isPlanningStopped ? copy.actions.regeneratePlanning : copy.actions.generateOutline}
            </button>
          </div>
        </div>
      </footer>

      {pendingAction ? (
        <UnsavedDialog copy={copy} onClose={() => setPendingAction(null)} onDiscard={handleDiscardUnsaved} />
      ) : null}
    </div>
  );
}
