import { BookOpen, ChevronRight, ClipboardList, FileText, ListTree, Plus, Search, Sparkles } from 'lucide-react';

function getArtifactVisual(type = '') {
  if (type === 'references') return { icon: BookOpen, label: '引用来源' };
  if (type === 'search_results') return { icon: Search, label: '搜索结果' };
  if (type === 'strategy' || type === 'keyword_strategy') return { icon: ClipboardList, label: '内容策略' };
  if (type === 'title_options') return { icon: Sparkles, label: '标题候选' };
  if (type === 'outline') return { icon: ListTree, label: '文章大纲' };
  if (type === 'evaluation') return { icon: ClipboardList, label: '内容评估' };
  if (type === 'enrichment') return { icon: BookOpen, label: '内容增强' };
  if (type === 'tdk') return { icon: Sparkles, label: '文章元信息' };
  return { icon: FileText, label: '文章产物' };
}

export function ArtifactCard({ artifact, onClick, panel = false, selected = false }) {
  const { icon: Icon } = getArtifactVisual(artifact.type);
  const compact = artifact.metadata?.displayMode === 'compact';
  return (
    <button
      type="button"
      className={`flex w-full min-w-0 items-center gap-3 rounded-[8px] border text-left transition ${compact ? 'min-h-[44px] px-3 py-2' : 'min-h-[78px] p-4'} ${panel ? 'max-w-none' : 'max-w-[520px]'} ${selected ? 'border-[#365EFF] bg-[#EEF3FF]' : 'border-[#DCDFE6] bg-white hover:border-[#365EFF] hover:bg-[#F5F7FF]'}`}
      onClick={onClick}
    >
      <span className={`inline-flex flex-none items-center justify-center rounded-[8px] bg-[#5B7CFF] text-white ${compact ? 'h-7 w-7' : 'h-11 w-11'}`}>
        <Icon className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-[22px] text-[#303133]">{artifact.title}</span>
        {!compact ? <span className="mt-0.5 line-clamp-2 text-[13px] leading-[20px] text-[#606266]">{artifact.summary}</span> : null}
      </span>
      <ChevronRight className="h-5 w-5 flex-none text-[#A8ABB2]" />
    </button>
  );
}

function parseOutlineContent(content) {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function MarkdownContent({ content = '' }) {
  return (
    <div className="text-[14px] leading-6 text-[#606266]">
      {String(content).split('\n').map((line, index) => {
        const key = `${index}-${line.slice(0, 12)}`;
        if (!line.trim()) return <div key={key} className="h-3" />;
        if (line.startsWith('# ')) return <h1 key={key} className="mt-2 text-[22px] font-bold leading-8 text-[#303133]">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={key} className="mt-6 text-[17px] font-bold leading-7 text-[#303133]">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={key} className="mt-4 text-[15px] font-bold leading-6 text-[#303133]">{line.slice(4)}</h3>;
        if (/^[-*] /.test(line)) return <div key={key} className="ml-5 flex gap-2"><span>•</span><span>{line.slice(2)}</span></div>;
        if (/^\d+\. /.test(line)) return <div key={key} className="ml-5">{line}</div>;
        return <p key={key}>{line}</p>;
      })}
    </div>
  );
}

function OutlinePreview({ artifact }) {
  const outline = parseOutlineContent(artifact.content);
  if (!outline?.sections?.length) return <MarkdownContent content={artifact.content} />;

  return (
    <div>
      {outline.summary ? <p className="rounded-[8px] bg-[#F7F8FB] p-4 text-[14px] leading-6 text-[#606266]">{outline.summary}</p> : null}
      <div className="mt-4 space-y-3">
        {outline.sections.map((section, index) => (
          <section key={`${section.heading}-${index}`} className="rounded-[8px] border border-[#EBEEF5] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-bold leading-6 text-[#303133]">{section.heading}</h3>
              {section.estimatedWords ? <span className="flex-none rounded-full bg-[#F5F7FA] px-2.5 py-1 text-[12px] font-semibold text-[#606266]">{section.estimatedWords} 词</span> : null}
            </div>
            {section.keyPoints?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-5 text-[#606266]">{section.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul> : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function SearchResultsPreview({ artifact, onInsertToComposer }) {
  const items = artifact.previewData?.items ?? [];
  return (
    <div className="w-full min-w-0 space-y-3">
      {items.map((item) => (
        <article key={item.id} className="w-full min-w-0 rounded-[8px] border border-[#E7EAF0] bg-white p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[220px] flex-1">
              <h3 className="break-words text-[14px] font-bold leading-[22px] text-[#1F55E5]">{item.title}</h3>
              <p className="mt-1 truncate text-[12px] text-[#909399]">{item.url}</p>
            </div>
            <button type="button" className="inline-flex h-8 flex-none items-center gap-1 rounded-[6px] bg-[#365EFF] px-3 text-[13px] font-semibold text-white hover:bg-[#2547D0]" onClick={() => onInsertToComposer?.(`${item.title}\n${item.url}`)}>
              <Plus className="h-3.5 w-3.5" />添加到输入框
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[#606266]">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags?.map((tag) => <span key={tag} className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-[12px] text-[#606266]">{tag}</span>)}
          </div>
        </article>
      ))}
    </div>
  );
}

function EvaluationPreview({ artifact }) {
  const parsed = parseOutlineContent(artifact.content) ?? {};
  const groups = artifact.previewData?.groups ?? [];
  return (
    <div className="space-y-4">
      {artifact.summary ? <div className="rounded-[8px] bg-[#F7F8FB] p-4 text-[14px] leading-6 text-[#606266]">{artifact.summary}</div> : null}
      {Number.isFinite(parsed.score) ? <div className="text-[22px] font-bold text-[#303133]">{parsed.score} / 100</div> : null}
      {parsed.blockingIssues?.length || parsed.suggestions?.length ? <div className="space-y-3 rounded-[8px] border border-[#EBEEF5] p-4 text-[13px] leading-5 text-[#606266]">{parsed.blockingIssues?.map((item) => <p key={item} className="text-red-500">待修正：{item}</p>)}{parsed.suggestions?.map((item) => <p key={item}>建议：{item}</p>)}</div> : null}
      {groups.map((group) => (
        <section key={group.name} className="rounded-[8px] border border-[#EBEEF5] bg-white p-4">
          <h3 className="text-[15px] font-bold text-[#303133]">{group.name}</h3>
          <div className="mt-3 space-y-2">
            {group.items?.map((item) => (
              <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[6px] bg-[#F7F8FB] px-3 py-2 text-[13px]">
                <div><span className="font-semibold text-[#303133]">{item.name}</span><p className="mt-1 leading-5 text-[#606266]">{item.suggestion}</p></div>
                <span className={item.pass ? 'font-semibold text-emerald-600' : 'font-semibold text-red-500'}>{item.pass ? '通过' : '待优化'}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TdkPreview({ artifact }) {
  const tdk = artifact.previewData?.tdk ?? parseOutlineContent(artifact.content) ?? {};
  return (
    <div className="space-y-5">
      <label className="block"><span className="mb-2 block text-[14px] font-semibold text-[#303133]">标题</span><input readOnly className="h-10 w-full rounded-[6px] border border-[#DCDFE6] px-3 text-[14px]" value={tdk.title || ''} /></label>
      <div><span className="mb-2 block text-[14px] font-semibold text-[#303133]">关键词</span><div className="flex min-h-10 flex-wrap gap-2 rounded-[6px] border border-[#DCDFE6] px-3 py-2">{tdk.keywords?.map((keyword) => <span key={keyword} className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[13px] font-semibold text-[#365EFF]">{keyword}</span>)}</div></div>
      <label className="block"><span className="mb-2 block text-[14px] font-semibold text-[#303133]">描述</span><textarea readOnly className="h-[160px] w-full resize-none rounded-[6px] border border-[#DCDFE6] px-3 py-2 text-[14px] leading-6" value={tdk.description || ''} /></label>
    </div>
  );
}

function TitleOptionsPreview({ artifact, onInsertToComposer }) {
  const data = parseOutlineContent(artifact.content) ?? {};
  return <div className="space-y-3">{data.options?.map((option) => <button key={option.id || option.title} type="button" className="w-full rounded-[8px] border border-[#DCDFE6] bg-white p-4 text-left hover:border-[#365EFF] hover:bg-[#F5F7FF]" onClick={() => onInsertToComposer?.(option.title)}><span className="block text-[14px] font-bold text-[#303133]">{option.title}</span>{option.rationale ? <span className="mt-1 block text-[13px] leading-5 text-[#606266]">{option.rationale}</span> : null}</button>)}</div>;
}

function StructuredPreview({ artifact }) {
  const data = parseOutlineContent(artifact.content);
  if (!data) return <MarkdownContent content={artifact.content} />;
  return <pre className="whitespace-pre-wrap break-words rounded-[8px] bg-[#F7F8FB] p-4 text-[13px] leading-6 text-[#606266]">{JSON.stringify(data, null, 2)}</pre>;
}

const planningLabels = {
  additionalRequirements: '补充生成要求', analyzedReferences: '已分析参考文章', anchorText: '锚文本',
  answerDirection: '回答方向', articleLanguage: '文章语言', articleLength: '文章长度', articleTopic: '文章主题',
  articleType: '文章类型', audienceAnalysis: '目标受众分析', brandRequirements: '品牌要求',
  businessGoal: '业务目标', businessGoalAnalysis: '业务目标分析', businessGoalType: '业务目标类型',
  contentBoundaries: '内容边界', contentGaps: '内容空缺', conversionGoal: '转化目标',
  copyModelStrategy: '营销文案模型与写作思路', differentiationOpportunities: '差异化机会',
  evidenceGaps: '证据缺口', evidenceNeeded: '所需依据', faqItems: 'FAQ 建议', faqPlan: 'FAQ 建议',
  goal: '阶段目标', goalAnalysis: '文章目标分析', guidance: '布局建议', internalLinkPlan: '内链插入建议',
  keyword: '关键词', keywordItems: '关键词明细', keywordLayout: '关键词布局建议', keyContent: '核心内容',
  limitations: '当前限制', linkSuggestions: '内链建议', modelRationale: '模型选择理由', name: '阶段名称',
  origin: '来源', person: '人称', placement: '建议位置', primaryKeywords: '主要关键词', primaryModel: '主文案模型',
  question: '问题', rationale: '建议理由', referenceAnalysis: '参考文章分析', referenceArticles: '参考文章',
  relevance: '相关性', risks: '风险', role: '关键词角色', searchIntent: '搜索意图', secondaryKeywords: '次要关键词',
  secondaryModel: '辅助文案模型', skippedReferences: '跳过的参考文章', stage: '写作阶段', stageGuidance: '分阶段布局',
  strengths: '可借鉴点', summary: '摘要', synthesis: '综合结论', targetAudience: '目标受众',
  targetMarketAnalysis: '目标市场分析', targetRegion: '目标地区', targetTitle: '目标页面', targetUrl: '目标 URL',
  title: '标题', tone: '语气', trustBuildingMethods: '信任建立方式', usageGuidance: '使用说明', url: 'URL',
  writingPrinciples: '写作原则', writingStages: '分阶段写作思路',
};

const planningSectionTitles = {
  copyModelStrategy: '营销文案模型与写作思路', faqPlan: 'FAQ 建议', goalAnalysis: '文章目标分析',
  internalLinkPlan: '内链插入建议', keywordLayout: '关键词布局建议', referenceAnalysis: '参考文章分析',
};

function PlanningValue({ value }) {
  if (value === null || value === undefined || value === '') return <span className="text-[#A8ABB2]">未提供</span>;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value);
    return /^https?:\/\//i.test(text)
      ? <a className="break-all font-semibold text-[#365EFF] hover:underline" href={text} target="_blank" rel="noreferrer">{text}</a>
      : <span className="whitespace-pre-wrap break-words">{text}</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-[#A8ABB2]">暂无</span>;
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={`${index}-${typeof item === 'string' ? item.slice(0, 16) : 'item'}`} className={typeof item === 'object' ? 'rounded-[8px] border border-[#EBEEF5] bg-white p-3' : 'flex gap-2'}>
            {typeof item !== 'object' ? <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#365EFF]" /> : null}
            <div className="min-w-0 flex-1"><PlanningValue value={item} /></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <dl className="grid gap-3">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="grid gap-1.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
          <dt className="text-[12px] font-semibold text-[#909399]">{planningLabels[key] || key}</dt>
          <dd className="min-w-0 text-[13px] leading-6 text-[#606266]"><PlanningValue value={item} /></dd>
        </div>
      ))}
    </dl>
  );
}

function ArticlePlanningPreview({ artifact }) {
  const data = parseOutlineContent(artifact.content);
  if (!data) return <MarkdownContent content={artifact.content} />;
  const finalPlan = artifact.metadata?.kind === 'article_planning_plan';
  const sections = finalPlan ? data.sections ?? {} : { [artifact.metadata?.sectionKey || 'section']: data };

  return (
    <div className="w-full min-w-0 space-y-5">
      {finalPlan ? (
        <section className="rounded-[8px] bg-[#F7F8FB] p-4">
          <h3 className="text-[15px] font-bold text-[#303133]">已确认的文章基础信息</h3>
          <div className="mt-3"><PlanningValue value={data.confirmedInputs ?? {}} /></div>
        </section>
      ) : null}
      {Object.entries(sections).map(([sectionKey, section]) => (
        <section key={sectionKey} className="rounded-[8px] border border-[#EBEEF5] bg-white p-4">
          <h3 className="text-[15px] font-bold text-[#303133]">{planningSectionTitles[sectionKey] || planningLabels[sectionKey] || artifact.title}</h3>
          <div className="mt-3"><PlanningValue value={section} /></div>
        </section>
      ))}
      {finalPlan && (data.evidenceGaps?.length || data.limitations?.length) ? (
        <section className="rounded-[8px] border border-amber-100 bg-amber-50 p-4">
          <h3 className="text-[14px] font-bold text-amber-800">证据缺口与当前限制</h3>
          <div className="mt-3 text-amber-800"><PlanningValue value={[...(data.evidenceGaps ?? []), ...(data.limitations ?? [])]} /></div>
        </section>
      ) : null}
    </div>
  );
}

function RevisionPreview({ artifact }) {
  return (
    <div>
      {artifact.changeSummary ? <div className="rounded-[8px] border border-blue-100 bg-blue-50 p-4 text-[14px] leading-6 text-blue-700">{artifact.changeSummary}</div> : null}
      {artifact.previewData?.changes?.length ? <div className="mt-4 space-y-3">{artifact.previewData.changes.map((change, index) => <div key={`${change.before}-${index}`} className="space-y-2">{change.before ? <div className="rounded-[8px] bg-[#F5F7FA] px-4 py-3 text-[14px] leading-6 text-[#909399] line-through">{change.before}</div> : null}{change.after ? <div className="rounded-[8px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] leading-6 text-emerald-700">+ {change.after}</div> : null}</div>)}</div> : <div className="mt-4"><MarkdownContent content={artifact.content} /></div>}
    </div>
  );
}

export function ArtifactPreview({ artifact, emptyText = '选择产物后可在此预览。', onInsertToComposer }) {
  if (!artifact) return <div className="flex h-full items-center justify-center rounded-[8px] border border-dashed border-[#DCDFE6] bg-[#FAFBFC] p-6 text-center text-[13px] text-[#909399]">{emptyText}</div>;
  const visual = getArtifactVisual(artifact.type);
  const Icon = visual.icon;

  let body = <MarkdownContent content={artifact.content} />;
  if (artifact.type === 'outline') body = <OutlinePreview artifact={artifact} />;
  if (artifact.type === 'search_results' || artifact.type === 'references') body = <SearchResultsPreview artifact={artifact} onInsertToComposer={onInsertToComposer} />;
  if (artifact.type === 'evaluation') body = <EvaluationPreview artifact={artifact} />;
  if (artifact.type === 'tdk') body = <TdkPreview artifact={artifact} />;
  if (artifact.type === 'title_options') body = <TitleOptionsPreview artifact={artifact} onInsertToComposer={onInsertToComposer} />;
  if (artifact.type === 'strategy' && ['planning_section', 'article_planning_plan'].includes(artifact.metadata?.kind)) body = <ArticlePlanningPreview artifact={artifact} />;
  else if (artifact.type === 'strategy' || artifact.type === 'enrichment') body = <StructuredPreview artifact={artifact} />;
  if (artifact.type === 'revision') body = <RevisionPreview artifact={artifact} />;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-[#EBEEF5] bg-white">
      <div className="flex flex-none items-start gap-3 border-b border-[#EBEEF5] px-5 py-4">
        <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[8px] bg-[#EEF3FF] text-[#365EFF]"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0"><div className="text-[12px] font-semibold text-[#365EFF]">{visual.label}</div><h2 className="mt-1 text-[16px] font-bold leading-6 text-[#303133]">{artifact.title}</h2>{artifact.summary ? <p className="mt-1 text-[13px] leading-5 text-[#909399]">{artifact.summary}</p> : null}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5">{body}</div>
    </div>
  );
}
