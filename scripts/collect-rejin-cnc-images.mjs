import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourcePagesPath = path.join(rootDir, 'demo-data/rejin-cnc/source-pages.md');
const assetsDir = path.join(rootDir, 'demo-data/rejin-cnc/assets');
const imageRoot = path.join(assetsDir, 'images');
const dataFilePath = path.join(rootDir, 'src/data/demo/rejinCncAssetLibrary.js');
const maxAssets = Number(process.env.MAX_ASSETS ?? 40);
const perCategoryLimit = Number(process.env.PER_CATEGORY_LIMIT ?? 8);
const userAgent =
  'Mozilla/5.0 (compatible; ContentStudioDemoAssetCollector/1.0; +https://www.rejincnc.com/)';

const categories = {
  brand: {
    label: 'Brand and company',
    tags: ['brand', 'company', 'capability'],
  },
  services: {
    label: 'Services',
    tags: ['service', 'manufacturing', 'capability'],
  },
  products: {
    label: 'Products',
    tags: ['product', 'component', 'application'],
  },
  cases: {
    label: 'Cases',
    tags: ['case', 'customer proof', 'application'],
  },
  'materials-process': {
    label: 'Materials and process',
    tags: ['process', 'materials', 'finishing'],
  },
};

const sourceTypeMap = {
  'Core Pages': 'page',
  'Service Pages': 'service',
  'Product Example Pages': 'product',
  'Solution Source Pages': 'solution',
  'Case Pages': 'case',
  'FAQ Pages': 'faq',
};

const skipImagePatterns = [
  /\/plugins\//i,
  /\/flags\//i,
  /logo/i,
  /favicon/i,
  /cropped/i,
  /avatar/i,
  /icon/i,
  /placeholder/i,
  /blank/i,
  /loading/i,
  /sprite/i,
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function titleCaseFromSlug(value) {
  return value
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function normalizeUrl(value, baseUrl) {
  if (!value) return null;

  const cleaned = value
    .replace(/&amp;/g, '&')
    .replace(/^url\(['"]?/, '')
    .replace(/['"]?\)$/, '')
    .trim();

  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) {
    return null;
  }

  try {
    return new URL(cleaned, baseUrl).toString();
  } catch {
    return null;
  }
}

function isAllowedPageUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /(^|\.)rejincnc\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function parseSourcePages(markdown) {
  const sources = [];
  let currentType = 'page';

  markdown.split('\n').forEach((line) => {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      currentType = sourceTypeMap[heading[1].trim()] ?? currentType;
      return;
    }

    const item = line.match(/^-\s+(.+?):\s+(https:\/\/\S+)$/);
    if (!item) return;

    const title = item[1].trim();
    const url = item[2].trim();

    if (isAllowedPageUrl(url)) {
      sources.push({
        id: slugify(`${currentType}-${title}`),
        title,
        type: currentType,
        url,
      });
    }
  });

  return sources;
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

function extractLinkedPages(html, baseUrl) {
  const urls = new Set();
  const linkPattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const normalized = normalizeUrl(match[1], baseUrl);
    if (!normalized || !isAllowedPageUrl(normalized)) continue;
    urls.add(normalized.replace(/#.*$/, ''));
  }

  return [...urls].filter((url) => url.startsWith('https://') && !url.match(/\.(jpg|jpeg|png|webp|pdf)$/i));
}

function categoryFor(source, imageUrl) {
  const text = `${source.type} ${source.title} ${imageUrl}`.toLowerCase();

  if (/surface|finish|anodiz|polish|sheet|laser|bend|weld|stamping|material|metal/i.test(text)) {
    return 'materials-process';
  }

  if (source.type === 'product') return 'products';
  if (source.type === 'case') return 'cases';
  if (source.type === 'service' || source.type === 'solution') return 'services';
  if (/banner|factory|about|company|cnc|machining/i.test(text)) return 'brand';

  return 'brand';
}

function usageFor(category, source) {
  const usage = {
    brand: `Use as brand or capability imagery for Rejin CNC overview content sourced from ${source.title}.`,
    services: `Use when introducing Rejin CNC service capabilities related to ${source.title}.`,
    products: `Use when creating product pages, blog sections, or social posts about ${source.title}.`,
    cases: `Use when supporting customer proof, case study, or application content related to ${source.title}.`,
    'materials-process': `Use when explaining materials, machining processes, finishing, or production capability related to ${source.title}.`,
  };

  return usage[category];
}

function tagsFor(category, source, imageUrl) {
  const text = `${source.title} ${imageUrl}`.toLowerCase();
  const tags = new Set(categories[category].tags);

  [
    ['cnc', /cnc/],
    ['milling', /milling/],
    ['turning', /turning|turned/],
    ['sheet metal', /sheet|stamping|laser|weld|bend/],
    ['surface finish', /surface|finish|anodiz|polish/],
    ['robotics', /robot/],
    ['medical', /medical/],
    ['uav', /uav|aerospace/],
    ['audio', /audio/],
    ['fasteners', /screw|fastener|nut|stud/],
    ['coffee equipment', /coffee/],
  ].forEach(([tag, pattern]) => {
    if (pattern.test(text)) tags.add(tag);
  });

  return [...tags];
}

function getExtension(url, contentType) {
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';

  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).replace('.', '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg';
}

function getImageBaseName(imageUrl, source) {
  const pathname = new URL(imageUrl).pathname;
  const filename = path.basename(pathname).replace(/\.[a-z0-9]+$/i, '');
  return slugify(filename) || slugify(source.title);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': userAgent },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchImage(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': userAgent },
    redirect: 'follow',
  });

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

function scoreCandidate(candidate) {
  const text = `${candidate.source.title} ${candidate.url}`.toLowerCase();
  let score = 0;

  if (candidate.source.type === 'product') score += 30;
  if (candidate.source.type === 'case') score += 26;
  if (candidate.source.type === 'service' || candidate.source.type === 'solution') score += 22;
  if (candidate.source.type === 'page') score += 16;
  if (/banner|factory|cnc|machining|medical|robot|aerospace|audio|fastener|sheet|surface|stamping/.test(text)) score += 12;
  if (/-\d+x\d+\./.test(text)) score -= 8;

  return score;
}

function buildAssetTitle(source, imageUrl, sequence) {
  const imageName = titleCaseFromSlug(getImageBaseName(imageUrl, source));

  if (source.type === 'page') {
    return `${imageName} Brand Image`;
  }

  return sequence === 1 ? `${source.title} Image` : `${source.title} Image ${sequence}`;
}

function writeJsAssetLibrary(assets) {
  const rawJson = JSON.stringify(assets, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  return `const imageModules = import.meta.glob('../../../demo-data/rejin-cnc/assets/images/**/*.{jpg,jpeg,png,webp}', {\n  eager: true,\n  import: 'default',\n  query: '?url',\n});\n\nconst rawRejinCncAssetLibrary = ${rawJson};\n\nfunction resolveImageUrl(localPath) {\n  const moduleKey = \`../../../\${localPath}\`;\n  return imageModules[moduleKey] ?? localPath;\n}\n\nexport const rejinCncAssetLibrary = rawRejinCncAssetLibrary.map((asset) => ({\n  ...asset,\n  imageUrl: resolveImageUrl(asset.localPath),\n}));\n`;
}

function writeReadme() {
  return `# Rejin CNC Asset Library\n\nThis folder stores selected visual assets for the Rejin CNC demo project.\n\nThe assets are intended for export marketing content generation, including blog articles, landing pages, product pages, social posts, email copy, and future AI-assisted workflows.\n\n## Structure\n\n- \`images/brand/\`: Company, capability, and general brand imagery\n- \`images/services/\`: Service capability imagery\n- \`images/products/\`: Product and application imagery\n- \`images/cases/\`: Case study and customer proof imagery\n- \`images/materials-process/\`: Material, machining process, and finishing imagery\n- \`image-library.md\`: Product-manager-readable index of selected assets\n\n## Maintenance Rule\n\nKeep asset titles, tags, usage notes, and source information in English. The system interface handles Chinese and English UI labels separately.\n\nImages are selected from public Rejin CNC website pages for demo use. Confirm usage rights before publishing these assets externally.\n`;
}

function writeImageLibraryMarkdown(assets) {
  const coverageNotes = Object.keys(categories)
    .map((category) => {
      const count = assets.filter((asset) => asset.category === category).length;
      return count >= 3
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

  return `# Rejin CNC Image Library\n\nSelected image assets for Content Studio demo content generation.\n\n## Coverage Notes\n\n${coverageNotes}\n\n| Title | Category | Tags | Suggested Usage | Source Page | Local Path |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`;
}

async function main() {
  await fs.mkdir(imageRoot, { recursive: true });
  await Promise.all(Object.keys(categories).map((category) => fs.mkdir(path.join(imageRoot, category), { recursive: true })));

  const markdown = await fs.readFile(sourcePagesPath, 'utf8');
  const baseSources = parseSourcePages(markdown);
  const sourceMap = new Map(baseSources.map((source) => [source.url, source]));

  for (const source of baseSources.slice(0, 8)) {
    try {
      const html = await fetchText(source.url);
      extractLinkedPages(html, source.url).slice(0, 12).forEach((url) => {
        if (!sourceMap.has(url)) {
          sourceMap.set(url, {
            id: slugify(`discovered-${url}`),
            title: new URL(url).pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Discovered Page',
            type: 'discovered',
            url,
          });
        }
      });
    } catch (error) {
      console.warn(`Could not discover linked pages from ${source.url}: ${error.message}`);
    }
  }

  const sources = [...sourceMap.values()];
  const candidates = [];

  for (const source of sources) {
    try {
      const html = await fetchText(source.url);
      extractImageUrls(html, source.url).forEach((url) => {
        const category = categoryFor(source, url);
        candidates.push({
          category,
          score: scoreCandidate({ source, url }),
          source,
          url,
        });
      });
    } catch (error) {
      console.warn(`Could not fetch ${source.url}: ${error.message}`);
    }
  }

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
      if (image.buffer.length < 12_000) continue;

      const hash = createHash('sha256').update(image.buffer).digest('hex');
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      categoryCounts[candidate.category] += 1;
      sourceSequences[candidate.source.id] = (sourceSequences[candidate.source.id] ?? 0) + 1;

      const ext = getExtension(candidate.url, image.contentType);
      const baseName = getImageBaseName(candidate.url, candidate.source);
      const filename = `${candidate.category}-${baseName}-${hash.slice(0, 8)}.${ext}`;
      const localPath = `demo-data/rejin-cnc/assets/images/${candidate.category}/${filename}`;
      const absolutePath = path.join(rootDir, localPath);

      if (!existsSync(absolutePath)) {
        await fs.writeFile(absolutePath, image.buffer);
      }

      selected.push({
        id: slugify(`${candidate.category}-${baseName}-${hash.slice(0, 8)}`),
        title: buildAssetTitle(candidate.source, candidate.url, sourceSequences[candidate.source.id]),
        category: candidate.category,
        tags: tagsFor(candidate.category, candidate.source, candidate.url),
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

  await fs.writeFile(path.join(assetsDir, 'README.md'), writeReadme());
  await fs.writeFile(path.join(assetsDir, 'image-library.md'), writeImageLibraryMarkdown(selected));
  await fs.writeFile(dataFilePath, writeJsAssetLibrary(selected));

  console.log(`Collected ${selected.length} image assets.`);
  console.table(categoryCounts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
