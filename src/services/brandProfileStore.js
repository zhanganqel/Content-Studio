const storageKeyPrefix = 'content-studio-brand-profile:';

export const marketOptions = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Netherlands',
  'Spain',
  'Australia',
  'Japan',
  'South Korea',
  'Singapore',
  'Vietnam',
  'Thailand',
  'Malaysia',
  'Indonesia',
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Global',
];

function getStorageKey(projectId) {
  return `${storageKeyPrefix}${projectId}`;
}

function safeJoin(items) {
  return Array.isArray(items) ? items.join('\n') : '';
}

function getSourceUrls(project, ids) {
  const documents = project?.demoProject?.sourceDocuments ?? [];
  return ids
    .map((id) => documents.find((document) => document.id === id)?.url)
    .filter(Boolean);
}

export function createDefaultBrandProfile(project) {
  const demoProject = project?.demoProject;
  const brandProfile = demoProject?.brandProfile ?? {};

  return {
    companyName: demoProject?.name ?? project?.name ?? '',
    brandName: 'Rejin CNC',
    website: demoProject?.website ?? '',
    industry: demoProject?.industry ?? '',
    coreMarkets: ['Global'],
    coreCategories: [
      'Precision CNC machining',
      'Custom metal parts',
      'Sheet metal fabrication',
      'Surface finishing',
    ],
    companyIntroduction: brandProfile.summary ?? '',
    certifications: safeJoin(brandProfile.certifications),
    coreAdvantages: safeJoin(brandProfile.capabilities),
    companyLinks: getSourceUrls(project, ['home', 'about', 'service', 'contact']),
    authorityLinks: getSourceUrls(project, [
      'source-five-axis-cnc-machining',
      'source-dfm-support',
      'source-automotive-connector-case',
      'source-audio-enclosure-case',
      'source-machining-accuracy',
      'source-design-and-prototyping-support',
    ]),
    brandPositioning: brandProfile.positioning ?? '',
    brandRequirements: safeJoin(brandProfile.brandStyle?.messagingPrinciples),
  };
}

export function getBrandProfileDraft(project) {
  if (typeof window === 'undefined') {
    return createDefaultBrandProfile(project);
  }

  const stored = window.localStorage.getItem(getStorageKey(project.id));

  if (!stored) {
    return createDefaultBrandProfile(project);
  }

  try {
    return {
      ...createDefaultBrandProfile(project),
      ...JSON.parse(stored),
    };
  } catch {
    return createDefaultBrandProfile(project);
  }
}

export function saveBrandProfileDraft(projectId, data) {
  if (typeof window === 'undefined') {
    return data;
  }

  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
  return data;
}

export function resetBrandProfileDraft(project) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(getStorageKey(project.id));
  }

  return createDefaultBrandProfile(project);
}
