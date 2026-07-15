import { Bot, CircleAlert, CircleCheck, Clock3 } from 'lucide-react';
import { formatTaskStatus, getTaskDefinition } from './taskCatalog.js';

const agentConfig = {
  researcher: {
    initial: 'R',
    name: '项目研究专家',
    nameEn: 'Researcher',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  seo_strategist: {
    initial: 'S',
    name: 'SEO策略专家',
    nameEn: 'SEO Strategist',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  content_operator: {
    initial: 'W',
    name: '内容运营专员',
    nameEn: 'Content Operator',
    className: 'border-blue-200 bg-blue-50 text-blue-600',
  },
  content_evaluator: {
    initial: 'O',
    name: '内容评估专家',
    nameEn: 'Content Evaluator',
    className: 'border-red-200 bg-red-50 text-red-600',
  },
  copilot: {
    icon: Bot,
    name: 'Copilot',
    nameEn: 'Copilot',
    className: 'border-blue-200 bg-blue-50 text-blue-600',
  },
};

function normalizeAgentId(agentId = '') {
  if (agentConfig[agentId]) return agentId;
  if (/research/i.test(agentId)) return 'researcher';
  if (/strateg/i.test(agentId)) return 'seo_strategist';
  if (/evaluat|optimiz/i.test(agentId)) return 'content_evaluator';
  if (/content|writer/i.test(agentId)) return 'content_operator';
  return 'copilot';
}

export function getAgentPresentation(agentId, locale = 'zh-CN') {
  const normalizedId = normalizeAgentId(agentId);
  const config = agentConfig[normalizedId];
  return {
    ...config,
    id: normalizedId,
    name: locale === 'en-US' ? config.nameEn : config.name,
  };
}

export function AgentAvatar({ agentId, className = '', locale = 'zh-CN' }) {
  const agent = getAgentPresentation(agentId, locale);
  const Icon = agent.icon;

  return (
    <span
      className={`inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border text-[15px] font-bold ${agent.className} ${className}`}
      aria-label={agent.name}
    >
      {Icon ? <Icon className="h-[18px] w-[18px]" /> : agent.initial}
    </span>
  );
}

export function TaskStatusIcon({ label = '', status = 'done' }) {
  const commonProps = { 'aria-label': label, title: label };

  if (status === 'running') {
    return <span {...commonProps} className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />;
  }
  if (status === 'waiting_input') {
    return <Clock3 {...commonProps} className="h-4 w-4 text-amber-500" strokeWidth={2.3} />;
  }
  if (status === 'done') {
    return <CircleCheck {...commonProps} className="h-4 w-4 text-emerald-500" strokeWidth={2.3} />;
  }
  if (status === 'error' || status === 'interrupted') {
    return <CircleAlert {...commonProps} className="h-4 w-4 text-red-500" strokeWidth={2.3} />;
  }
  if (status === 'cancelled') {
    return <span {...commonProps} className="h-4 w-4 rounded-full border-2 border-slate-900 border-t-transparent" />;
  }
  return <span className="h-4 w-4" aria-hidden="true" />;
}

export function TaskProcessBlock({ emphasis = false, text }) {
  return (
    <div className={`border-l-2 pl-5 text-[14px] leading-[22px] ${emphasis ? 'border-blue-500 font-semibold text-slate-900' : 'border-slate-200 text-slate-500'}`}>
      {text}
    </div>
  );
}

export function AgentTaskGroup({ block, locale, renderArtifact, sources = [] }) {
  const firstTask = block.tasks?.[0];
  const inferredAgent = getTaskDefinition(firstTask, locale).agentId;
  const agent = getAgentPresentation(block.agentId || inferredAgent, locale);

  return (
    <section className="flex gap-4">
      <AgentAvatar agentId={agent.id} locale={locale} />
      <div className="min-w-0 flex-1 pb-4">
        <div className="text-[15px] font-semibold leading-6 text-slate-900">{agent.name}</div>
        <div className="mt-3 space-y-6">
          {(block.tasks ?? []).map((task) => {
            const label = formatTaskStatus(task, locale);
            const taskSources = sources.filter((source) => task.sourceIds?.includes(source.id));
            return (
              <div key={task.id} className="flex items-start gap-3">
                <span className="flex h-5 w-4 flex-none items-center justify-center">
                  <TaskStatusIcon label={label} status={task.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-5 text-slate-900">{label}</div>
                  {task.processItems?.length || taskSources.length || task.artifactIds?.length ? (
                    <div className="mt-3 space-y-4">
                      {(task.processItems ?? []).map((item) => (
                        <TaskProcessBlock key={item.id} emphasis={item.emphasis} text={item.text} />
                      ))}
                      {taskSources.length ? (
                        <div className="border-l-2 border-slate-200 pl-5">
                          <div className="flex flex-wrap gap-2">
                            {taskSources.map((source) => (
                              <span key={source.id} className="inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                <span className="truncate">{source.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {(task.artifactIds ?? []).map((artifactId) => renderArtifact?.(artifactId))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
