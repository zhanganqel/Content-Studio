import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  FileText,
  Globe2,
  ImagePlus,
  LayoutTemplate,
  LibraryBig,
  ListTree,
  PenLine,
  Repeat2,
  SearchCheck,
  Sparkles,
  TrendingUp,
  UserRoundCog,
  UsersRound,
  Video,
} from 'lucide-react';

const itemIcons = {
  'ai-visibility': Bot,
  'audience-persona': UsersRound,
  'blog-article': FilePenLine,
  'brand-component-library': Boxes,
  'brand-profile': FileText,
  'bulk-creation': LibraryBig,
  'knowledge-assets': BookOpenCheck,
  'knowledge-items': LibraryBig,
  'navigation-structure': ListTree,
  'page-management': LayoutTemplate,
  'seo-traffic': SearchCheck,
  'social-post': ImagePlus,
  'social-traffic': TrendingUp,
  'video-ad': Video,
  approvals: ClipboardCheck,
  copilot: Sparkles,
  members: UserRoundCog,
};

const flowDefinitions = [
  {
    id: 'strategy',
    icon: BookOpenCheck,
    itemIds: ['brand-profile', 'audience-persona', 'knowledge-items', 'knowledge-assets'],
  },
  {
    id: 'experience',
    icon: Globe2,
    itemIds: ['navigation-structure', 'page-management', 'brand-component-library'],
  },
  {
    id: 'production',
    icon: PenLine,
    itemIds: ['blog-article', 'social-post', 'video-ad', 'bulk-creation'],
    emphasized: true,
  },
  {
    id: 'growth',
    icon: BarChart3,
    itemIds: ['seo-traffic', 'ai-visibility', 'social-traffic'],
  },
];

const enabledItemIds = new Set([
  'brand-profile',
  'audience-persona',
  'knowledge-items',
  'knowledge-assets',
  'blog-article',
  'video-ad',
  'copilot',
]);

function HeroIllustration() {
  return (
    <div className="relative hidden h-[190px] w-[360px] flex-none items-center justify-center lg:flex" aria-hidden="true">
      <div className="absolute left-3 top-8 h-[122px] w-[168px] rotate-[-5deg] rounded-lg border border-blue-100 bg-blue-50" />
      <div className="absolute left-20 top-3 h-[150px] w-[188px] rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex h-11 items-center gap-2 border-b border-slate-100 px-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-white">
            <FileText className="h-4 w-4" />
          </span>
          <span className="h-2 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3 px-4 py-4">
          <span className="block h-2 w-full rounded-full bg-slate-100" />
          <span className="block h-2 w-4/5 rounded-full bg-slate-100" />
          <span className="block h-2 w-11/12 rounded-full bg-slate-100" />
          <div className="flex items-center gap-2 pt-1 text-blue-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="h-2 w-16 rounded-full bg-blue-100" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-1 right-6 grid h-20 w-20 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
        <PenLine className="h-9 w-9" />
      </div>
      <Sparkles className="absolute right-3 top-5 h-8 w-8 text-blue-500" />
      <TrendingUp className="absolute bottom-4 left-4 h-7 w-7 text-emerald-500" />
    </div>
  );
}

function ShortcutItem({ available, item, onActivate, t }) {
  const Icon = itemIcons[item.id] ?? ArrowRight;

  return (
    <button
      type="button"
      disabled={!available}
      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
        available
          ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
          : 'cursor-not-allowed text-slate-400'
      }`}
      onClick={available ? onActivate : undefined}
    >
      <span
        className={`grid h-8 w-8 flex-none place-items-center rounded-md ${
          available ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {available ? (
        <ArrowRight className="h-4 w-4 flex-none text-slate-300" />
      ) : (
        <span className="flex-none text-[11px] font-medium text-slate-400">{t.sidebar.comingSoon}</span>
      )}
    </button>
  );
}

function FlowCard({ definition, index, onSelectItem, t }) {
  const Icon = definition.icon;
  const copy = t.home.flow[definition.id];

  return (
    <article
      className={`relative min-h-[280px] rounded-lg border bg-white p-5 shadow-sm ${
        definition.emphasized ? 'border-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.08)]' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${
            definition.emphasized ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-600">{t.home.stepLabel(index + 1)}</p>
          <h3 className="mt-1 text-[17px] font-bold leading-6 text-slate-900">{copy.title}</h3>
        </div>
      </div>
      <p className="mt-3 min-h-[40px] text-sm leading-5 text-slate-500">{copy.description}</p>

      <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
        {definition.itemIds.map((itemId) => (
          <ShortcutItem
            key={itemId}
            available={enabledItemIds.has(itemId)}
            item={{ id: itemId, label: t.home.shortcuts[itemId] }}
            onActivate={() => onSelectItem(itemId)}
            t={t}
          />
        ))}
      </div>

      {index < flowDefinitions.length - 1 ? (
        <span className="absolute -right-5 top-1/2 z-10 hidden h-px w-5 bg-blue-200 min-[1440px]:block" aria-hidden="true">
          <ArrowRight className="absolute -right-1.5 -top-[7px] h-4 w-4 text-blue-400" />
        </span>
      ) : null}
    </article>
  );
}

function CollaborationCard({ onOpenCopilot, t }) {
  const items = [
    { id: 'copilot', available: true, onActivate: onOpenCopilot },
    { id: 'approvals', available: false },
    { id: 'members', available: false },
  ];

  return (
    <section className="mt-6 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[240px_1fr] lg:items-center">
      <div>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
            <Bot className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">{t.home.collaboration.title}</h2>
        </div>
        <p className="mt-2 text-sm leading-5 text-slate-500">{t.home.collaboration.description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <ShortcutItem
            key={item.id}
            available={item.available}
            item={{ id: item.id, label: t.home.shortcuts[item.id] }}
            onActivate={item.onActivate}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

export default function StudioHomePage({ activeProject, onOpenCopilot, onSelectItem, t }) {
  return (
    <div className="mx-auto w-full max-w-[1480px] px-6 py-7 lg:px-8">
      <section className="grid min-h-[210px] items-center gap-8 border-b border-slate-200 pb-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-600">{activeProject.name}</p>
          <h1 className="mt-4 text-[36px] font-bold leading-[1.2] tracking-normal text-slate-950">
            {t.home.heroTitle}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-500">{t.home.heroDescription}</p>
        </div>
        <HeroIllustration />
      </section>

      <section className="pt-7">
        <div className="mb-4 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.home.flowTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.home.flowDescription}</p>
          </div>
          <span className="hidden items-center gap-2 text-xs font-semibold text-blue-600 sm:flex">
            <Repeat2 className="h-4 w-4" />
            {t.home.closedLoop}
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 min-[1440px]:grid-cols-[1fr_1fr_1.25fr_1fr]">
          {flowDefinitions.map((definition, index) => (
            <FlowCard
              key={definition.id}
              definition={definition}
              index={index}
              onSelectItem={onSelectItem}
              t={t}
            />
          ))}
        </div>

        <div className="relative mx-10 hidden h-11 items-end min-[1440px]:flex" aria-hidden="true">
          <span className="h-6 w-px bg-blue-200" />
          <span className="relative mb-0 h-px flex-1 border-t border-dashed border-blue-200">
            <span className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 bg-[#F7F9FC] px-4 text-xs font-medium text-slate-500">
              <Repeat2 className="h-4 w-4 text-blue-500" />
              {t.home.feedbackLoop}
            </span>
          </span>
          <span className="h-6 w-px bg-blue-200" />
        </div>
      </section>

      <CollaborationCard onOpenCopilot={onOpenCopilot} t={t} />
    </div>
  );
}
