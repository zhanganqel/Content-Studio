const storageKeyPrefix = 'content-studio-brand-profile:';
const storageSchemaVersion = 2;

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

function serializeBrandProfile(data) {
  return JSON.stringify({
    schemaVersion: storageSchemaVersion,
    data,
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function shouldRefreshDemoBrandProfile(project, schemaVersion) {
  return Boolean(project?.demoProject) && schemaVersion !== storageSchemaVersion;
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

function getDefaultBrandName(project, demoProject) {
  return (
    demoProject?.brandName ??
    demoProject?.name?.replace(/\s+Demo Project$/i, '') ??
    project?.name?.replace(/\s+Demo Project$/i, '') ??
    ''
  );
}

export function createDefaultBrandProfile(project) {
  const demoProject = project?.demoProject;
  const brandProfile = demoProject?.brandProfile ?? {};
  const defaultCoreCategories = [
    'Precision CNC machining',
    'Custom metal parts',
    'Sheet metal fabrication',
    'Surface finishing',
  ];
  const defaultCompanySourceIds = ['home', 'about', 'service', 'contact'];
  const defaultAuthoritySourceIds = [
    'source-five-axis-cnc-machining',
    'source-dfm-support',
    'source-automotive-connector-case',
    'source-audio-enclosure-case',
    'source-machining-accuracy',
    'source-design-and-prototyping-support',
  ];

  return {
    companyName: demoProject?.name ?? project?.name ?? '',
    brandName: getDefaultBrandName(project, demoProject),
    website: demoProject?.website ?? '',
    industry: demoProject?.industry ?? '',
    coreMarkets: demoProject?.coreMarkets ?? ['Global'],
    coreCategories: demoProject?.coreCategories ?? defaultCoreCategories,
    companyIntroduction: brandProfile.summary ?? '',
    certifications: safeJoin(brandProfile.certifications),
    coreAdvantages: safeJoin(brandProfile.capabilities),
    companyLinks: getSourceUrls(project, demoProject?.companySourceIds ?? defaultCompanySourceIds),
    authorityLinks: getSourceUrls(project, demoProject?.authoritySourceIds ?? defaultAuthoritySourceIds),
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
    const parsed = JSON.parse(stored);
    const defaultProfile = createDefaultBrandProfile(project);

    if (isPlainObject(parsed) && isPlainObject(parsed.data)) {
      if (shouldRefreshDemoBrandProfile(project, parsed.schemaVersion)) {
        window.localStorage.setItem(getStorageKey(project.id), serializeBrandProfile(defaultProfile));
        return defaultProfile;
      }

      return {
        ...defaultProfile,
        ...parsed.data,
      };
    }

    if (isPlainObject(parsed)) {
      if (shouldRefreshDemoBrandProfile(project)) {
        window.localStorage.setItem(getStorageKey(project.id), serializeBrandProfile(defaultProfile));
        return defaultProfile;
      }

      return {
        ...defaultProfile,
        ...parsed,
      };
    }

    return defaultProfile;
  } catch {
    return createDefaultBrandProfile(project);
  }
}

export function saveBrandProfileDraft(projectId, data) {
  if (typeof window === 'undefined') {
    return data;
  }

  window.localStorage.setItem(getStorageKey(projectId), serializeBrandProfile(data));
  return data;
}

export function resetBrandProfileDraft(project) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(getStorageKey(project.id));
  }

  return createDefaultBrandProfile(project);
}
