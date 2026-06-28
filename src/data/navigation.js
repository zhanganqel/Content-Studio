import { rejinCncProject } from './demo/rejinCncProject.js';

export const projects = [
  {
    id: rejinCncProject.id,
    name: rejinCncProject.name,
    description: rejinCncProject.description,
    demoProject: rejinCncProject,
  },
  {
    id: 'aero-parts',
    name: 'Aero Precision Parts',
    description: 'Demo project placeholder for aerospace machining solutions.',
  },
  {
    id: 'nova-tools',
    name: 'Nova Tools Export',
    description: 'Demo project placeholder for overseas tool brand marketing.',
  },
];

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

export const searchScopes = ['project', 'file', 'content', 'knowledge'];

export const userMenuItems = [
  'switchAccount',
  'accountSettings',
  'notificationPreferences',
  'logout',
];
