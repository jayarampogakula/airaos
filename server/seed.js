import { writeDb } from './db.js';

const initialTenants = [
  {
    id: 't-1',
    name: 'Smile Dental Clinic',
    domain: 'smile-dental.airaos.com',
    plan: 'Growth',
    status: 'active',
    logo: '🦷',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0f172a',
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
    primaryColor: '#8b5cf6',
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
    primaryColor: '#10b981',
    secondaryColor: '#0f172a',
    emailTemplates: {
      welcome: 'Hi {contact_name}, your support request has been logged. Let us solve it!',
      escalation: 'Escalation Alert: Technical support issue reported by {contact_name}.'
    }
  }
];

const initialAgents = [
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
    knowledgeSources: ['Smile Dental FAQ.pdf', 'Dental Insurance Guidelines.txt'],
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
    workingHours: { start: '00:00', end: '23:59' },
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

const initialContacts = [
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

const initialDeals = [
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

const initialAppointments = [
  {
    id: 'app-301',
    contactId: 'c-101',
    agentId: 'a-1',
    dateTime: '2026-05-23T14:30:00',
    duration: 30,
    location: 'Smile Dental Clinic Suite A',
    type: 'Teeth Whitening',
    status: 'scheduled'
  },
  {
    id: 'app-302',
    contactId: 'c-102',
    agentId: 'a-2',
    dateTime: '2026-05-24T11:00:00',
    duration: 60,
    location: 'Apex Heights Tower 2, Penthouse Lobby',
    type: 'Property Tour',
    status: 'scheduled'
  }
];

const initialConversations = [
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
  }
];

const initialKnowledgeChunks = [
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
  },
  // Real estate
  {
    id: 'chk-5',
    sourceId: 'ks-5',
    sourceName: 'Apex Heights Catalog.pdf',
    content: 'The penthouses at Apex Heights feature spacious 2-bedroom and 3-bedroom configurations with floor-to-ceiling windows, custom Italian kitchens, and private rooftop plunge pools.',
    tokens: 35
  },
  {
    id: 'chk-6',
    sourceId: 'ks-5',
    sourceName: 'Apex Heights Catalog.pdf',
    content: 'Apex Heights luxury suites and penthouses start at $850,000 up to $2.5M. A minimum of 15% down payment is required. Every unit includes 2 designated basement parking spots and sky lounge access.',
    tokens: 40
  },
  {
    id: 'chk-7',
    sourceId: 'ks-6',
    sourceName: 'Apex Heights Catalog.pdf',
    content: 'Apex Heights daily property showings are available from 8:00 AM to 8:00 PM. Please schedule weekend private showing tours with a sales agent at least 48 hours in advance.',
    tokens: 35
  },
  // ByteTech support
  {
    id: 'chk-8',
    sourceId: 'ks-7',
    sourceName: 'ByteTech User Guide.pdf',
    content: 'ByteTech Software helpdesk hours are Monday to Friday, 8:00 AM to 7:00 PM. 24/7 critical server paging is available. Standard support ticket response time is under 1 hour.',
    tokens: 38
  },
  {
    id: 'chk-9',
    sourceId: 'ks-7',
    sourceName: 'ByteTech User Guide.pdf',
    content: 'If you encounter API connection errors, please verify your authorization headers contain the correct Bearer Token. For sync issues on transaction endpoint `/v1/transactions/sync`, check the payload size limits.',
    tokens: 42
  }
];

const initialWorkingShifts = {
  't-1': {
    monday: { enabled: true, start: "09:00", end: "18:00" },
    tuesday: { enabled: true, start: "09:00", end: "18:00" },
    wednesday: { enabled: true, start: "09:00", end: "18:00" },
    thuesday: { enabled: true, start: "09:00", end: "18:00" },
    friday: { enabled: true, start: "09:00", end: "18:00" },
    saturday: { enabled: false, start: "09:00", end: "14:00" },
    sunday: { enabled: false, start: "09:00", end: "12:00" }
  },
  't-2': {
    monday: { enabled: true, start: "08:00", end: "20:00" },
    tuesday: { enabled: true, start: "08:00", end: "20:00" },
    wednesday: { enabled: true, start: "08:00", end: "20:00" },
    thuesday: { enabled: true, start: "08:00", end: "20:00" },
    friday: { enabled: true, start: "08:00", end: "20:00" },
    saturday: { enabled: true, start: "08:00", end: "20:00" },
    sunday: { enabled: true, start: "08:00", end: "20:00" }
  },
  't-3': {
    monday: { enabled: true, start: "08:00", end: "19:00" },
    tuesday: { enabled: true, start: "08:00", end: "19:00" },
    wednesday: { enabled: true, start: "08:00", end: "19:00" },
    thuesday: { enabled: true, start: "08:00", end: "19:00" },
    friday: { enabled: true, start: "08:00", end: "19:00" },
    saturday: { enabled: false, start: "09:00", end: "12:00" },
    sunday: { enabled: false, start: "09:00", end: "12:00" }
  }
};

const initialIntegrations = {
  difyUrl: '',
  difyApiKey: '',
  chatwootUrl: 'https://chat.cleveradai.in',
  chatwootInboxToken: '',
  n8nUrl: 'https://flow.cleveradai.in',
  n8nApiKey: '',
  calUrl: '',
  twentyUrl: '',
  twentyApiKey: '',
  dograhUrl: '',
  dograhApiKey: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  inboundRouting: 'twilio',
  outboundRouting: 'twilio',
  byoSipServer: '',
  byoSipUsername: '',
  byoSipPassword: '',
  byoPhoneNumber: ''
};

function seed() {
  const dbData = {
    tenants: initialTenants,
    agents: initialAgents,
    contacts: initialContacts,
    deals: initialDeals,
    conversations: initialConversations,
    appointments: initialAppointments,
    working_shifts: initialWorkingShifts,
    knowledge_chunks: initialKnowledgeChunks,
    integrations: initialIntegrations
  };

  const success = writeDb(dbData);
  if (success) {
    console.log('Database seeded successfully in server/db.json!');
  } else {
    console.error('Failed to seed database.');
  }
}

seed();
