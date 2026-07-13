// Vite 将本地图片转换为可在页面中访问的资源 URL。
const imageModules = import.meta.glob('../../../demo-data/rejin-cnc/assets/images/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
});

// Rejin CNC 的演示图片素材元数据。
const rawRejinCncAssetLibrary = [
  {
    id: 'brand-banner11-c5fc81d3',
    title: 'Banner11 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner11.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner11-c5fc81d3.webp'
  },
  {
    id: 'brand-banner4-4235aa6f',
    title: 'Banner4 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner4.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner4-4235aa6f.webp'
  },
  {
    id: 'brand-banner44-de9f0d69',
    title: 'Banner44 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner44.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner44-de9f0d69.webp'
  },
  {
    id: 'brand-banner444-9ae7dfad',
    title: 'Banner444 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner444.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner444-9ae7dfad.webp'
  },
  {
    id: 'brand-banner6-d3011345',
    title: 'Banner6 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner6.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner6-d3011345.webp'
  },
  {
    id: 'brand-banner7-5fa9161e',
    title: 'Banner7 Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/banner7.webp',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-banner7-5fa9161e.webp'
  },
  {
    id: 'brand-bicycle-mtb-cnc-machined-parts-0518ced5',
    title: 'Bicycle Mtb Cnc Machined Parts Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Bicycle-MTB-CNC-Machined-Parts.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-bicycle-mtb-cnc-machined-parts-0518ced5.jpg'
  },
  {
    id: 'brand-wheel-bearing-240e01dc',
    title: 'Wheel Bearing Brand Image',
    category: 'brand',
    tags: [
      'brand',
      'company',
      'capability',
      'cnc'
    ],
    usage: 'Use as brand or capability imagery for Rejin CNC overview content sourced from Home.',
    sourcePageUrl: 'https://www.rejincnc.com/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Wheel-Bearing.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/brand/brand-wheel-bearing-240e01dc.jpg'
  },
  {
    id: 'cases-case-1cbb908a',
    title: 'Automotive Stainless Steel Connector Assembly Image',
    category: 'cases',
    tags: [
      'case',
      'customer proof',
      'application',
      'cnc'
    ],
    usage: 'Use when supporting customer proof, case study, or application content related to Automotive Stainless Steel Connector Assembly.',
    sourcePageUrl: 'https://www.rejincnc.com/case/auto-parts-project-stainless-steel-connector-assembly-for-vehicle-fluid-systems/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/case.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/cases/cases-case-1cbb908a.jpg'
  },
  {
    id: 'materials-process-d8c2adb454a7e5b3c664443cdde0adac-edfcdc7c',
    title: 'CNC Metal iPad Hub and Dock Components Image',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/01/d8c2adb454a7e5b3c664443cdde0adac.png',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-d8c2adb454a7e5b3c664443cdde0adac-edfcdc7c.png'
  },
  {
    id: 'materials-process-stanzen-3d6f5195',
    title: 'CNC Metal iPad Hub and Dock Components Image 2',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/01/Stanzen.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-stanzen-3d6f5195.jpg'
  },
  {
    id: 'materials-process-robotic-arm-6c09d457',
    title: 'CNC Metal iPad Hub and Dock Components Image 3',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc',
      'robotics'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Robotic-arm.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-robotic-arm-6c09d457.jpg'
  },
  {
    id: 'materials-process-medical-devices-equipment-manufacturing-1-eb7a58ce',
    title: 'CNC Metal iPad Hub and Dock Components Image 4',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc',
      'medical'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Medical-Devices-Equipment-Manufacturing-1.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-medical-devices-equipment-manufacturing-1-eb7a58ce.jpg'
  },
  {
    id: 'materials-process-precision-cnc-machined-camera-gimbals-for-zero-vibrati',
    title: 'CNC Metal iPad Hub and Dock Components Image 5',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/06/Precision-CNC-Machined-Camera-Gimbals-for-Zero-Vibration-Aerial-Shots.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-precision-cnc-machined-camera-gimbals-for-zero-vibration-aerial-shots-0edfb892.jpg'
  },
  {
    id: 'materials-process-how-cnc-metal-parts-eliminate-high-end-audio-resonance',
    title: 'CNC Metal iPad Hub and Dock Components Image 6',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc',
      'audio'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/06/How-CNC-Metal-Parts-Eliminate-High-End-Audio-Resonance.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-how-cnc-metal-parts-eliminate-high-end-audio-resonance-d76132ed.jpg'
  },
  {
    id: 'materials-process-choosing-the-right-strategy-of-stamping-vs-machining-f',
    title: 'CNC Metal iPad Hub and Dock Components Image 7',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc',
      'sheet metal'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/06/Choosing-the-Right-Strategy-of-Stamping-vs.-Machining-for-High-Volume-Metal-Parts.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-choosing-the-right-strategy-of-stamping-vs-machining-for-high-volume-met-70237927.jpg'
  },
  {
    id: 'materials-process-custom-cnc-machining-for-automation-end-effectors-and-',
    title: 'CNC Metal iPad Hub and Dock Components Image 8',
    category: 'materials-process',
    tags: [
      'process',
      'materials',
      'finishing',
      'cnc'
    ],
    usage: 'Use when explaining materials, machining processes, finishing, or production capability related to CNC Metal iPad Hub and Dock Components.',
    sourcePageUrl: 'https://www.rejincnc.com/ipad-hub-manufacturer-cnc-metal-ipad-dock-expansion-hub/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2026/06/Custom-CNC-Machining-for-Automation-End-Effectors-and-Grippers.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/materials-process/materials-process-custom-cnc-machining-for-automation-end-effectors-and-grippers-d0f3ee54.jpg'
  },
  {
    id: 'products-audio-knob-3-2a84ef21',
    title: 'Custom CNC Audio Knobs Image',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'audio'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Custom CNC Audio Knobs.',
    sourcePageUrl: 'https://www.rejincnc.com/custom-cnc-turned-aluminum-audio-knob-6063-aluminum-knurled-anodized/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Audio-Knob-3.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-audio-knob-3-2a84ef21.jpg'
  },
  {
    id: 'products-audio-button-a912b5fa',
    title: 'Custom CNC Audio Knobs Image 2',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'audio'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Custom CNC Audio Knobs.',
    sourcePageUrl: 'https://www.rejincnc.com/custom-cnc-turned-aluminum-audio-knob-6063-aluminum-knurled-anodized/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Audio-Button.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-audio-button-a912b5fa.jpg'
  },
  {
    id: 'products-audio-button-1-b9685d79',
    title: 'Custom CNC Audio Knobs Image 3',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'audio'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Custom CNC Audio Knobs.',
    sourcePageUrl: 'https://www.rejincnc.com/custom-cnc-turned-aluminum-audio-knob-6063-aluminum-knurled-anodized/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Audio-Button-1.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-audio-button-1-b9685d79.jpg'
  },
  {
    id: 'products-cnc-precision-parts-96656879',
    title: 'Custom Fasteners Image',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'fasteners'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Custom Fasteners.',
    sourcePageUrl: 'https://www.rejincnc.com/custom-cnc-turned-nut-stud-brass-aluminum-stainless-steel-fasteners/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/CNC-precision-parts.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-cnc-precision-parts-96656879.jpg'
  },
  {
    id: 'products-cnc-mill-turn-machines-6f9ed491',
    title: 'Precision Coffee Machine Parts Image',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'coffee equipment'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Precision Coffee Machine Parts.',
    sourcePageUrl: 'https://www.rejincnc.com/cnc-coffee-machine-parts-manufacturer-precision-coffee-equipment-components/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/CNC-Mill-Turn-Machines.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-cnc-mill-turn-machines-6f9ed491.jpg'
  },
  {
    id: 'products-cooling-pipe-milling-process-6ba0fc7d',
    title: 'Precision Coffee Machine Parts Image 2',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'milling',
      'coffee equipment'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Precision Coffee Machine Parts.',
    sourcePageUrl: 'https://www.rejincnc.com/cnc-coffee-machine-parts-manufacturer-precision-coffee-equipment-components/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Cooling-Pipe-Milling-Process.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-cooling-pipe-milling-process-6ba0fc7d.jpg'
  },
  {
    id: 'products-industrial-5-axis-cnc-2-fcfd0606',
    title: 'Precision Coffee Machine Parts Image 3',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'coffee equipment'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about Precision Coffee Machine Parts.',
    sourcePageUrl: 'https://www.rejincnc.com/cnc-coffee-machine-parts-manufacturer-precision-coffee-equipment-components/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Industrial-5-Axis-CNC-2.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-industrial-5-axis-cnc-2-fcfd0606.jpg'
  },
  {
    id: 'products-aerospace-uav-components-1-601d56cd',
    title: 'UAV Structural Parts Image',
    category: 'products',
    tags: [
      'product',
      'component',
      'application',
      'cnc',
      'uav'
    ],
    usage: 'Use when creating product pages, blog sections, or social posts about UAV Structural Parts.',
    sourcePageUrl: 'https://www.rejincnc.com/precision-cnc-machined-aluminum-stainless-steel-uav-structural-parts-aerospace-components/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Aerospace-UAV-Components-1.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/products/products-aerospace-uav-components-1-601d56cd.jpg'
  },
  {
    id: 'services-service-5-axis-cnc-machining-aerospace-components-7463c9fa',
    title: '5-Axis CNC Machining Image',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc',
      'uav'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to 5-Axis CNC Machining.',
    sourcePageUrl: 'https://www.rejincnc.com/service/5-axis-cnc-machining/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/service-5-axis-cnc-machining-aerospace-components.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-5-axis-cnc-machining-aerospace-components-7463c9fa.jpg'
  },
  {
    id: 'services-service-cnc-milling-precision-machining-751753f5',
    title: 'CNC Milling Image',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc',
      'milling'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to CNC Milling.',
    sourcePageUrl: 'https://www.rejincnc.com/service/cnc-milling/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/service-cnc-milling-precision-machining.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-cnc-milling-precision-machining-751753f5.jpg'
  },
  {
    id: 'services-service-3c87e755',
    title: 'CNC Turning Image',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc',
      'turning'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to CNC Turning.',
    sourcePageUrl: 'https://www.rejincnc.com/service/cnc-turning/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Service.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-3c87e755.jpg'
  },
  {
    id: 'services-service-cnc-turning-precision-lathe-parts-1069486e',
    title: 'CNC Turning Image 2',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc',
      'turning'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to CNC Turning.',
    sourcePageUrl: 'https://www.rejincnc.com/service/cnc-turning/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/service-cnc-turning-precision-lathe-parts.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-cnc-turning-precision-lathe-parts-1069486e.jpg'
  },
  {
    id: 'services-service-cnc-turning-precision-lathe-parts-300x200-76cb4f0c',
    title: 'CNC Turning Image 3',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc',
      'turning'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to CNC Turning.',
    sourcePageUrl: 'https://www.rejincnc.com/service/cnc-turning/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/service-cnc-turning-precision-lathe-parts-300x200.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-cnc-turning-precision-lathe-parts-300x200-76cb4f0c.jpg'
  },
  {
    id: 'services-fai-testing-3a527496',
    title: 'Precision Prototyping for Hardware Startups Image',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to Precision Prototyping for Hardware Startups.',
    sourcePageUrl: 'https://www.rejincnc.com/service/support-dfm-service/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/FAI-testing.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-fai-testing-3a527496.jpg'
  },
  {
    id: 'services-inspection-services-57682531',
    title: 'Precision Prototyping for Hardware Startups Image 2',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to Precision Prototyping for Hardware Startups.',
    sourcePageUrl: 'https://www.rejincnc.com/service/support-dfm-service/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/Inspection-Services.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-inspection-services-57682531.jpg'
  },
  {
    id: 'services-service-dfm-design-for-manufacturability-63c21c85',
    title: 'Precision Prototyping for Hardware Startups Image 3',
    category: 'services',
    tags: [
      'service',
      'manufacturing',
      'capability',
      'cnc'
    ],
    usage: 'Use when introducing Rejin CNC service capabilities related to Precision Prototyping for Hardware Startups.',
    sourcePageUrl: 'https://www.rejincnc.com/service/support-dfm-service/',
    originalImageUrl: 'https://www.rejincnc.com/wp-content/uploads/2025/12/service-dfm-design-for-manufacturability.jpg',
    localPath: 'demo-data/rejin-cnc/assets/images/services/services-service-dfm-design-for-manufacturability-63c21c85.jpg'
  }
];

function resolveImageUrl(localPath) {
  // 优先使用构建后的资源 URL，缺失时保留原路径便于排查。
  const moduleKey = `../../../${localPath}`;
  return imageModules[moduleKey] ?? localPath;
}

// 页面和 AI 创作流程读取的图片素材库。
export const rejinCncAssetLibrary = rawRejinCncAssetLibrary.map((asset) => ({
  ...asset,
  imageUrl: resolveImageUrl(asset.localPath),
}));
