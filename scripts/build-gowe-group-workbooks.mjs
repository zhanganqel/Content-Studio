import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const projectDir = path.join(rootDir, 'demo-data/gowe-group');
const fileDir = path.join(projectDir, 'file');
const sourceDataPath = path.join(projectDir, 'source-data.json');
const renderDir = process.env.GOWE_XLSX_RENDER_DIR ?? '/private/tmp/gowe-group-xlsx-render';

async function loadArtifactTool() {
  try {
    return await import('@oai/artifact-tool');
  } catch (error) {
    const fallback = process.env.ARTIFACT_TOOL_ENTRY;
    if (!fallback) {
      throw new Error(
        `Could not load @oai/artifact-tool (${error.message}). Set ARTIFACT_TOOL_ENTRY to the bundled package entry from load_workspace_dependencies.`,
      );
    }
    return import(pathToFileURL(fallback).href);
  }
}

function toText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value ?? '');
}

function shortText(value, limit = 420) {
  const text = toText(value).replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function tagText(value) {
  return shortText(value, 120);
}

function safeSheetName(value) {
  return String(value).replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);
}

function writeSheet(workbook, name, title, subtitle, headers, rows, widths = []) {
  const sheet = workbook.worksheets.add(safeSheetName(name));
  sheet.showGridLines = false;

  const columnCount = headers.length;
  const rowCount = Math.max(rows.length, 1);
  const titleRange = sheet.getRangeByIndexes(0, 0, 1, columnCount);
  titleRange.merge();
  titleRange.values = [[title]];
  titleRange.format = {
    fill: '#103D3B',
    font: { bold: true, color: '#FFFFFF', size: 16 },
    wrapText: true,
  };
  titleRange.format.rowHeightPx = 32;

  const subtitleRange = sheet.getRangeByIndexes(1, 0, 1, columnCount);
  subtitleRange.merge();
  subtitleRange.values = [[subtitle]];
  subtitleRange.format = {
    fill: '#EAF3F1',
    font: { color: '#33524F', size: 10 },
    wrapText: true,
  };
  subtitleRange.format.rowHeightPx = 30;

  const headerRange = sheet.getRangeByIndexes(2, 0, 1, columnCount);
  headerRange.values = [headers];
  headerRange.format = {
    fill: '#2D6A64',
    font: { bold: true, color: '#FFFFFF' },
    wrapText: true,
    borders: { preset: 'all', style: 'thin', color: '#B7C9C6' },
  };
  headerRange.format.rowHeightPx = 24;

  const bodyRows = rows.length ? rows : [headers.map(() => '')];
  const bodyRange = sheet.getRangeByIndexes(3, 0, rowCount, columnCount);
  bodyRange.values = bodyRows;
  bodyRange.format = {
    wrapText: true,
    borders: { preset: 'all', style: 'thin', color: '#D8E3E1' },
  };
  bodyRange.format.rowHeightPx = 72;

  headers.forEach((_, index) => {
    const columnRange = sheet.getRangeByIndexes(0, index, rowCount + 3, 1);
    columnRange.format.columnWidth = widths[index] ?? 22;
  });

  sheet.freezePanes.freezeRows(3);
  return sheet;
}

function productRows(data) {
  return data.products.map((item) => [
    item.title,
    item.category,
    shortText(item.alias, 120),
    shortText(item.summary, 180),
    tagText(item.tags),
    item.sourceUrl,
  ]);
}

function serviceRows(data) {
  return [...data.services, ...data.solutions].map((item) => [
    item.title,
    item.type,
    shortText(item.targetScenario, 160),
    shortText(item.relatedService, 160),
    shortText(item.summary, 180),
    tagText(item.tags),
    item.sourceUrl,
  ]);
}

function caseRows(data) {
  return data.cases.map((item) => [
    item.title,
    item.industry,
    shortText(item.summary, 180),
    tagText(item.tags),
    item.sourceUrl,
  ]);
}

function faqRows(data) {
  return data.faqs.map((item) => [
    item.title,
    shortText(item.answer ?? item.summary, 220),
    tagText(item.tags),
    item.sourceUrl,
  ]);
}

function sourceRows(data) {
  return data.sourceDocuments.map((item) => [
    item.id,
    item.type,
    item.title,
    shortText(item.summary, 180),
    item.url,
  ]);
}

function mediaRows(data) {
  return data.mediaAssets.map((item) => [
    item.title,
    item.category,
    tagText(item.tags),
    shortText(item.usage, 180),
    item.localPath,
    item.originalImageUrl,
    item.sourcePageUrl,
  ]);
}

function fileRows(data) {
  return data.fileAssets.map((item) => [
    item.title,
    item.format,
    item.category,
    shortText(item.description, 180),
    tagText(item.tags),
    item.localPath,
  ]);
}

async function saveWorkbook(SpreadsheetFile, workbook, filename, firstSheetName) {
  await fs.mkdir(fileDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = path.join(fileDir, filename);
  await output.save(outputPath);

  const inspection = await workbook.inspect({
    kind: 'workbook,sheet,region',
    maxChars: 4500,
    tableMaxRows: 5,
    tableMaxCols: 6,
    tableMaxCellChars: 80,
  });
  await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });

  await fs.mkdir(renderDir, { recursive: true });
  const preview = await workbook.render({
    sheetName: firstSheetName,
    autoCrop: 'all',
    scale: 1,
    format: 'png',
  });
  const previewPath = path.join(renderDir, filename.replace(/\.xlsx$/i, '.png'));
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

  console.log(outputPath);
  console.log(previewPath);
  console.log(String(inspection).slice(0, 900));
}

function buildKnowledgeWorkbook(Workbook, data) {
  const workbook = Workbook.create();
  writeSheet(
    workbook,
    'Products',
    'GOWE Knowledge Tables - Products',
    'Product knowledge items prepared for Content Studio demo search, briefs, and generation context.',
    ['Product', 'Category', 'Alias', 'Summary', 'Tags', 'Source URL'],
    productRows(data),
    [28, 24, 22, 54, 34, 50],
  );
  writeSheet(
    workbook,
    'Services Solutions',
    'GOWE Knowledge Tables - Services and Solutions',
    'Lifecycle service and solution records with target scenarios and related service hints.',
    ['Name', 'Type', 'Target Scenario', 'Related Service', 'Summary', 'Tags', 'Source URL'],
    serviceRows(data),
    [28, 14, 32, 28, 54, 32, 50],
  );
  writeSheet(
    workbook,
    'Cases',
    'GOWE Knowledge Tables - Project Proof',
    'Selected project and application proof points for industry-specific content creation.',
    ['Case', 'Industry', 'Summary', 'Tags', 'Source URL'],
    caseRows(data),
    [30, 24, 58, 34, 50],
  );
  writeSheet(
    workbook,
    'FAQ',
    'GOWE Knowledge Tables - FAQ',
    'Support answers prepared for snippets, sales enablement copy, and grounded blog briefs.',
    ['Question', 'Answer', 'Tags', 'Source URL'],
    faqRows(data),
    [34, 64, 34, 50],
  );
  writeSheet(
    workbook,
    'Sources',
    'GOWE Knowledge Tables - Sources',
    'Crawl source register used to connect generated records back to official GOWE pages.',
    ['Source ID', 'Type', 'Title', 'Summary', 'URL'],
    sourceRows(data),
    [30, 16, 32, 58, 50],
  );
  return workbook;
}

function buildCrawlWorkbook(Workbook, data) {
  const workbook = Workbook.create();
  const summarySheet = writeSheet(
    workbook,
    'Crawl Summary',
    'GOWE Website Crawl Summary',
    'High-level demo crawl inventory and generated asset counts.',
    ['Metric', 'Value', 'Notes'],
    [
      ['Generated At', new Date(data.generatedAt), 'Timestamp from local generation script.'],
      ['Website', data.website, 'Official GOWE source boundary.'],
      ['Products', data.products.length, 'Full product sitemap/fallback coverage.'],
      ['Services', data.services.length, 'Support and lifecycle service records.'],
      ['Solutions', data.solutions.length, 'Solution category records.'],
      ['Cases', data.cases.length, 'Selected project proof records.'],
      ['FAQ', data.faqs.length, 'Support answer records.'],
      ['Media Assets', data.mediaAssets.length, 'Filtered and locally cached official website images.'],
      ['File Assets', data.fileAssets.length, 'Generated local DOCX/XLSX assets.'],
      ['Crawl Sources', data.crawlSourceCount, 'Official pages, products, services, solutions, cases, FAQs, and seeds.'],
    ],
    [24, 28, 64],
  );
  summarySheet.getRange('B4').format.numberFormat = 'yyyy-mm-dd hh:mm';
  writeSheet(
    workbook,
    'Source Pages',
    'GOWE Source Pages',
    'Official GOWE URLs referenced by the demo knowledge base.',
    ['Source ID', 'Type', 'Title', 'Summary', 'URL'],
    sourceRows(data),
    [30, 16, 32, 58, 50],
  );
  writeSheet(
    workbook,
    'Media Assets',
    'GOWE Media Asset Register',
    'Image library with local paths, original image URLs, categories, and intended content use.',
    ['Title', 'Category', 'Tags', 'Usage', 'Local Path', 'Original Image URL', 'Source Page URL'],
    mediaRows(data),
    [32, 20, 32, 54, 50, 58, 50],
  );
  writeSheet(
    workbook,
    'File Assets',
    'GOWE Generated File Assets',
    'Local generated documents and workbook assets registered for Knowledge Assets.',
    ['Title', 'Format', 'Category', 'Description', 'Tags', 'Local Path'],
    fileRows(data),
    [34, 14, 22, 58, 34, 50],
  );
  return workbook;
}

const { SpreadsheetFile, Workbook } = await loadArtifactTool();
const data = JSON.parse(await fs.readFile(sourceDataPath, 'utf8'));

await saveWorkbook(
  SpreadsheetFile,
  buildKnowledgeWorkbook(Workbook, data),
  'GOWE Knowledge Tables.xlsx',
  'Products',
);
await saveWorkbook(
  SpreadsheetFile,
  buildCrawlWorkbook(Workbook, data),
  'GOWE Website Crawl Summary.xlsx',
  'Crawl Summary',
);
