import { goweGroupProject } from './goweGroupProject.js';
import { rejinCncProject } from './rejinCncProject.js';

export const demoProjectRegistry = {
  [rejinCncProject.id]: rejinCncProject,
  [goweGroupProject.id]: goweGroupProject,
};

export const placeholderProjects = [
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

export const projectRegistryProjects = [
  {
    id: rejinCncProject.id,
    name: rejinCncProject.name,
    description: rejinCncProject.description,
    demoProject: rejinCncProject,
  },
  {
    id: goweGroupProject.id,
    name: goweGroupProject.name,
    description: goweGroupProject.description,
    demoProject: goweGroupProject,
  },
  ...placeholderProjects,
];

export function getDemoProject(projectId) {
  return demoProjectRegistry[projectId] ?? null;
}

export function hasDemoProject(projectId) {
  return Boolean(getDemoProject(projectId));
}
