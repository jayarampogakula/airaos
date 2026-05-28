import { Tenant, Agent, Contact, Deal, Conversation, Appointment, Workflow, KnowledgeSource, KbChunk, SystemMetrics, BillingLimit } from './types';

export const mockTenants: Tenant[] = [
  {
    id: 't-1',
    name: 'Smile Dental Clinic',
    domain: 'smile-dental.gatidesk.com',
    plan: 'Growth',
    status: 'active',
    logo: '🦷',
    primaryColor: '#0ea5e9', // Sky blue
    secondaryColor: '#0f172a', // Slate dark
    emailTemplates: {
      welcome: 'Hello {contact_name}, welcome to Smile Dental! We have set up your profile.',
      escalation: 'Alert: Conversation with {contact_name} has been escalated to support staff.'
    }
  },
  {
    id: 't-2',
    name: 'Apex Heights Real Estate',
    domain: 'apexheights.co',
    plan: 'Enterprise',
    status: 'active',
    logo: '🏢',
    primaryColor: '#8b5cf6', // Violet
    secondaryColor: '#0f172a',
    emailTemplates: {
      welcome: 'Hi {contact_name}, thank you for reaching out to Apex Heights! Your sales assistant Marcus will assist you.',
      escalation: 'Immediate Attention: Lead {contact_name} is requesting pricing for Premium Penthouse.'
    }
  },
  {
    id: 't-3',
    name: 'ByteTech Software Solutions',
    domain: 'support.bytetech.io',
    plan: 'Scale',
    status: 'active',
    logo: '💻',
    primaryColor: '#10b981', // Emerald green
    secondaryColor: '#0f172a',
    emailTemplates: {
      welcome: 'Hi {contact_name}, your support request has been logged. Let us solve it!',
      escalation: 'Escalation Alert: Technical support issue reported by {contact_name}.'
    }
  }
];

export const mockAgents: Agent[] = [
  {
    id: 'a-1',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    voice: 'Echo (US Female, warm)',
    language: 'English',
    personality: 'Professional, articulate, welcoming, and extremely organized. Core business receptionist.',
    department: 'Reception',
    prompt: 'You are Sarah, the AI Office Receptionist and Lead Coordinator. Your main job is to answer generic business FAQs, explain company operations, check staff availability, qualify leads, and book, reschedule, or cancel consulting appointments.\n\nKeep answers polite, professional, and relatively short. Always confirm details (name, phone number, date/time) before scheduling a slot in the Calendar Scheduler.\n\nIf the visitor describes severe operational failures or demands human interaction immediately, flag that you are transferring them to a human manager.',
    workingHours: { start: '09:00', end: '18:00' },
    status: 'online',
    tools: ['Book Appointment', 'Check Availability', 'Update CRM Contact', 'Send WhatsApp Confirmation'],
    knowledgeSources: ['Company Overview.pdf', 'Standard FAQ.txt'],
    escalationRules: 'Escalate if customer reports critical issue or demands human interaction twice.'
  },
  {
    id: 'a-2',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    voice: 'Alloy (US Male, energetic)',
    language: 'English',
    personality: 'Charismatic, persuasive, and highly responsive. Focused on sales and lead capture.',
    department: 'Sales',
    prompt: 'You are Marcus, the AI Sales Executive. Your goal is to capture customer contact details, qualify their business needs, explain product catalog features, and book sales demo sessions.\n\nCapture name and email before scheduling. Once captured, book a calendar slot for a private consultation with our human representatives.',
    workingHours: { start: '08:00', end: '20:00' },
    status: 'online',
    tools: ['Create CRM Lead', 'Book Property Tour', 'Send Brochure PDF'],
    knowledgeSources: ['Product Catalog.pdf', 'Pricing Guide.csv'],
    escalationRules: 'Escalate when lead specifies a budget above $100k or requests custom finance terms.'
  },
  {
    id: 'a-3',
    name: 'Chloe',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    voice: 'Nova (UK Female, calm)',
    language: 'English & Spanish',
    personality: 'Patient, analytical, highly technical, and reassuring.',
    department: 'Support',
    prompt: 'You are Chloe, the AI Technical Support Analyst. You diagnose user bugs, search the doc databases for resolution guides, explain troubleshooting steps, and create support tickets in the CRM when issues are unresolved.\n\nAsk troubleshooting questions one by one. If unresolved, create a support ticket and assure the user that engineering is looking into it.',
    workingHours: { start: '00:00', end: '23:59' }, // 24/7
    status: 'online',
    tools: ['Create Support Ticket', 'Search Docs Database', 'Reset User Password API'],
    knowledgeSources: ['Technical Guide.pdf', 'System FAQ.txt'],
    escalationRules: 'Escalate immediately if user reports database downtime or billing leakage.'
  },
  {
    id: 'a-4',
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    voice: 'Fable (British Male, clear)',
    language: 'English',
    personality: 'Direct, polite, precise with numbers, and compliance-focused.',
    department: 'Billing',
    prompt: 'You are Alex, the AI Accounts & Billing Specialist. You explain subscription structures, tier pricing, invoice details, handle credit card failure issues, and generate payment links via Stripe.\n\nBe very secure with numbers. Always verify customer identity (email code verification) before showing billing data.',
    workingHours: { start: '09:00', end: '17:00' },
    status: 'offline',
    tools: ['Generate Invoice Link', 'Check Invoice Status', 'Request Refund Request'],
    knowledgeSources: ['Billing Policy.txt', 'Standard Price Sheets.pdf'],
    escalationRules: 'Escalate if client requests custom invoice discounts or refund amounts over $500.'
  }
];

export const mockContacts: Contact[] = [
  {
    id: 'c-101',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    phone: '+1 (555) 019-2834',
    company: 'Individual',
    tags: ['Patient', 'New Lead'],
    notes: ['Inquired about teeth whitening procedures.', 'Prefers afternoon appointments.'],
    createdAt: '2026-05-18T10:30:00Z',
    city: 'New York',
    assignedAgentId: 'a-1'
  },
  {
    id: 'c-102',
    name: 'Sarah Jenkins',
    email: 'sjenkins@techcorp.co',
    phone: '+1 (555) 489-1122',
    company: 'TechCorp',
    tags: ['Real Estate Lead', 'VIP'],
    notes: ['Looking for a 2-bedroom luxury penthouse near downtown.', 'Budget around $1.5M.'],
    createdAt: '2026-05-19T14:15:00Z',
    city: 'Miami',
    project: 'Apex Penthouse',
    assignedAgentId: 'a-2'
  },
  {
    id: 'c-103',
    name: 'Michael Chen',
    email: 'mchen@cloudspace.net',
    phone: '+1 (555) 762-9900',
    company: 'CloudSpace',
    tags: ['Support Escalation'],
    notes: ['Experiencing issues connecting API endpoints to AWS backend.', 'High priority account.'],
    createdAt: '2026-05-20T08:45:00Z',
    city: 'San Francisco',
    assignedAgentId: 'a-3'
  },
  {
    id: 'c-104',
    name: 'Emily Watson',
    email: 'emily.watson@gmail.com',
    phone: '+1 (555) 233-8899',
    company: 'Individual',
    tags: ['Billing Query'],
    notes: ['Double charged on May monthly invoice.', 'Requested refund.'],
    createdAt: '2026-05-21T11:20:00Z',
    city: 'New York',
    assignedAgentId: 'a-4'
  }
];

export const mockDeals: Deal[] = [
  {
    id: 'd-201',
    contactId: 'c-101',
    name: 'Full Teeth Whitening Plan',
    value: 450,
    stage: 'qualified',
    createdAt: '2026-05-18T10:35:00Z'
  },
  {
    id: 'd-202',
    contactId: 'c-102',
    name: 'Apex Heights Penthouse Sale',
    value: 1450000,
    stage: 'negotiation',
    createdAt: '2026-05-19T14:20:00Z'
  },
  {
    id: 'd-203',
    contactId: 'c-103',
    name: 'Enterprise Cloud Support SLA',
    value: 12000,
    stage: 'lead',
    createdAt: '2026-05-20T08:50:00Z'
  },
  {
    id: 'd-204',
    contactId: 'c-104',
    name: 'Plan Upgrade: Scale Level',
    value: 2400,
    stage: 'proposal',
    createdAt: '2026-05-21T11:25:00Z'
  }
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    contactId: 'c-101',
    status: 'ai_active',
    channel: 'web',
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hi, what are your opening hours?', timestamp: '2026-05-22T09:00:00Z' },
      { id: 'm2', sender: 'ai', text: 'Hello! Smile Dental Clinic is open Monday through Friday, from 9:00 AM to 6:00 PM. Would you like to schedule an appointment during these times?', timestamp: '2026-05-22T09:00:05Z' },
      { id: 'm3', sender: 'customer', text: 'Yes please. Do you have anything open this afternoon?', timestamp: '2026-05-22T09:00:45Z' },
      { id: 'm4', sender: 'ai', text: 'Let me check... Yes! We have openings for teeth cleaning or consultation today at 2:30 PM or 4:00 PM. Would either of those work for you?', timestamp: '2026-05-22T09:00:52Z' }
    ],
    lastMessageText: 'Would either of those work for you?',
    lastMessageTime: '09:00 AM',
    assignedAgentId: 'a-1',
    unreadCount: 0
  },
  {
    id: 'conv-2',
    contactId: 'c-102',
    status: 'ai_active',
    channel: 'whatsapp',
    messages: [
      { id: 'm5', sender: 'customer', text: 'Hi Marcus, interested in Apex Heights properties. What is the layout of the penthouse?', timestamp: '2026-05-22T10:15:00Z' },
      { id: 'm6', sender: 'ai', text: 'Hi! The penthouses at Apex Heights feature spacious 2-bedroom and 3-bedroom formats, floor-to-ceiling glass windows, custom Italian kitchens, and a private rooftop plunge pool. I would love to send you the full brochure! May I know your email address?', timestamp: '2026-05-22T10:15:10Z' },
      { id: 'm7', sender: 'customer', text: 'Sure, it is sjenkins@techcorp.co. Send it over.', timestamp: '2026-05-22T10:16:00Z' },
      { id: 'm8', sender: 'ai', text: 'Perfect, I have sent the catalog to sjenkins@techcorp.co! Would you like to book a private tour of the model penthouse this weekend? I have slots on Saturday afternoon.', timestamp: '2026-05-22T10:16:15Z' }
    ],
    lastMessageText: 'Would you like to book a private tour of the model penthouse this weekend?',
    lastMessageTime: '10:16 AM',
    assignedAgentId: 'a-2',
    unreadCount: 1
  },
  {
    id: 'conv-3',
    contactId: 'c-103',
    status: 'human_escalated',
    channel: 'web',
    messages: [
      { id: 'm9', sender: 'customer', text: 'My production AWS cluster is spitting out 500 errors when communicating with the ByteTech API endpoint.', timestamp: '2026-05-22T11:00:00Z' },
      { id: 'm10', sender: 'ai', text: 'Oh no, I understand how critical this is. Have you checked if the headers contain the correct Bearer Token? Also, could you confirm the specific API path returning 500 errors?', timestamp: '2026-05-22T11:00:15Z' },
      { id: 'm11', sender: 'customer', text: 'Yes, tokens are fresh and valid. The path is `/v1/transactions/sync`. We are losing transactional data! Give me a human agent immediately!', timestamp: '2026-05-22T11:01:00Z' },
      { id: 'm12', sender: 'ai', text: 'I am transferring you to a senior developer immediately. Please hold on.', timestamp: '2026-05-22T11:01:08Z' }
    ],
    lastMessageText: 'I am transferring you to a senior developer immediately. Please hold on.',
    lastMessageTime: '11:01 AM',
    assignedAgentId: 'a-3',
    unreadCount: 0
  },
  {
    id: 'conv-4',
    contactId: 'c-104',
    status: 'closed',
    channel: 'sms',
    messages: [
      { id: 'm13', sender: 'customer', text: 'Hello, why is my invoice $50 higher this month?', timestamp: '2026-05-21T14:30:00Z' },
      { id: 'm14', sender: 'ai', text: 'Hello Emily. It looks like you exceeded your database storage limit of 10GB, resulting in a $50 overage charge (5GB @ $10/GB). You can check details in your dashboard Billing tab.', timestamp: '2026-05-21T14:30:45Z' },
      { id: 'm15', sender: 'customer', text: 'Ah, I see. I will clean up some backups. Thanks!', timestamp: '2026-05-21T14:32:00Z' },
      { id: 'm16', sender: 'ai', text: 'You are welcome! Let me know if you need anything else. Have a great day!', timestamp: '2026-05-21T14:32:15Z' }
    ],
    lastMessageText: 'Have a great day!',
    lastMessageTime: 'May 21',
    assignedAgentId: 'a-4',
    unreadCount: 0
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'app-301',
    contactId: 'c-101',
    agentId: 'a-1',
    dateTime: '2026-05-23T14:30:00',
    duration: 30,
    location: 'Smile Dental Clinic Suite A',
    type: 'Teeth Whitening',
    status: 'scheduled'
  }
];

export const mockWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Customer Onboarding Sequence',
    description: 'Triggered when a new customer is onboarded. Automatically sends a welcome email immediately, followed by a hygiene guide after 3 days and special offers after 7 days.',
    active: true,
    nodes: [
      { id: 'wn-1', type: 'trigger', label: 'Onboarding Trigger', component: 'Native CRM', description: 'Fires when a new customer is registered in Native CRM', status: 'active' },
      { id: 'wn-2', type: 'action', label: 'Send Welcome Email', component: 'Email Connector', description: 'Sends predesigned onboarding welcome template immediately', status: 'active', config: { connectorType: 'email', emailTemplateId: 'welcome_onboarding', timingMode: 'immediate' } },
      { id: 'wn-3', type: 'action', label: 'Send 3-Day Followup', component: 'Email Connector', description: 'Sends educational oral hygiene guide after 3 days delay', status: 'active', config: { connectorType: 'email', emailTemplateId: 'onboarding_3day_followup', timingMode: 'delay', delayValue: 3, delayUnit: 'days' } },
      { id: 'wn-4', type: 'action', label: 'Send 7-Day Promo Offer', component: 'Email Connector', description: 'Sends whitening promotional offer after 7 days delay', status: 'active', config: { connectorType: 'email', emailTemplateId: 'onboarding_7day_upsell', timingMode: 'delay', delayValue: 7, delayUnit: 'days' } }
    ],
    edges: [
      { id: 'we-1', source: 'wn-1', target: 'wn-2' },
      { id: 'we-2', source: 'wn-2', target: 'wn-3' },
      { id: 'we-3', source: 'wn-3', target: 'wn-4' }
    ],
    runsCount: 142,
    successCount: 140,
    lastRun: '5 minutes ago'
  },
  {
    id: 'wf-2',
    name: 'Appointment Confirmation & Reminder',
    description: 'Triggered when a customer books an appointment. Sends confirmation details immediately on WhatsApp, and a final reminder 1 hour before.',
    active: true,
    nodes: [
      { id: 'wn-5', type: 'trigger', label: 'Appointment Scheduled', component: 'Calendar Engine', description: 'Fires when slot is booked in Calendar Scheduler', status: 'active' },
      { id: 'wn-6', type: 'action', label: 'Send Booking WhatsApp', component: 'WhatsApp Node', description: 'Dispatches booking confirmation details immediately', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplateId: 'appointment_confirm', timingMode: 'immediate' } },
      { id: 'wn-7', type: 'action', label: 'Send 1-Hour Reminder', component: 'WhatsApp Node', description: 'Sends a second alert exactly 1 hour before appointment time', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplateId: 'appointment_remind_1h', timingMode: 'relative', relativeValue: 1, relativeUnit: 'hours', relativeAnchor: 'before' } }
    ],
    edges: [
      { id: 'we-4', source: 'wn-5', target: 'wn-6' },
      { id: 'we-5', source: 'wn-6', target: 'wn-7' }
    ],
    runsCount: 89,
    successCount: 88,
    lastRun: '2 hours ago'
  },
  {
    id: 'wf-3',
    name: 'Support Incident Escalation',
    description: 'Triggered when AI Support Agent transfers chat. Creates ticket in Native CRM, alerts Slack general channel, and pings support queue.',
    active: false,
    nodes: [
      { id: 'wn-9', type: 'trigger', label: 'Human Handoff Trigger', component: 'AI Brain / Hub', description: 'Conversation status changes to human_escalated', status: 'inactive' },
      { id: 'wn-10', type: 'action', label: 'Create CRM Ticket', component: 'Native CRM', description: 'Adds ticket entity linked to customer profiles immediately', status: 'inactive', config: { connectorType: 'crm', crmAction: 'create_ticket', timingMode: 'immediate' } },
      { id: 'wn-11', type: 'action', label: 'Slack Alert Dev Team', component: 'Slack Integration', description: 'Pings engineering Slack channel with logs links', status: 'inactive', config: { connectorType: 'slack', slackChannel: '#general', slackMessage: 'Support Ticket Escalated: {contact_name}', timingMode: 'immediate' } }
    ],
    edges: [
      { id: 'we-7', source: 'wn-9', target: 'wn-10' },
      { id: 'we-8', source: 'wn-10', target: 'wn-11' }
    ],
    runsCount: 34,
    successCount: 34,
    lastRun: '1 day ago'
  }
];

export const mockKnowledgeSources: KnowledgeSource[] = [
  {
    id: 'ks-1',
    name: 'Smile Dental FAQ.pdf',
    type: 'file',
    size: '1.8 MB',
    tokenCount: 14200,
    status: 'synced',
    lastSync: '2026-05-20 10:00'
  },
  {
    id: 'ks-2',
    name: 'Dental Insurance Guidelines.txt',
    type: 'file',
    size: '342 KB',
    tokenCount: 4100,
    status: 'synced',
    lastSync: '2026-05-20 10:05'
  },
  {
    id: 'ks-3',
    name: 'Website: smile-dental.com/about',
    type: 'url',
    size: '12 Pages',
    tokenCount: 22800,
    status: 'synced',
    lastSync: '2026-05-21 04:00'
  },
  {
    id: 'ks-4',
    name: 'Google Drive: Clinic Operations Guide',
    type: 'drive',
    size: '8 Documents',
    tokenCount: 89300,
    status: 'indexing',
    lastSync: 'Syncing...'
  }
];

export const mockKbChunks: KbChunk[] = [
  {
    id: 'chk-1',
    sourceId: 'ks-1',
    sourceName: 'Smile Dental FAQ.pdf',
    content: 'Smile Dental Clinic hours are Monday to Friday, 9:00 AM to 6:00 PM. We are closed on Saturdays and Sundays. For dental emergencies outside hours, call our emergency hotline at +1 (555) 999-EMER.',
    tokens: 42
  },
  {
    id: 'chk-2',
    sourceId: 'ks-1',
    sourceName: 'Smile Dental FAQ.pdf',
    content: 'Standard dental cleaning costs $120. In-office teeth whitening costs $450 per session and takes approximately 60 minutes. We support payment through cash, major credit cards, Stripe billing, and dental insurance packages.',
    tokens: 38
  },
  {
    id: 'chk-3',
    sourceId: 'ks-2',
    sourceName: 'Dental Insurance Guidelines.txt',
    content: 'We accept insurance plans from Aetna, Cigna, Delta Dental, and MetLife. Co-pays vary depending on specific policy guidelines. Basic teeth cleaning is covered 100% by most plans twice a year.',
    tokens: 35
  },
  {
    id: 'chk-4',
    sourceId: 'ks-3',
    sourceName: 'Website: smile-dental.com/about',
    content: 'Smile Dental Clinic was founded in 2018 by Dr. Elizabeth Vance, D.D.S. Dr. Vance has over 15 years of experience in restorative and cosmetic dentistry. The clinic is equipped with state-of-the-art digital dental imaging equipment.',
    tokens: 44
  }
];

export const mockBillingLimits: BillingLimit[] = [
  { name: 'AI Conversations', limit: 2000, used: 842, unit: 'chats' },
  { name: 'Voice Minutes', limit: 500, used: 215, unit: 'mins' },
  { name: 'Calendar Bookings', limit: 'Unlimited', used: 48, unit: 'bookings' },
  { name: 'CRM Contacts', limit: 5000, used: 1250, unit: 'contacts' },
  { name: 'Knowledge Storage', limit: '5.0 GB', used: 1.2, unit: 'GB' },
  { name: 'Workflow Automator Runs', limit: 10000, used: 4520, unit: 'runs' }
];

export const mockSystemMetrics: SystemMetrics = {
  mrr: 4850,
  conversionRate: 18.4,
  aiResolutionRate: 84.6,
  humanEscalationRate: 15.4,
  activeCalls: 2,
  chatCount: 1242,
  voiceDuration: 890
};
