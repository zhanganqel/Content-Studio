export const defaultLocale = 'zh-CN';

export const locales = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
];

export const messages = {
  'zh-CN': {
    navSections: {
      'brand-knowledge': {
        title: '品牌知识',
        description: '沉淀品牌、受众与资料',
      },
      'site-builder': {
        title: '站点建设',
        description: '生成官网、产品页与落地页',
      },
      'content-factory': {
        title: '内容工厂',
        description: '批量生产多渠道营销内容',
      },
      'growth-dashboard': {
        title: '数据看板',
        description: '追踪搜索、AI 与社媒流量',
      },
    },
    navItems: {
      'brand-profile': '品牌档案',
      'audience-persona': '受众画像',
      'knowledge-items': '知识条目',
      'knowledge-assets': '知识资料',
      'home-page': '独立站首页',
      'product-page': '产品页',
      'landing-page': '落地页',
      'blog-page': '博客页',
      'blog-article': '博客文章',
      'social-post': '图文帖子',
      'video-ad': '视频/广告',
      'email-copy': '邮件文案',
      'seo-traffic': 'SEO流量',
      'ai-visibility': 'AI搜索可见性',
      'social-traffic': '社媒流量',
    },
    searchScopes: {
      project: '项目',
      file: '文件',
      content: '内容',
      knowledge: '知识库',
    },
    userMenu: {
      switchAccount: '切换账号',
      accountSettings: '账号设置',
      notificationPreferences: '通知偏好',
      logout: '退出登录',
    },
    settings: {
      entry: '设置',
      title: '设置',
      interfaceLanguage: '界面语言',
    },
    topbar: {
      searchPlaceholder: '请输入搜索关键词',
    },
    mainContent: {
      welcomeTitle: '欢迎使用 Content Studio',
      welcomeBody: '请从左侧展开一级模块并选择二级模块，开始搭建外贸营销内容工作台。',
      itemPlaceholder: ({ sectionTitle, itemTitle }) =>
        `${sectionTitle} / ${itemTitle} 页面内容将在这里接入。`,
    },
  },
  'en-US': {
    navSections: {
      'brand-knowledge': {
        title: 'Brand Knowledge',
        description: 'Store brand, audience, and source materials',
      },
      'site-builder': {
        title: 'Site Builder',
        description: 'Generate home, product, landing, and blog pages',
      },
      'content-factory': {
        title: 'Content Factory',
        description: 'Create multi-channel marketing content',
      },
      'growth-dashboard': {
        title: 'Growth Dashboard',
        description: 'Track SEO, AI visibility, and social traffic',
      },
    },
    navItems: {
      'brand-profile': 'Brand Profile',
      'audience-persona': 'Audience Personas',
      'knowledge-items': 'Knowledge Items',
      'knowledge-assets': 'Knowledge Assets',
      'home-page': 'Homepage',
      'product-page': 'Product Page',
      'landing-page': 'Landing Page',
      'blog-page': 'Blog Page',
      'blog-article': 'Blog Article',
      'social-post': 'Social Post',
      'video-ad': 'Video / Ad',
      'email-copy': 'Email Copy',
      'seo-traffic': 'SEO Traffic',
      'ai-visibility': 'AI Search Visibility',
      'social-traffic': 'Social Traffic',
    },
    searchScopes: {
      project: 'Project',
      file: 'File',
      content: 'Content',
      knowledge: 'Knowledge',
    },
    userMenu: {
      switchAccount: 'Switch Account',
      accountSettings: 'Account Settings',
      notificationPreferences: 'Notification Preferences',
      logout: 'Log Out',
    },
    settings: {
      entry: 'Settings',
      title: 'Settings',
      interfaceLanguage: 'Interface Language',
    },
    topbar: {
      searchPlaceholder: 'Search files, content, knowledge...',
    },
    mainContent: {
      welcomeTitle: 'Welcome to Content Studio',
      welcomeBody:
        'Expand a primary module on the left and choose a secondary module to start building the export marketing workspace.',
      itemPlaceholder: ({ sectionTitle, itemTitle }) =>
        `${sectionTitle} / ${itemTitle} content will be connected here.`,
    },
  },
};
