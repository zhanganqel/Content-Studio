import { projectRegistryProjects } from './demo/projectRegistry.js';

// 顶部项目切换器读取这里的项目列表。
export const projects = projectRegistryProjects;

// 左侧导航按一级模块和二级入口分组。
export const navSections = [
  {
    id: 'brand-knowledge',
    items: [
      { id: 'brand-profile' },
      { id: 'audience-persona' },
      { id: 'knowledge-items' },
      { id: 'knowledge-assets' },
    ],
  },
  {
    id: 'site-builder',
    items: [
      { id: 'home-page' },
      { id: 'product-page' },
      { id: 'landing-page' },
      { id: 'blog-page' },
    ],
  },
  {
    id: 'content-factory',
    items: [
      { id: 'blog-article' },
      { id: 'social-post' },
      { id: 'video-ad' },
      { id: 'email-copy' },
    ],
  },
  {
    id: 'growth-dashboard',
    items: [
      { id: 'seo-traffic' },
      { id: 'ai-visibility' },
      { id: 'social-traffic' },
    ],
  },
];

// 全局搜索入口的范围选项。
export const searchScopes = ['project', 'file', 'content', 'knowledge'];

// 用户菜单只保存入口 ID，展示文案由 i18n 字典提供。
export const userMenuItems = [
  'switchAccount',
  'accountSettings',
  'notificationPreferences',
  'logout',
];
