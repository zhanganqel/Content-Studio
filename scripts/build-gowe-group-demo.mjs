import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const projectDir = path.join(rootDir, 'demo-data/gowe-group');
const assetsDir = path.join(projectDir, 'assets');
const fileDir = path.join(projectDir, 'file');
const imageRoot = path.join(assetsDir, 'images');
const dataDir = path.join(rootDir, 'src/data/demo');
const sourceDataPath = path.join(projectDir, 'source-data.json');
const maxAssets = Number(process.env.MAX_ASSETS ?? 60);
const perCategoryLimit = Number(process.env.PER_CATEGORY_LIMIT ?? 14);
const fetchTimeoutMs = Number(process.env.FETCH_TIMEOUT_MS ?? 6_000);
const fetchProductPages = process.env.FETCH_PRODUCT_PAGES === '1';
const userAgent =
  'Mozilla/5.0 (compatible; ContentStudioDemoCollector/1.0; +https://www.gowe-group.com/)';

const site = 'https://www.gowe-group.com';
let robotsRules = [];

const categories = {
  brand: {
    label: 'Brand and company',
    tags: ['brand', 'company', 'global capability'],
  },
  services: {
    label: 'Services and solutions',
    tags: ['service', 'solution', 'engineering support'],
  },
  products: {
    label: 'Products',
    tags: ['product', 'construction system', 'equipment'],
  },
  cases: {
    label: 'Cases and projects',
    tags: ['case', 'project proof', 'construction application'],
  },
  'materials-process': {
    label: 'Materials and process',
    tags: ['process', 'steel', 'formwork', 'scaffolding'],
  },
};

const corePages = [
  { id: 'home', type: 'page', title: 'Home', url: `${site}/` },
  { id: 'about', type: 'page', title: 'About us', url: `${site}/about-us/` },
  { id: 'solution', type: 'solution', title: 'Solution', url: `${site}/solution/` },
  { id: 'products', type: 'page', title: 'Products', url: `${site}/products/` },
  { id: 'support', type: 'page', title: 'Support', url: `${site}/support/` },
  { id: 'project', type: 'case', title: 'Project', url: `${site}/project/` },
  { id: 'news', type: 'page', title: 'News', url: `${site}/news/` },
  { id: 'contact', type: 'page', title: 'Contact', url: `${site}/contact/` },
];

const fallbackProductUrls = [
  '/product/electric-mast-climbing-work-platform/',
  '/product/steel-components-for-bridge-and-tunnel-machinerymining-equipments-system/',
  '/product/outfitting-components-for-ship/',
  '/product/steel-structure-system-for-bridge/',
  '/product/petrochemical-power-plant-large-scale-steel-structure-system/',
  '/product/steel-prop/',
  '/product/scaffolding-tube/',
  '/product/single-sided-support-formwork-system/',
  '/product/cantilever-formwork/',
  '/product/high-strength-stainless-steel-formwork/',
  '/product/table-formwork/',
  '/product/timber-beam-formwork/',
  '/product/wind-power-hydropower-formwork/',
  '/product/precast-formwork/',
  '/product/tunnel-equipments/',
  '/product/segmental-assembly-formwork/',
  '/product/hanging-basket-formwork/',
  '/product/pier-formwork/',
  '/product/protection-platform/',
  '/product/aluminium-beam/',
  '/product/long-span-space-structure-system/',
  '/product/multi-high-rise-steel-structure-system/',
  '/product/steel-structure-system-for-workshop/',
  '/product/t-beam-formwork/',
  '/product/aluminium-formwork-system/',
  '/product/couplers/',
  '/product/frame-scaffolding/',
  '/product/scaffolding-plank/',
  '/product/ringlock-scaffolding/',
].map((item) => `${site}${item}`);

const productCategoryRules = [
  {
    category: 'Scaffolding Series',
    tags: ['scaffolding', 'site access', 'temporary works'],
    pattern: /scaffolding|ringlock|couplers|steel-prop|tube|aluminium-beam|plank|frame/i,
  },
  {
    category: 'Formwork Series',
    tags: ['formwork', 'concrete construction', 'template system'],
    pattern: /formwork|table|timber|aluminium-formwork|single-sided|stainless/i,
  },
  {
    category: 'Bridge and Tunnel',
    tags: ['bridge', 'tunnel', 'infrastructure'],
    pattern: /bridge|tunnel|precast|segmental|hanging-basket|pier|t-beam|hydropower|wind-power/i,
  },
  {
    category: 'Steel Structure',
    tags: ['steel structure', 'fabrication', 'large structure'],
    pattern: /steel-structure|steel-components|outfitting|petrochemical|long-span|high-rise|workshop|ship/i,
  },
  {
    category: 'Protection Platform',
    tags: ['protection platform', 'high-rise safety', 'climbing platform'],
    pattern: /protection-platform|mast-climbing|self-climbing/i,
  },
  {
    category: 'Cantilever Formwork',
    tags: ['cantilever formwork', 'bridge construction', 'civil works'],
    pattern: /cantilever/i,
  },
];

const serviceItems = [
  {
    id: 'engineering-design-support',
    type: 'service',
    title: 'Engineering Design Support',
    summary:
      'In-house engineers and consulting engineers support scaffolding and formwork design drawings, material calculations, and technically challenging project layouts.',
    sourceUrl: `${site}/support/`,
    tags: ['engineering design', 'drawings', 'technical support'],
  },
  {
    id: 'production-and-fabrication',
    type: 'service',
    title: 'Production and Fabrication',
    summary:
      'GOWE combines R&D, production, sales, rental, and construction services across formwork, scaffolding, steel structure, bridge and tunnel equipment, and building materials.',
    sourceUrl: `${site}/about-us/`,
    tags: ['production', 'fabrication', 'R&D'],
  },
  {
    id: 'construction-technical-guidance',
    type: 'service',
    title: 'Construction Technical Guidance',
    summary:
      'Technical guidance can be provided after purchase according to project schedule, with support typically aligned to a defined period or standard floor cycle.',
    sourceUrl: `${site}/support/`,
    tags: ['construction guidance', 'installation support', 'project execution'],
  },
  {
    id: 'rental-and-purchase-options',
    type: 'service',
    title: 'Rental and Purchase Options',
    summary:
      'GOWE offers rental and purchase options for scaffolding and formwork systems so contractors can align procurement with budget and project duration.',
    sourceUrl: `${site}/support/`,
    tags: ['rental', 'purchase', 'procurement flexibility'],
  },
  {
    id: 'localized-overseas-service',
    type: 'service',
    title: 'Localized Overseas Service',
    summary:
      'Overseas branches and localized service teams in Southeast Asia support regional contractors, developers, distributors, and agents with tailored project solutions.',
    sourceUrl: `${site}/contact/`,
    tags: ['localized service', 'Southeast Asia', 'global network'],
  },
];

const solutionItems = [
  {
    id: 'consult-and-design',
    type: 'solution',
    title: 'Consult and Design',
    targetScenario: 'Early-stage project planning and temporary works design',
    relatedService: 'Engineering Design Support',
    summary:
      'A consulting and design workflow for contractors that need scaffold and formwork layouts, material quantity estimates, and constructability support before ordering.',
    sourceUrl: `${site}/solution/`,
    tags: ['consulting', 'design', 'quantity planning'],
  },
  {
    id: 'production',
    type: 'solution',
    title: 'Production',
    targetScenario: 'Manufacturing formwork, scaffolding, steel structure, and bridge or tunnel equipment',
    relatedService: 'Production and Fabrication',
    summary:
      'Integrated production capability supports standardized and customized construction systems from formwork and scaffolding to steel structures and bridge equipment.',
    sourceUrl: `${site}/solution/`,
    tags: ['production', 'manufacturing', 'custom system'],
  },
  {
    id: 'construction',
    type: 'solution',
    title: 'Construction',
    targetScenario: 'On-site use of scaffolding, formwork, and protection systems',
    relatedService: 'Construction Technical Guidance',
    summary:
      'Construction-stage support helps project teams apply GOWE systems efficiently and safely in residential, public, industrial, infrastructure, and special building projects.',
    sourceUrl: `${site}/solution/`,
    tags: ['construction', 'on-site execution', 'temporary works'],
  },
  {
    id: 'operation',
    type: 'solution',
    title: 'Operation',
    targetScenario: 'Lifecycle operation of repeatable construction system assets',
    relatedService: 'Rental and Purchase Options',
    summary:
      'Operation-oriented support connects product selection, rental, logistics, reuse, and regional service for contractors managing multiple construction phases.',
    sourceUrl: `${site}/solution/`,
    tags: ['operation', 'reuse', 'asset lifecycle'],
  },
  {
    id: 'service',
    type: 'solution',
    title: 'Service',
    targetScenario: 'Localized support for builders, contractors, developers, distributors, and agents',
    relatedService: 'Localized Overseas Service',
    summary:
      'A service model for global construction partners that need localized response, product guidance, and one-stop formwork and scaffolding support.',
    sourceUrl: `${site}/solution/`,
    tags: ['service', 'global partner', 'localized support'],
  },
];

const caseItems = [
  {
    id: 'metro-project-in-australia',
    type: 'case',
    title: 'Metro Project in Australia',
    industry: 'Infrastructure',
    summary:
      'A metro construction reference used to demonstrate GOWE formwork, scaffolding, and temporary works capability for overseas infrastructure projects.',
    sourceUrl: `${site}/metro-project-in-australia/`,
    tags: ['metro', 'Australia', 'infrastructure'],
  },
  {
    id: 'stellar-science-park-retaining-wall',
    type: 'case',
    title: 'Stellar Science Park DR Retaining Wall',
    industry: 'Public and commercial building',
    summary:
      'A retaining wall project reference for GOWE aluminum formwork, showing use in precise concrete works and project-specific structural support.',
    sourceUrl: `${site}/gowe-aluminum-formwork-stellar-science-park-dr-retaining-wall/`,
    tags: ['aluminum formwork', 'retaining wall', 'project proof'],
  },
  {
    id: 'pasir-ris-apartment-singapore',
    type: 'case',
    title: 'Pasir Ris Apartment Singapore',
    industry: 'Residential building',
    summary:
      'A Singapore apartment project reference for GOWE ringlock scaffolding, relevant to high-rise residential construction and localized Southeast Asia service.',
    sourceUrl: `${site}/gowe-ringlock-scaffolding-pasir-ris-apartment-singapore/`,
    tags: ['ringlock scaffolding', 'Singapore', 'residential'],
  },
  {
    id: 'tanglin-halt-singapore',
    type: 'case',
    title: 'Tanglin Halt Singapore',
    industry: 'Residential and public building',
    summary:
      'A Singapore project reference that supports GOWE messaging around regional project experience and local construction support.',
    sourceUrl: `${site}/tanglin-halt-singapore/`,
    tags: ['Singapore', 'project proof', 'localized support'],
  },
  {
    id: 'hai-yun-lng-carrier',
    type: 'case',
    title: 'Hai Yun LNG Carrier',
    industry: 'Shipbuilding',
    summary:
      'A shipbuilding reference that connects GOWE steel structure and outfitting component capability with large-scale industrial and marine applications.',
    sourceUrl: `${site}/the-hai-yun-lng-carrier/`,
    tags: ['shipbuilding', 'steel structure', 'marine application'],
  },
  {
    id: 'china-thailand-railway',
    type: 'case',
    title: 'China and Thailand Railway',
    industry: 'Infrastructure',
    summary:
      'A notable construction project example cited by GOWE to demonstrate experience across complex railway and infrastructure applications.',
    sourceUrl: `${site}/support/`,
    tags: ['railway', 'Thailand', 'infrastructure'],
  },
  {
    id: 'beijing-daxing-airport',
    type: 'case',
    title: 'Beijing Daxing Airport',
    industry: 'Public building',
    summary:
      'A major airport project example cited by GOWE to support public building and large-scale construction credibility.',
    sourceUrl: `${site}/support/`,
    tags: ['airport', 'public building', 'project proof'],
  },
  {
    id: 'tianjin-pingtai-skyscraper',
    type: 'case',
    title: 'Tianjin PingTai Skyscraper',
    industry: 'High-rise building',
    summary:
      'A skyscraper project example cited by GOWE to support high-rise construction messaging for formwork, scaffolding, and protection systems.',
    sourceUrl: `${site}/support/`,
    tags: ['skyscraper', 'high-rise', 'project proof'],
  },
  {
    id: 'residential-building-projects',
    type: 'case',
    title: 'Residential Building Projects',
    industry: 'Residential building',
    summary:
      'A project category for residential construction use cases, including formwork, scaffolding, and protection systems for repeatable floor cycles.',
    sourceUrl: `${site}/project/prjoect-type/residential-building/`,
    tags: ['residential', 'floor cycle', 'formwork'],
  },
  {
    id: 'industrial-building-projects',
    type: 'case',
    title: 'Industrial Building Projects',
    industry: 'Industrial building',
    summary:
      'A project category for industrial construction applications where steel structures, formwork, and temporary access systems need to support heavy-duty site conditions.',
    sourceUrl: `${site}/project/prjoect-type/industrial-building/`,
    tags: ['industrial building', 'steel structure', 'heavy-duty'],
  },
  {
    id: 'infrastructure-projects',
    type: 'case',
    title: 'Infrastructure Projects',
    industry: 'Infrastructure',
    summary:
      'A project category covering bridges, tunnels, rail, metro, and civil infrastructure scenarios for GOWE bridge and tunnel equipment.',
    sourceUrl: `${site}/project/prjoect-type/infrastructure/`,
    tags: ['infrastructure', 'bridge', 'tunnel'],
  },
  {
    id: 'shipbuilding-projects',
    type: 'case',
    title: 'Shipbuilding Projects',
    industry: 'Shipbuilding',
    summary:
      'A project category that supports GOWE steel structure and outfitting component messaging for shipbuilding applications.',
    sourceUrl: `${site}/project/prjoect-type/shipbuilding/`,
    tags: ['shipbuilding', 'outfitting components', 'steel structure'],
  },
];

const faqItems = [
  {
    id: 'design-drawings',
    type: 'faq',
    title: 'Do you provide design drawings?',
    summary:
      'Yes. GOWE has in-house engineers and consulting engineers who can design scaffolding and formwork solutions, calculate material quantities, and support challenging project requirements.',
    sourceUrl: `${site}/support/`,
    tags: ['design drawings', 'engineering', 'material calculation'],
  },
  {
    id: 'company-introduction',
    type: 'faq',
    title: 'Can you introduce GOWE Group briefly?',
    summary:
      'GOWE Group is a long-established supplier of formwork and scaffolding systems, construction equipment, building materials, and engineering solutions with integrated R&D, production, sales, and rental.',
    sourceUrl: `${site}/support/`,
    tags: ['company profile', 'capability', 'R&D'],
  },
  {
    id: 'project-examples',
    type: 'faq',
    title: 'Can GOWE provide examples of successful construction projects?',
    summary:
      'Yes. GOWE cites projects including convention centers, bridges, subways, tunnels, the China and Thailand Railway, Beijing Daxing Airport, and Tianjin PingTai Skyscraper.',
    sourceUrl: `${site}/support/`,
    tags: ['project examples', 'proof', 'case study'],
  },
  {
    id: 'certifications',
    type: 'faq',
    title: 'What certifications do GOWE products have?',
    summary:
      'GOWE cites ISO 9001, ISO 14001, OHSAS 18001, EN 1090-2, and EN 12811 certification coverage for quality, environmental, occupational safety, steel structure, and ringlock scaffolding systems.',
    sourceUrl: `${site}/support/`,
    tags: ['certification', 'ISO 9001', 'EN 12811'],
  },
  {
    id: 'custom-solutions',
    type: 'faq',
    title: 'Can GOWE provide custom solutions?',
    summary:
      'Yes. GOWE provides tailored scaffolding and formwork systems based on project needs, using technical design and construction experience to improve efficiency and cost effectiveness.',
    sourceUrl: `${site}/support/`,
    tags: ['custom solution', 'tailored design', 'project efficiency'],
  },
  {
    id: 'technical-guidance',
    type: 'faq',
    title: 'Can GOWE provide technical guidance after purchase?',
    summary:
      'Yes. Technical guidance can be provided according to project schedule, typically within a defined project period or standard floor scope.',
    sourceUrl: `${site}/support/`,
    tags: ['technical guidance', 'after-sales', 'installation support'],
  },
  {
    id: 'rental-services',
    type: 'faq',
    title: 'Does GOWE offer rental services for scaffolding and formwork?',
    summary:
      'Yes. GOWE offers both rental and purchase options so customers can match system procurement to budget and project duration.',
    sourceUrl: `${site}/support/`,
    tags: ['rental', 'purchase', 'budget planning'],
  },
  {
    id: 'delivery-lead-time',
    type: 'faq',
    title: 'What is the lead time for scaffolding delivery?',
    summary:
      'Lead times vary based on product availability and project scope. GOWE asks customers to contact the team for an accurate timeline.',
    sourceUrl: `${site}/support/`,
    tags: ['lead time', 'delivery', 'availability'],
  },
];

const audiencePersonas = [
  {
    id: 'international-contractor-procurement-manager',
    title: 'International Contractor Procurement Manager',
    summary:
      'Evaluates formwork, scaffolding, steel structure, and temporary works suppliers for overseas projects where quality, delivery, certification, and localized support affect project risk.',
    contentPreferences: ['Comparison', 'FAQS', 'Project case studies', 'Supplier capability pages'],
  },
  {
    id: 'formwork-scaffolding-distributor',
    title: 'Formwork and Scaffolding Distributor',
    summary:
      'Needs a credible manufacturer partner with broad product coverage, catalog-ready materials, rental or sales flexibility, and responsive regional support.',
    contentPreferences: ['Product Reviews', 'Catalog content', 'Industry Insights', 'Sales enablement guides'],
  },
  {
    id: 'project-engineering-manager',
    title: 'Project or Structural Engineering Manager',
    summary:
      'Needs technical details, design support, load and safety evidence, drawing workflows, and practical guidance for applying systems on complex construction sites.',
    contentPreferences: ['Ultimate Guides', 'Problem-Solving', 'Technical explainers', 'Safety checklists'],
  },
  {
    id: 'infrastructure-developer-epc-lead',
    title: 'Infrastructure Developer or EPC Lead',
    summary:
      'Looks for project-proof, lifecycle support, local service coverage, and integrated solutions for bridge, tunnel, rail, metro, high-rise, and industrial construction.',
    contentPreferences: ['Case studies', 'Industry Insights', 'Solution pages', 'Executive capability briefs'],
  },
];

const contentSeeds = [
  {
    id: 'seed-ringlock-scaffolding-buying-guide',
    type: 'blog',
    title: 'Ringlock Scaffolding Buying Guide for International Contractors',
    audiencePersonaId: 'international-contractor-procurement-manager',
    relatedKnowledgeItemIds: ['ringlock-scaffolding', 'certifications', 'delivery-lead-time'],
  },
  {
    id: 'seed-aluminium-formwork-floor-cycle',
    type: 'blog',
    title: 'How Aluminium Formwork Supports Faster High-Rise Floor Cycles',
    audiencePersonaId: 'project-engineering-manager',
    relatedKnowledgeItemIds: ['aluminium-formwork-system', 'construction', 'technical-guidance'],
  },
  {
    id: 'seed-scaffolding-distributor-catalog',
    type: 'landing-page',
    title: 'Formwork and Scaffolding Product Portfolio for Distributors',
    audiencePersonaId: 'formwork-scaffolding-distributor',
    relatedKnowledgeItemIds: ['scaffolding-tube', 'couplers', 'frame-scaffolding', 'rental-services'],
  },
  {
    id: 'seed-bridge-tunnel-solution',
    type: 'landing-page',
    title: 'Bridge and Tunnel Formwork Solution for Infrastructure Projects',
    audiencePersonaId: 'infrastructure-developer-epc-lead',
    relatedKnowledgeItemIds: ['tunnel-equipments', 'segmental-assembly-formwork', 'infrastructure-projects'],
  },
  {
    id: 'seed-project-proof-singapore',
    type: 'case-article',
    title: 'Using Singapore Project Proof to Build Overseas Trust',
    audiencePersonaId: 'international-contractor-procurement-manager',
    relatedKnowledgeItemIds: ['pasir-ris-apartment-singapore', 'tanglin-halt-singapore', 'localized-overseas-service'],
  },
  {
    id: 'seed-custom-formwork-faq',
    type: 'faq-cluster',
    title: 'Custom Formwork and Scaffolding FAQ Cluster',
    audiencePersonaId: 'project-engineering-manager',
    relatedKnowledgeItemIds: ['custom-solutions', 'design-drawings', 'technical-guidance'],
  },
  {
    id: 'seed-steel-structure-portfolio',
    type: 'product-page',
    title: 'Steel Structure Systems for Industrial and Infrastructure Projects',
    audiencePersonaId: 'infrastructure-developer-epc-lead',
    relatedKnowledgeItemIds: [
      'steel-structure-system-for-bridge',
      'steel-structure-system-for-workshop',
      'industrial-building-projects',
    ],
  },
  {
    id: 'seed-rental-purchase-comparison',
    type: 'blog',
    title: 'Scaffolding Rental vs Purchase: What Contractors Should Compare',
    audiencePersonaId: 'international-contractor-procurement-manager',
    relatedKnowledgeItemIds: ['rental-and-purchase-options', 'rental-services', 'delivery-lead-time'],
  },
  {
    id: 'seed-certification-trust',
    type: 'blog',
    title: 'Why ISO, EN 1090-2, and EN 12811 Matter in Scaffolding Supplier Selection',
    audiencePersonaId: 'formwork-scaffolding-distributor',
    relatedKnowledgeItemIds: ['certifications', 'ringlock-scaffolding', 'production-and-fabrication'],
  },
  {
    id: 'seed-mast-climbing-platform',
    type: 'product-page',
    title: 'Electric Mast Climbing Work Platform for High-Rise Construction',
    audiencePersonaId: 'project-engineering-manager',
    relatedKnowledgeItemIds: ['electric-mast-climbing-work-platform', 'protection-platform', 'construction'],
  },
  {
    id: 'seed-precast-formwork',
    type: 'blog',
    title: 'Precast Formwork Planning for Bridge and Tunnel Contractors',
    audiencePersonaId: 'infrastructure-developer-epc-lead',
    relatedKnowledgeItemIds: ['precast-formwork', 't-beam-formwork', 'consult-and-design'],
  },
  {
    id: 'seed-global-service-network',
    type: 'social-post',
    title: 'Localized GOWE Support for Southeast Asia Construction Partners',
    audiencePersonaId: 'formwork-scaffolding-distributor',
    relatedKnowledgeItemIds: ['localized-overseas-service', 'project-examples', 'contact'],
  },
];

const skipImagePatterns = [
  /\/plugins\//i,
  /\/flags\//i,
  /logo/i,
  /favicon/i,
  /avatar/i,
  /icon/i,
  /placeholder/i,
  /blank/i,
  /loading/i,
  /sprite/i,
  /cropped/i,
  /whatsapp/i,
  /linkedin/i,
  /facebook/i,
  /instagram/i,
  /youtube/i,
  /tiktok/i,
  /pinterest/i,
];

const seedImageSources = [
  ['brand', 'GOWE Brand Banner', '/', 'https://www.gowe-group.com/wp-content/uploads/2025/10/GOWEbanner51.jpg'],
  ['brand', 'GOWE Company Title', '/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/biaoti-1.png'],
  ['brand', 'GOWE Global Map', '/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/map4_4.jpg'],
  ['brand', 'GOWE Beijing Office', '/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/BEIJING1.jpg'],
  ['products', 'Flying Formwork', '/product/table-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-1.jpg'],
  ['products', 'Flying Formwork Detail', '/product/table-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-2.jpg'],
  ['products', 'Flying Formwork Site View', '/product/table-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-3.jpg'],
  ['products', 'Steel Prop', '/product/steel-prop/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/gowe-steel-prop-768x768.jpg'],
  ['products', 'Scaffolding Steel Tube', '/product/scaffolding-tube/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Scaffolding-Steel-Tube-1.jpg'],
  ['products', 'Cantilever Formwork', '/product/cantilever-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Cantilever-Formwork-GOWE.jpg'],
  ['products', 'High Strength Stainless Steel Formwork', '/product/high-strength-stainless-steel-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-High-Strength-Stainless-Steel-Formwork-System-2.jpg'],
  ['products', 'Wind Power and Hydropower Formwork', '/product/wind-power-hydropower-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Wind-Power-Hydropower-Formwork.jpg'],
  ['products', 'Waterproof Membrane Installation Trolley', '/product/tunnel-equipments/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Waterproof-MembraneInstallation-Trolley.jpg'],
  ['products', 'Timber Beams H20', '/product/timber-beam-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Timber-Beams-H20-7.jpg'],
  ['products', 'Aluminium Formwork System', '/product/aluminium-formwork-system/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-aluminium-formwork-system-1.jpg'],
  ['products', 'Aluminium Formwork System Detail', '/product/aluminium-formwork-system/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-aluminium-formwork-system-2.jpg'],
  ['products', 'Hanging Basket Formwork', '/product/hanging-basket-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Hanging-Basket-Formwork.jpg'],
  ['products', 'Hanging Basket Formwork Beam Launcher', '/product/hanging-basket-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Hanging-Basket-Formwork-Beam-Launcher.jpg'],
  ['products', 'Ringlock Scaffolding Standard', '/product/ringlock-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-Ringlock-scaffolding-standard.jpg'],
  ['products', 'Frame Scaffold', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Frame-Scaffold-1.jpg'],
  ['products', 'Frame Scaffold Factory', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-frame-scaffolding-factory.jpg'],
  ['products', 'Joint Pin', '/product/couplers/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/joint-pin.jpg'],
  ['products', 'Precast Formwork', '/product/precast-formwork/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Precast-Formwork-3.jpg'],
  ['products', 'Steel Prop Bulk', '/product/steel-prop/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/steel-prop-in-bluk-gowe.jpg'],
  ['products', 'Steel Prop Clip', '/product/steel-prop/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/u-clip-steel-prop-gowe.jpg'],
  ['products', 'Steel Prop Product View', '/product/steel-prop/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/steel-prop2.jpg'],
  ['products', 'Scaffolding Tube Wholesale', '/product/scaffolding-tube/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-scaffolding-tube-wholesale.jpg'],
  ['products', 'Frame Scaffold Wholesale', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/GOWE-Frame-Scaffold-4.jpg'],
  ['products', 'Frame Scaffolding Wholesale', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Frame-scaffolding-wholesale.jpg'],
  ['products', 'Aluminium Beam Application', '/product/aluminium-beam/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/GOWE-Aluminium-Beam-Application-1.jpg'],
  ['products', 'Aluminium Beam Application Detail', '/product/aluminium-beam/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/GOWE-Aluminium-Beam-Application-2.jpg'],
  ['products', 'Aluminium Beam Site Application', '/product/aluminium-beam/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/GOWE-Aluminium-Beam-Application-3.jpg'],
  ['services', 'Residential Building Application', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/Residential-Building.jpg'],
  ['services', 'Industrial Building Application', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/Industrial-Building.jpg'],
  ['services', 'Public Building Application', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/Public-Building.jpg'],
  ['services', 'High-Rise Frame Structure', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/High-rise-frame-structure.jpg'],
  ['services', 'Multistory Frame Structure', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/Multistory-frame-structure.jpg'],
  ['services', 'Self Climbing Public Buildings', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/self-climbing-application-public-buildings.jpg'],
  ['services', 'Self Climbing Commercial Buildings', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/self-climbing-system-gowe-application-Commercial-Buildings.jpg'],
  ['services', 'Construction Technical Guidance', '/about-us/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/about1.jpg'],
  ['services', 'Single-Sided Support Formwork Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Single-sided-Support-Formwork-System-GOWE.png'],
  ['services', 'Aluminum Flying Formwork Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Aluminum-Flying-Formwork-3.jpg'],
  ['services', 'Aluminium Formwork Rental Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Aluminium-Formwork-for-salerental-GOWE.jpg'],
  ['services', 'Hanging Basket Formwork Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Hanging-Basket-Formwork-2.jpg'],
  ['services', 'Pier Formwork Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Pier-Formwork-1.jpg'],
  ['services', 'Protection Platform Solution', '/solution/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/protection-platform.png'],
  ['cases', 'Bridge Construction Application', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/application-bridge-construction.jpg'],
  ['cases', 'Complex Terrain Engineering', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Complex-terrain-or-special-engineering.jpg'],
  ['cases', 'Urban Viaducts and Railway Transportation', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/Urban-Viaducts-and-Railway-Transportation.jpg'],
  ['cases', 'Residential Building Project', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Residential-Building.jpg'],
  ['cases', 'Project Reference Overview', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/Home-01-%E2%80%93-Remons-%E2%80%93-Car-Rental-Elementor-Template-Kit.jpg'],
  ['cases', 'Overseas Project Map', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/map6_6.jpg'],
  ['cases', 'Project Site Reference', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/02/jiuwei1.jpg'],
  ['cases', 'Scaffolding Project Category', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/scaffolding.png'],
  ['cases', 'Formwork Project Category', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/01/formwork.png'],
  ['cases', 'Bridge Tunnel Project Category', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Bridge-Tunnel-Series.png'],
  ['cases', 'Steel Structure Project Category', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Steel-Structure-Series.png'],
  ['cases', 'Board Retaining Coupler Project Reference', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/British-Drop-Forged-Board-Retaining-Coupler-1.jpg'],
  ['cases', 'Frame Scaffold Project Reference', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Frame-Scaffold-1.jpg'],
  ['cases', 'Scaffolding Plank Project Reference', '/project/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/scaffolding-plank-gowe.jpg'],
  ['materials-process', 'GOWE Scaffolding System Application', '/product/ringlock-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-scaffolding-system-Application-1.jpg'],
  ['materials-process', 'GOWE Scaffolding Bridge Construction', '/product/ringlock-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Gowe-scaffolding-system-bridge-construction-1.jpg'],
  ['materials-process', 'Ringlock Scaffolding System', '/product/ringlock-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/ringlock-scaffolding-GOWE.jpg'],
  ['materials-process', 'Steel Prop Wholesale', '/product/steel-prop/', 'https://www.gowe-group.com/wp-content/uploads/2025/05/gowe-steel-prop-wholesale.jpg'],
  ['materials-process', 'Frame Scaffolding Factory', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/GOWE-frame-scaffolding-factory.jpg'],
  ['materials-process', 'Frame Scaffolding Wholesale Process', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/Frame-scaffolding-wholesale.jpg'],
  ['materials-process', 'Cross Brace Wholesale', '/product/frame-scaffolding/', 'https://www.gowe-group.com/wp-content/uploads/2025/03/cross-brace-wholesale.jpg'],
  ['materials-process', 'GOWE Scaffolding and Formwork', '/', 'https://www.gowe-group.com/wp-content/uploads/2025/04/Gowe-Scaffolding-Formwork1.jpg'],
  ['materials-process', 'Ladders and Scaffolding Guide', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Comparing-Ladders-and-Scaffolding-Which-is-Safer-and-More-Efficient.jpg'],
  ['materials-process', 'Scaffolding Safety Guide', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Comprehensive-Guide-to-Scaffolding-in-2026-Safety-Types-and-Best-Practices-1.jpg'],
  ['materials-process', 'Aluminium Formwork Supplier Checks', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Aluminium-Formwork-Suppliers-Key-Checks-Before-Placing-an-Order.jpg'],
  ['materials-process', 'Mobile Scaffold Selection', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Mobile-Scaffold-Solutions-How-to-Choose-the-Right-One-for-Your-Project.jpg'],
  ['materials-process', 'Aluminium Formwork Cost Factors', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/Aluminium-Formwork-Cost-Factors-Contractors-Should-Compare-First.jpg'],
  ['materials-process', 'Concrete Structure Quality', '/news/', 'https://www.gowe-group.com/wp-content/uploads/2026/06/The-Role-of-Formwork-in-Ensuring-Concrete-Structure-Quality.jpg'],
].map(([category, title, pagePath, url]) => ({
  category,
  source: {
    id: `seed-${slugify(`${category}-${title}`)}`,
    type: category === 'cases' ? 'case' : category === 'products' ? 'product' : 'solution',
    title,
    url: `${site}${pagePath}`,
  },
  url,
  score: 100,
}));

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function titleCaseFromSlug(value) {
  return String(value ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAnd\b/g, 'and')
    .trim();
}

function cleanSummary(value) {
  const cleaned = decodeHtml(value)
    .replace(/\s+\.\.\.$/, '.')
    .replace(/\.\.\.$/, '.')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.endsWith('.') || cleaned.endsWith('?') ? cleaned : `${cleaned}.`;
}

function normalizeUrl(value, baseUrl = site) {
  if (!value) return null;

  const cleaned = decodeHtml(value)
    .replace(/^url\(['"]?/, '')
    .replace(/['"]?\)$/, '')
    .trim();

  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) {
    return null;
  }

  try {
    const parsed = new URL(cleaned, baseUrl);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

function isAllowedPageUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'www.gowe-group.com';
  } catch {
    return false;
  }
}

function shouldSkipPageUrl(url) {
  return /\/wp-admin\/|\/wp-login\.php|add-to-cart=|\/go\?_=/i.test(url);
}

function robotsPatternToRegex(pattern) {
  const anchored = pattern.endsWith('$');
  const rawPattern = anchored ? pattern.slice(0, -1) : pattern;
  const source = rawPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${source}${anchored ? '$' : ''}`);
}

function parseRobotsRules(text) {
  const rules = [];
  let appliesToCollector = false;

  String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return;

      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();

      if (key === 'user-agent') {
        appliesToCollector = value === '*' || value.toLowerCase() === 'contentstudiodemocollector';
        return;
      }

      if (!appliesToCollector || !value || !['allow', 'disallow'].includes(key)) return;

      rules.push({
        type: key,
        pattern: value,
        regex: robotsPatternToRegex(value),
      });
    });

  return rules;
}

async function loadRobotsRules() {
  const text = await fetchOptionalText(`${site}/robots.txt`);
  const rules = parseRobotsRules(text);
  console.log(`Loaded ${rules.length} robots.txt rules for ${site}`);
  return rules;
}

function isAllowedByRobots(url) {
  if (!robotsRules.length) return true;

  try {
    const parsed = new URL(url);
    const target = `${parsed.pathname}${parsed.search}`;
    const matches = robotsRules
      .filter((rule) => rule.regex.test(target))
      .sort((a, b) => b.pattern.length - a.pattern.length || (a.type === 'allow' ? -1 : 1));

    return matches.length ? matches[0].type === 'allow' : true;
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  const response = await fetch(url, {
    headers: { 'user-agent': userAgent },
    redirect: 'follow',
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchOptionalText(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    console.warn(`Could not fetch ${url}: ${error.message}`);
    return '';
  }
}

async function readSitemap(url) {
  const xml = await fetchOptionalText(url);
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map((match) => decodeHtml(match[1]))
    .map((item) => normalizeUrl(item))
    .filter(Boolean)
    .filter(isAllowedPageUrl)
    .filter((item) => !shouldSkipPageUrl(item))
    .filter(isAllowedByRobots);
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function extractMetaDescription(html) {
  const match =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  return cleanSummary(match?.[1] ?? '');
}

function extractHeadingTitle(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return decodeHtml(h1.replace(/<[^>]+>/g, ''));
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return decodeHtml(String(title ?? '').replace(/\s*[-|]\s*Global Leader.*$/i, ''));
}

function getProductCategory(url, title) {
  const text = `${url} ${title}`;
  return (
    productCategoryRules.find((rule) => rule.pattern.test(text)) ?? {
      category: 'Construction Systems',
      tags: ['construction system', 'formwork', 'scaffolding'],
    }
  );
}

function productFallbackSummary(title, category) {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('scaffolding')) {
    return `${title} is part of GOWE's scaffolding portfolio for temporary access, shoring, maintenance, and site support in construction projects.`;
  }
  if (lowerCategory.includes('formwork')) {
    return `${title} is part of GOWE's formwork portfolio for concrete construction, reusable forming systems, and project-specific structural support.`;
  }
  if (lowerCategory.includes('bridge')) {
    return `${title} supports bridge, tunnel, hydropower, precast, or segmental construction scenarios where specialized civil engineering equipment is required.`;
  }
  if (lowerCategory.includes('steel')) {
    return `${title} supports large-scale steel structure applications for bridges, workshops, high-rise buildings, shipbuilding, mining equipment, or industrial projects.`;
  }
  if (lowerCategory.includes('protection')) {
    return `${title} supports high-rise construction safety, working access, and protection platform applications.`;
  }
  return `${title} is part of GOWE's construction equipment portfolio for contractors, developers, builders, and distributors.`;
}

async function buildProducts() {
  const sitemapProducts = await readSitemap(`${site}/sitemap-product-2025.xml`);
  const productUrls = [
    ...new Set((sitemapProducts.length ? sitemapProducts : fallbackProductUrls).filter((url) => /\/product\//.test(url))),
  ].filter(isAllowedByRobots);
  const products = [];

  for (const url of productUrls) {
    const html = fetchProductPages ? await fetchOptionalText(url) : '';
    const slug = slugify(new URL(url).pathname.split('/').filter(Boolean).pop());
    const fallbackTitle = titleCaseFromSlug(slug);
    const title = extractHeadingTitle(html) || fallbackTitle;
    const { category, tags } = getProductCategory(url, title);
    const metaDescription = extractMetaDescription(html);
    const summary = metaDescription && !/^Discover GOWE Group/i.test(metaDescription)
      ? metaDescription
      : productFallbackSummary(title, category);

    products.push({
      id: slug,
      type: 'product',
      title,
      alias: title.replace(/\s+System$/i, '').slice(0, 42),
      category,
      summary,
      sourceUrl: url,
      tags: [...new Set([category, ...tags, ...slug.split('-').filter((item) => item.length > 3).slice(0, 3)])],
    });
  }

  return products.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

function extractImageUrls(html, baseUrl) {
  const urls = new Set();
  const imagePattern =
    /(?:https?:)?\/\/[^"'()<>\s,]+?\.(?:jpe?g|png|webp)(?:\?[^"'()<>\s,]*)?|\/[^"'()<>\s,]+?\.(?:jpe?g|png|webp)(?:\?[^"'()<>\s,]*)?/gi;

  for (const match of html.matchAll(imagePattern)) {
    const normalized = normalizeUrl(match[0], baseUrl);
    if (normalized) urls.add(normalized);
  }

  return [...urls].filter((url) => {
    if (!isAllowedPageUrl(url)) return false;
    return !skipImagePatterns.some((pattern) => pattern.test(url));
  });
}

function categoryForImage(source, imageUrl) {
  const text = `${source.type} ${source.title} ${imageUrl}`.toLowerCase();

  if (source.type === 'product') return 'products';
  if (source.type === 'case') return 'cases';
  if (source.type === 'service' || source.type === 'solution' || /consult|construction|operation|service/.test(text)) {
    return 'services';
  }
  if (/steel|formwork|scaffold|ringlock|beam|prop|tunnel|bridge|platform|factory|workshop|production/.test(text)) {
    return 'materials-process';
  }
  return 'brand';
}

function scoreCandidate(candidate) {
  const text = `${candidate.source.title} ${candidate.url}`.toLowerCase();
  let score = 0;
  if (candidate.source.type === 'product') score += 35;
  if (candidate.source.type === 'case') score += 32;
  if (candidate.source.type === 'solution' || candidate.source.type === 'service') score += 24;
  if (candidate.source.type === 'page') score += 16;
  if (/formwork|scaffold|ringlock|steel|bridge|tunnel|platform|project|factory|construction/.test(text)) score += 12;
  if (/-\d+x\d+\./.test(text)) score -= 8;
  if (/banner|home|about/.test(text)) score += 4;
  return score;
}

function usageFor(category, source) {
  const usage = {
    brand: `Use as brand or company capability imagery for GOWE overview content sourced from ${source.title}.`,
    services: `Use when introducing GOWE lifecycle support, engineering service, or solution content related to ${source.title}.`,
    products: `Use when creating product pages, category sections, or product-led posts about ${source.title}.`,
    cases: `Use when supporting customer proof, project references, or industry case content related to ${source.title}.`,
    'materials-process': `Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to ${source.title}.`,
  };
  return usage[category];
}

function tagsForImage(category, source, imageUrl) {
  const text = `${source.title} ${imageUrl}`.toLowerCase();
  const tags = new Set(categories[category].tags);

  [
    ['formwork', /formwork|template/],
    ['scaffolding', /scaffold|ringlock|coupler|prop|plank/],
    ['steel structure', /steel|structure|workshop/],
    ['bridge', /bridge|pier|t-beam|segmental/],
    ['tunnel', /tunnel/],
    ['protection platform', /platform|climbing/],
    ['Singapore', /singapore|pasir|tanglin/],
    ['Australia', /australia|metro/],
  ].forEach(([tag, pattern]) => {
    if (pattern.test(text)) tags.add(tag);
  });

  return [...tags];
}

function getExtension(url, contentType) {
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  const ext = path.extname(new URL(url).pathname).replace('.', '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg';
}

function getImageBaseName(imageUrl, source) {
  const pathname = new URL(imageUrl).pathname;
  const filename = path.basename(pathname).replace(/\.[a-z0-9]+$/i, '');
  return slugify(filename) || slugify(source.title);
}

async function fetchImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  const response = await fetch(url, {
    headers: { 'user-agent': userAgent },
    redirect: 'follow',
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}

async function collectImages(sources) {
  await fs.mkdir(imageRoot, { recursive: true });
  await Promise.all(Object.keys(categories).map((category) => fs.mkdir(path.join(imageRoot, category), { recursive: true })));

  const candidates = [...seedImageSources];
  const crawlSources = sources.slice(0, 72);

  await mapLimit(crawlSources, 8, async (source) => {
    const html = await fetchOptionalText(source.url);
    if (!html) return;
    extractImageUrls(html, source.url).forEach((url) => {
      const category = categoryForImage(source, url);
      candidates.push({
        category,
        score: scoreCandidate({ source, url }),
        source,
        url,
      });
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  const selected = [];
  const seenUrls = new Set();
  const seenHashes = new Set();
  const categoryCounts = Object.fromEntries(Object.keys(categories).map((category) => [category, 0]));
  const sourceSequences = {};

  for (const candidate of candidates) {
    if (selected.length >= maxAssets) break;
    if (seenUrls.has(candidate.url)) continue;
    if (categoryCounts[candidate.category] >= perCategoryLimit) continue;
    seenUrls.add(candidate.url);

    try {
      const image = await fetchImage(candidate.url);
      if (image.buffer.length < 15_000) continue;

      const hash = createHash('sha256').update(image.buffer).digest('hex');
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      categoryCounts[candidate.category] += 1;
      sourceSequences[candidate.source.id] = (sourceSequences[candidate.source.id] ?? 0) + 1;

      const ext = getExtension(candidate.url, image.contentType);
      const baseName = getImageBaseName(candidate.url, candidate.source);
      const filename = `${candidate.category}-${baseName}-${hash.slice(0, 8)}.${ext}`;
      const localPath = `demo-data/gowe-group/assets/images/${candidate.category}/${filename}`;
      const absolutePath = path.join(rootDir, localPath);

      if (!existsSync(absolutePath)) {
        await fs.writeFile(absolutePath, image.buffer);
      }

      const sequence = sourceSequences[candidate.source.id];
      selected.push({
        id: slugify(`${candidate.category}-${baseName}-${hash.slice(0, 8)}`),
        title: sequence === 1 ? `${candidate.source.title} Image` : `${candidate.source.title} Image ${sequence}`,
        category: candidate.category,
        tags: tagsForImage(candidate.category, candidate.source, candidate.url),
        usage: usageFor(candidate.category, candidate.source),
        sourcePageUrl: candidate.source.url,
        originalImageUrl: candidate.url,
        localPath,
      });
    } catch (error) {
      console.warn(`Could not download ${candidate.url}: ${error.message}`);
    }
  }

  selected.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  console.table(categoryCounts);
  return selected;
}

function sourceDoc(id, type, title, url) {
  return { id, type, title, url };
}

function buildSourceDocuments(products) {
  return [
    ...corePages.map((page) => sourceDoc(page.id, page.type, page.title, page.url)),
    ...serviceItems.map((item) => sourceDoc(`source-service-${item.id}`, 'service', item.title, item.sourceUrl)),
    ...solutionItems.map((item) => sourceDoc(`source-solution-${item.id}`, 'solution', item.title, item.sourceUrl)),
    ...products.map((item) => sourceDoc(`source-product-${item.id}`, 'product', item.title, item.sourceUrl)),
    ...caseItems.map((item) => sourceDoc(`source-case-${item.id}`, 'case', item.title, item.sourceUrl)),
    ...faqItems.map((item) => sourceDoc(`source-faq-${item.id}`, 'faq', item.title, item.sourceUrl)),
  ];
}

function buildProject(products, mediaAssets) {
  const sourceDocuments = buildSourceDocuments(products);
  const knowledgeItems = [...serviceItems, ...solutionItems, ...products, ...caseItems, ...faqItems];

  return {
    id: 'gowe-group',
    name: 'GOWE Group',
    brandName: 'GOWE',
    website: `${site}/`,
    industry: 'Construction formwork, scaffolding, steel structure, bridge and tunnel equipment',
    description: 'Demo project for a global formwork, scaffolding, and construction solution supplier.',
    defaultContentLanguage: 'en-US',
    demoDataVersion: 1,
    coreMarkets: ['Global', 'Southeast Asia', 'China', 'Europe', 'North America', 'Middle East'],
    coreCategories: [
      'Formwork systems',
      'Scaffolding systems',
      'Bridge and tunnel equipment',
      'Steel structures',
      'Protection platforms',
      'Construction lifecycle services',
    ],
    companySourceIds: ['home', 'about', 'solution', 'products', 'support', 'contact'],
    authoritySourceIds: [
      'about',
      'support',
      'source-faq-certifications',
      'source-case-china-thailand-railway',
      'source-case-beijing-daxing-airport',
      'source-case-tianjin-pingtai-skyscraper',
    ],
    contact: {
      email: 'HW-GOWE@gowe-group.com',
      phone: '+86 18222117137',
      whatsapp: '+8618222117137',
      address: 'Unit 901-911, North Tower, Citic Poly Plaza, No.46 Tianhong Road, Lecong Town, Shunde, Foshan, Guangdong, China',
      offices: [
        'Bangkok, Thailand',
        'Singapore',
        'Johor Darul Ta\'zim, Malaysia',
      ],
    },
    brandProfile: {
      summary:
        'GOWE Group is a construction formwork and scaffolding solution supplier integrating R&D, production, sales, leasing, construction, and operation across formwork, scaffolding, steel structures, bridge and tunnel equipment, and related building materials.',
      positioning:
        'A one-stop formwork and scaffolding partner for global builders, contractors, developers, distributors, agents, scaffolders, designers, and infrastructure teams.',
      capabilities: [
        'Formwork and scaffolding R&D',
        'Production and fabrication',
        'Sales and rental',
        'Construction-stage support',
        'Bridge and tunnel equipment',
        'Steel structure systems',
        'Protection platform systems',
        'Localized overseas service',
      ],
      certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001', 'EN 1090-2', 'EN 12811'],
      brandStyle: {
        tone: 'Professional, engineering-grounded, reliable, global, project-focused, and partnership-oriented.',
        messagingPrinciples: [
          'Lead with one-stop lifecycle capability across design, production, construction, operation, and service.',
          'Use concrete product categories and project applications instead of generic construction claims.',
          'Support trust with certification, project proof, global branches, and localized service messages.',
          'Write for contractors, developers, distributors, and engineering decision makers who compare risk, delivery, and support.',
        ],
      },
    },
    mediaAssets,
    fileAssets: [],
    brandFacts: [
      {
        title: 'Integrated formwork and scaffolding solution provider',
        detail:
          'GOWE integrates R&D, production, sales, leasing, construction, and operation across formwork, scaffolding, steel structures, bridge and tunnel equipment, and building materials.',
        sourceUrl: `${site}/about-us/`,
      },
      {
        title: '30+ years of industry experience',
        detail:
          'GOWE presents more than 30 years of experience in formwork and scaffolding support systems and construction solution delivery.',
        sourceUrl: `${site}/about-us/`,
      },
      {
        title: 'Large project and partner footprint',
        detail:
          'GOWE cites 10,000+ construction projects and 800+ construction partners across China and major Southeast Asia markets, with growing reach in Europe and North America.',
        sourceUrl: `${site}/about-us/`,
      },
      {
        title: 'International quality and safety certifications',
        detail:
          'GOWE cites ISO 9001, ISO 14001, OHSAS 18001, EN 1090-2, and EN 12811 certification coverage.',
        sourceUrl: `${site}/support/`,
      },
      {
        title: 'Localized overseas network',
        detail:
          'GOWE lists overseas offices and localized service coverage in Thailand, Singapore, Malaysia, and broader overseas branch networks.',
        sourceUrl: `${site}/contact/`,
      },
    ],
    audiencePersonas,
    knowledgeItems,
    sourceDocuments,
    contentSeeds,
  };
}

function markdownTable(rows) {
  return rows.join('\n');
}

function itemMarkdown(item, extraRows = []) {
  const rows = [
    `# ${item.title}`,
    '',
    `- ID: ${item.id}`,
    `- Type: ${item.type}`,
    item.category ? `- Category: ${item.category}` : null,
    item.industry ? `- Industry: ${item.industry}` : null,
    item.targetScenario ? `- Target scenario: ${item.targetScenario}` : null,
    item.relatedService ? `- Related service: ${item.relatedService}` : null,
    `- Tags: ${(item.tags ?? []).join(', ')}`,
    `- Source: ${item.sourceUrl}`,
    ...extraRows,
    '',
    '## Summary',
    '',
    item.summary,
    '',
  ].filter(Boolean);

  return rows.join('\n');
}

async function writeMarkdownFiles(project, products) {
  await fs.mkdir(projectDir, { recursive: true });
  await Promise.all([
    fs.mkdir(path.join(projectDir, 'products'), { recursive: true }),
    fs.mkdir(path.join(projectDir, 'services'), { recursive: true }),
    fs.mkdir(path.join(projectDir, 'solutions'), { recursive: true }),
    fs.mkdir(path.join(projectDir, 'cases'), { recursive: true }),
    fs.mkdir(path.join(projectDir, 'faqs'), { recursive: true }),
    fs.mkdir(assetsDir, { recursive: true }),
    fs.mkdir(fileDir, { recursive: true }),
  ]);

  await fs.writeFile(
    path.join(projectDir, 'README.md'),
    `# GOWE Group Demo Project

This folder is the demo database for the GOWE Group project in Content Studio.

All business data in this folder is written in English because the demo project targets export marketing. System UI labels, buttons, navigation, and prompts are handled separately by \`src/i18n/messages.js\`.

## Project Summary

- Company: ${project.name}
- Website: ${project.website}
- Industry: ${project.industry}
- Demo purpose: Brand knowledge, audience personas, reusable knowledge items, file library, media library, AI content planning, and backend/API test data.
- Content language: English

## Folder Guide

| Path | Purpose |
| --- | --- |
| \`brand-profile.md\` | Company profile, positioning, style, facts, and contacts. |
| \`audience-personas.md\` | Target audiences for marketing content. |
| \`source-pages.md\` | Public website pages used as source material. |
| \`products/\` | Product portfolio knowledge items. |
| \`services/\` | Service capability knowledge items. |
| \`solutions/\` | Lifecycle solution knowledge items. |
| \`cases/\` | Case study and project proof examples. |
| \`faqs/\` | FAQ knowledge items. |
| \`file/\` | Readable Word and Excel source files plus the file library index. |
| \`assets/\` | Selected image assets plus the image library index. |
| \`source-data.json\` | Generated structured crawl payload used to reproduce project files. |

## Runtime Relationship

- Human-readable material is maintained here.
- App-facing structured data is maintained in \`src/data/demo/\`.
- \`src/data/demo/goweGroupProject.js\` aggregates this demo project.
- \`src/data/demo/goweGroupAssetLibrary.js\` imports images from \`demo-data/gowe-group/assets/images/\`.
- \`src/data/demo/goweGroupFileLibrary.js\` imports Word and Excel files from \`demo-data/gowe-group/file/\`.

Because the app imports files from this folder, do not move or rename files here without updating \`src/data/demo/*\` and running \`npm run build\`.

## Maintenance Rule

- Keep this folder readable for non-technical teammates.
- Keep source notes, tags, usage guidance, and public URLs auditable.
- Confirm usage rights before publishing demo assets externally.
`,
  );

  await fs.writeFile(
    path.join(projectDir, 'brand-profile.md'),
    `# GOWE Group Brand Profile

## Company Summary

${project.brandProfile.summary}

## Positioning

${project.brandProfile.positioning}

## Core Markets

${project.coreMarkets.map((item) => `- ${item}`).join('\n')}

## Core Categories

${project.coreCategories.map((item) => `- ${item}`).join('\n')}

## Capabilities

${project.brandProfile.capabilities.map((item) => `- ${item}`).join('\n')}

## Certifications

${project.brandProfile.certifications.map((item) => `- ${item}`).join('\n')}

## Brand Messaging Principles

${project.brandProfile.brandStyle.messagingPrinciples.map((item) => `- ${item}`).join('\n')}

## Contact

- Email: ${project.contact.email}
- Phone: ${project.contact.phone}
- WhatsApp: ${project.contact.whatsapp}
- Address: ${project.contact.address}
- Overseas offices: ${project.contact.offices.join('; ')}

## Brand Facts

${project.brandFacts.map((fact) => `### ${fact.title}\n\n${fact.detail}\n\nSource: ${fact.sourceUrl}`).join('\n\n')}
`,
  );

  await fs.writeFile(
    path.join(projectDir, 'audience-personas.md'),
    `# GOWE Group Audience Personas

${project.audiencePersonas
  .map(
    (persona) => `## ${persona.title}

- ID: ${persona.id}
- Content preferences: ${persona.contentPreferences.join(', ')}

${persona.summary}
`,
  )
  .join('\n')}
`,
  );

  const groupedSources = project.sourceDocuments.reduce((groups, source) => {
    groups[source.type] = groups[source.type] ?? [];
    groups[source.type].push(source);
    return groups;
  }, {});

  await fs.writeFile(
    path.join(projectDir, 'source-pages.md'),
    `# GOWE Group Source Pages

Public website pages used as source material for this demo project.

${Object.entries(groupedSources)
  .map(
    ([type, sources]) => `## ${titleCaseFromSlug(type)}

${sources.map((source) => `- ${source.title}: ${source.url}`).join('\n')}
`,
  )
  .join('\n')}
`,
  );

  await Promise.all(serviceItems.map((item) => fs.writeFile(path.join(projectDir, 'services', `${item.id}.md`), itemMarkdown(item))));
  await Promise.all(solutionItems.map((item) => fs.writeFile(path.join(projectDir, 'solutions', `${item.id}.md`), itemMarkdown(item))));
  await Promise.all(products.map((item) => fs.writeFile(path.join(projectDir, 'products', `${item.id}.md`), itemMarkdown(item))));
  await Promise.all(caseItems.map((item) => fs.writeFile(path.join(projectDir, 'cases', `${item.id}.md`), itemMarkdown(item))));
  await Promise.all(faqItems.map((item) => fs.writeFile(path.join(projectDir, 'faqs', `${item.id}.md`), itemMarkdown(item, [`- Answer: ${item.summary}`]))));
}

async function writeAssetDocs(assets) {
  const coverageNotes = Object.keys(categories)
    .map((category) => {
      const count = assets.filter((asset) => asset.category === category).length;
      return count >= 6
        ? `- ${categories[category].label}: ${count} selected assets.`
        : `- ${categories[category].label}: ${count} selected asset${count === 1 ? '' : 's'}; source pages did not expose enough non-decorative images.`;
    })
    .join('\n');

  const rows = assets
    .map(
      (asset) =>
        `| ${asset.title} | ${asset.category} | ${asset.tags.join(', ')} | ${asset.usage} | ${asset.sourcePageUrl} | ${asset.localPath} |`,
    )
    .join('\n');

  await fs.writeFile(
    path.join(assetsDir, 'README.md'),
    `# GOWE Group Asset Library

This folder stores selected visual assets for the GOWE Group demo project.

The assets are intended for export marketing content generation, including blog articles, landing pages, product pages, social posts, email copy, and future AI-assisted workflows.

## Structure

- \`images/brand/\`: Company, capability, and general brand imagery
- \`images/services/\`: Service and solution imagery
- \`images/products/\`: Product and category imagery
- \`images/cases/\`: Case study and project proof imagery
- \`images/materials-process/\`: Construction system, material, site, and process imagery
- \`image-library.md\`: Product-manager-readable index of selected assets

## Maintenance Rule

Keep asset titles, tags, usage notes, and source information in English. The system interface handles Chinese and English UI labels separately.

Images are selected from public GOWE Group website pages for demo use. Confirm usage rights before publishing these assets externally.
`,
  );

  await fs.writeFile(
    path.join(assetsDir, 'image-library.md'),
    `# GOWE Group Image Library

Selected image assets for Content Studio demo content generation.

## Coverage Notes

${coverageNotes}

| Title | Category | Tags | Suggested Usage | Source Page | Local Path |
| --- | --- | --- | --- | --- | --- |
${rows}
`,
  );
}

async function writeFileDocs() {
  const rows = goweFileAssets()
    .map(
      (file) =>
        `| ${file.fileName} | ${file.fileType} | ${file.category} | ${file.usage} | ${file.sourceUrls.join('<br>')} |`,
    )
    .join('\n');

  const content = `# GOWE Group File Library

Readable source documents and structured workbooks for the GOWE Group demo project.

| File | Type | Category | Suggested Usage | Source URLs |
| --- | --- | --- | --- | --- |
${rows}

## Maintenance Rule

These files are generated from \`demo-data/gowe-group/source-data.json\`. Regenerate them after changing the structured demo data, then run \`npm run build\`.
`;

  await fs.writeFile(path.join(fileDir, 'README.md'), content);
  await fs.writeFile(path.join(fileDir, 'file-library.md'), content);
}

function goweFileAssets() {
  return [
    {
      id: 'gowe-group-profile',
      title: 'GOWE Group Profile',
      fileName: 'GOWE Group Profile.docx',
      fileType: 'docx',
      category: 'company',
      tags: ['company', 'brand', 'capability'],
      usage: 'Use as a readable company profile source for AI content planning and SEO page generation.',
      sourceUrls: [`${site}/`, `${site}/about-us/`, `${site}/contact/`],
      localPath: 'demo-data/gowe-group/file/GOWE Group Profile.docx',
    },
    {
      id: 'gowe-product-portfolio',
      title: 'GOWE Product Portfolio',
      fileName: 'GOWE Product Portfolio.docx',
      fileType: 'docx',
      category: 'product',
      tags: ['products', 'portfolio', 'construction systems'],
      usage: 'Use as a readable product portfolio source for product pages, catalog copy, and distributor enablement.',
      sourceUrls: [`${site}/products/`, `${site}/sitemap-product-2025.xml`],
      localPath: 'demo-data/gowe-group/file/GOWE Product Portfolio.docx',
    },
    {
      id: 'gowe-formwork-scaffolding-solutions',
      title: 'GOWE Formwork and Scaffolding Solutions',
      fileName: 'GOWE Formwork and Scaffolding Solutions.docx',
      fileType: 'docx',
      category: 'solution',
      tags: ['solutions', 'services', 'engineering support'],
      usage: 'Use as a readable solution source for lifecycle service content, landing pages, and AI planning workflows.',
      sourceUrls: [`${site}/solution/`, `${site}/support/`],
      localPath: 'demo-data/gowe-group/file/GOWE Formwork and Scaffolding Solutions.docx',
    },
    {
      id: 'gowe-project-proof-faq',
      title: 'GOWE Project Proof and FAQ',
      fileName: 'GOWE Project Proof and FAQ.docx',
      fileType: 'docx',
      category: 'case-faq',
      tags: ['cases', 'faq', 'project proof'],
      usage: 'Use as a readable source for trust-building pages, FAQ clusters, project proof copy, and sales enablement.',
      sourceUrls: [`${site}/project/`, `${site}/support/`],
      localPath: 'demo-data/gowe-group/file/GOWE Project Proof and FAQ.docx',
    },
    {
      id: 'gowe-knowledge-tables',
      title: 'GOWE Knowledge Tables',
      fileName: 'GOWE Knowledge Tables.xlsx',
      fileType: 'xlsx',
      category: 'structured-data',
      tags: ['products', 'services', 'solutions', 'cases', 'faq'],
      usage: 'Use as structured source tables for import, search, and AI retrieval tests.',
      sourceUrls: [`${site}/`, `${site}/products/`, `${site}/solution/`, `${site}/support/`],
      localPath: 'demo-data/gowe-group/file/GOWE Knowledge Tables.xlsx',
    },
    {
      id: 'gowe-website-crawl-summary',
      title: 'GOWE Website Crawl Summary',
      fileName: 'GOWE Website Crawl Summary.xlsx',
      fileType: 'xlsx',
      category: 'website-research',
      tags: ['crawl', 'source pages', 'metadata'],
      usage: 'Use as an auditable summary of crawled source pages and extracted page signals.',
      sourceUrls: [`${site}/sitemap.xml`, `${site}/sitemap-product-2025.xml`, `${site}/sitemap-post-2026.xml`],
      localPath: 'demo-data/gowe-group/file/GOWE Website Crawl Summary.xlsx',
    },
  ];
}

async function writeJsLibraries(project, mediaAssets) {
  const projectForJs = {
    ...project,
    mediaAssets: '__GOWE_MEDIA_ASSETS__',
    fileAssets: '__GOWE_FILE_ASSETS__',
  };

  await fs.writeFile(
    path.join(dataDir, 'goweGroupAssetLibrary.js'),
    `const imageModules = import.meta.glob('../../../demo-data/gowe-group/assets/images/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
});

const rawGoweGroupAssetLibrary = ${JSON.stringify(mediaAssets, null, 2)};

function resolveImageUrl(localPath) {
  const moduleKey = \`../../../\${localPath}\`;
  return imageModules[moduleKey] ?? localPath;
}

export const goweGroupAssetLibrary = rawGoweGroupAssetLibrary.map((asset) => ({
  ...asset,
  imageUrl: resolveImageUrl(asset.localPath),
}));
`,
  );

  await fs.writeFile(
    path.join(dataDir, 'goweGroupFileLibrary.js'),
    `const fileModules = import.meta.glob('../../../demo-data/gowe-group/file/*.{docx,xlsx,pdf}', {
  eager: true,
  import: 'default',
  query: '?url',
});

const rawGoweGroupFileLibrary = ${JSON.stringify(goweFileAssets(), null, 2)};

function resolveFileUrl(localPath) {
  return fileModules[\`../../../\${localPath}\`] ?? localPath;
}

export const goweGroupFileLibrary = rawGoweGroupFileLibrary.map((file) => ({
  ...file,
  url: resolveFileUrl(file.localPath),
}));
`,
  );

  const projectJson = JSON.stringify(projectForJs, null, 2)
    .replace('"__GOWE_MEDIA_ASSETS__"', 'goweGroupAssetLibrary')
    .replace('"__GOWE_FILE_ASSETS__"', 'goweGroupFileLibrary');

  await fs.writeFile(
    path.join(dataDir, 'goweGroupProject.js'),
    `import { goweGroupAssetLibrary } from './goweGroupAssetLibrary.js';
import { goweGroupFileLibrary } from './goweGroupFileLibrary.js';

export const goweGroupProject = ${projectJson};
`,
  );
}

async function main() {
  robotsRules = await loadRobotsRules();
  const products = await buildProducts();
  const categoryUrls = await readSitemap(`${site}/sitemap-category.xml`);
  const postUrls = await readSitemap(`${site}/sitemap-post-2026.xml`);
  const selectedPostSources = postUrls
    .filter((url) => /(project|gowe-|metro|singapore|carrier|formwork|scaffolding|bridge|tunnel|aluminium|steel)/i.test(url))
    .slice(0, 24)
    .map((url) => ({
      id: `post-${slugify(new URL(url).pathname.split('/').filter(Boolean).pop())}`,
      type: /project|gowe-|metro|singapore|carrier/i.test(url) ? 'case' : 'page',
      title: titleCaseFromSlug(new URL(url).pathname.split('/').filter(Boolean).pop()),
      url,
    }));

  const projectSourceDocs = buildSourceDocuments(products);
  const crawlSources = [
    ...corePages,
    ...products.slice(0, 10).map((product) => ({ id: `product-${product.id}`, type: 'product', title: product.title, url: product.sourceUrl })),
    ...serviceItems.map((item) => ({ id: `service-${item.id}`, type: 'service', title: item.title, url: item.sourceUrl })),
    ...solutionItems.map((item) => ({ id: `solution-${item.id}`, type: 'solution', title: item.title, url: item.sourceUrl })),
    ...caseItems.map((item) => ({ id: `case-${item.id}`, type: 'case', title: item.title, url: item.sourceUrl })),
    ...categoryUrls.slice(0, 20).map((url) => ({
      id: `category-${slugify(new URL(url).pathname.split('/').filter(Boolean).join('-'))}`,
      type: /project/.test(url) ? 'case' : /solution/.test(url) ? 'solution' : 'page',
      title: titleCaseFromSlug(new URL(url).pathname.split('/').filter(Boolean).pop()),
      url,
    })),
    ...selectedPostSources,
  ].filter((source) => isAllowedByRobots(source.url));

  const mediaAssets = await collectImages(crawlSources);
  const project = buildProject(products, mediaAssets);

  await writeMarkdownFiles(project, products);
  await writeAssetDocs(mediaAssets);
  await writeFileDocs();
  await writeJsLibraries(project, mediaAssets);
  await fs.writeFile(
    sourceDataPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        website: site,
        products,
        services: serviceItems,
        solutions: solutionItems,
        cases: caseItems,
        faqs: faqItems,
        audiencePersonas,
        contentSeeds,
        sourceDocuments: projectSourceDocs,
        mediaAssets,
        fileAssets: goweFileAssets(),
        crawlSourceCount: crawlSources.length,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Generated GOWE demo project with ${products.length} products and ${mediaAssets.length} media assets.`);
  console.log(`Wrote structured source data to ${sourceDataPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
