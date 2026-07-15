import { goweGroupProject } from './goweGroupProject.js';
import { rejinCncProject } from './rejinCncProject.js';

// 可直接加载完整演示数据的项目注册表。
export const demoProjectRegistry = {
  [rejinCncProject.id]: rejinCncProject,
  [goweGroupProject.id]: goweGroupProject,
};

// 占位项目只用于展示项目切换器，不包含完整 demo 数据。
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

// 项目切换器使用的扁平项目列表。
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
  // 根据项目 ID 获取完整演示项目。
  return demoProjectRegistry[projectId] ?? null;
}

export function hasDemoProject(projectId) {
  // 判断项目是否具备可运行的演示数据。
  return Boolean(getDemoProject(projectId));
}
