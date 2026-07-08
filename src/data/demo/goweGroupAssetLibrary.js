const imageModules = import.meta.glob('../../../demo-data/gowe-group/assets/images/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
});

const rawGoweGroupAssetLibrary = [
  {
    "id": "brand-beijing1-1b42d95e",
    "title": "GOWE Beijing Office Image",
    "category": "brand",
    "tags": [
      "brand",
      "company",
      "global capability"
    ],
    "usage": "Use as brand or company capability imagery for GOWE overview content sourced from GOWE Beijing Office.",
    "sourcePageUrl": "https://www.gowe-group.com/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/BEIJING1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/brand/brand-beijing1-1b42d95e.jpg"
  },
  {
    "id": "brand-gowebanner51-fdba4453",
    "title": "GOWE Brand Banner Image",
    "category": "brand",
    "tags": [
      "brand",
      "company",
      "global capability"
    ],
    "usage": "Use as brand or company capability imagery for GOWE overview content sourced from GOWE Brand Banner.",
    "sourcePageUrl": "https://www.gowe-group.com/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/10/GOWEbanner51.jpg",
    "localPath": "demo-data/gowe-group/assets/images/brand/brand-gowebanner51-fdba4453.jpg"
  },
  {
    "id": "brand-biaoti-1-6ce897d6",
    "title": "GOWE Company Title Image",
    "category": "brand",
    "tags": [
      "brand",
      "company",
      "global capability"
    ],
    "usage": "Use as brand or company capability imagery for GOWE overview content sourced from GOWE Company Title.",
    "sourcePageUrl": "https://www.gowe-group.com/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/biaoti-1.png",
    "localPath": "demo-data/gowe-group/assets/images/brand/brand-biaoti-1-6ce897d6.png"
  },
  {
    "id": "brand-map4-4-4bc95356",
    "title": "GOWE Global Map Image",
    "category": "brand",
    "tags": [
      "brand",
      "company",
      "global capability"
    ],
    "usage": "Use as brand or company capability imagery for GOWE overview content sourced from GOWE Global Map.",
    "sourcePageUrl": "https://www.gowe-group.com/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/map4_4.jpg",
    "localPath": "demo-data/gowe-group/assets/images/brand/brand-map4-4-4bc95356.jpg"
  },
  {
    "id": "cases-british-drop-forged-board-retaining-coupler-1-81e6f55c",
    "title": "Board Retaining Coupler Project Reference Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "scaffolding"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Board Retaining Coupler Project Reference.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/British-Drop-Forged-Board-Retaining-Coupler-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-british-drop-forged-board-retaining-coupler-1-81e6f55c.jpg"
  },
  {
    "id": "cases-application-bridge-construction-ac5c8708",
    "title": "Bridge Construction Application Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "bridge"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Bridge Construction Application.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/application-bridge-construction.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-application-bridge-construction-ac5c8708.jpg"
  },
  {
    "id": "cases-bridge-tunnel-series-85a04977",
    "title": "Bridge Tunnel Project Category Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "bridge",
      "tunnel"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Bridge Tunnel Project Category.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Bridge-Tunnel-Series.png",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-bridge-tunnel-series-85a04977.png"
  },
  {
    "id": "cases-complex-terrain-or-special-engineering-104d1ca2",
    "title": "Complex Terrain Engineering Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Complex Terrain Engineering.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Complex-terrain-or-special-engineering.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-complex-terrain-or-special-engineering-104d1ca2.jpg"
  },
  {
    "id": "cases-formwork-144ca2da",
    "title": "Formwork Project Category Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "formwork"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Formwork Project Category.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/formwork.png",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-formwork-144ca2da.png"
  },
  {
    "id": "cases-frame-scaffold-1-3bf1af5a",
    "title": "Frame Scaffold Project Reference Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "scaffolding"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Frame Scaffold Project Reference.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Frame-Scaffold-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-frame-scaffold-1-3bf1af5a.jpg"
  },
  {
    "id": "cases-map6-6-bd26830b",
    "title": "Overseas Project Map Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Overseas Project Map.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/map6_6.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-map6-6-bd26830b.jpg"
  },
  {
    "id": "cases-home-01-e2-80-93-remons-e2-80-93-car-rental-elementor-template-kit",
    "title": "Project Reference Overview Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "formwork"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Project Reference Overview.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/Home-01-%E2%80%93-Remons-%E2%80%93-Car-Rental-Elementor-Template-Kit.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-home-01-e2-80-93-remons-e2-80-93-car-rental-elementor-template-kit-5f269e66.jpg"
  },
  {
    "id": "cases-jiuwei1-16bbbf0e",
    "title": "Project Site Reference Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Project Site Reference.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/jiuwei1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-jiuwei1-16bbbf0e.jpg"
  },
  {
    "id": "cases-residential-building-38abc112",
    "title": "Residential Building Project Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Residential Building Project.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Residential-Building.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-residential-building-38abc112.jpg"
  },
  {
    "id": "cases-scaffolding-plank-gowe-e4d28949",
    "title": "Scaffolding Plank Project Reference Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "scaffolding"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Scaffolding Plank Project Reference.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/scaffolding-plank-gowe.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-scaffolding-plank-gowe-e4d28949.jpg"
  },
  {
    "id": "cases-scaffolding-1b70329b",
    "title": "Scaffolding Project Category Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "scaffolding"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Scaffolding Project Category.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/01/scaffolding.png",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-scaffolding-1b70329b.png"
  },
  {
    "id": "cases-steel-structure-series-0e786442",
    "title": "Steel Structure Project Category Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application",
      "steel structure"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Steel Structure Project Category.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Steel-Structure-Series.png",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-steel-structure-series-0e786442.png"
  },
  {
    "id": "cases-urban-viaducts-and-railway-transportation-929c23c5",
    "title": "Urban Viaducts and Railway Transportation Image",
    "category": "cases",
    "tags": [
      "case",
      "project proof",
      "construction application"
    ],
    "usage": "Use when supporting customer proof, project references, or industry case content related to Urban Viaducts and Railway Transportation.",
    "sourcePageUrl": "https://www.gowe-group.com/project/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Urban-Viaducts-and-Railway-Transportation.jpg",
    "localPath": "demo-data/gowe-group/assets/images/cases/cases-urban-viaducts-and-railway-transportation-929c23c5.jpg"
  },
  {
    "id": "materials-process-aluminium-formwork-cost-factors-contractors-should-com",
    "title": "Aluminium Formwork Cost Factors Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Aluminium Formwork Cost Factors.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/Aluminium-Formwork-Cost-Factors-Contractors-Should-Compare-First.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-aluminium-formwork-cost-factors-contractors-should-compare-first-358a1d0b.jpg"
  },
  {
    "id": "materials-process-aluminium-formwork-suppliers-key-checks-before-placing",
    "title": "Aluminium Formwork Supplier Checks Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Aluminium Formwork Supplier Checks.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/Aluminium-Formwork-Suppliers-Key-Checks-Before-Placing-an-Order.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-aluminium-formwork-suppliers-key-checks-before-placing-an-order-d93435a1.jpg"
  },
  {
    "id": "materials-process-the-role-of-formwork-in-ensuring-concrete-structure-qu",
    "title": "Concrete Structure Quality Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding",
      "steel structure"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Concrete Structure Quality.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/The-Role-of-Formwork-in-Ensuring-Concrete-Structure-Quality.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-the-role-of-formwork-in-ensuring-concrete-structure-quality-0e2a7206.jpg"
  },
  {
    "id": "materials-process-cross-brace-wholesale-5767f73f",
    "title": "Cross Brace Wholesale Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Cross Brace Wholesale.",
    "sourcePageUrl": "https://www.gowe-group.com/product/frame-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/cross-brace-wholesale.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-cross-brace-wholesale-5767f73f.jpg"
  },
  {
    "id": "materials-process-gowe-frame-scaffolding-factory-ceb58da0",
    "title": "Frame Scaffolding Factory Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Frame Scaffolding Factory.",
    "sourcePageUrl": "https://www.gowe-group.com/product/frame-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/GOWE-frame-scaffolding-factory.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-gowe-frame-scaffolding-factory-ceb58da0.jpg"
  },
  {
    "id": "materials-process-frame-scaffolding-wholesale-4eba1e5b",
    "title": "Frame Scaffolding Wholesale Process Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Frame Scaffolding Wholesale Process.",
    "sourcePageUrl": "https://www.gowe-group.com/product/frame-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Frame-scaffolding-wholesale.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-frame-scaffolding-wholesale-4eba1e5b.jpg"
  },
  {
    "id": "materials-process-gowe-scaffolding-formwork1-983b32c2",
    "title": "GOWE Scaffolding and Formwork Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to GOWE Scaffolding and Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/Gowe-Scaffolding-Formwork1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-gowe-scaffolding-formwork1-983b32c2.jpg"
  },
  {
    "id": "materials-process-gowe-scaffolding-system-bridge-construction-1-5e30ddbf",
    "title": "GOWE Scaffolding Bridge Construction Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding",
      "bridge"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to GOWE Scaffolding Bridge Construction.",
    "sourcePageUrl": "https://www.gowe-group.com/product/ringlock-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Gowe-scaffolding-system-bridge-construction-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-gowe-scaffolding-system-bridge-construction-1-5e30ddbf.jpg"
  },
  {
    "id": "materials-process-gowe-scaffolding-system-application-1-7631edd8",
    "title": "GOWE Scaffolding System Application Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to GOWE Scaffolding System Application.",
    "sourcePageUrl": "https://www.gowe-group.com/product/ringlock-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-scaffolding-system-Application-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-gowe-scaffolding-system-application-1-7631edd8.jpg"
  },
  {
    "id": "materials-process-comparing-ladders-and-scaffolding-which-is-safer-and-m",
    "title": "Ladders and Scaffolding Guide Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Ladders and Scaffolding Guide.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/Comparing-Ladders-and-Scaffolding-Which-is-Safer-and-More-Efficient.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-comparing-ladders-and-scaffolding-which-is-safer-and-more-efficient-0590f0ae.jpg"
  },
  {
    "id": "materials-process-mobile-scaffold-solutions-how-to-choose-the-right-one-",
    "title": "Mobile Scaffold Selection Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Mobile Scaffold Selection.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/Mobile-Scaffold-Solutions-How-to-Choose-the-Right-One-for-Your-Project.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-mobile-scaffold-solutions-how-to-choose-the-right-one-for-your-project-07888e1d.jpg"
  },
  {
    "id": "materials-process-ringlock-scaffolding-gowe-8bd080bc",
    "title": "Ringlock Scaffolding System Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Ringlock Scaffolding System.",
    "sourcePageUrl": "https://www.gowe-group.com/product/ringlock-scaffolding/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/ringlock-scaffolding-GOWE.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-ringlock-scaffolding-gowe-8bd080bc.jpg"
  },
  {
    "id": "materials-process-comprehensive-guide-to-scaffolding-in-2026-safety-type",
    "title": "Scaffolding Safety Guide Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Scaffolding Safety Guide.",
    "sourcePageUrl": "https://www.gowe-group.com/news/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2026/06/Comprehensive-Guide-to-Scaffolding-in-2026-Safety-Types-and-Best-Practices-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-comprehensive-guide-to-scaffolding-in-2026-safety-types-and-best-practic-5764eb4a.jpg"
  },
  {
    "id": "materials-process-gowe-steel-prop-wholesale-eac0da06",
    "title": "Steel Prop Wholesale Image",
    "category": "materials-process",
    "tags": [
      "process",
      "steel",
      "formwork",
      "scaffolding",
      "steel structure"
    ],
    "usage": "Use when explaining construction systems, steel structures, scaffolding, formwork, or site process capability related to Steel Prop Wholesale.",
    "sourcePageUrl": "https://www.gowe-group.com/product/steel-prop/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/gowe-steel-prop-wholesale.jpg",
    "localPath": "demo-data/gowe-group/assets/images/materials-process/materials-process-gowe-steel-prop-wholesale-eac0da06.jpg"
  },
  {
    "id": "products-gowe-aluminium-formwork-system-2-4ce85970",
    "title": "Aluminium Formwork System Detail Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Aluminium Formwork System Detail.",
    "sourcePageUrl": "https://www.gowe-group.com/product/aluminium-formwork-system/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-aluminium-formwork-system-2.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-aluminium-formwork-system-2-4ce85970.jpg"
  },
  {
    "id": "products-gowe-aluminium-formwork-system-1-4830aeac",
    "title": "Aluminium Formwork System Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Aluminium Formwork System.",
    "sourcePageUrl": "https://www.gowe-group.com/product/aluminium-formwork-system/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/GOWE-aluminium-formwork-system-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-aluminium-formwork-system-1-4830aeac.jpg"
  },
  {
    "id": "products-cantilever-formwork-gowe-643f0b3e",
    "title": "Cantilever Formwork Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Cantilever Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/product/cantilever-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Cantilever-Formwork-GOWE.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-cantilever-formwork-gowe-643f0b3e.jpg"
  },
  {
    "id": "products-gowe-flying-formwork-2-d706621f",
    "title": "Flying Formwork Detail Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Flying Formwork Detail.",
    "sourcePageUrl": "https://www.gowe-group.com/product/table-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-2.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-flying-formwork-2-d706621f.jpg"
  },
  {
    "id": "products-gowe-flying-formwork-1-735218cf",
    "title": "Flying Formwork Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Flying Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/product/table-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-flying-formwork-1-735218cf.jpg"
  },
  {
    "id": "products-gowe-flying-formwork-3-a6971edf",
    "title": "Flying Formwork Site View Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Flying Formwork Site View.",
    "sourcePageUrl": "https://www.gowe-group.com/product/table-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-FLYING-FORMWORK-3.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-flying-formwork-3-a6971edf.jpg"
  },
  {
    "id": "products-gowe-hanging-basket-formwork-beam-launcher-778c1936",
    "title": "Hanging Basket Formwork Beam Launcher Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Hanging Basket Formwork Beam Launcher.",
    "sourcePageUrl": "https://www.gowe-group.com/product/hanging-basket-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Hanging-Basket-Formwork-Beam-Launcher.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-hanging-basket-formwork-beam-launcher-778c1936.jpg"
  },
  {
    "id": "products-gowe-hanging-basket-formwork-0575e7f4",
    "title": "Hanging Basket Formwork Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Hanging Basket Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/product/hanging-basket-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Hanging-Basket-Formwork.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-hanging-basket-formwork-0575e7f4.jpg"
  },
  {
    "id": "products-gowe-high-strength-stainless-steel-formwork-system-2-1a5e3579",
    "title": "High Strength Stainless Steel Formwork Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork",
      "steel structure"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about High Strength Stainless Steel Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/product/high-strength-stainless-steel-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-High-Strength-Stainless-Steel-Formwork-System-2.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-high-strength-stainless-steel-formwork-system-2-1a5e3579.jpg"
  },
  {
    "id": "products-scaffolding-steel-tube-1-c2e32685",
    "title": "Scaffolding Steel Tube Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "scaffolding",
      "steel structure"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Scaffolding Steel Tube.",
    "sourcePageUrl": "https://www.gowe-group.com/product/scaffolding-tube/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Scaffolding-Steel-Tube-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-scaffolding-steel-tube-1-c2e32685.jpg"
  },
  {
    "id": "products-gowe-steel-prop-768x768-897367f0",
    "title": "Steel Prop Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "scaffolding",
      "steel structure"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Steel Prop.",
    "sourcePageUrl": "https://www.gowe-group.com/product/steel-prop/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/gowe-steel-prop-768x768.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-steel-prop-768x768-897367f0.jpg"
  },
  {
    "id": "products-gowe-timber-beams-h20-7-7935cfb2",
    "title": "Timber Beams H20 Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Timber Beams H20.",
    "sourcePageUrl": "https://www.gowe-group.com/product/timber-beam-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Timber-Beams-H20-7.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-timber-beams-h20-7-7935cfb2.jpg"
  },
  {
    "id": "products-gowe-waterproof-membraneinstallation-trolley-05e61236",
    "title": "Waterproof Membrane Installation Trolley Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Waterproof Membrane Installation Trolley.",
    "sourcePageUrl": "https://www.gowe-group.com/product/tunnel-equipments/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/GOWE-Waterproof-MembraneInstallation-Trolley.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-gowe-waterproof-membraneinstallation-trolley-05e61236.jpg"
  },
  {
    "id": "products-wind-power-hydropower-formwork-dbcb4c95",
    "title": "Wind Power and Hydropower Formwork Image",
    "category": "products",
    "tags": [
      "product",
      "construction system",
      "equipment",
      "formwork"
    ],
    "usage": "Use when creating product pages, category sections, or product-led posts about Wind Power and Hydropower Formwork.",
    "sourcePageUrl": "https://www.gowe-group.com/product/wind-power-hydropower-formwork/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Wind-Power-Hydropower-Formwork.jpg",
    "localPath": "demo-data/gowe-group/assets/images/products/products-wind-power-hydropower-formwork-dbcb4c95.jpg"
  },
  {
    "id": "services-aluminium-formwork-for-salerental-gowe-79e9a7a3",
    "title": "Aluminium Formwork Rental Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "formwork"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Aluminium Formwork Rental Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/03/Aluminium-Formwork-for-salerental-GOWE.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-aluminium-formwork-for-salerental-gowe-79e9a7a3.jpg"
  },
  {
    "id": "services-aluminum-flying-formwork-3-4c637acb",
    "title": "Aluminum Flying Formwork Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "formwork"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Aluminum Flying Formwork Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Aluminum-Flying-Formwork-3.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-aluminum-flying-formwork-3-4c637acb.jpg"
  },
  {
    "id": "services-about1-7b0e76f6",
    "title": "Construction Technical Guidance Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Construction Technical Guidance.",
    "sourcePageUrl": "https://www.gowe-group.com/about-us/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/about1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-about1-7b0e76f6.jpg"
  },
  {
    "id": "services-hanging-basket-formwork-2-b07088cf",
    "title": "Hanging Basket Formwork Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "formwork"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Hanging Basket Formwork Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Hanging-Basket-Formwork-2.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-hanging-basket-formwork-2-b07088cf.jpg"
  },
  {
    "id": "services-high-rise-frame-structure-0ca38efc",
    "title": "High-Rise Frame Structure Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "steel structure"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to High-Rise Frame Structure.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/High-rise-frame-structure.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-high-rise-frame-structure-0ca38efc.jpg"
  },
  {
    "id": "services-industrial-building-97dd4889",
    "title": "Industrial Building Application Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Industrial Building Application.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/Industrial-Building.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-industrial-building-97dd4889.jpg"
  },
  {
    "id": "services-multistory-frame-structure-7dc06813",
    "title": "Multistory Frame Structure Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "steel structure"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Multistory Frame Structure.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/Multistory-frame-structure.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-multistory-frame-structure-7dc06813.jpg"
  },
  {
    "id": "services-pier-formwork-1-e5590a6e",
    "title": "Pier Formwork Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "formwork",
      "bridge"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Pier Formwork Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Pier-Formwork-1.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-pier-formwork-1-e5590a6e.jpg"
  },
  {
    "id": "services-protection-platform-ca351ea6",
    "title": "Protection Platform Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "protection platform"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Protection Platform Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/protection-platform.png",
    "localPath": "demo-data/gowe-group/assets/images/services/services-protection-platform-ca351ea6.png"
  },
  {
    "id": "services-public-building-e327382d",
    "title": "Public Building Application Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Public Building Application.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/Public-Building.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-public-building-e327382d.jpg"
  },
  {
    "id": "services-residential-building-bb5726a2",
    "title": "Residential Building Application Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Residential Building Application.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/02/Residential-Building.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-residential-building-bb5726a2.jpg"
  },
  {
    "id": "services-self-climbing-system-gowe-application-commercial-buildings-671c",
    "title": "Self Climbing Commercial Buildings Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "protection platform"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Self Climbing Commercial Buildings.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/self-climbing-system-gowe-application-Commercial-Buildings.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-self-climbing-system-gowe-application-commercial-buildings-671c5a09.jpg"
  },
  {
    "id": "services-self-climbing-application-public-buildings-39b70b08",
    "title": "Self Climbing Public Buildings Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "protection platform"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Self Climbing Public Buildings.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/04/self-climbing-application-public-buildings.jpg",
    "localPath": "demo-data/gowe-group/assets/images/services/services-self-climbing-application-public-buildings-39b70b08.jpg"
  },
  {
    "id": "services-single-sided-support-formwork-system-gowe-f4cc86ec",
    "title": "Single-Sided Support Formwork Solution Image",
    "category": "services",
    "tags": [
      "service",
      "solution",
      "engineering support",
      "formwork"
    ],
    "usage": "Use when introducing GOWE lifecycle support, engineering service, or solution content related to Single-Sided Support Formwork Solution.",
    "sourcePageUrl": "https://www.gowe-group.com/solution/",
    "originalImageUrl": "https://www.gowe-group.com/wp-content/uploads/2025/05/Single-sided-Support-Formwork-System-GOWE.png",
    "localPath": "demo-data/gowe-group/assets/images/services/services-single-sided-support-formwork-system-gowe-f4cc86ec.png"
  }
];

function resolveImageUrl(localPath) {
  const moduleKey = `../../../${localPath}`;
  return imageModules[moduleKey] ?? localPath;
}

export const goweGroupAssetLibrary = rawGoweGroupAssetLibrary.map((asset) => ({
  ...asset,
  imageUrl: resolveImageUrl(asset.localPath),
}));
