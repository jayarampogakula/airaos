import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resolvedDbFile = process.env.DB_PATH || path.join(__dirname, 'db.json');

try {
  if (fs.existsSync(resolvedDbFile) && fs.lstatSync(resolvedDbFile).isDirectory()) {
    console.warn(`[DATABASE] WARNING: Database path ${resolvedDbFile} is a directory! Falling back to db_file.json to prevent crash loops.`);
    resolvedDbFile = path.join(path.dirname(resolvedDbFile), 'db_file.json');
  }
} catch (e) {
  console.error("[DATABASE] Error inspecting database path:", e);
}

export const DB_FILE = resolvedDbFile;

const ROLE_NAMES = ['Owner', 'Admin', 'Manager', 'Agent'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 48) || `tenant-${Date.now()}`;
}

function createTenant(id, name, plan = 'Growth', primaryColor = '#0ea5e9', logo = 'A') {
  return {
    id,
    name,
    slug: slugify(name),
    domain: `${slugify(name)}.airaos.com`,
    plan,
    status: 'active',
    logo,
    primaryColor,
    secondaryColor: '#0f172a',
    settings: {
      chatwootUrl: 'https://chat.cleveradai.in',
      chatwootAccountId: '1',
      chatwootApiAccessToken: 'GC8whkYToqKKV9kW98gdDntX',
      n8nUrl: '',
      timezone: 'Asia/Calcutta'
    },
    chatwootMapping: {
      accountId: '1',
      accountName: name,
      status: 'connected',
      inboxIds: [],
      channelIds: []
    },
    emailTemplates: {
      welcome: `Hello {contact_name}, welcome to ${name}!`,
      escalation: `Alert: Conversation with {contact_name} has been escalated.`
    },
    credits: 0,
    billingHistory: []
  };
}

function withTenantId(records, tenantIdResolver) {
  return (records || []).map((record, index) => ({
    ...record,
    tenantId: record.tenantId || tenantIdResolver(record, index)
  }));
}

export function ensureSaasSchema(data) {
  const db = {
    tenants: [],
    agents: [],
    contacts: [],
    deals: [],
    conversations: [],
    appointments: [],
    workflows: [],
    teamMembers: [],
    notifications: [],
    working_shifts: {},
    knowledge_chunks: [],
    integrations: {},
    channelConfigs: [],
    chatwootAccounts: [],
    chatwootInboxes: [],
    chatwootChannels: [],
    chatwootConversationMappings: [],
    sessions: [],
    users: [],
    memberships: [],
    roles: [],
    platformSettings: {
      growthPrice: 499,
      growthChats: 2000,
      growthVoice: 500,
      growthWebsites: 2,
      scalePrice: 1200,
      scaleChats: 5000,
      scaleVoice: 1000,
      scaleWebsites: 5,
      enterprisePrice: 2500,
      enterpriseChats: 10000,
      enterpriseVoice: 2500,
      enterpriseWebsites: 999,
      currency: '$',
      overageChatRate: 0.05,
      overageVoiceRate: 0.15,
      inboundCallRate: 0.10,
      outboundCallRate: 0.20,
      voiceSynthesisRate: 0.02,
      chatAddonPrice: 250,
      voiceAddonPrice: 400
    },
    ...data
  };

  if (!Array.isArray(db.roles) || db.roles.length === 0) {
    db.roles = ROLE_NAMES.map((name) => ({
      id: `role-${name.toLowerCase()}`,
      name,
      permissions: {
        manageTenant: name === 'Owner' || name === 'Admin',
        manageTeam: name === 'Owner' || name === 'Admin',
        manageSettings: name === 'Owner' || name === 'Admin',
        manageBilling: name === 'Owner',
        manageConversations: true,
        manageContacts: name !== 'Agent',
        manageAppointments: true,
        manageAgents: name !== 'Agent'
      }
    }));
  }

  if (!Array.isArray(db.tenants) || db.tenants.length === 0) {
    db.tenants = [
      createTenant('t-1', 'Smile Dentals', 'Growth', '#0ea5e9', 'S'),
      createTenant('t-2', 'KP Real Estates', 'Scale', '#8b5cf6', 'K'),
      createTenant('t-3', 'ABC Coaching', 'Growth', '#10b981', 'A')
    ];
  } else {
    db.tenants = db.tenants.map((tenant) => {
      const settings = {
        chatwootUrl: 'https://chat.cleveradai.in',
        chatwootAccountId: '1',
        chatwootApiAccessToken: 'GC8whkYToqKKV9kW98gdDntX',
        n8nUrl: tenant.settings?.n8nUrl || '',
        timezone: tenant.settings?.timezone || 'Asia/Calcutta'
      };
      return {
        ...tenant,
        slug: tenant.slug || slugify(tenant.name),
        settings,
        chatwootMapping: {
          accountId: '1',
          accountName: tenant.name,
          status: 'connected',
          inboxIds: tenant.chatwootMapping?.inboxIds || [],
          channelIds: tenant.chatwootMapping?.channelIds || []
        }
      };
    });
  }

  const defaultTenantId = db.tenants[0]?.id || 't-1';
  if (!Array.isArray(db.agents) || db.agents.length === 0) {
    db.agents = [
      {
        id: 'a-1',
        tenantId: 't-1',
        name: 'Sarah',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        voice: 'Echo (US Female, warm)',
        language: 'English',
        personality: 'Professional, welcoming, and organized.',
        department: 'Reception',
        prompt: 'You are Sarah, the AI receptionist for Smile Dentals. Answer FAQs, capture leads, and book appointments.',
        workingHours: { start: '09:00', end: '18:00' },
        status: 'online',
        tools: ['Book Appointment', 'Check Availability', 'Update CRM Contact'],
        knowledgeSources: [],
        escalationRules: 'Escalate when the customer asks for a human.'
      },
      {
        id: 'a-2',
        tenantId: 't-2',
        name: 'Marcus',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        voice: 'Alloy (US Male, energetic)',
        language: 'English',
        personality: 'Persuasive and highly responsive.',
        department: 'Sales',
        prompt: 'You are Marcus, the AI property advisor for KP Real Estates. Qualify property leads and book tours.',
        workingHours: { start: '08:00', end: '20:00' },
        status: 'online',
        tools: ['Create CRM Lead', 'Book Property Tour', 'Send Brochure PDF'],
        knowledgeSources: [],
        escalationRules: 'Escalate VIP leads and custom finance requests.'
      },
      {
        id: 'a-3',
        tenantId: 't-3',
        name: 'Maya',
        avatar: 'https://images.unsplash.com/photo-1494790108377-0be9c1e3f4c6?w=150',
        voice: 'Nova (calm)',
        language: 'English',
        personality: 'Patient, encouraging, and precise.',
        department: 'Support',
        prompt: 'You are Maya, the AI coaching coordinator for ABC Coaching. Answer program questions and schedule consultations.',
        workingHours: { start: '09:00', end: '18:00' },
        status: 'online',
        tools: ['Book Appointment', 'Create CRM Lead'],
        knowledgeSources: [],
        escalationRules: 'Escalate payment and admissions issues.'
      }
    ];
  }
  if (!Array.isArray(db.contacts) || db.contacts.length === 0) {
    db.contacts = [
      {
        id: 'c-101',
        tenantId: 't-1',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        phone: '+1 (555) 019-2834',
        company: 'Individual',
        tags: ['Patient', 'New Lead'],
        notes: ['Inquired about teeth whitening procedures.'],
        createdAt: new Date().toISOString(),
        city: 'New York',
        assignedAgentId: 'a-1'
      },
      {
        id: 'c-102',
        tenantId: 't-2',
        name: 'Priya Menon',
        email: 'priya@example.com',
        phone: '+91 90000 12345',
        company: 'Individual',
        tags: ['Real Estate Lead'],
        notes: ['Looking for a 3BHK investment property.'],
        createdAt: new Date().toISOString(),
        city: 'Hyderabad',
        project: 'KP Heights',
        assignedAgentId: 'a-2'
      },
      {
        id: 'c-103',
        tenantId: 't-3',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '+91 90000 67890',
        company: 'Individual',
        tags: ['Coaching Lead'],
        notes: ['Asked about weekend coaching batches.'],
        createdAt: new Date().toISOString(),
        city: 'Bengaluru',
        assignedAgentId: 'a-3'
      }
    ];
  }
  if (!Array.isArray(db.deals) || db.deals.length === 0) {
    db.deals = [
      { id: 'd-201', tenantId: 't-1', contactId: 'c-101', name: 'Dental Consultation', value: 450, stage: 'qualified', createdAt: new Date().toISOString() },
      { id: 'd-202', tenantId: 't-2', contactId: 'c-102', name: 'KP Heights Site Visit', value: 150000, stage: 'lead', createdAt: new Date().toISOString() },
      { id: 'd-203', tenantId: 't-3', contactId: 'c-103', name: 'Coaching Enrollment', value: 1200, stage: 'proposal', createdAt: new Date().toISOString() }
    ];
  }
  if (!Array.isArray(db.conversations) || db.conversations.length === 0) {
    db.conversations = [
      {
        id: 'conv-1',
        tenantId: 't-1',
        contactId: 'c-101',
        status: 'ai_active',
        channel: 'web',
        messages: [
          { id: 'm1', tenantId: 't-1', conversationId: 'conv-1', sender: 'customer', text: 'Do you have cleaning slots this week?', timestamp: new Date().toISOString() },
          { id: 'm2', tenantId: 't-1', conversationId: 'conv-1', sender: 'ai', text: 'Yes, I can help you book a cleaning appointment.', timestamp: new Date().toISOString() }
        ],
        lastMessageText: 'Yes, I can help you book a cleaning appointment.',
        lastMessageTime: '09:00 AM',
        assignedAgentId: 'a-1',
        unreadCount: 0
      },
      {
        id: 'conv-2',
        tenantId: 't-2',
        contactId: 'c-102',
        status: 'ai_active',
        channel: 'whatsapp',
        messages: [
          { id: 'm3', tenantId: 't-2', conversationId: 'conv-2', sender: 'customer', text: 'I want to visit KP Heights this weekend.', timestamp: new Date().toISOString() },
          { id: 'm4', tenantId: 't-2', conversationId: 'conv-2', sender: 'ai', text: 'I can help schedule a site visit. What time works for you?', timestamp: new Date().toISOString() }
        ],
        lastMessageText: 'I can help schedule a site visit. What time works for you?',
        lastMessageTime: '10:16 AM',
        assignedAgentId: 'a-2',
        unreadCount: 1
      },
      {
        id: 'conv-3',
        tenantId: 't-3',
        contactId: 'c-103',
        status: 'human_escalated',
        channel: 'web',
        messages: [
          { id: 'm5', tenantId: 't-3', conversationId: 'conv-3', sender: 'customer', text: 'Can I join the weekend batch?', timestamp: new Date().toISOString() },
          { id: 'm6', tenantId: 't-3', conversationId: 'conv-3', sender: 'ai', text: 'Let me connect you with an admissions manager for batch availability.', timestamp: new Date().toISOString() }
        ],
        lastMessageText: 'Let me connect you with an admissions manager for batch availability.',
        lastMessageTime: '11:01 AM',
        assignedAgentId: 'a-3',
        unreadCount: 0
      }
    ];
  }
  if (!Array.isArray(db.appointments) || db.appointments.length === 0) {
    db.appointments = [
      { id: 'app-301', tenantId: 't-1', contactId: 'c-101', agentId: 'a-1', dateTime: new Date().toISOString(), duration: 30, location: 'Smile Dentals Office', type: 'Dental Cleaning', status: 'scheduled' },
      { id: 'app-302', tenantId: 't-2', contactId: 'c-102', agentId: 'a-2', dateTime: new Date().toISOString(), duration: 60, location: 'KP Heights Site Office', type: 'Property Tour', status: 'scheduled' }
    ];
  }

  db.agents = withTenantId(db.agents, (agent, index) => {
    if (agent.id === 'a-2') return 't-2';
    if (agent.id === 'a-3') return 't-3';
    return index % 3 === 2 ? 't-3' : index % 3 === 1 ? 't-2' : defaultTenantId;
  });
  db.contacts = withTenantId(db.contacts, (contact) => {
    if (contact.assignedAgentId === 'a-2' || contact.id === 'c-102') return 't-2';
    if (contact.assignedAgentId === 'a-3' || contact.id === 'c-103') return 't-3';
    return defaultTenantId;
  });
  db.deals = withTenantId(db.deals, (deal) => db.contacts.find((c) => c.id === deal.contactId)?.tenantId || defaultTenantId);
  db.conversations = withTenantId(db.conversations, (conv) => db.contacts.find((c) => c.id === conv.contactId)?.tenantId || defaultTenantId);
  db.conversations = db.conversations.map((conv) => ({
    ...conv,
    messages: (conv.messages || []).map((message) => ({
      ...message,
      tenantId: message.tenantId || conv.tenantId,
      conversationId: message.conversationId || conv.id
    }))
  }));
  db.appointments = withTenantId(db.appointments, (app) => db.contacts.find((c) => c.id === app.contactId)?.tenantId || defaultTenantId);
  db.workflows = withTenantId(db.workflows, () => defaultTenantId);
  db.teamMembers = withTenantId(db.teamMembers, () => defaultTenantId);
  db.notifications = withTenantId(db.notifications, () => defaultTenantId);
  db.channelConfigs = withTenantId(db.channelConfigs, () => defaultTenantId);
  db.chatwootAccounts = withTenantId(db.chatwootAccounts, () => defaultTenantId);
  db.chatwootInboxes = withTenantId(db.chatwootInboxes, () => defaultTenantId);
  db.chatwootChannels = withTenantId(db.chatwootChannels, () => defaultTenantId);
  db.chatwootConversationMappings = withTenantId(db.chatwootConversationMappings, () => defaultTenantId);

  if (db.channelConfigs.length === 0) {
    const defaultChannels = ['website', 'whatsapp', 'gmail', 'outlook', 'smtp', 'telegram', 'instagram', 'facebook'];
    db.channelConfigs = db.tenants.flatMap((tenant) => defaultChannels.map((type) => ({
      id: `channel-${tenant.id}-${type}`,
      tenantId: tenant.id,
      type,
      provider: type === 'website' ? 'chatwoot_web_widget' : `chatwoot_${type}`,
      displayName: type === 'website' ? 'Website Chat' : type.charAt(0).toUpperCase() + type.slice(1),
      status: 'not_connected',
      config: {},
      chatwootAccountId: tenant.chatwootMapping?.accountId || tenant.settings?.chatwootAccountId || '',
      chatwootInboxId: '',
      chatwootChannelId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })));
  }

  if (!Array.isArray(db.users) || db.users.length === 0) {
    db.users = [
      {
        id: 'u-admin',
        name: 'Admin',
        email: 'admin@airaos.com',
        passwordHash: hashPassword('password123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-smile',
        name: 'Smile Owner',
        email: 'dental@airaos.com',
        passwordHash: hashPassword('smile123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-kp',
        name: 'KP Owner',
        email: 'sales@airaos.com',
        passwordHash: hashPassword('apex123'),
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-abc',
        name: 'ABC Owner',
        email: 'tech@airaos.com',
        passwordHash: hashPassword('byte123'),
        createdAt: new Date().toISOString()
      }
    ];
  }

  if (!Array.isArray(db.memberships) || db.memberships.length === 0) {
    db.memberships = [
      { id: 'm-admin-smile', userId: 'u-admin', tenantId: 't-1', role: 'Owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'm-admin-kp', userId: 'u-admin', tenantId: 't-2', role: 'Owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'm-admin-abc', userId: 'u-admin', tenantId: 't-3', role: 'Owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'm-smile-owner', userId: 'u-smile', tenantId: 't-1', role: 'Owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'm-kp-owner', userId: 'u-kp', tenantId: 't-2', role: 'Owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'm-abc-owner', userId: 'u-abc', tenantId: 't-3', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }
    ];
  }

  if (!db.working_shifts || Object.keys(db.working_shifts).length === 0) {
    db.working_shifts = Object.fromEntries(db.tenants.map((tenant) => [tenant.id, {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '09:00', end: '14:00' },
      sunday: { enabled: false, start: '09:00', end: '12:00' }
    }]));
  }

  return db;
}

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(ensureSaasSchema({}), null, 2), 'utf8');
  }
}

export function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = ensureSaasSchema(JSON.parse(data));
    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    return parsed;
  } catch (err) {
    console.error('Error reading database:', err);
    return ensureSaasSchema({});
  }
}

export function writeDb(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(ensureSaasSchema(data), null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}
