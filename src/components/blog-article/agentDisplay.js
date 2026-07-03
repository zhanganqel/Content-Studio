const agentRoleConfig = {
  researcher: {
    initial: 'R',
    names: {
      'zh-CN': '项目研究专家',
      'en-US': 'Researcher',
    },
    avatarClassName: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
  },
  strategist: {
    initial: 'S',
    names: {
      'zh-CN': 'SEO策略专家',
      'en-US': 'SEO Strategist',
    },
    avatarClassName: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
  },
  writer: {
    initial: 'W',
    names: {
      'zh-CN': '内容运营专员',
      'en-US': 'Content Writer',
    },
    avatarClassName: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]',
  },
  optimizer: {
    initial: 'O',
    names: {
      'zh-CN': '内容评估专家',
      'en-US': 'Optimizer',
    },
    avatarClassName: 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
  },
  user: {
    initial: 'U',
    names: {
      'zh-CN': '用户',
      'en-US': 'User',
    },
    avatarClassName: 'border-[#DDE3F0] bg-[#F7F8FB] text-[#606266]',
  },
};

function getAgentRole(agentTitle = '') {
  if (agentTitle.includes('用户') || /\buser\b/i.test(agentTitle)) return 'user';
  if (agentTitle.includes('SEO') || /strategist/i.test(agentTitle)) return 'strategist';
  if (agentTitle.includes('评估') || /optimizer/i.test(agentTitle)) return 'optimizer';
  if (agentTitle.includes('内容运营') || /writer/i.test(agentTitle)) return 'writer';
  if (agentTitle.includes('项目研究') || agentTitle.includes('行业研究') || /researcher/i.test(agentTitle)) {
    return 'researcher';
  }

  return 'writer';
}

export function getAgentDisplay(agentTitle, locale = 'zh-CN') {
  const role = getAgentRole(agentTitle);
  const config = agentRoleConfig[role];

  return {
    avatarClassName: config.avatarClassName,
    initial: config.initial,
    name: config.names[locale] ?? config.names['zh-CN'],
    role,
  };
}
