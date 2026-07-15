// Vite 将本地文档转换为可下载或预览的资源 URL。
const fileModules = import.meta.glob('../../../demo-data/rejin-cnc/file/*.{docx,xlsx,pdf}', {
  eager: true,
  import: 'default',
  query: '?url',
});

// Rejin CNC 的演示文件资料元数据。
const rawRejinCncFileLibrary = [
  {
    id: 'rejin-cnc-introduce',
    title: 'Rejin CNC Introduce',
    fileType: 'docx',
    category: 'company',
    tags: ['company', 'brand', 'capability'],
    usage: 'Use as a readable company profile source for AI content planning and SEO page generation.',
    sourceUrls: ['https://www.rejincnc.com/', 'https://www.rejincnc.com/about-us/', 'https://www.rejincnc.com/service/'],
    localPath: 'demo-data/rejin-cnc/file/Rejin CNC Introduce.docx',
  },
  {
    id: 'service-cnc-turning',
    title: 'Service-CNC Turning',
    fileType: 'docx',
    category: 'service',
    tags: ['service', 'capability', 'cnc-turning'],
    usage: 'Use as a readable source for CNC Turning service pages, blog articles, and RFQ copy.',
    sourceUrls: ['https://www.rejincnc.com/service/cnc-turning/'],
    localPath: 'demo-data/rejin-cnc/file/Service-CNC Turning.docx',
  },
  {
    id: 'service-cnc-milling',
    title: 'Service-CNC Milling',
    fileType: 'docx',
    category: 'service',
    tags: ['service', 'capability', 'cnc-milling'],
    usage: 'Use as a readable source for CNC Milling service pages, blog articles, and RFQ copy.',
    sourceUrls: ['https://www.rejincnc.com/service/cnc-milling/'],
    localPath: 'demo-data/rejin-cnc/file/Service-CNC Milling.docx',
  },
  {
    id: 'service-five-axis-cnc-machining',
    title: 'Service-5-Axis CNC Machining',
    fileType: 'docx',
    category: 'service',
    tags: ['service', 'capability', 'five-axis-cnc-machining'],
    usage: 'Use as a readable source for 5-Axis CNC Machining service pages, blog articles, and RFQ copy.',
    sourceUrls: ['https://www.rejincnc.com/service/5-axis-cnc-machining/'],
    localPath: 'demo-data/rejin-cnc/file/Service-5-Axis CNC Machining.docx',
  },
  {
    id: 'service-sheet-metal-fabrication',
    title: 'Service-Sheet Metal Fabrication',
    fileType: 'docx',
    category: 'service',
    tags: ['service', 'capability', 'sheet-metal-fabrication'],
    usage: 'Use as a readable source for Sheet Metal Fabrication service pages, blog articles, and RFQ copy.',
    sourceUrls: ['https://www.rejincnc.com/service/sheet-metal-fabrication/'],
    localPath: 'demo-data/rejin-cnc/file/Service-Sheet Metal Fabrication.docx',
  },
  {
    id: 'rejin-cnc-knowledge-tables',
    title: 'Rejin CNC Knowledge Tables',
    fileType: 'xlsx',
    category: 'structured-data',
    tags: ['products', 'services', 'solutions', 'cases', 'faq'],
    usage: 'Use as structured source tables for import, search, and AI retrieval tests.',
    sourceUrls: [
      'https://www.rejincnc.com/',
      'https://www.rejincnc.com/about-us/',
      'https://www.rejincnc.com/service/',
      'https://www.rejincnc.com/service/cnc-turning/',
      'https://www.rejincnc.com/service/cnc-milling/',
      'https://www.rejincnc.com/service/5-axis-cnc-machining/',
      'https://www.rejincnc.com/service/sheet-metal-fabrication/',
      'https://www.rejincnc.com/service/surface-treatments/',
      'https://www.rejincnc.com/service/support-dfm-service/',
    ],
    localPath: 'demo-data/rejin-cnc/file/Rejin CNC Knowledge Tables.xlsx',
  },
  {
    id: 'rejin-cnc-website-crawl-summary',
    title: 'Rejin CNC Website Crawl Summary',
    fileType: 'xlsx',
    category: 'website-research',
    tags: ['crawl', 'source pages', 'metadata'],
    usage: 'Use as an auditable summary of crawled source pages and extracted page signals.',
    sourceUrls: [
      'https://www.rejincnc.com/',
      'https://www.rejincnc.com/about-us/',
      'https://www.rejincnc.com/service/',
      'https://www.rejincnc.com/service/cnc-turning/',
      'https://www.rejincnc.com/service/cnc-milling/',
      'https://www.rejincnc.com/service/5-axis-cnc-machining/',
      'https://www.rejincnc.com/service/sheet-metal-fabrication/',
      'https://www.rejincnc.com/service/surface-treatments/',
      'https://www.rejincnc.com/service/support-dfm-service/',
    ],
    localPath: 'demo-data/rejin-cnc/file/Rejin CNC Website Crawl Summary.xlsx',
  },
];

function resolveFileUrl(localPath) {
  // 优先使用构建后的资源 URL，缺失时保留原路径便于排查。
  return fileModules[`../../../${localPath}`] ?? localPath;
}

// 页面和 AI 创作流程读取的文件资料库。
export const rejinCncFileLibrary = rawRejinCncFileLibrary.map((file) => ({
  ...file,
  url: resolveFileUrl(file.localPath),
}));
