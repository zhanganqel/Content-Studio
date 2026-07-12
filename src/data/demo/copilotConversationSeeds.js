export const copilotDemoSeedVersion = 1;

const rejinConversationIds = {
  article: 'rejin-cnc-demo-conv-article',
  cluster: 'rejin-cnc-demo-conv-keywords',
  planning: 'rejin-cnc-demo-conv-planning',
};

const rejinArtifactIds = {
  draft: 'rejin-cnc-demo-artifact-draft',
  keyword: 'rejin-cnc-demo-artifact-keywords',
  outline: 'rejin-cnc-demo-artifact-outline',
  revision: 'rejin-cnc-demo-artifact-revision',
};

const rejinMessageIds = {
  articleAssistantDraft: 'rejin-cnc-demo-message-article-assistant-draft',
  articleAssistantOutline: 'rejin-cnc-demo-message-article-assistant-outline',
  articleAssistantRevision: 'rejin-cnc-demo-message-article-assistant-revision',
  articleUserDraft: 'rejin-cnc-demo-message-article-user-draft',
  articleUserOutline: 'rejin-cnc-demo-message-article-user-outline',
  articleUserRevision: 'rejin-cnc-demo-message-article-user-revision',
  clusterAssistant: 'rejin-cnc-demo-message-cluster-assistant',
  clusterUser: 'rejin-cnc-demo-message-cluster-user',
  planningAssistantOne: 'rejin-cnc-demo-message-planning-assistant-one',
  planningAssistantTwo: 'rejin-cnc-demo-message-planning-assistant-two',
  planningUserOne: 'rejin-cnc-demo-message-planning-user-one',
  planningUserTwo: 'rejin-cnc-demo-message-planning-user-two',
};

const rejinSeed = {
  artifacts: [
    {
      content: JSON.stringify({
        estimatedTotalWords: 1800,
        sections: [
          {
            estimatedWords: 220,
            heading: '1. Turning vs. Milling: The Core Difference',
            keyPoints: ['How the workpiece and cutting tool move', 'Typical geometries produced by each process'],
          },
          {
            estimatedWords: 360,
            heading: '2. When CNC Turning Is the Better Choice',
            keyPoints: ['Cylindrical parts and concentric features', 'Cycle-time advantages for rotational components'],
          },
          {
            estimatedWords: 360,
            heading: '3. When CNC Milling Is the Better Choice',
            keyPoints: ['Prismatic and multi-face geometries', 'Slots, pockets, complex surfaces, and multi-axis work'],
          },
          {
            estimatedWords: 420,
            heading: '4. A Practical Selection Framework',
            keyPoints: ['Geometry, tolerance, material, quantity, and budget', 'When mill-turn machining should be evaluated'],
          },
          {
            estimatedWords: 260,
            heading: '5. Questions to Ask a Machining Supplier',
            keyPoints: ['DFM review, inspection, secondary processes, and lead time', 'Information to include in an RFQ package'],
          },
          {
            estimatedWords: 180,
            heading: 'Conclusion',
            keyPoints: ['Summarize the decision logic', 'Invite readers to request a manufacturing review'],
          },
        ],
        summary: 'A decision-focused article structure that helps overseas engineering and sourcing teams choose between CNC turning and milling.',
        title: 'CNC Turning vs. Milling: How to Choose the Right Process',
        tone: 'Professional, practical, and engineering-focused',
      }, null, 2),
      contentFormat: 'json',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:12:00.000Z',
      id: rejinArtifactIds.outline,
      metadata: { estimatedWords: 1800, language: 'en-US' },
      sourceIds: ['rejin-cnc-demo-source-turning', 'rejin-cnc-demo-source-milling'],
      sourceMessageId: rejinMessageIds.articleAssistantOutline,
      status: 'ready',
      summary: 'A six-part comparison and process-selection framework for engineering buyers.',
      taskType: 'outline',
      title: 'CNC Turning vs. Milling Article Outline',
      type: 'outline',
      updatedAt: '2026-07-11T01:12:00.000Z',
    },
    {
      content: `# CNC Turning vs. Milling: How to Choose the Right Process

Choosing between CNC turning and CNC milling is not simply a question of which machine is more advanced. The right process depends on part geometry, tolerance requirements, material, production quantity, and the secondary operations needed after machining.

## The Core Difference

In CNC turning, the workpiece rotates while a stationary cutting tool removes material. This makes turning particularly efficient for shafts, pins, bushings, threaded components, and other parts built around a central axis. CNC milling works in the opposite way: the cutting tool rotates while the workpiece remains fixed or moves along several axes.

## When CNC Turning Works Best

Turning is usually the first process to evaluate when a component is predominantly cylindrical. It can create outside and inside diameters, grooves, tapers, threads, and facing features in a continuous setup. For suitable geometries, this can reduce cycle time and help maintain concentricity between critical features.

## When CNC Milling Works Best

Milling is better suited to flat faces, pockets, slots, hole patterns, irregular contours, and parts requiring machining from several directions. Three-axis machining covers many standard industrial components, while four-axis and five-axis strategies can reduce setups for more complex geometries.

## A Practical Selection Framework

Start with the dominant geometry, then review tolerance, surface finish, material machinability, annual quantity, and inspection requirements. Some parts require both processes. A mill-turn machine or a planned turning-plus-milling route may be more efficient than forcing the complete design into a single operation.

## Information to Include in Your RFQ

Provide 2D drawings, 3D models, material specifications, tolerance requirements, surface-finish expectations, estimated quantity, and any inspection documentation required. A complete RFQ allows the supplier to recommend the process rather than quote from incomplete assumptions.

## Conclusion

CNC turning is generally strongest for rotational components, while CNC milling offers greater flexibility for prismatic and multi-face parts. The best result comes from evaluating the complete manufacturing route early and using DFM feedback before the design is released for production.`,
      contentFormat: 'markdown',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:18:00.000Z',
      evidenceGaps: ['Confirm any project-specific tolerance examples before publication.', 'Add verified lead-time data if the final article includes delivery claims.'],
      id: rejinArtifactIds.draft,
      metadata: { estimatedWords: 620, language: 'en-US', tone: 'engineering-focused' },
      sourceIds: ['rejin-cnc-demo-source-turning', 'rejin-cnc-demo-source-milling'],
      sourceMessageId: rejinMessageIds.articleAssistantDraft,
      status: 'ready',
      summary: 'A practical English draft comparing turning and milling for engineering and sourcing teams.',
      taskType: 'article_draft',
      title: 'CNC Turning vs. Milling: How to Choose the Right Process',
      type: 'draft',
      updatedAt: '2026-07-11T01:18:00.000Z',
    },
    {
      changedSections: ['Introduction', 'A Practical Selection Framework'],
      changeSummary: 'Shortened the opening and converted the selection section into a faster five-factor decision checklist.',
      content: `# CNC Turning vs. Milling: How to Choose the Right Process

The right CNC process depends on geometry, tolerance, material, quantity, and the operations required after machining. Turning and milling solve different manufacturing problems, and many components benefit from a planned combination of both.

## The Core Difference

In CNC turning, the workpiece rotates while a stationary cutting tool removes material. This makes turning efficient for shafts, pins, bushings, threaded components, and other parts built around a central axis. In CNC milling, the cutting tool rotates and approaches a fixed workpiece from one or more directions.

## When CNC Turning Works Best

Evaluate turning first when a component is predominantly cylindrical. It can produce outside and inside diameters, grooves, tapers, threads, and facing features while maintaining relationships between concentric features.

## When CNC Milling Works Best

Milling is better suited to flat faces, pockets, slots, hole patterns, irregular contours, and multi-face parts. Four-axis and five-axis strategies can reduce setups when geometry becomes more complex.

## Five Factors for Choosing the Process

1. **Geometry:** rotational parts favor turning; prismatic parts favor milling.
2. **Tolerance:** review which features must remain concentric or aligned across faces.
3. **Material:** account for machinability, tool wear, and thermal behavior.
4. **Quantity:** compare setup time and cycle time against the expected volume.
5. **Secondary work:** include finishing, inspection, assembly, and combined turning-milling operations.

## Information to Include in Your RFQ

Provide 2D drawings, 3D models, material specifications, tolerances, finishes, quantities, and inspection requirements. A complete RFQ helps the supplier recommend the most efficient manufacturing route.

## Conclusion

Turning is generally strongest for rotational components, while milling offers greater flexibility for prismatic and multi-face parts. Early DFM feedback helps confirm whether one process or a combined route is the better choice.`,
      contentFormat: 'markdown',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:24:00.000Z',
      evidenceGaps: ['Add verified company-specific examples before publication.'],
      id: rejinArtifactIds.revision,
      metadata: { language: 'en-US', tone: 'concise engineering guidance' },
      parentArtifactId: rejinArtifactIds.draft,
      sourceIds: ['rejin-cnc-demo-source-turning', 'rejin-cnc-demo-source-milling'],
      sourceMessageId: rejinMessageIds.articleAssistantRevision,
      status: 'ready',
      summary: 'A shorter revision with a scannable five-factor selection checklist.',
      taskType: 'section_revision',
      title: 'CNC Turning vs. Milling: Concise Revision',
      type: 'draft',
      updatedAt: '2026-07-11T01:24:00.000Z',
    },
    {
      content: `## Strategic angle
Position 5-axis CNC machining as a setup-reduction and geometry-access solution rather than simply a premium machine category.

## Commercial-intent keywords
- 5 axis CNC machining service
- custom 5 axis machined parts
- 5 axis CNC machining supplier
- precision 5 axis machining company

## Informational keywords
- what is 5 axis CNC machining
- 3 axis vs 5 axis CNC machining
- benefits of 5 axis machining
- when to use 5 axis machining

## Long-tail opportunities
- 5 axis CNC machining for aerospace components
- low volume 5 axis CNC machining service
- complex aluminum parts 5 axis machining
- 5 axis machining tolerance considerations

## Suggested content cluster
1. Pillar page: 5-Axis CNC Machining Services
2. Comparison: 3-Axis vs. 5-Axis CNC Machining
3. Application guide: Complex Aerospace and Automation Components
4. Buyer guide: Information Required for a 5-Axis Machining RFQ`,
      contentFormat: 'markdown',
      conversationId: rejinConversationIds.cluster,
      createdAt: '2026-07-11T00:40:00.000Z',
      id: rejinArtifactIds.keyword,
      metadata: { language: 'en-US', keywordCount: 12 },
      sourceIds: [],
      sourceMessageId: rejinMessageIds.clusterAssistant,
      status: 'ready',
      summary: 'A grouped keyword strategy and four-page cluster for 5-axis machining services.',
      taskType: 'keyword_strategy',
      title: '5-Axis CNC Machining Keyword Strategy',
      type: 'keyword_strategy',
      updatedAt: '2026-07-11T00:40:00.000Z',
    },
  ],
  conversations: [
    {
      artifactIds: [rejinArtifactIds.revision, rejinArtifactIds.draft, rejinArtifactIds.outline],
      createdAt: '2026-07-11T01:08:00.000Z',
      id: rejinConversationIds.article,
      messageIds: [
        rejinMessageIds.articleUserOutline,
        rejinMessageIds.articleAssistantOutline,
        rejinMessageIds.articleUserDraft,
        rejinMessageIds.articleAssistantDraft,
        rejinMessageIds.articleUserRevision,
        rejinMessageIds.articleAssistantRevision,
      ],
      pinned: true,
      projectId: 'rejin-cnc',
      threadId: '',
      title: 'CNC Turning vs. Milling 文章创作',
      updatedAt: '2026-07-11T01:24:00.000Z',
    },
    {
      artifactIds: [rejinArtifactIds.keyword],
      createdAt: '2026-07-11T00:36:00.000Z',
      id: rejinConversationIds.cluster,
      messageIds: [rejinMessageIds.clusterUser, rejinMessageIds.clusterAssistant],
      pinned: false,
      projectId: 'rejin-cnc',
      threadId: '',
      title: '5轴 CNC 加工关键词集群',
      updatedAt: '2026-07-11T00:40:00.000Z',
    },
    {
      artifactIds: [],
      createdAt: '2026-07-10T08:20:00.000Z',
      id: rejinConversationIds.planning,
      messageIds: [
        rejinMessageIds.planningUserOne,
        rejinMessageIds.planningAssistantOne,
        rejinMessageIds.planningUserTwo,
        rejinMessageIds.planningAssistantTwo,
      ],
      pinned: false,
      projectId: 'rejin-cnc',
      threadId: '',
      title: 'CNC 服务落地页内容规划',
      updatedAt: '2026-07-10T08:34:00.000Z',
    },
  ],
  messages: [
    {
      content: '请为海外工程师和采购经理规划一篇 CNC Turning vs. Milling 对比文章，重点帮助他们判断项目应该选哪种工艺。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:08:00.000Z',
      id: rejinMessageIds.articleUserOutline,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'content_operator',
      artifactIds: [rejinArtifactIds.outline],
      content: '已生成《CNC Turning vs. Milling Article Outline》，点击产物卡查看。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:12:00.000Z',
      id: rejinMessageIds.articleAssistantOutline,
      intent: 'outline',
      role: 'assistant',
      sourceIds: ['rejin-cnc-demo-source-turning', 'rejin-cnc-demo-source-milling'],
      status: 'done',
    },
    {
      content: '基于这个大纲生成英文文章草稿。语气专业、工程导向，避免夸张宣传。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:14:00.000Z',
      id: rejinMessageIds.articleUserDraft,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'content_operator',
      artifactIds: [rejinArtifactIds.draft],
      content: '已生成《CNC Turning vs. Milling: How to Choose the Right Process》，点击产物卡查看。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:18:00.000Z',
      id: rejinMessageIds.articleAssistantDraft,
      intent: 'draft',
      role: 'assistant',
      sourceIds: ['rejin-cnc-demo-source-turning', 'rejin-cnc-demo-source-milling'],
      status: 'done',
    },
    {
      content: '把开头缩短一些，并把工艺选择部分改成更容易扫描的决策清单。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:21:00.000Z',
      id: rejinMessageIds.articleUserRevision,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'content_operator',
      artifactIds: [rejinArtifactIds.revision],
      content: '已生成《CNC Turning vs. Milling: Concise Revision》，点击产物卡查看。',
      conversationId: rejinConversationIds.article,
      createdAt: '2026-07-11T01:24:00.000Z',
      id: rejinMessageIds.articleAssistantRevision,
      intent: 'section_revision',
      role: 'assistant',
      status: 'done',
    },
    {
      content: '生成 5-axis CNC machining 的英文关键词策略，按商业意图、信息意图和长尾词分组，并建议内容集群。',
      conversationId: rejinConversationIds.cluster,
      createdAt: '2026-07-11T00:36:00.000Z',
      id: rejinMessageIds.clusterUser,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'seo_strategist',
      artifactIds: [rejinArtifactIds.keyword],
      content: '已生成《5-Axis CNC Machining Keyword Strategy》，点击产物卡查看。',
      conversationId: rejinConversationIds.cluster,
      createdAt: '2026-07-11T00:40:00.000Z',
      id: rejinMessageIds.clusterAssistant,
      intent: 'keywords',
      role: 'assistant',
      status: 'done',
    },
    {
      content: '我们准备重做 CNC machining services 落地页，应该如何组织信息，才能同时服务工程师和采购经理？',
      conversationId: rejinConversationIds.planning,
      createdAt: '2026-07-10T08:20:00.000Z',
      id: rejinMessageIds.planningUserOne,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'copilot',
      content: '建议使用双层信息结构：首屏先回答采购经理最关心的能力范围、质量体系、交付流程和询价入口；随后用材料、设备、典型公差、表面处理和检测能力满足工程师的技术判断。页面中段可以加入“上传图纸—DFM 评审—报价—生产—检验—交付”的流程，让两类受众都能快速理解合作方式。',
      conversationId: rejinConversationIds.planning,
      createdAt: '2026-07-10T08:24:00.000Z',
      id: rejinMessageIds.planningAssistantOne,
      intent: 'reply',
      role: 'assistant',
      status: 'done',
    },
    {
      content: '首屏应该避免哪些常见问题？',
      conversationId: rejinConversationIds.planning,
      createdAt: '2026-07-10T08:30:00.000Z',
      id: rejinMessageIds.planningUserTwo,
      role: 'user',
      status: 'done',
    },
    {
      agentId: 'copilot',
      content: '避免只写“高质量、低价格、快速交付”这类无法验证的泛化口号。首屏标题应明确服务类别和目标客户，辅助文案说明可处理的工艺或项目类型，主按钮使用“上传图纸获取报价”之类的具体动作。认证、材料、公差或交期数字只有在已核验时才展示。',
      conversationId: rejinConversationIds.planning,
      createdAt: '2026-07-10T08:34:00.000Z',
      id: rejinMessageIds.planningAssistantTwo,
      intent: 'reply',
      role: 'assistant',
      status: 'done',
    },
  ],
  runs: [
    { conversationId: rejinConversationIds.article, endedAt: '2026-07-11T01:12:00.000Z', id: 'rejin-cnc-demo-run-outline', startedAt: '2026-07-11T01:08:00.000Z', status: 'done' },
    { conversationId: rejinConversationIds.article, endedAt: '2026-07-11T01:18:00.000Z', id: 'rejin-cnc-demo-run-draft', startedAt: '2026-07-11T01:14:00.000Z', status: 'done' },
    { conversationId: rejinConversationIds.article, endedAt: '2026-07-11T01:24:00.000Z', id: 'rejin-cnc-demo-run-revision', startedAt: '2026-07-11T01:21:00.000Z', status: 'done' },
    { conversationId: rejinConversationIds.cluster, endedAt: '2026-07-11T00:40:00.000Z', id: 'rejin-cnc-demo-run-keywords', startedAt: '2026-07-11T00:36:00.000Z', status: 'done' },
  ],
  sources: [
    {
      conversationId: rejinConversationIds.article,
      id: 'rejin-cnc-demo-source-turning',
      originId: 'service-cnc-turning',
      snippet: 'CNC turning service information used to demonstrate source cards and article provenance.',
      title: 'CNC Turning Service',
      type: 'demo_reference',
      url: 'https://www.rejincnc.com/service/cnc-turning/',
    },
    {
      conversationId: rejinConversationIds.article,
      id: 'rejin-cnc-demo-source-milling',
      originId: 'service-cnc-milling',
      snippet: 'CNC milling service information used to demonstrate source cards and article provenance.',
      title: 'CNC Milling Service',
      type: 'demo_reference',
      url: 'https://www.rejincnc.com/service/cnc-milling/',
    },
  ],
};

const goweConversationIds = {
  article: 'gowe-group-demo-conv-article',
  cluster: 'gowe-group-demo-conv-keywords',
  planning: 'gowe-group-demo-conv-planning',
};

const goweArtifactIds = {
  draft: 'gowe-group-demo-artifact-draft',
  keyword: 'gowe-group-demo-artifact-keywords',
  outline: 'gowe-group-demo-artifact-outline',
};

const goweSeed = {
  artifacts: [
    {
      content: JSON.stringify({
        estimatedTotalWords: 1600,
        sections: [
          { estimatedWords: 220, heading: '1. What Is Ringlock Scaffolding?', keyPoints: ['Core components', 'Modular connection principle'] },
          { estimatedWords: 320, heading: '2. Main Advantages on Complex Projects', keyPoints: ['Flexible geometry', 'Efficient assembly planning', 'Load-path considerations'] },
          { estimatedWords: 380, heading: '3. Selection and Engineering Checks', keyPoints: ['Project loads and dimensions', 'Material and compliance documentation', 'Access and protection requirements'] },
          { estimatedWords: 360, heading: '4. Supplier Evaluation Checklist', keyPoints: ['Engineering support', 'Manufacturing consistency', 'Inspection and logistics'] },
          { estimatedWords: 200, heading: '5. RFQ Information', keyPoints: ['Drawings, quantities, standards, schedule, and destination'] },
          { estimatedWords: 120, heading: 'Conclusion', keyPoints: ['Select a system around project requirements rather than price alone'] },
        ],
        summary: 'A buyer-focused guide covering ringlock scaffolding fundamentals, engineering checks, and supplier evaluation.',
        title: 'How to Choose a Ringlock Scaffolding System for Complex Projects',
        tone: 'Professional and project-oriented',
      }, null, 2),
      contentFormat: 'json',
      conversationId: goweConversationIds.article,
      createdAt: '2026-07-11T00:05:00.000Z',
      id: goweArtifactIds.outline,
      metadata: { estimatedWords: 1600, language: 'en-US' },
      sourceIds: ['gowe-group-demo-source-ringlock'],
      sourceMessageId: 'gowe-group-demo-message-article-assistant-outline',
      status: 'ready',
      summary: 'A structured buyer guide for evaluating ringlock scaffolding systems and suppliers.',
      title: 'Ringlock Scaffolding Buyer Guide Outline',
      type: 'outline',
      updatedAt: '2026-07-11T00:05:00.000Z',
    },
    {
      content: `# How to Choose a Ringlock Scaffolding System for Complex Projects

Ringlock scaffolding is widely considered for projects that require modular access, adaptable layouts, and repeatable assembly. Selecting a system, however, requires more than comparing component prices. Project geometry, design loads, applicable standards, erection planning, worker access, protection requirements, and logistics all affect the final solution.

## Understand the System

A ringlock system typically combines vertical standards, horizontal ledgers, diagonal braces, base components, platforms, and accessories. The rosette connection allows members to meet at several angles, which helps the system adapt to irregular structures and changing elevations.

## Define Project Requirements First

Before requesting a quotation, prepare drawings or dimensions, expected loads, working heights, access points, platform requirements, project schedule, destination, and applicable standards. This allows suppliers to evaluate the system configuration rather than quote isolated components.

## Review Engineering and Documentation

Confirm what calculations, drawings, material records, inspection documents, and installation guidance are available. Requirements vary by market and project type, so documentation should be reviewed against the actual contract rather than treated as a generic certificate checklist.

## Evaluate Manufacturing and Logistics

Consistent dimensions, connection quality, surface treatment, packaging, and component identification affect both assembly and reuse. For overseas projects, container planning and phased delivery can be as important as unit price.

## Supplier Checklist

- Can the supplier review project drawings and quantities?
- Are system configurations and accessories clearly documented?
- What inspection records accompany the shipment?
- How are replacement components and future additions handled?
- Can packaging and delivery be planned around the project schedule?

## Conclusion

A suitable ringlock scaffolding solution starts with project requirements and engineering review. Comparing complete system support, documentation, manufacturing consistency, and logistics provides a more reliable basis than comparing component prices alone.`,
      contentFormat: 'markdown',
      conversationId: goweConversationIds.article,
      createdAt: '2026-07-11T00:12:00.000Z',
      evidenceGaps: ['Confirm project-specific standards and load values before publishing numerical examples.'],
      id: goweArtifactIds.draft,
      metadata: { estimatedWords: 480, language: 'en-US', tone: 'project-oriented' },
      sourceIds: ['gowe-group-demo-source-ringlock'],
      sourceMessageId: 'gowe-group-demo-message-article-assistant-draft',
      status: 'ready',
      summary: 'An English buyer guide focused on engineering requirements, supplier checks, and overseas logistics.',
      taskType: 'article_draft',
      title: 'How to Choose a Ringlock Scaffolding System',
      type: 'draft',
      updatedAt: '2026-07-11T00:12:00.000Z',
    },
    {
      content: `## Commercial-intent keywords
- aluminium formwork system supplier
- aluminium formwork manufacturer
- aluminium formwork for high rise buildings
- custom aluminium formwork solution

## Informational keywords
- aluminium formwork advantages and disadvantages
- aluminium formwork construction process
- aluminium formwork vs timber formwork
- how to calculate aluminium formwork quantity

## Decision-stage questions
- What drawings are required for an aluminium formwork quotation?
- How should contractors compare reuse cycles and total project cost?
- Which accessories and on-site services should be included?

## Recommended cluster
1. Aluminium Formwork System pillar page
2. Aluminium vs. Timber Formwork comparison
3. High-Rise Project Planning Guide
4. RFQ Drawing and Quantity Checklist`,
      contentFormat: 'markdown',
      conversationId: goweConversationIds.cluster,
      createdAt: '2026-07-10T09:48:00.000Z',
      id: goweArtifactIds.keyword,
      metadata: { language: 'en-US', keywordCount: 8 },
      sourceIds: [],
      sourceMessageId: 'gowe-group-demo-message-keyword-assistant',
      status: 'ready',
      summary: 'Commercial and informational keyword groups for an aluminium formwork content cluster.',
      taskType: 'keyword_strategy',
      title: 'Aluminium Formwork Keyword Strategy',
      type: 'keyword_strategy',
      updatedAt: '2026-07-10T09:48:00.000Z',
    },
  ],
  conversations: [
    {
      artifactIds: [goweArtifactIds.draft, goweArtifactIds.outline],
      createdAt: '2026-07-10T23:58:00.000Z',
      id: goweConversationIds.article,
      messageIds: [
        'gowe-group-demo-message-article-user-outline',
        'gowe-group-demo-message-article-assistant-outline',
        'gowe-group-demo-message-article-user-draft',
        'gowe-group-demo-message-article-assistant-draft',
      ],
      pinned: true,
      projectId: 'gowe-group',
      threadId: '',
      title: 'Ringlock Scaffolding 买家指南',
      updatedAt: '2026-07-11T00:12:00.000Z',
    },
    {
      artifactIds: [goweArtifactIds.keyword],
      createdAt: '2026-07-10T09:43:00.000Z',
      id: goweConversationIds.cluster,
      messageIds: ['gowe-group-demo-message-keyword-user', 'gowe-group-demo-message-keyword-assistant'],
      pinned: false,
      projectId: 'gowe-group',
      threadId: '',
      title: 'Aluminium Formwork 关键词策略',
      updatedAt: '2026-07-10T09:48:00.000Z',
    },
    {
      artifactIds: [],
      createdAt: '2026-07-09T06:10:00.000Z',
      id: goweConversationIds.planning,
      messageIds: [
        'gowe-group-demo-message-planning-user-one',
        'gowe-group-demo-message-planning-assistant-one',
        'gowe-group-demo-message-planning-user-two',
        'gowe-group-demo-message-planning-assistant-two',
      ],
      pinned: false,
      projectId: 'gowe-group',
      threadId: '',
      title: '海外工程案例内容规划',
      updatedAt: '2026-07-09T06:24:00.000Z',
    },
  ],
  messages: [
    { content: '规划一篇面向海外承包商的 Ringlock Scaffolding 买家指南，重点覆盖工程条件、供应商评估和询价资料。', conversationId: goweConversationIds.article, createdAt: '2026-07-10T23:58:00.000Z', id: 'gowe-group-demo-message-article-user-outline', role: 'user', status: 'done' },
    { agentId: 'content_operator', artifactIds: [goweArtifactIds.outline], content: '已生成《Ringlock Scaffolding Buyer Guide Outline》，点击产物卡查看。', conversationId: goweConversationIds.article, createdAt: '2026-07-11T00:05:00.000Z', id: 'gowe-group-demo-message-article-assistant-outline', intent: 'outline', role: 'assistant', sourceIds: ['gowe-group-demo-source-ringlock'], status: 'done' },
    { content: '基于大纲写成英文草稿，避免给出未经项目核验的载荷、标准和复用次数。', conversationId: goweConversationIds.article, createdAt: '2026-07-11T00:07:00.000Z', id: 'gowe-group-demo-message-article-user-draft', role: 'user', status: 'done' },
    { agentId: 'content_operator', artifactIds: [goweArtifactIds.draft], content: '已生成《How to Choose a Ringlock Scaffolding System》，点击产物卡查看。', conversationId: goweConversationIds.article, createdAt: '2026-07-11T00:12:00.000Z', id: 'gowe-group-demo-message-article-assistant-draft', intent: 'draft', role: 'assistant', sourceIds: ['gowe-group-demo-source-ringlock'], status: 'done' },
    { content: '生成 aluminium formwork 的英文关键词策略，区分商业意图、信息意图和决策阶段问题。', conversationId: goweConversationIds.cluster, createdAt: '2026-07-10T09:43:00.000Z', id: 'gowe-group-demo-message-keyword-user', role: 'user', status: 'done' },
    { agentId: 'seo_strategist', artifactIds: [goweArtifactIds.keyword], content: '已生成《Aluminium Formwork Keyword Strategy》，点击产物卡查看。', conversationId: goweConversationIds.cluster, createdAt: '2026-07-10T09:48:00.000Z', id: 'gowe-group-demo-message-keyword-assistant', intent: 'keywords', role: 'assistant', status: 'done' },
    { content: '海外工程案例页面应该重点展示哪些信息，才能同时支持 SEO 和销售沟通？', conversationId: goweConversationIds.planning, createdAt: '2026-07-09T06:10:00.000Z', id: 'gowe-group-demo-message-planning-user-one', role: 'user', status: 'done' },
    { agentId: 'copilot', content: '建议围绕项目类型、国家或地区、施工难点、采用的系统、服务范围和可验证结果组织内容。SEO 需要清晰的项目主题与产品关联，销售则需要看到供应范围、协作过程和解决的问题。没有经过验证的工期、节省比例或载荷数据不要写成确定事实。', conversationId: goweConversationIds.planning, createdAt: '2026-07-09T06:16:00.000Z', id: 'gowe-group-demo-message-planning-assistant-one', intent: 'reply', role: 'assistant', status: 'done' },
    { content: '如果暂时没有完整项目数据，页面还能先做什么？', conversationId: goweConversationIds.planning, createdAt: '2026-07-09T06:20:00.000Z', id: 'gowe-group-demo-message-planning-user-two', role: 'user', status: 'done' },
    { agentId: 'copilot', content: '可以先建立结构化案例模板，明确需要业务团队补充的字段，并发布经过确认的项目背景、系统类别和服务范围。无法确认的指标保留为内部待办，不在公开页面中使用。这样既能推进内容建设，也不会用推测填补证据缺口。', conversationId: goweConversationIds.planning, createdAt: '2026-07-09T06:24:00.000Z', id: 'gowe-group-demo-message-planning-assistant-two', intent: 'reply', role: 'assistant', status: 'done' },
  ],
  runs: [
    { conversationId: goweConversationIds.article, endedAt: '2026-07-11T00:05:00.000Z', id: 'gowe-group-demo-run-outline', startedAt: '2026-07-10T23:58:00.000Z', status: 'done' },
    { conversationId: goweConversationIds.article, endedAt: '2026-07-11T00:12:00.000Z', id: 'gowe-group-demo-run-draft', startedAt: '2026-07-11T00:07:00.000Z', status: 'done' },
    { conversationId: goweConversationIds.cluster, endedAt: '2026-07-10T09:48:00.000Z', id: 'gowe-group-demo-run-keywords', startedAt: '2026-07-10T09:43:00.000Z', status: 'done' },
  ],
  sources: [
    {
      conversationId: goweConversationIds.article,
      id: 'gowe-group-demo-source-ringlock',
      originId: 'product-ringlock-scaffolding',
      snippet: 'Ringlock scaffolding product information used to demonstrate source cards and article provenance.',
      title: 'GOWE Ringlock Scaffolding',
      type: 'demo_reference',
      url: 'https://www.gowe-group.com/product/ringlock-scaffolding/',
    },
  ],
};

const seedByProject = {
  'gowe-group': goweSeed,
  'rejin-cnc': rejinSeed,
};

export function getCopilotConversationSeed(projectId) {
  const seed = seedByProject[projectId];
  return seed ? JSON.parse(JSON.stringify(seed)) : null;
}
