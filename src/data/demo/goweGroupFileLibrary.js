// Vite 将本地文档转换为可下载或预览的资源 URL。
const fileModules = import.meta.glob('../../../demo-data/gowe-group/file/*.{docx,xlsx,pdf}', {
  eager: true,
  import: 'default',
  query: '?url',
});

// GOWE 项目的演示文件资料元数据。
const rawGoweGroupFileLibrary = [
  {
    "id": "gowe-group-profile",
    "title": "GOWE Group Profile",
    "fileName": "GOWE Group Profile.docx",
    "fileType": "docx",
    "category": "company",
    "tags": [
      "company",
      "brand",
      "capability"
    ],
    "usage": "Use as a readable company profile source for AI content planning and SEO page generation.",
    "sourceUrls": [
      "https://www.gowe-group.com/",
      "https://www.gowe-group.com/about-us/",
      "https://www.gowe-group.com/contact/"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Group Profile.docx"
  },
  {
    "id": "gowe-product-portfolio",
    "title": "GOWE Product Portfolio",
    "fileName": "GOWE Product Portfolio.docx",
    "fileType": "docx",
    "category": "product",
    "tags": [
      "products",
      "portfolio",
      "construction systems"
    ],
    "usage": "Use as a readable product portfolio source for product pages, catalog copy, and distributor enablement.",
    "sourceUrls": [
      "https://www.gowe-group.com/products/",
      "https://www.gowe-group.com/sitemap-product-2025.xml"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Product Portfolio.docx"
  },
  {
    "id": "gowe-formwork-scaffolding-solutions",
    "title": "GOWE Formwork and Scaffolding Solutions",
    "fileName": "GOWE Formwork and Scaffolding Solutions.docx",
    "fileType": "docx",
    "category": "solution",
    "tags": [
      "solutions",
      "services",
      "engineering support"
    ],
    "usage": "Use as a readable solution source for lifecycle service content, landing pages, and AI planning workflows.",
    "sourceUrls": [
      "https://www.gowe-group.com/solution/",
      "https://www.gowe-group.com/support/"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Formwork and Scaffolding Solutions.docx"
  },
  {
    "id": "gowe-project-proof-faq",
    "title": "GOWE Project Proof and FAQ",
    "fileName": "GOWE Project Proof and FAQ.docx",
    "fileType": "docx",
    "category": "case-faq",
    "tags": [
      "cases",
      "faq",
      "project proof"
    ],
    "usage": "Use as a readable source for trust-building pages, FAQ clusters, project proof copy, and sales enablement.",
    "sourceUrls": [
      "https://www.gowe-group.com/project/",
      "https://www.gowe-group.com/support/"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Project Proof and FAQ.docx"
  },
  {
    "id": "gowe-knowledge-tables",
    "title": "GOWE Knowledge Tables",
    "fileName": "GOWE Knowledge Tables.xlsx",
    "fileType": "xlsx",
    "category": "structured-data",
    "tags": [
      "products",
      "services",
      "solutions",
      "cases",
      "faq"
    ],
    "usage": "Use as structured source tables for import, search, and AI retrieval tests.",
    "sourceUrls": [
      "https://www.gowe-group.com/",
      "https://www.gowe-group.com/products/",
      "https://www.gowe-group.com/solution/",
      "https://www.gowe-group.com/support/"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Knowledge Tables.xlsx"
  },
  {
    "id": "gowe-website-crawl-summary",
    "title": "GOWE Website Crawl Summary",
    "fileName": "GOWE Website Crawl Summary.xlsx",
    "fileType": "xlsx",
    "category": "website-research",
    "tags": [
      "crawl",
      "source pages",
      "metadata"
    ],
    "usage": "Use as an auditable summary of crawled source pages and extracted page signals.",
    "sourceUrls": [
      "https://www.gowe-group.com/sitemap.xml",
      "https://www.gowe-group.com/sitemap-product-2025.xml",
      "https://www.gowe-group.com/sitemap-post-2026.xml"
    ],
    "localPath": "demo-data/gowe-group/file/GOWE Website Crawl Summary.xlsx"
  }
];

function resolveFileUrl(localPath) {
  // 优先使用构建后的资源 URL，缺失时保留原路径便于排查。
  return fileModules[`../../../${localPath}`] ?? localPath;
}

// 页面和 AI 创作流程读取的文件资料库。
export const goweGroupFileLibrary = rawGoweGroupFileLibrary.map((file) => ({
  ...file,
  url: resolveFileUrl(file.localPath),
}));
