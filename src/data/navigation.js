import { projectRegistryProjects } from './demo/projectRegistry.js';

// 顶部项目切换器读取这里的项目列表。
export const projects = projectRegistryProjects;

// 左侧导航按一级模块和二级入口分组。
export const navSections = [
  {
    id: 'brand-knowledge',
    items: [
      { id: 'brand-profile', available: true },
      { id: 'audience-persona', available: true },
      { id: 'knowledge-items', available: true },
      { id: 'knowledge-assets', available: true },
    ],
  },
  {
    id: 'site-builder',
    items: [
      { id: 'navigation-structure', available: false },
      { id: 'page-management', available: false },
      { id: 'brand-component-library', available: false },
    ],
  },
  {
    id: 'content-factory',
    items: [
      { id: 'blog-article', available: true },
      { id: 'social-post', available: false },
      { id: 'video-ad', available: true },
      { id: 'email-copy', available: false },
    ],
  },
  {
    id: 'growth-dashboard',
    items: [
      { id: 'seo-traffic', available: false },
      { id: 'ai-visibility', available: false },
      { id: 'social-traffic', available: false },
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
