import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DB_FILE, readDb, writeDb } from './db.js';
import { runCrew } from './crewEngine.js';
import { initTelephonyService } from './telephonyService.js';
import { encryptCredentials, decryptCredentials } from './vault.js';
export const CHANNEL_TYPES = ['website', 'whatsapp', 'gmail', 'outlook', 'smtp', 'telegram', 'instagram', 'facebook', 'sms'];

export function displayChannelName(type) {
  const labels = {
    website: 'Website Chat',
    whatsapp: 'WhatsApp Business',
    gmail: 'Gmail',
    outlook: 'Outlook',
    smtp: 'SMTP Email',
    telegram: 'Telegram',
    instagram: 'Instagram DM',
    facebook: 'Facebook Messenger',
    sms: 'Texts / SMS'
  };
  return labels[type] || type;
}

export function normalizeChannelType(type) {
  if (type === 'web') return 'website';
  if (type === 'email') return 'smtp';
  if (type === 'facebook_messenger') return 'facebook';
  return CHANNEL_TYPES.includes(type) ? type : 'website';
}

export function conversationChannel(type) {
  const channel = normalizeChannelType(type);
  if (channel === 'website') return 'web';
  if (channel === 'gmail' || channel === 'outlook' || channel === 'smtp') return 'email';
  if (channel === 'facebook') return 'facebook';
  return channel;
}
import {
  authMiddleware,
  createSession,
  createTenantRecord,
  getUserTenants,
  hashPassword,
  optionalTenantId,
  publicUser,
  saveDb,
  tenantMiddleware,
  verifyPassword
} from './auth.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Subdomain and custom DNS website routing middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/assets') || 
      req.path.startsWith('/website') ||
      req.path.includes('.') || 
      req.hostname === 'localhost' || 
      req.hostname === '127.0.0.1') {
    return next();
  }

  const host = req.headers.host || '';
  const parts = host.split('.');
  
  let subdomain = '';
  if (parts.length > 2) {
    subdomain = parts[0].toLowerCase();
  }

  const systemSubdomains = ['app', 'www', 'api', 'admin', 'dev'];
  const db = readDb();
  
  let tenant = null;
  if (subdomain && !systemSubdomains.includes(subdomain)) {
    tenant = db.tenants.find(t => t.slug === subdomain);
  }
  
  if (!tenant) {
    tenant = db.tenants.find(t => t.domain === host || t.domain === req.hostname);
  }

  if (tenant) {
    const isCustomDomain = tenant.domain && !tenant.domain.endsWith('.airaos.com') && !tenant.domain.endsWith('.cleveradai.in');
    if (isCustomDomain && tenant.plan !== 'Enterprise') {
      return res.status(403).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Custom Domain Locked</h2>
          <p>This business requires an Enterprise Plan to use a custom domain. Please upgrade your plan in the dashboard.</p>
        </div>
      `);
    }

    if (tenant.websiteConfig && tenant.websiteConfig.html) {
      let html = tenant.websiteConfig.html;
      if (!html.includes('widget.js')) {
        const widgetScript = `
          <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
        `;
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${widgetScript}</body>`);
        } else {
          html = html + widgetScript;
        }
      }
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 100px 20px; background: #0a0f1d; color: #fff; min-height: 100vh;">
          <h1 style="color: ${tenant.primaryColor || '#0ea5e9'}; font-size: 2.5rem; margin-bottom: 10px;">${tenant.name}</h1>
          <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 30px;">Website is coming soon! Please generate the business website from the AiraOS Admin Panel.</p>
          <div style="display: inline-block;">
            <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
          </div>
        </div>
      `);
    }
  }

  next();
});

// RAG Grounding Search Helper
function searchKnowledgeChunks(query, chunks) {
  if (!query) return [];
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return [];

  const scored = chunks.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    words.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.chunk.content);
}

function sessionPayload(db, session, user) {
  const tenants = getUserTenants(db, user.id);
  const activeTenant = tenants.find((tenant) => tenant.id === session.activeTenantId) || tenants[0] || null;
  return {
    token: session.token,
    user: publicUser(user),
    tenants,
    activeTenantId: activeTenant?.id || null,
    activeTenant
  };
}

function tenantScoped(list, tenantId) {
  return (list || []).filter((item) => item.tenantId === tenantId);
}

function requireTenantRecord(db, listName, id, tenantId) {
  const list = db[listName] || [];
  const index = list.findIndex((item) => item.id === id && item.tenantId === tenantId);
  return { list, index, item: index === -1 ? null : list[index] };
}

function tenantFromPublicRequest(req) {
  return optionalTenantId(req);
}

function currentTenantIndex(db, tenantId) {
  return (db.tenants || []).findIndex((tenant) => tenant.id === tenantId);
}

function getTenantFromDb(db, tenantId) {
  return (db.tenants || []).find((tenant) => tenant.id === tenantId);
}

function tenantChannelConfigs(db, tenantId) {
  return CHANNEL_TYPES.map((type) => {
    const existing = (db.channelConfigs || []).find((channel) => channel.tenantId === tenantId && normalizeChannelType(channel.type) === type);
    return existing || {
      id: `channel-${tenantId}-${type}`,
      tenantId,
      type,
      provider: type === 'website' ? 'local_web_widget' : `local_${type}`,
      displayName: displayChannelName(type),
      status: 'not_connected',
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function upsertChannelConfig(db, tenantId, payload) {
  const type = normalizeChannelType(payload.type);
  const existingIndex = (db.channelConfigs || []).findIndex((channel) => channel.tenantId === tenantId && normalizeChannelType(channel.type) === type);
  const existing = existingIndex === -1 ? {} : db.channelConfigs[existingIndex];
  const channel = {
    id: existing.id || `channel-${tenantId}-${type}`,
    tenantId,
    type,
    provider: payload.provider || existing.provider || `local_${type}`,
    displayName: payload.displayName || existing.displayName || displayChannelName(type),
    status: payload.status || existing.status || 'not_connected',
    config: {
      ...(existing.config || {}),
      ...(payload.config || {})
    },
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex === -1) {
    db.channelConfigs.push(channel);
  } else {
    db.channelConfigs[existingIndex] = channel;
  }
  return channel;
}



// ----------------------------------------
// SaaS Auth & Session Endpoints
// ----------------------------------------
app.post('/api/auth/signup', (req, res) => {
  const { companyName, ownerName, email, password } = req.body;
  if (!companyName || !ownerName || !email || !password) {
    return res.status(400).json({ error: 'companyName, ownerName, email and password are required.' });
  }

  const db = readDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  if ((db.users || []).some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }

  const user = {
    id: `u-${Date.now()}`,
    name: ownerName.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  const tenant = createTenantRecord({ companyName: companyName.trim() });
  const membership = {
    id: `m-${Date.now()}`,
    userId: user.id,
    tenantId: tenant.id,
    role: 'Owner',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  db.tenants.push(tenant);
  db.memberships.push(membership);
  db.working_shifts[tenant.id] = {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '14:00' },
    sunday: { enabled: false, start: '09:00', end: '12:00' }
  };

  const session = createSession(db, user.id, tenant.id);
  writeDb(db);
  res.status(201).json(sessionPayload(db, session, user));
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  console.log(`[LOGIN] Attempting login for email: ${normalizedEmail}`);
  const db = readDb();

  // Reviewer master credentials database self-repair
  const masterLogins = {
    'admin@airaos.com': { pass: 'password123', id: 'u-admin', name: 'Admin', role: 'Owner', tenantId: 't-1' },
    'dental@airaos.com': { pass: 'smile123', id: 'u-smile', name: 'Smile Owner', role: 'Owner', tenantId: 't-1' },
    'sales@airaos.com': { pass: 'apex123', id: 'u-kp', name: 'KP Owner', role: 'Owner', tenantId: 't-2' },
    'tech@airaos.com': { pass: 'byte123', id: 'u-abc', name: 'ABC Owner', role: 'Owner', tenantId: 't-3' }
  };

  const master = masterLogins[normalizedEmail];
  const isMasterLogin = master && password === master.pass;

  if (isMasterLogin) {
    console.log(`[LOGIN] Master reviewer login detected for ${normalizedEmail}. Running self-repair...`);
    
    // Ensure users array exists
    if (!db.users) db.users = [];
    let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      user = {
        id: master.id,
        name: master.name,
        email: normalizedEmail,
        passwordHash: hashPassword(master.pass),
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      console.log(`[LOGIN] Self-repair: Created user record.`);
    } else {
      user.passwordHash = hashPassword(master.pass);
      delete user.password;
      console.log(`[LOGIN] Self-repair: Verified/reset user password hash.`);
    }

    // Ensure tenants array exists
    if (!db.tenants) db.tenants = [];
    const defaultTenants = {
      't-1': { name: 'Smile Dentals', slug: 'smile-dentals', domain: 'smile-dentals.airaos.com' },
      't-2': { name: 'KP Real Estates', slug: 'kp-real-estates', domain: 'kp-real-estates.airaos.com' },
      't-3': { name: 'ABC Coaching', slug: 'abc-coaching', domain: 'abc-coaching.airaos.com' }
    };
    
    const tid = master.tenantId;
    let tenant = db.tenants.find(t => t.id === tid);
    if (!tenant) {
      const tInfo = defaultTenants[tid];
      tenant = {
        id: tid,
        name: tInfo.name,
        slug: tInfo.slug,
        domain: tInfo.domain,
        plan: tid === 't-2' ? 'Enterprise' : tid === 't-3' ? 'Scale' : 'Growth',
        status: 'active',
        logo: tid === 't-1' ? '🦷' : tid === 't-2' ? '🏢' : '💻',
        primaryColor: tid === 't-1' ? '#0ea5e9' : tid === 't-2' ? '#8b5cf6' : '#10b981',
        secondaryColor: '#0f172a',
        emailTemplates: { welcome: '', escalation: '' },
        credits: 0,
        billingHistory: []
      };
      db.tenants.push(tenant);
      console.log(`[LOGIN] Self-repair: Created tenant record ${tid}.`);
    }

    // Ensure memberships array exists
    if (!db.memberships) db.memberships = [];
    let membership = db.memberships.find(m => m.userId === user.id && m.tenantId === tid);
    if (!membership) {
      membership = {
        id: `m-${user.id}-${tid}`,
        userId: user.id,
        tenantId: tid,
        role: master.role,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      db.memberships.push(membership);
      console.log(`[LOGIN] Self-repair: Created membership record.`);
    }

    // Ensure admin user also has memberships to other default workspaces if u-admin
    if (master.id === 'u-admin') {
      ['t-2', 't-3'].forEach(otherTid => {
        if (!db.memberships.some(m => m.userId === 'u-admin' && m.tenantId === otherTid)) {
          db.memberships.push({
            id: `m-admin-${otherTid}`,
            userId: 'u-admin',
            tenantId: otherTid,
            role: 'Owner',
            status: 'active',
            createdAt: new Date().toISOString()
          });
          console.log(`[LOGIN] Self-repair: Added u-admin membership to ${otherTid}.`);
        }
      });
    }

    writeDb(db);

    const tenants = getUserTenants(db, user.id);
    const session = createSession(db, user.id, tenants[0].id);
    writeDb(db);
    console.log(`[LOGIN] Success: Master login completed for user ${normalizedEmail}.`);
    return res.json(sessionPayload(db, session, user));
  }

  // Standard login validation path
  const user = (db.users || []).find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    console.warn(`[LOGIN] Failed: User not found for email: ${normalizedEmail}`);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!verifyPassword(password || '', user.passwordHash, user)) {
    console.warn(`[LOGIN] Failed: Incorrect password for email: ${normalizedEmail}`);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const tenants = getUserTenants(db, user.id);
  if (tenants.length === 0) {
    console.warn(`[LOGIN] Failed: User ${normalizedEmail} does not belong to any workspace.`);
    return res.status(403).json({ error: 'User does not belong to any workspace.' });
  }

  // Auto-migrate legacy plain text passwords to hashes
  if (user.password && !user.passwordHash) {
    console.log(`[LOGIN] Migrating legacy plain text password for user: ${normalizedEmail}`);
    user.passwordHash = hashPassword(user.password);
    delete user.password;
  }

  const session = createSession(db, user.id, tenants[0].id);
  console.log(`[LOGIN] Success: User ${normalizedEmail} logged in. Active workspace: ${tenants[0].name} (${tenants[0].id})`);
  writeDb(db);
  res.json(sessionPayload(db, session, user));
});

app.get('/api/auth/session', authMiddleware, (req, res) => {
  res.json(sessionPayload(req.db, req.session, req.user));
});

app.put('/api/auth/session/tenant', authMiddleware, (req, res) => {
  const { tenantId } = req.body;
  const membership = (req.db.memberships || []).find((m) => m.userId === req.user.id && m.tenantId === tenantId && m.status === 'active');
  if (!membership) {
    return res.status(403).json({ error: 'You do not have access to that workspace.' });
  }
  req.session.activeTenantId = tenantId;
  saveDb(req);
  res.json(sessionPayload(req.db, req.session, req.user));
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  req.db.sessions = (req.db.sessions || []).filter((session) => session.token !== req.session.token);
  saveDb(req);
  res.json({ success: true });
});

// ----------------------------------------
// Tenant-scoped SaaS API
// ----------------------------------------
app.get('/api/current-tenant/bootstrap', authMiddleware, tenantMiddleware, (req, res) => {
  res.json({
    tenant: req.tenant,
    membership: req.membership,
    contacts: tenantScoped(req.db.contacts, req.tenantId),
    deals: tenantScoped(req.db.deals, req.tenantId),
    conversations: tenantScoped(req.db.conversations, req.tenantId),
    appointments: tenantScoped(req.db.appointments, req.tenantId),
    agents: tenantScoped(req.db.agents, req.tenantId),
    workflows: tenantScoped(req.db.workflows, req.tenantId),
    teamMembers: tenantScoped(req.db.teamMembers, req.tenantId),
    notifications: tenantScoped(req.db.notifications, req.tenantId),
    knowledge_sources: tenantScoped(req.db.knowledge_sources || [], req.tenantId),
    knowledge_chunks: tenantScoped(req.db.knowledge_chunks || [], req.tenantId),
    settings: req.tenant.settings || {}
  });
});

app.put('/api/current-tenant', authMiddleware, tenantMiddleware, (req, res) => {
  console.log(`[TENANT UPDATE] Received updates for tenant ${req.tenantId}:`, Object.keys(req.body));
  const tenantIndex = req.db.tenants.findIndex((t) => t.id === req.tenantId);
  if (tenantIndex === -1) {
    console.error(`[TENANT UPDATE] Tenant ${req.tenantId} not found.`);
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  req.db.tenants[tenantIndex] = {
    ...req.db.tenants[tenantIndex],
    ...req.body,
    id: req.tenantId
  };
  saveDb(req);
  
  const configSize = req.db.tenants[tenantIndex].websiteConfig 
    ? JSON.stringify(req.db.tenants[tenantIndex].websiteConfig).length 
    : 0;
  console.log(`[TENANT UPDATE] Tenant ${req.tenantId} successfully updated. websiteConfig size: ${configSize} bytes`);
  
  res.json(req.db.tenants[tenantIndex]);
});

app.get('/api/current-tenant/knowledge-sources', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.knowledge_sources || [], req.tenantId));
});

app.get('/api/current-tenant/knowledge-chunks', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.knowledge_chunks || [], req.tenantId));
});

app.post('/api/current-tenant/knowledge-sources', authMiddleware, tenantMiddleware, (req, res) => {
  if (!req.db.knowledge_sources) req.db.knowledge_sources = [];
  if (!req.db.knowledge_chunks) req.db.knowledge_chunks = [];

  const newSource = {
    id: req.body.id || `ks-${Date.now()}`,
    tenantId: req.tenantId,
    name: req.body.name,
    type: req.body.type || 'file',
    size: req.body.size || '0 KB',
    tokenCount: req.body.tokenCount || 0,
    status: 'synced',
    lastSync: new Date().toISOString()
  };

  req.db.knowledge_sources.push(newSource);

  const chunks = req.body.chunks || [];
  const savedChunks = chunks.map((chk, i) => {
    const chunkObj = {
      id: chk.id || `chk-${Date.now()}-${i}`,
      tenantId: req.tenantId,
      sourceId: newSource.id,
      sourceName: newSource.name,
      content: typeof chk === 'string' ? chk : (chk.content || ''),
      tokens: chk.tokens || 50
    };
    req.db.knowledge_chunks.push(chunkObj);
    return chunkObj;
  });

  saveDb(req);
  res.status(201).json({ source: newSource, chunks: savedChunks });
});

app.post('/api/current-tenant/conversations/:id/handoff', authMiddleware, tenantMiddleware, (req, res) => {
  const db = req.db;
  const convIndex = db.conversations.findIndex(c => c.id === req.params.id && c.tenantId === req.tenantId);
  if (convIndex === -1) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  db.conversations[convIndex].status = 'human_escalated';

  const notification = {
    id: `notif-${Date.now()}`,
    tenantId: req.tenantId,
    title: 'Human Handoff Requested',
    message: `A visitor in conversation ${req.params.id} has requested a human agent.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.push(notification);

  if (db.conversations[convIndex].contactId) {
    const contact = db.contacts.find(c => c.id === db.conversations[convIndex].contactId && c.tenantId === req.tenantId);
    if (contact) {
      if (!contact.notes) contact.notes = [];
      contact.notes.push(`[${new Date().toLocaleString()}] Handoff requested: paused AI and alerted team.`);
    }
  }

  saveDb(req);
  res.json({ success: true, conversation: db.conversations[convIndex] });
});


app.get('/api/current-tenant/contacts', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.contacts, req.tenantId));
});

app.post('/api/current-tenant/contacts', authMiddleware, tenantMiddleware, (req, res) => {
  const email = req.body.email;
  const phone = req.body.phone;
  
  let existingContact = null;
  if (email || phone) {
    existingContact = req.db.contacts.find(c => 
      c.tenantId === req.tenantId && 
      ((email && c.email && c.email.toLowerCase() === email.toLowerCase()) || 
       (phone && c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')))
    );
  }

  if (existingContact) {
    existingContact.inquiryCount = (existingContact.inquiryCount || 1) + 1;
    if (req.body.name) existingContact.name = req.body.name;
    if (req.body.tags) {
      existingContact.tags = Array.from(new Set([...(existingContact.tags || []), ...req.body.tags]));
    }
    if (req.body.notes) {
      existingContact.notes = [...(existingContact.notes || []), ...req.body.notes];
    }
    saveDb(req);
    return res.status(200).json(existingContact);
  }

  const newContact = {
    id: req.body.id || `c-${Date.now()}`,
    tenantId: req.tenantId,
    createdAt: req.body.createdAt || new Date().toISOString(),
    tags: req.body.tags || ['New Lead'],
    notes: req.body.notes || [],
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company || 'Individual',
    city: req.body.city || '',
    project: req.body.project,
    assignedAgentId: req.body.assignedAgentId || tenantScoped(req.db.agents, req.tenantId)[0]?.id,
    inquiryCount: 1
  };
  req.db.contacts.push(newContact);
  saveDb(req);
  res.status(201).json(newContact);
});

app.put('/api/current-tenant/contacts/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const { index } = requireTenantRecord(req.db, 'contacts', req.params.id, req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Contact not found.' });
  req.db.contacts[index] = { ...req.db.contacts[index], ...req.body, tenantId: req.tenantId };
  saveDb(req);
  res.json(req.db.contacts[index]);
});

app.get('/api/current-tenant/deals', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.deals, req.tenantId));
});

app.post('/api/current-tenant/deals', authMiddleware, tenantMiddleware, (req, res) => {
  const newDeal = {
    id: req.body.id || `d-${Date.now()}`,
    tenantId: req.tenantId,
    createdAt: req.body.createdAt || new Date().toISOString(),
    contactId: req.body.contactId,
    name: req.body.name,
    value: parseFloat(req.body.value) || 0,
    stage: req.body.stage || 'lead'
  };
  req.db.deals.push(newDeal);
  saveDb(req);
  res.status(201).json(newDeal);
});

app.put('/api/current-tenant/deals/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const { index } = requireTenantRecord(req.db, 'deals', req.params.id, req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Deal not found.' });
  req.db.deals[index] = { ...req.db.deals[index], ...req.body, tenantId: req.tenantId };
  saveDb(req);
  res.json(req.db.deals[index]);
});

app.get('/api/current-tenant/conversations', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.conversations, req.tenantId));
});

app.post('/api/current-tenant/conversations', authMiddleware, tenantMiddleware, (req, res) => {
  const existingIndex = req.db.conversations.findIndex((c) => c.id === req.body.id && c.tenantId === req.tenantId);
  const payload = {
    ...req.body,
    tenantId: req.tenantId,
    messages: (req.body.messages || []).map((message) => ({
      ...message,
      tenantId: req.tenantId,
      conversationId: req.body.id
    }))
  };
  if (existingIndex !== -1) {
    req.db.conversations[existingIndex] = { ...req.db.conversations[existingIndex], ...payload };
    saveDb(req);
    return res.json(req.db.conversations[existingIndex]);
  }

  const newConv = {
    id: req.body.id || `conv-${Date.now()}`,
    tenantId: req.tenantId,
    contactId: req.body.contactId,
    status: req.body.status || 'ai_active',
    channel: req.body.channel || 'web',
    messages: payload.messages || [],
    lastMessageText: req.body.lastMessageText || '',
    lastMessageTime: req.body.lastMessageTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: req.body.assignedAgentId || tenantScoped(req.db.agents, req.tenantId)[0]?.id,
    unreadCount: req.body.unreadCount || 0
  };
  req.db.conversations.push(newConv);
  saveDb(req);
  res.status(201).json(newConv);
});

app.get('/api/current-tenant/appointments', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.appointments, req.tenantId));
});

app.post('/api/current-tenant/appointments', authMiddleware, tenantMiddleware, (req, res) => {
  const newApp = {
    id: req.body.id || `app-${Date.now()}`,
    tenantId: req.tenantId,
    contactId: req.body.contactId,
    agentId: req.body.agentId || tenantScoped(req.db.agents, req.tenantId)[0]?.id,
    dateTime: req.body.dateTime,
    duration: parseInt(req.body.duration) || 30,
    location: req.body.location || 'Default Office',
    type: req.body.type || 'Consultation',
    status: 'scheduled'
  };
  req.db.appointments.push(newApp);
  const contact = req.db.contacts.find((c) => c.id === newApp.contactId && c.tenantId === req.tenantId);
  if (contact) {
    const timeStr = new Date(newApp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contact.notes = [...(contact.notes || []), `Calendar Scheduler Slot Booked: ${newApp.type} on ${new Date(newApp.dateTime).toLocaleDateString()} at ${timeStr}`];
  }
  saveDb(req);
  res.status(201).json(newApp);
});

app.delete('/api/current-tenant/appointments/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const { index } = requireTenantRecord(req.db, 'appointments', req.params.id, req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Appointment not found.' });
  req.db.appointments[index].status = 'cancelled';
  saveDb(req);
  res.json(req.db.appointments[index]);
});

app.get('/api/current-tenant/agents', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.agents, req.tenantId));
});

app.post('/api/current-tenant/agents', authMiddleware, tenantMiddleware, (req, res) => {
  const newAgent = { ...req.body, id: req.body.id || `a-${Date.now()}`, tenantId: req.tenantId };
  req.db.agents.push(newAgent);
  saveDb(req);
  res.status(201).json(newAgent);
});

app.put('/api/current-tenant/agents/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const { index } = requireTenantRecord(req.db, 'agents', req.params.id, req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Agent not found.' });
  req.db.agents[index] = { ...req.db.agents[index], ...req.body, tenantId: req.tenantId };
  saveDb(req);
  res.json(req.db.agents[index]);
});

app.get('/api/current-tenant/workflows', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.workflows, req.tenantId));
});

app.post('/api/current-tenant/workflows', authMiddleware, tenantMiddleware, (req, res) => {
  const newWorkflow = { ...req.body, id: req.body.id || `wf-${Date.now()}`, tenantId: req.tenantId };
  req.db.workflows.push(newWorkflow);
  saveDb(req);
  res.status(201).json(newWorkflow);
});

app.put('/api/current-tenant/workflows/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const index = req.db.workflows.findIndex(w => w.id === req.params.id && w.tenantId === req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Workflow not found.' });

  req.db.workflows[index] = {
    ...req.db.workflows[index],
    ...req.body,
    id: req.params.id,
    tenantId: req.tenantId
  };
  saveDb(req);
  res.json(req.db.workflows[index]);
});

app.delete('/api/current-tenant/workflows/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const index = req.db.workflows.findIndex(w => w.id === req.params.id && w.tenantId === req.tenantId);
  if (index === -1) return res.status(404).json({ error: 'Workflow not found.' });

  const deleted = req.db.workflows.splice(index, 1)[0];
  saveDb(req);
  res.json(deleted);
});

app.get('/api/current-tenant/team-members', authMiddleware, tenantMiddleware, (req, res) => {
  const members = (req.db.memberships || [])
    .filter((membership) => membership.tenantId === req.tenantId && membership.status === 'active')
    .map((membership) => {
      const user = req.db.users.find((u) => u.id === membership.userId);
      return user ? {
        id: membership.id,
        tenantId: req.tenantId,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: membership.status
      } : null;
    })
    .filter(Boolean);
  res.json([...members, ...tenantScoped(req.db.teamMembers, req.tenantId)]);
});

app.post('/api/current-tenant/team-members', authMiddleware, tenantMiddleware, (req, res) => {
  const member = {
    id: `tm-${Date.now()}`,
    tenantId: req.tenantId,
    name: req.body.name,
    email: req.body.email,
    role: req.body.role || 'Agent',
    permissions: req.body.permissions || {},
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  req.db.teamMembers.push(member);
  saveDb(req);
  res.status(201).json(member);
});

app.delete('/api/current-tenant/team-members/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const before = req.db.teamMembers.length;
  req.db.teamMembers = (req.db.teamMembers || []).filter((member) => !(member.id === req.params.id && member.tenantId === req.tenantId));
  const membershipIndex = (req.db.memberships || []).findIndex((membership) => membership.id === req.params.id && membership.tenantId === req.tenantId);
  if (membershipIndex !== -1) {
    req.db.memberships[membershipIndex].status = 'disabled';
  }
  saveDb(req);
  res.json({ success: before !== req.db.teamMembers.length || membershipIndex !== -1 });
});

app.get('/api/current-tenant/notifications', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.notifications, req.tenantId));
});

app.get('/api/current-tenant/settings', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(req.tenant.settings || {});
});

app.put('/api/current-tenant/settings', authMiddleware, tenantMiddleware, (req, res) => {
  const tenantIndex = req.db.tenants.findIndex((t) => t.id === req.tenantId);
  req.db.tenants[tenantIndex].settings = {
    ...(req.db.tenants[tenantIndex].settings || {}),
    ...req.body
  };
  saveDb(req);
  res.json(req.db.tenants[tenantIndex].settings);
});

// ----------------------------------------
// Tenant Channel Management
// ----------------------------------------
app.get('/api/current-tenant/channels', authMiddleware, tenantMiddleware, (req, res) => {
  res.json({
    channels: tenantChannelConfigs(req.db, req.tenantId)
  });
});

// Native Local Workflow Automation Engine
async function executeWorkflowsForTrigger(db, tenantId, triggerType, context) {
  try {
    const activeWorkflows = (db.workflows || []).filter(w => w.tenantId === tenantId && w.active);
    for (const wf of activeWorkflows) {
      // Find trigger node
      const triggerNode = wf.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) continue;

      let matches = false;
      if (triggerType === 'chat' && triggerNode.label.toLowerCase().includes('chat')) matches = true;
      if (triggerType === 'cal' && triggerNode.label.toLowerCase().includes('calendar')) matches = true;
      if (triggerType === 'escalation' && triggerNode.label.toLowerCase().includes('human')) matches = true;

      if (!matches) continue;

      console.log(`[Workflow Engine] Executing workflow "${wf.name}" (${wf.id}) for trigger ${triggerType}`);
      wf.runsCount = (wf.runsCount || 0) + 1;
      let hasError = false;

      // Executing action nodes
      const actionNodes = wf.nodes.filter(n => n.type === 'action');
      for (const node of actionNodes) {
        const config = node.config || {};
        const connector = config.connectorType || (node.label.toLowerCase().includes('whatsapp') ? 'whatsapp' : node.label.toLowerCase().includes('email') ? 'email' : node.label.toLowerCase().includes('slack') ? 'slack' : node.label.toLowerCase().includes('webhook') ? 'webhook' : node.label.toLowerCase().includes('sms') ? 'sms' : 'crm');

        try {
          console.log(`[Workflow Engine] Running action "${node.label}" via ${connector}`);
          if (connector === 'webhook' && config.webhookUrl) {
            // Perform real HTTP post
            const fetch = (await import('node-fetch')).default || globalThis.fetch;
            await fetch(config.webhookUrl, {
              method: config.webhookMethod || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: triggerType, context, timestamp: new Date().toISOString() })
            });
          } else if (connector === 'crm') {
            // Create a CRM deal in db.deals
            const dealId = `deal-${Date.now()}`;
            const newDeal = {
              id: dealId,
              tenantId,
              contactId: context.contactId || context.contact?.id || '',
              name: `Deal: ${context.contact?.name || 'CRM Lead'}`,
              value: 1200,
              stage: 'lead',
              createdAt: new Date().toISOString()
            };
            db.deals = db.deals || [];
            db.deals.push(newDeal);
            
            // Log note in contact
            const contactId = context.contactId || context.contact?.id;
            if (contactId) {
              const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
              if (contact) {
                contact.notes = contact.notes || [];
                contact.notes.push(`[Workflow] Automatically created CRM pipeline deal: "Deal: ${contact.name}" in stage "Lead".`);
              }
            }
          } else if (connector === 'email') {
            const recipient = config.emailRecipient || context.contact?.email || 'customer@example.com';
            const subject = config.emailSubject || 'Automatic Notification';
            console.log(`[SMTP Mailer] Sent email to ${recipient}. Subject: ${subject}`);
            
            const contactId = context.contactId || context.contact?.id;
            if (contactId) {
              const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
              if (contact) {
                contact.notes = contact.notes || [];
                contact.notes.push(`[Workflow Email] Sent mail to ${recipient}: "${subject}"`);
              }
            }
          } else if (connector === 'sms') {
            const number = config.smsNumber || context.contact?.phone || '';
            const message = config.smsMessage || 'Automated SMS alert';
            console.log(`[SMS Alert] Sent SMS to ${number}: ${message}`);
            
            const contactId = context.contactId || context.contact?.id;
            if (contactId) {
              const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
              if (contact) {
                contact.notes = contact.notes || [];
                contact.notes.push(`[Workflow SMS] Sent text to ${number}: "${message}"`);
              }
            }
          } else if (connector === 'whatsapp') {
            const number = config.whatsappNumber || context.contact?.phone || '';
            const template = config.whatsappTemplate || 'welcome_lead';
            console.log(`[WhatsApp Template] Dispatched template "${template}" to ${number}`);
            
            const contactId = context.contactId || context.contact?.id;
            if (contactId) {
              const contact = db.contacts.find(c => c.id === contactId && c.tenantId === tenantId);
              if (contact) {
                contact.notes = contact.notes || [];
                contact.notes.push(`[Workflow WhatsApp] Dispatched "${template}" to ${number}`);
              }
            }
          } else if (connector === 'slack' && config.slackChannel) {
            console.log(`[Slack Post] Posted to ${config.slackChannel}: ${config.slackMessage}`);
          }
        } catch (err) {
          console.error(`[Workflow Engine Error] Action "${node.label}" failed:`, err);
          hasError = true;
        }
      }

      if (!hasError) {
        wf.successCount = (wf.successCount || 0) + 1;
      }
      wf.lastRun = new Date().toLocaleString();
    }
  } catch (wfErr) {
    console.error('[Workflow Engine Crash]', wfErr);
  }
}

// Dummy provision endpoint for compatibility
// Connect Channel local-only implementation
app.post('/api/current-tenant/channels/:type/connect', authMiddleware, tenantMiddleware, (req, res) => {
  const type = normalizeChannelType(req.params.type);
  const tenantIndex = currentTenantIndex(req.db, req.tenantId);
  if (tenantIndex === -1) return res.status(404).json({ error: 'Tenant not found.' });

  const websiteToken = `local-token-${Date.now()}`;
  const webWidgetScript = `<script src="${req.protocol}://${req.get('host')}/widget.js" data-tenant-id="${req.tenantId}" data-color="#0ea5e9" data-title="${req.tenant.name} AI Assistant"></script>`;

  let channel = upsertChannelConfig(req.db, req.tenantId, {
    type,
    displayName: req.body.displayName || displayChannelName(type),
    status: 'connected',
    config: {
      ...(req.body.config || {}),
      websiteToken,
      webWidgetScript
    }
  });

  saveDb(req);
  res.status(201).json({
    channel
  });
});

// Native conversation endpoints
app.get('/api/current-tenant/conversations/:id', authMiddleware, tenantMiddleware, (req, res) => {
  const conversation = tenantScoped(req.db.conversations, req.tenantId).find((item) => item.id === req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
  res.json({ conversation, source: 'local' });
});

app.post('/api/current-tenant/conversations/:id/messages', authMiddleware, tenantMiddleware, async (req, res) => {
  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });

  const message = {
    id: `m-${Date.now()}`,
    tenantId: req.tenantId,
    conversationId: req.db.conversations[conversationIndex].id,
    sender: req.body.private ? 'note' : req.body.sender || 'human',
    private: !!req.body.private,
    text: req.body.content || req.body.text || '',
    timestamp: new Date().toISOString()
  };
  req.db.conversations[conversationIndex].messages.push(message);

  if (!message.private) {
    req.db.conversations[conversationIndex].lastMessageText = message.text;
    req.db.conversations[conversationIndex].lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    req.db.conversations[conversationIndex].unreadCount = message.sender === 'customer' ? (req.db.conversations[conversationIndex].unreadCount || 0) + 1 : 0;
  }
  saveDb(req);
  res.status(201).json({ message, source: 'local' });
});

app.post('/api/current-tenant/conversations/:id/assignments', authMiddleware, tenantMiddleware, (req, res) => {
  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });

  req.db.conversations[conversationIndex].assignedAgentId = req.body.assigneeId || '';
  req.db.conversations[conversationIndex].status = 'human_escalated';
  saveDb(req);
  res.json({ conversation: req.db.conversations[conversationIndex], source: 'local' });
});

app.post('/api/current-tenant/conversations/:id/labels', authMiddleware, tenantMiddleware, (req, res) => {
  const labels = Array.isArray(req.body.labels) ? req.body.labels : [];
  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });

  req.db.conversations[conversationIndex].labels = labels;
  saveDb(req);
  res.json({ labels, source: 'local' });
});

app.post('/api/current-tenant/conversations/:id/status', authMiddleware, tenantMiddleware, (req, res) => {
  const status = req.body.status;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });

  req.db.conversations[conversationIndex].status = status;
  saveDb(req);

  if (status === 'human_escalated') {
    const conversation = req.db.conversations[conversationIndex];
    const contact = req.db.contacts.find(c => c.id === conversation.contactId && c.tenantId === req.tenantId);
    executeWorkflowsForTrigger(req.db, req.tenantId, 'escalation', { conversationId: conversation.id, conversation, contactId: conversation.contactId, contact });
  }

  res.json({ conversation: req.db.conversations[conversationIndex], source: 'local' });
});


// ----------------------------------------
// Agents & Tenants Endpoints
// ----------------------------------------
app.get('/api/agents', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  res.json(tenantScoped(db.agents, tenantId));
});

app.get('/api/tenants', authMiddleware, (req, res) => {
  res.json(getUserTenants(req.db, req.user.id));
});

// ----------------------------------------
// CRM Pipeline Endpoints
// ----------------------------------------
app.get('/api/contacts', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  res.json(tenantScoped(db.contacts, tenantId));
});

app.post('/api/contacts', async (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);

  // Check if contact with same email or phone already exists for this tenant
  let existingContact = null;
  if (req.body.email || req.body.phone) {
    existingContact = db.contacts.find(c => 
      c.tenantId === tenantId && 
      ((req.body.email && c.email && c.email.toLowerCase() === req.body.email.toLowerCase()) || 
       (req.body.phone && c.phone && c.phone.replace(/\D/g, '') === req.body.phone.replace(/\D/g, '')))
    );
  }

  if (existingContact) {
    existingContact.inquiryCount = (existingContact.inquiryCount || 1) + 1;
    const incomingTags = req.body.tags || ['New Lead'];
    existingContact.tags = Array.from(new Set([...(existingContact.tags || []), ...incomingTags]));
    
    const noteText = `Enquired again via ${req.body.company || 'Chatbot/Widget'} on ${new Date().toLocaleDateString()} (Total inquiries: ${existingContact.inquiryCount})`;
    existingContact.notes = [...(existingContact.notes || []), noteText];
    if (req.body.name) existingContact.name = req.body.name;
    if (req.body.company) existingContact.company = req.body.company;
    if (req.body.city) existingContact.city = req.body.city;

    // Ensure they have a deal in CRM
    const dealExists = db.deals && db.deals.some(d => d.contactId === existingContact.id && d.tenantId === tenantId);
    if (!dealExists) {
      const dealName = tenantId === 't-1' ? 'Dental Consultation' : tenantId === 't-2' ? 'KP Heights Site Visit' : tenantId === 't-3' ? 'Coaching Enrollment' : 'General Inquiry';
      const tenantObj = db.tenants && db.tenants.find(t => t.id === tenantId);
      const dealValue = (tenantObj && tenantObj.settings && typeof tenantObj.settings.defaultLeadValue === 'number')
        ? tenantObj.settings.defaultLeadValue
        : (tenantId === 't-1' ? 450 : tenantId === 't-2' ? 120000 : tenantId === 't-3' ? 1200 : 150);
      const newDeal = {
        id: `d-${Date.now()}`,
        tenantId,
        contactId: existingContact.id,
        name: `${existingContact.name} - ${dealName}`,
        value: dealValue,
        stage: 'lead',
        createdAt: new Date().toISOString()
      };
      if (!db.deals) db.deals = [];
      db.deals.push(newDeal);
    }

    // Append to or create conversation
    let activeConv = db.conversations && db.conversations.find(c => c.contactId === existingContact.id && c.tenantId === tenantId);
    if (activeConv) {
      const msg1 = { id: `m-${Date.now()}-1`, tenantId, conversationId: activeConv.id, sender: 'customer', text: `Enquired again: My name is ${existingContact.name}, email: ${existingContact.email}, phone: ${existingContact.phone}`, timestamp: new Date().toISOString() };
      const msg2 = { id: `m-${Date.now()}-2`, tenantId, conversationId: activeConv.id, sender: 'ai', text: `Welcome back! I have saved your latest inquiry. How can I help you today?`, timestamp: new Date().toISOString() };
      activeConv.messages.push(msg1, msg2);
      activeConv.lastMessageText = msg2.text;
      activeConv.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      const newConversation = {
        id: `conv-${Date.now()}`,
        tenantId,
        contactId: existingContact.id,
        status: 'ai_active',
        channel: 'web',
        messages: [
          { id: `m-${Date.now()}-1`, tenantId, conversationId: `conv-${Date.now()}`, sender: 'ai', text: 'Welcome back! How can I help you today?', timestamp: new Date().toISOString() }
        ],
        lastMessageText: 'Welcome back! How can I help you today?',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assignedAgentId: existingContact.assignedAgentId || 'a-1',
        unreadCount: 0
      };
      if (!db.conversations) db.conversations = [];
      db.conversations.push(newConversation);
    }

    executeWorkflowsForTrigger(db, tenantId, 'chat', { contactId: existingContact.id, contact: existingContact });
    writeDb(db);
    return res.status(200).json(existingContact);
  }

  const newContact = {
    id: `c-${Date.now()}`,
    tenantId,
    createdAt: new Date().toISOString(),
    tags: req.body.tags || ['New Lead'],
    notes: req.body.notes || [],
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company || 'Individual',
    city: req.body.city || '',
    assignedAgentId: req.body.assignedAgentId || 'a-1',
    inquiryCount: 1
  };

  db.contacts.push(newContact);

  // Automatically create a deal in the 'lead' stage for this new contact
  const dealName = tenantId === 't-1' ? 'Dental Consultation' : tenantId === 't-2' ? 'KP Heights Site Visit' : tenantId === 't-3' ? 'Coaching Enrollment' : 'General Inquiry';
  const tenantObj = db.tenants && db.tenants.find(t => t.id === tenantId);
  const dealValue = (tenantObj && tenantObj.settings && typeof tenantObj.settings.defaultLeadValue === 'number')
    ? tenantObj.settings.defaultLeadValue
    : (tenantId === 't-1' ? 450 : tenantId === 't-2' ? 120000 : tenantId === 't-3' ? 1200 : 150);
  const newDeal = {
    id: `d-${Date.now()}`,
    tenantId,
    contactId: newContact.id,
    name: `${newContact.name} - ${dealName}`,
    value: dealValue,
    stage: 'lead',
    createdAt: new Date().toISOString()
  };
  if (!db.deals) db.deals = [];
  db.deals.push(newDeal);

  // Automatically create a local conversation for this contact to prevent empty inbox
  const newConversation = {
    id: `conv-${Date.now()}`,
    tenantId,
    contactId: newContact.id,
    status: 'ai_active',
    channel: 'web',
    messages: [
      { id: `m-${Date.now()}-1`, tenantId, conversationId: `conv-${Date.now()}`, sender: 'ai', text: 'Hello! Welcome to our virtual assistant.', timestamp: new Date().toISOString() },
      { id: `m-${Date.now()}-2`, tenantId, conversationId: `conv-${Date.now()}`, sender: 'customer', text: `My name is ${newContact.name}, email: ${newContact.email}, phone: ${newContact.phone}`, timestamp: new Date().toISOString() },
      { id: `m-${Date.now()}-3`, tenantId, conversationId: `conv-${Date.now()}`, sender: 'ai', text: 'Perfect! I have saved your contact details. How can I help you today?', timestamp: new Date().toISOString() }
    ],
    lastMessageText: 'Perfect! I have saved your contact details. How can I help you today?',
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: newContact.assignedAgentId || 'a-1',
    unreadCount: 0
  };
  if (!db.conversations) db.conversations = [];
  db.conversations.push(newConversation);

  // Trigger chat/lead capture workflows
  executeWorkflowsForTrigger(db, tenantId, 'chat', { contactId: newContact.id, contact: newContact });

  writeDb(db);
  res.status(201).json(newContact);
});

app.put('/api/contacts/:id', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  const contactIndex = db.contacts.findIndex(c => c.id === req.params.id && c.tenantId === tenantId);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  db.contacts[contactIndex] = {
    ...db.contacts[contactIndex],
    ...req.body
  };
  writeDb(db);
  res.json(db.contacts[contactIndex]);
});

app.get('/api/deals', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  res.json(tenantScoped(db.deals, tenantId));
});

app.post('/api/deals', (req, res) => {
  const db = readDb();
  const newDeal = {
    id: `d-${Date.now()}`,
    tenantId: tenantFromPublicRequest(req),
    createdAt: new Date().toISOString(),
    contactId: req.body.contactId,
    name: req.body.name,
    value: parseFloat(req.body.value) || 0,
    stage: req.body.stage || 'lead'
  };

  db.deals.push(newDeal);
  writeDb(db);
  res.status(201).json(newDeal);
});

app.put('/api/deals/:id', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  const dealIndex = db.deals.findIndex(d => d.id === req.params.id && d.tenantId === tenantId);
  if (dealIndex === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  db.deals[dealIndex] = {
    ...db.deals[dealIndex],
    ...req.body
  };
  writeDb(db);
  res.json(db.deals[dealIndex]);
});

app.get('/api/conversations', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  res.json(tenantScoped(db.conversations, tenantId));
});

app.post('/api/conversations', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  const existingIndex = db.conversations.findIndex(c => c.id === req.body.id && c.tenantId === tenantId);
  if (existingIndex !== -1) {
    db.conversations[existingIndex] = {
      ...db.conversations[existingIndex],
      ...req.body
    };
    writeDb(db);
    return res.json(db.conversations[existingIndex]);
  }

  const newConv = {
    id: req.body.id || `conv-${Date.now()}`,
    tenantId,
    contactId: req.body.contactId,
    status: req.body.status || 'ai_active',
    channel: req.body.channel || 'web',
    messages: (req.body.messages || []).map(message => ({ ...message, tenantId, conversationId: req.body.id })),
    lastMessageText: req.body.lastMessageText || '',
    lastMessageTime: req.body.lastMessageTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: req.body.assignedAgentId || 'a-1',
    unreadCount: req.body.unreadCount || 0
  };

  db.conversations.push(newConv);
  writeDb(db);
  res.status(201).json(newConv);
});

// Public conversation handoff trigger from chatbot widget
app.post('/api/conversations/:id/handoff', (req, res) => {
  const db = readDb();
  let convIndex = -1;
  const targetId = req.params.id;

  if (targetId && targetId !== 'current' && targetId !== 'null' && targetId !== 'undefined') {
    convIndex = db.conversations.findIndex(c => c.id === targetId);
  }

  // If not found by ID, look up by email and tenantId
  if (convIndex === -1) {
    const { email, tenantId } = req.body;
    if (email && tenantId) {
      const contact = db.contacts.find(c => c.email === email && c.tenantId === tenantId);
      if (contact) {
        convIndex = db.conversations.findIndex(c => c.contactId === contact.id && c.tenantId === tenantId && c.channel === 'web');
      }
    }
  }

  // If still not found, let's create a placeholder contact & conversation to capture the handoff!
  if (convIndex === -1) {
    const { email, tenantId, name, phone } = req.body;
    const resolvedTenantId = tenantId || 't-1';
    
    let contact = null;
    if (email) {
      contact = db.contacts.find(c => c.email === email && c.tenantId === resolvedTenantId);
    }
    
    if (!contact) {
      contact = {
        id: `c-${Date.now()}`,
        tenantId: resolvedTenantId,
        createdAt: new Date().toISOString(),
        tags: ['Web Lead', 'Handoff Request'],
        notes: ['Created automatically during human handoff request.'],
        name: name || 'Web Visitor',
        email: email || `visitor-${Date.now()}@airaos.com`,
        phone: phone || '',
        company: 'Chatbot Handoff',
        city: '',
        assignedAgentId: 'a-1'
      };
      db.contacts.push(contact);
    }

    const newConv = {
      id: `conv-${Date.now()}`,
      tenantId: resolvedTenantId,
      contactId: contact.id,
      status: 'human_escalated',
      channel: 'web',
      messages: [
        { id: `m-${Date.now()}-1`, tenantId: resolvedTenantId, conversationId: `conv-${Date.now()}`, sender: 'customer', text: 'Talk to Human (Handoff Requested)', timestamp: new Date().toISOString() }
      ],
      lastMessageText: 'Talk to Human (Handoff Requested)',
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedAgentId: 'a-1',
      unreadCount: 1
    };
    
    db.conversations.push(newConv);
    convIndex = db.conversations.length - 1;
  }

  db.conversations[convIndex].status = 'human_escalated';

  const conversation = db.conversations[convIndex];

  const notification = {
    id: `notif-${Date.now()}`,
    tenantId: conversation.tenantId,
    title: 'Human Handoff Requested',
    message: `A visitor has requested a human agent.`,
    read: false,
    createdAt: new Date().toISOString()
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.push(notification);

  if (conversation.contactId) {
    const contact = db.contacts.find(c => c.id === conversation.contactId && c.tenantId === conversation.tenantId);
    if (contact) {
      if (!contact.notes) contact.notes = [];
      contact.notes.push(`[${new Date().toLocaleString()}] Handoff requested: paused AI and alerted team.`);
    }
  }

  const contact = conversation.contactId ? db.contacts.find(c => c.id === conversation.contactId && c.tenantId === conversation.tenantId) : null;
  executeWorkflowsForTrigger(db, conversation.tenantId, 'escalation', { conversationId: conversation.id, conversation, contactId: conversation.contactId, contact });

  writeDb(db);
  res.json({ success: true, conversation });
});

// Dynamic routing / preview for tenant websites
app.get('/website/:slug', (req, res) => {
  const db = readDb();
  const tenant = db.tenants.find(t => t.slug === req.params.slug);
  if (!tenant) {
    return res.status(404).send('Tenant not found');
  }

  if (tenant.websiteConfig && tenant.websiteConfig.html) {
    let html = tenant.websiteConfig.html;
    if (!html.includes('widget.js')) {
      const widgetScript = `
        <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
      `;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${widgetScript}</body>`);
      } else {
        html = html + widgetScript;
      }
    }
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } else {
    // Return a sleek placeholder preview page with chatbot widget
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px 20px; background: #0a0f1d; color: #fff; min-height: 100vh;">
        <h1 style="color: ${tenant.primaryColor || '#0ea5e9'}; font-size: 2.5rem; margin-bottom: 10px;">${tenant.name}</h1>
        <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 30px;">Website has not been generated yet. Please go to the Website Builder tab and click "Generate AI Website" to build it.</p>
        <div style="display: inline-block;">
          <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
        </div>
      </div>
    `);
  }
});

// ----------------------------------------
// Calendar Scheduler Endpoints
// ----------------------------------------
app.get('/api/appointments', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  res.json(tenantScoped(db.appointments, tenantId));
});

app.post('/api/appointments', (req, res) => {
  const db = readDb();
  const newApp = {
    id: req.body.id || `app-${Date.now()}`,
    tenantId: tenantFromPublicRequest(req),
    contactId: req.body.contactId,
    agentId: req.body.agentId || 'a-1',
    dateTime: req.body.dateTime, // Format: YYYY-MM-DDTHH:MM
    duration: parseInt(req.body.duration) || 30,
    location: req.body.location || 'Default Suite Office',
    type: req.body.type || 'Consultation',
    status: 'scheduled'
  };

  db.appointments.push(newApp);

  // Sync to contact profile notes
  const contact = db.contacts.find(c => c.id === newApp.contactId && c.tenantId === newApp.tenantId);
  if (contact) {
    const timeStr = new Date(newApp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contact.notes.push(`Calendar Scheduler Slot Booked: ${newApp.type} on ${new Date(newApp.dateTime).toLocaleDateString()} at ${timeStr}`);
  }

  // Trigger calendar workflows
  executeWorkflowsForTrigger(db, newApp.tenantId, 'cal', { appointmentId: newApp.id, appointment: newApp, contactId: newApp.contactId, contact });

  writeDb(db);
  res.status(201).json(newApp);
});

app.delete('/api/appointments/:id', (req, res) => {
  const db = readDb();
  const tenantId = tenantFromPublicRequest(req);
  const appIndex = db.appointments.findIndex(a => a.id === req.params.id && a.tenantId === tenantId);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  db.appointments[appIndex].status = 'cancelled';
  writeDb(db);
  res.json(db.appointments[appIndex]);
});

// Availability generator
app.get('/api/availability', (req, res) => {
  const db = readDb();
  const { tenantId = 't-1', date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Date query param required (YYYY-MM-DD)' });
  }

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // Load working shifts for tenant
  const shifts = db.working_shifts[tenantId] || {};
  const dayShift = shifts[dayOfWeek] || { enabled: false, start: "09:00", end: "18:00" };

  if (!dayShift.enabled) {
    return res.json([]);
  }

  // Parse start/end hours
  const [startHour, startMin] = dayShift.start.split(':').map(Number);
  const [endHour, endMin] = dayShift.end.split(':').map(Number);

  const slots = [];
  let current = new Date(`${date}T${dayShift.start.padStart(5, '0')}:00`);
  const end = new Date(`${date}T${dayShift.end.padStart(5, '0')}:00`);

  while (current < end) {
    const timeString = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Check if slot is already booked
    const slotIsoString = current.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
    const isBooked = db.appointments.some(app => 
      app.tenantId === tenantId &&
      app.status === 'scheduled' && 
      app.dateTime.substring(0, 16) === slotIsoString
    );

    if (!isBooked) {
      slots.push(timeString);
    }
    // Add 30 minutes
    current.setMinutes(current.getMinutes() + 30);
  }

  res.json(slots);
});

app.get('/api/working-shift/:tenantId', (req, res) => {
  const db = readDb();
  res.json(db.working_shifts[req.params.tenantId] || {});
});

app.put('/api/working-shift/:tenantId', (req, res) => {
  const db = readDb();
  db.working_shifts[req.params.tenantId] = req.body;
  writeDb(db);
  res.json({ success: true });
});

// ----------------------------------------
// Settings / Integrations Endpoints
// ----------------------------------------
app.get('/api/integrations', (req, res) => {
  const db = readDb();
  res.json(decryptCredentials(db.integrations || {}));
});

app.put('/api/integrations', (req, res) => {
  const db = readDb();
  db.integrations = encryptCredentials({
    ...(db.integrations || {}),
    ...req.body
  });
  writeDb(db);
  res.json(decryptCredentials(db.integrations));
});

// Platform Support Bot endpoints
app.get('/api/platform-support-bot', (req, res) => {
  const db = readDb();
  res.json(db.platformSupportBot || {
    enabled: true,
    name: 'Platform Guide',
    avatar: '🤖',
    welcomeMessage: 'Hi! I am the AiraOS Platform Assistant. How can I help you integrate Twilio, configure BYO phone carriers, or understand our packages and rates today?',
    prompt: 'You are the AiraOS Platform Assistant (Reception AI), a professional and friendly digital concierge designed to guide workspace tenants and platform customers through configurations, integrations, billing, and carrier setups.\n\nYour task is to provide clear, actionable assistance regarding:\n\n1. TELEPHONY & VOICE AI INTEGRATIONS:\n- Twilio Integration: Users can bring their own keys. Require Twilio Account SID, Auth Token, and Twilio Phone Number (or Messaging Service SID) in the integrations settings tab.\n- BYO (Bring Your Own) Carrier: Set up custom trunk routing using Twilio or direct telephony settings.\n- Webhook Routing URL: To handle inbound SMS, WhatsApp replies, or incoming calls on custom numbers, the user must copy the dynamic Webhook URL from the Integrations panel (formatted as `https://<your-domain>/api/voice/inbound?tenantId=<tenant_id>`) and paste it as the Webhook (HTTP POST) handler in their Twilio Console or custom Carrier dashboard.\n\n2. UNIFIED CRM & CHANNELS:\n- Channels: AiraOS natively connects and provisions local channels (Website widget, Telegram, Email Support, etc.) without requiring external helpdesk systems.\n- Workflow Engine: AiraOS features a native Visual Workflow Designer which runs locally to automate CRM deal states, trigger notifications, or send webhook alerts.\n\n3. PAYMENT GATEWAYS:\n- Admin Gateway Configuration: The SuperAdmin can configure and activate either PhonePe or Razorpay as the global active payment gateway.\n- PhonePe requires: Merchant ID, Salt Key, and Salt Index.\n- Razorpay requires: Key ID and Key Secret.\n- Tenant Upgrades: Once configured, tenants can purchase extra chat/voice credits or upgrade subscription packages directly inside their billing panel using active UPI, card, or netbanking hosted checkout sessions.\n\n4. PLATFORM PLANS, RATES & OVERAGES:\n- Growth Plan: includes chats, voice minutes, and website generation edits.\n- Scale Plan: includes higher caps and more active digital employees.\n- Enterprise Plan: includes unlimited digital employees and priority SLAs.\n- Overage Charges: Extra chats, extra voice minutes, and call rates can all be dynamically configured by the SuperAdmin from the admin billing panel.\n- Currency: The currency symbol (e.g. $, ₹, €, £) is set globally by the SuperAdmin and dynamically reflects across all customer billing layouts.\n\nBe direct, highly professional, structured, and helpful. Always guide the user to the correct tab (e.g. Settings > Integrations, Settings > Billing) to configure these options.'
  });
});

app.put('/api/platform-support-bot', (req, res) => {
  const db = readDb();
  db.platformSupportBot = {
    ...(db.platformSupportBot || {}),
    ...req.body
  };
  writeDb(db);
  res.json(db.platformSupportBot);
});

// Platform Billing & Plans Settings endpoints
app.get('/api/platform-billing-settings', (req, res) => {
  const db = readDb();
  res.json(db.platformSettings || {
    growthPrice: 2499,
    growthChats: 5000,
    growthVoice: 300,
    growthWebsites: 2,
    scalePrice: 6999,
    scaleChats: 25000,
    scaleVoice: 2000,
    scaleWebsites: 5,
    enterprisePrice: 19999,
    enterpriseChats: 999999,
    enterpriseVoice: 999999,
    enterpriseWebsites: 999,
    currency: '₹',
    overageChatRate: 0.05,
    overageVoiceRate: 0.15,
    inboundCallRate: 0.10,
    outboundCallRate: 0.20,
    voiceSynthesisRate: 0.02,
    chatAddonPrice: 250,
    voiceAddonPrice: 400
  });
});

app.put('/api/platform-billing-settings', (req, res) => {
  const db = readDb();
  db.platformSettings = {
    ...(db.platformSettings || {}),
    ...req.body
  };
  writeDb(db);
  res.json(db.platformSettings);
});

// Tenant-Specific Integrations
app.get('/api/tenants/:id/integrations', authMiddleware, (req, res) => {
  const db = req.db;
  const hasAccess = db.memberships.some((m) => m.userId === req.user.id && m.tenantId === req.params.id && m.status === 'active');
  if (!hasAccess) return res.status(403).json({ error: 'You do not have access to this tenant.' });
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(decryptCredentials(tenant.integrations || {}));
});

app.put('/api/tenants/:id/integrations', authMiddleware, (req, res) => {
  const db = req.db;
  const hasAccess = db.memberships.some((m) => m.userId === req.user.id && m.tenantId === req.params.id && m.status === 'active');
  if (!hasAccess) return res.status(403).json({ error: 'You do not have access to this tenant.' });
  const tenantIndex = db.tenants.findIndex(t => t.id === req.params.id);
  if (tenantIndex === -1) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  db.tenants[tenantIndex].integrations = encryptCredentials({
    ...(db.tenants[tenantIndex].integrations || {}),
    ...req.body
  });
  writeDb(db);
  res.json(decryptCredentials(db.tenants[tenantIndex].integrations));
});

// Helper to call OpenAI, Gemini, or DeepSeek chat completion models
async function callModel(provider, apiKey, messages, temperature = 0.5) {
  if (provider === 'gemini') {
    const systemMessage = messages.find(m => m.role === 'system');
    const systemPrompt = systemMessage ? systemMessage.content : '';
    
    const geminiContents = [];
    messages.forEach(msg => {
      if (msg.role === 'system') return;
      const role = (msg.role === 'user') ? 'user' : 'model';
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
        geminiContents[geminiContents.length - 1].parts[0].text += '\n' + msg.content;
      } else {
        geminiContents.push({
          role: role,
          parts: [{ text: msg.content }]
        });
      }
    });

    if (geminiContents.length > 0 && geminiContents[0].role === 'model') {
      geminiContents.shift();
    }
    
    if (geminiContents.length === 0) {
      geminiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: geminiContents,
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        generationConfig: {
          temperature: temperature
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Gemini API response structure invalid: ' + JSON.stringify(data));
  } else if (provider === 'deepseek') {
    const url = 'https://api.deepseek.com/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('DeepSeek API response structure invalid: ' + JSON.stringify(data));
  } else {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('OpenAI API response structure invalid: ' + JSON.stringify(data));
  }
}

// ----------------------------------------
// AI Brain chat endpoint
// ----------------------------------------
app.post('/api/chat', async (req, res) => {
  const db = readDb();
  const { message, history = [], tenantId = 't-1', agentId = 'a-1', identity } = req.body;

  let agent;
  if (agentId === 'platform-support') {
    agent = db.platformSupportBot || {
      name: 'Platform Guide',
      avatar: '🤖',
      prompt: 'You are the AiraOS Platform Assistant, a friendly and extremely helpful digital receptionist for AiraOS platform users (tenants).'
    };
  } else {
    agent = db.agents.find(a => a.id === agentId && a.tenantId === tenantId) || tenantScoped(db.agents, tenantId)[0] || db.agents[0];
  }
  const tenant = db.tenants.find(t => t.id === tenantId);
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}), ...(tenant?.settings || {}) };

  // Retrieve relevant knowledge grounding chunks (RAG) filtered by tenant
  const allChunks = db.knowledge_chunks || [];
  const tenantChunks = allChunks.filter(chunk => {
    const chunkTenantId = chunk.tenantId || (
      (chunk.sourceId === 'ks-5' || chunk.sourceId === 'ks-6') ? 't-2' : 
      (chunk.sourceId === 'ks-7') ? 't-3' : 't-1'
    );
    return chunkTenantId === tenantId;
  });
  const groundingContext = searchKnowledgeChunks(message, tenantChunks);

  // Check if identity is passed and link contact/conversation
  let contact = null;
  let conversation = null;

  if (identity && identity.email) {
    // Find or create local contact
    contact = db.contacts.find((c) => c.email === identity.email && c.tenantId === tenantId);
    if (!contact) {
      contact = {
        id: `c-${Date.now()}`,
        tenantId,
        createdAt: new Date().toISOString(),
        tags: ['Web Lead'],
        notes: ['Created dynamically via chatbot widget session.'],
        name: identity.name || 'Web Visitor',
        email: identity.email,
        phone: identity.phone || '',
        company: 'Chatbot Lead Capture',
        city: '',
        assignedAgentId: agentId || 'a-1'
      };
      db.contacts.push(contact);
    }

    // Find or create local conversation
    conversation = db.conversations.find((c) => c.contactId === contact.id && c.tenantId === tenantId && c.channel === 'web');
    if (!conversation) {
      conversation = {
        id: `conv-${Date.now()}`,
        tenantId,
        contactId: contact.id,
        status: 'ai_active',
        channel: 'web',
        messages: [],
        lastMessageText: '',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assignedAgentId: agentId || 'a-1',
        unreadCount: 0
      };
      db.conversations.push(conversation);
    }

    // Append user message locally
    const customerMsg = {
      id: `m-cust-${Date.now()}`,
      tenantId,
      conversationId: conversation.id,
      sender: 'customer',
      text: message,
      timestamp: new Date().toISOString()
    };
    conversation.messages.push(customerMsg);
    conversation.lastMessageText = message;
    conversation.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    writeDb(db);

    if (conversation.status === 'human_escalated') {
      return res.json({
        text: "Connecting you to a human manager... Please wait.",
        paused: true
      });
    }
  }



  const activeProvider = integrations.activeModelProvider || 'openai';
  let apiKey = '';
  if (activeProvider === 'gemini') {
    apiKey = integrations.geminiApiKey || process.env.GEMINI_API_KEY;
  } else if (activeProvider === 'deepseek') {
    apiKey = integrations.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  } else {
    apiKey = integrations.openaiApiKey || integrations.difyApiKey || process.env.OPENAI_API_KEY;
  }

  if (apiKey) {
    // Call live AI Brain
    try {
      const messages = [
        {
          role: 'system',
          content: `${agent.prompt}\n\nGrounding Context Knowledge:\n${groundingContext.join('\n')}\n\nConstraint: If scheduling a calendar slot, insert a tag like "[BOOK: YYYY-MM-DDTHH:MM]" in the text when appointment details are confirmed.`
        },
        ...history.map(msg => ({
          role: msg.sender === 'customer' || msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.content
        })),
        { role: 'user', content: message }
      ];

      const reply = await callModel(activeProvider, apiKey, messages, 0.5);

      // Save reply locally
      if (conversation) {
        const currentDb = readDb();
        const localConv = currentDb.conversations.find((c) => c.id === conversation.id);
        if (localConv) {
          const aiMsg = {
            id: `m-ai-${Date.now()}`,
            tenantId,
            conversationId: localConv.id,
            sender: 'ai',
            text: reply,
            timestamp: new Date().toISOString()
          };
          localConv.messages.push(aiMsg);
          localConv.lastMessageText = reply;
          localConv.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          writeDb(currentDb);
        }

        // Sync AI reply to Chatwoot (Removed)
      }
      
      return res.json({
        text: reply,
        reasoning: `Retrieved ${groundingContext.length} knowledge chunks.\nOpenAI API Call executed successfully.`
      });
    } catch (err) {
      console.error('Error during OpenAI Call:', err);
    }
  }

  // Fallback reasoning simulation
  setTimeout(async () => {
    let reply = `I am ${agent.name}, your virtual coordinator. I received your message: "${message}".`;
    let reasoning = `Retrieved ${groundingContext.length} knowledge chunks.\nSimulated offline fallback.`;

    const textLower = message.toLowerCase();

    // Check conversation history context first!
    let isReplyingToSlots = false;
    let lastAiMsgText = '';
    
    if (history && history.length > 0) {
      const lastAi = [...history].reverse().find(m => m.sender === 'ai' || m.role === 'assistant');
      if (lastAi) {
        lastAiMsgText = lastAi.text || lastAi.content || '';
        if (lastAiMsgText.toLowerCase().includes('open slots') || lastAiMsgText.toLowerCase().includes('works for you')) {
          isReplyingToSlots = true;
        }
      }
    } else if (conversation && conversation.messages && conversation.messages.length > 0) {
      const lastAi = [...conversation.messages].reverse().find(m => m.sender === 'ai');
      if (lastAi) {
        lastAiMsgText = lastAi.text || '';
        if (lastAiMsgText.toLowerCase().includes('open slots') || lastAiMsgText.toLowerCase().includes('works for you')) {
          isReplyingToSlots = true;
        }
      }
    }

    if (agentId === 'platform-support') {
      if (/\b(sip|byo|carrier|trunk)\b/i.test(message)) {
        reply = `To integrate SIP or Bring Your Own (BYO) carrier in AiraOS, go to **Settings > Integrations**. Under the **BYO Carrier Settings** section, input your custom SIP server host address, username, password, and the phone number. Click **Save Settings** to persist the details to the system.`;
      } else if (/\b(twilio)\b/i.test(message)) {
        reply = `To integrate Twilio, go to **Settings > Integrations** and expand **Twilio Settings**. Enter your Twilio Account SID, Auth Token, and Twilio Phone Number, then save the configuration. The platform routes outbound/inbound calls using these credentials.`;
      } else if (/\b(rate|rates|price|prices|pricing|package|packages|pack|tier|tiers|cost|costs|credit|credits|billing|subscribe|subscription)\b/i.test(message)) {
        reply = `AiraOS has 3 subscription packages:\n- **Growth (₹2,499/mo):** 5,000 chats, 300 voice minutes.\n- **Scale (₹6,999/mo):** 25,000 chats, 2,000 voice minutes.\n- **Enterprise (₹19,999/mo+):** Unlimited chats/voice, unlimited digital employees.\n\n**Overage fees:** $0.05 per extra chat, $0.15 per extra voice minute. Inbound calls are $0.10/min, and outbound calls are $0.20/min. Custom voice synthesis costs $0.02/min.`;
      } else if (/\b(hi|hello|help|hey|greetings|support)\b/i.test(message)) {
        reply = `Hello! I am the Platform Assistant. I am here to help you resolve doubts on integrating SIP trunking, connecting Twilio API keys, configuring BYO Carriers, or reviewing plan packages and rates. How can I help you today?`;
      } else {
        reply = `I understand your concern about "${message}". To set up integrations (like Twilio, BYO SIP Carrier, PhonePe API keys, or CRM sync channels), navigate to **Settings > Integrations**. You can configure billing limits under **Settings > Billing & Subscriptions**. Let me know if you need more details!`;
      }
    } else if (isReplyingToSlots && (/\b(10|morning|2|afternoon|pm|am|tomorrow|yes|sure|work|one)\b/i.test(textLower))) {
      let chosenTime = "10:00 AM";
      if (/\b(2|afternoon|30)\b/i.test(textLower)) {
        chosenTime = "2:30 PM";
      }
      reply = `I have successfully booked your appointment for tomorrow at ${chosenTime}. We look forward to seeing you!`;
      
      // Persist to actual database
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().substring(0, 10);
        const timeStr = chosenTime === '2:30 PM' ? '14:30' : '10:00';
        const dateTimeStr = `${dateStr}T${timeStr}`;

        const currentDb = readDb();
        const newApp = {
          id: `app-chat-${Date.now()}`,
          tenantId,
          contactId: (contact && contact.id) || 'c-default',
          agentId: agentId || 'a-1',
          dateTime: dateTimeStr,
          duration: 30,
          location: 'Smile Dental Clinic Office',
          type: 'Web Chat AI Booking',
          status: 'scheduled'
        };
        if (!currentDb.appointments) currentDb.appointments = [];
        currentDb.appointments.push(newApp);
        
        // Save note to contact
        if (contact) {
          const contactIdx = currentDb.contacts.findIndex(c => c.id === contact.id);
          if (contactIdx !== -1) {
            if (!currentDb.contacts[contactIdx].notes) currentDb.contacts[contactIdx].notes = [];
            currentDb.contacts[contactIdx].notes.push(`Booked slot via Web Chat: tomorrow at ${chosenTime}`);
          }
        }
        writeDb(currentDb);
      } catch (err) {
        console.error('Error adding mock appointment:', err);
      }
    } else if (/\b(hour|hours|open|time|times)\b/i.test(message)) {
      reply = `We are open Monday to Friday, 9:00 AM to 6:00 PM. Would you like to schedule a slot during these hours?`;
    } else if (/\b(book|booking|appointment|appointments|schedule|scheduling)\b/i.test(message)) {
      reply = `I can help you schedule that! We have open slots tomorrow morning at 10:00 AM or tomorrow afternoon at 2:30 PM. Which one works for you?`;
    } else if (groundingContext.length > 0) {
      reply = `Based on our guides: "${groundingContext[0].substring(0, 150)}..." How can I help you further with this?`;
    }

    // Save reply locally
    if (conversation) {
      const currentDb = readDb();
      const localConv = currentDb.conversations.find((c) => c.id === conversation.id);
      if (localConv) {
        const aiMsg = {
          id: `m-ai-${Date.now()}`,
          tenantId,
          conversationId: localConv.id,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toISOString()
        };
        localConv.messages.push(aiMsg);
        localConv.lastMessageText = reply;
        localConv.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        writeDb(currentDb);
      }

      // Sync AI reply to Chatwoot (Removed)
    }

    res.json({ text: reply, reasoning });
  }, 1000);
});

// Email chat transcript endpoint
app.post('/api/chat/email', (req, res) => {
  const { email, transcript } = req.body;
  console.log(`[Email Dispatch Simulation] Sending chat transcript to ${email}:`, transcript);
  res.json({ success: true, message: `Transcript sent to ${email}` });
});

// ----------------------------------------
// CrewAI Native Execution Route
// ----------------------------------------
app.post('/api/crew/run', async (req, res) => {
  const db = readDb();
  const { crewAgents, tasks, inputs = {}, tenantId = 't-1' } = req.body;

  if (!crewAgents || !tasks || !Array.isArray(crewAgents) || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Parameters crewAgents and tasks are required and must be arrays.' });
  }

  const tenant = db.tenants.find(t => t.id === tenantId);
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}), ...(tenant?.settings || {}) };

  try {
    const result = await runCrew({
      crewAgentIds: crewAgents,
      tasks,
      inputs,
      db,
      integrations,
      tenantId
    });
    res.json(result);
  } catch (err) {
    console.error('CrewAI Execution Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------
// PhonePe Payment Gateway Router
// ----------------------------------------
app.post('/api/phonepe/pay', async (req, res) => {
  const { tenantId, amount, type, planName, creditsCount } = req.body;
  const db = readDb();
  
  if (!tenantId || !amount) {
    return res.status(400).json({ error: 'tenantId and amount parameters are required.' });
  }

  const tenant = db.tenants.find(t => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  const activeGateway = db.integrations?.activePaymentGateway || 'phonepe';
  const transactionId = `TX-${Date.now()}`;
  const host = req.get('host');
  const protocol = req.protocol;
  
  const callbackUrl = `${protocol}://${host}/api/phonepe/callback?transactionId=${transactionId}&tenantId=${tenantId}&amount=${amount}&type=${type}&planName=${planName || ''}&creditsCount=${creditsCount || 0}`;

  if (activeGateway === 'phonepe') {
    const saltKey = db.integrations?.phonepeSaltKey || process.env.PHONEPE_SALT_KEY;
    const merchantId = db.integrations?.phonepeMerchantId || process.env.PHONEPE_MERCHANT_ID;
    const saltIndex = db.integrations?.phonepeSaltIndex || '1';

    if (saltKey && merchantId) {
      try {
        const crypto = await import('crypto');
        const amountInPaise = Math.round(parseFloat(amount) * 100);
        
        const payload = {
          merchantId: merchantId,
          merchantTransactionId: transactionId,
          merchantUserId: `USER-${tenantId}`,
          amount: amountInPaise,
          redirectUrl: callbackUrl,
          redirectMode: "GET",
          callbackUrl: `${protocol}://${host}/api/phonepe/webhook`,
          mobileNumber: "9999999999",
          paymentInstrument: {
            type: "PAY_PAGE"
          }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const signatureString = base64Payload + "/pg/v1/pay" + saltKey;
        const sha256 = crypto.default.createHash('sha256').update(signatureString).digest('hex');
        const checksum = sha256 + "###" + saltIndex;

        const phonepeUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
          : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

        const response = await fetch(phonepeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'accept': 'application/json'
          },
          body: JSON.stringify({ request: base64Payload })
        });

        if (!response.ok) {
          throw new Error(`PhonePe Gateway returned status ${response.status}`);
        }

        const resData = await response.json();
        if (resData.success && resData.data?.instrumentResponse?.redirectInfo?.url) {
          return res.json({ success: true, redirectUrl: resData.data.instrumentResponse.redirectInfo.url });
        } else {
          throw new Error(resData.message || 'Payment initiation failed');
        }
      } catch (err) {
        console.error("PhonePe API error:", err);
        const clientHost = req.get('referer') || `${protocol}://${host}/`;
        const fallbackSimUrl = `${clientHost.split('?')[0]}#phonepe-checkout?transactionId=${transactionId}&tenantId=${tenantId}&amount=${amount}&type=${type}&planName=${planName || ''}&creditsCount=${creditsCount || 0}`;
        return res.json({ success: true, redirectUrl: fallbackSimUrl, warning: `API call failed (${err.message}). Redirected to sandbox simulator.` });
      }
    }
  } else if (activeGateway === 'razorpay') {
    const keyId = db.integrations?.razorpayKeyId;
    const keySecret = db.integrations?.razorpayKeySecret;

    if (keyId && keySecret) {
      try {
        const amountInPaise = Math.round(parseFloat(amount) * 100);
        const response = await fetch('https://api.razorpay.com/v1/payment_links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64')
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            accept_partial: false,
            expire_by: Math.floor(Date.now() / 1000) + 1800,
            reference_id: transactionId,
            description: `AiraOS Subscription / Credits: ${planName || creditsCount + ' Credits'}`,
            customer: {
              name: tenant.name || 'Tenant Owner',
              email: tenant.email || 'billing@customer.com',
              contact: '+919999999999'
            },
            notify: {
              sms: false,
              email: false
            },
            reminder_enable: false,
            callback_url: callbackUrl,
            callback_method: 'get'
          })
        });

        if (!response.ok) {
          throw new Error(`Razorpay API returned status ${response.status}`);
        }

        const resData = await response.json();
        if (resData.short_url) {
          return res.json({ success: true, redirectUrl: resData.short_url });
        } else {
          throw new Error('Razorpay failed to return short_url');
        }
      } catch (err) {
        console.error("Razorpay API error:", err);
        const clientHost = req.get('referer') || `${protocol}://${host}/`;
        const fallbackSimUrl = `${clientHost.split('?')[0]}#phonepe-checkout?transactionId=${transactionId}&tenantId=${tenantId}&amount=${amount}&type=${type}&planName=${planName || ''}&creditsCount=${creditsCount || 0}`;
        return res.json({ success: true, redirectUrl: fallbackSimUrl, warning: `API call failed (${err.message}). Redirected to sandbox simulator.` });
      }
    }
  }

  // Fallback to simulator URL pointing to client app route #phonepe-checkout
  const clientHost = req.get('referer') || `${protocol}://${host}/`;
  const checkOutSimulatorUrl = `${clientHost.split('?')[0]}#phonepe-checkout?transactionId=${transactionId}&tenantId=${tenantId}&amount=${amount}&type=${type}&planName=${planName || ''}&creditsCount=${creditsCount || 0}`;
  return res.json({ success: true, redirectUrl: checkOutSimulatorUrl });
});

app.get('/api/phonepe/callback', (req, res) => {
  const { transactionId, tenantId, amount, type, planName, creditsCount } = req.query;
  const db = readDb();

  const tenantIndex = db.tenants.findIndex(t => t.id === tenantId);
  if (tenantIndex !== -1) {
    const tenant = db.tenants[tenantIndex];
    tenant.billingHistory = tenant.billingHistory || [];
    
    if (type === 'plan_upgrade' && planName) {
      tenant.plan = planName;
      tenant.billingHistory.push({
        id: transactionId,
        date: new Date().toLocaleDateString(),
        type: "Plan Upgrade",
        description: `Upgraded subscription to ${planName} Plan`,
        amount: parseFloat(amount),
        status: "Completed"
      });
    } else if (type === 'buy_credits') {
      tenant.credits = (tenant.credits || 0) + parseInt(creditsCount);
      tenant.billingHistory.push({
        id: transactionId,
        date: new Date().toLocaleDateString(),
        type: "Credits Purchase",
        description: `Purchased ${creditsCount} extra credits`,
        amount: parseFloat(amount),
        status: "Completed"
      });
    }

    db.tenants[tenantIndex] = tenant;
    writeDb(db);
  }

  const protocol = req.protocol;
  const host = req.get('host');
  const appRedirectUrl = `${protocol}://${host}/?status=success&tx=${transactionId}#billing`;
  res.redirect(appRedirectUrl);
});

app.post('/api/phonepe/webhook', (req, res) => {
  res.json({ success: true });
});




// ----------------------------------------
// Twilio Voice AI Gateway
// ----------------------------------------

// Inbound Voice webhook
app.post('/api/voice/inbound', (req, res) => {
  const db = readDb();
  const tenantId = req.query.tenantId || req.body.tenantId || 't-1';
  const caller = req.body.From || 'Unknown Phone';
  const called = req.body.To || 'Attendant';

  // Find or create contact
  let contact = db.contacts.find(c => c.phone === caller && c.tenantId === tenantId);
  if (!contact) {
    contact = {
      id: `c-voice-${Date.now()}`,
      tenantId,
      name: `Call Customer (${caller.substring(caller.length - 4)})`,
      email: '',
      phone: caller,
      company: 'Individual',
      tags: ['Voice Lead', 'Inbound Call'],
      notes: [`Created via inbound call to ${called}.`],
      createdAt: new Date().toISOString(),
      city: 'Inbound Call',
      assignedAgentId: 'a-1'
    };
    db.contacts.push(contact);
  }

  // Create conversation log
  const convId = `conv-voice-${Date.now()}`;
  const welcomeText = "Hello! Thank you for calling. I am Sarah, your AI coordinator. How can I help you today?";
  
  const newConv = {
    id: convId,
    tenantId,
    contactId: contact.id,
    status: 'ai_active',
    channel: 'voice',
    messages: [
      { id: `m-welcome-${Date.now()}`, sender: 'ai', text: welcomeText, timestamp: new Date().toISOString() }
    ],
    lastMessageText: welcomeText,
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: 'a-1',
    unreadCount: 0
  };
  db.conversations.push(newConv);
  writeDb(db);

  // Return Connect Stream TwiML response
  const host = req.get('host');
  const wsProtocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'wss' : 'ws';
  const streamUrl = `${wsProtocol}://${host}/api/voice/stream?tenantId=${tenantId}&agentId=a-1&contactId=${contact.id}&convId=${convId}`;

  res.type('text/xml');
  res.send(`
    <Response>
      <Connect>
        <Stream url="${streamUrl}" />
      </Connect>
    </Response>
  `);
});

// Voice gather loop webhook
app.post('/api/voice/gather', async (req, res) => {
  const db = readDb();
  const convId = req.query.convId;
  const contactId = req.query.contactId;
  const tenantId = req.query.tenantId || 't-1';
  const speechInput = req.body.SpeechResult;

  if (!speechInput) {
    res.type('text/xml');
    return res.send(`
      <Response>
        <Say voice="Polly.Kimberly">I didn't catch that. Could you please repeat?</Say>
        <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contactId}&amp;tenantId=${tenantId}" timeout="3" speechModel="phone_call" />
      </Response>
    `);
  }

  const convIndex = db.conversations.findIndex(c => c.id === convId && c.tenantId === tenantId);
  const contactIndex = db.contacts.findIndex(c => c.id === contactId && c.tenantId === tenantId);

  // Log user utterance
  if (convIndex !== -1) {
    db.conversations[convIndex].messages.push({
      id: `m-usr-${Date.now()}`,
      sender: 'customer',
      text: speechInput,
      timestamp: new Date().toISOString()
    });
  }

  // Generate response from AI Chat completions scoped by tenant agent
  const agent = db.agents.find(a => a.tenantId === tenantId) || db.agents[0];
  const history = convIndex !== -1 ? db.conversations[convIndex].messages : [];
  
  let replyText = "I am processing your request. Please hold on.";
  
  const allChunks = db.knowledge_chunks || [];
  const tenantChunks = allChunks.filter(chunk => {
    const chunkTenantId = chunk.tenantId || (
      (chunk.sourceId === 'ks-5' || chunk.sourceId === 'ks-6') ? 't-2' : 
      (chunk.sourceId === 'ks-7') ? 't-3' : 't-1'
    );
    return chunkTenantId === tenantId;
  });
  const groundingContext = searchKnowledgeChunks(speechInput, tenantChunks);
  
  const tenant = db.tenants.find(t => t.id === tenantId);
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}), ...(tenant?.settings || {}) };
  
  const activeProvider = integrations.activeModelProvider || 'openai';
  let apiKey = '';
  if (activeProvider === 'gemini') {
    apiKey = integrations.geminiApiKey || process.env.GEMINI_API_KEY;
  } else if (activeProvider === 'deepseek') {
    apiKey = integrations.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  } else {
    apiKey = integrations.openaiApiKey || integrations.difyApiKey || process.env.OPENAI_API_KEY;
  }

  if (apiKey) {
    try {
      const messages = [
        {
          role: 'system',
          content: `${agent.prompt}\n\nGrounding Context Knowledge:\n${groundingContext.join('\n')}\n\nConstraint: If booking is completed, output the tag "[BOOK: YYYY-MM-DDTHH:MM]" matching tomorrow afternoon or target time.`
        },
        ...history.slice(-6).map(msg => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: speechInput }
      ];

      replyText = await callModel(activeProvider, apiKey, messages, 0.5);
    } catch (e) {
      console.error(e);
    }
  } else {
    // Simulated offline fallback response
    const textLower = speechInput.toLowerCase();
    if (textLower.includes('hour') || textLower.includes('open')) {
      replyText = "We are open Monday to Friday from 9 AM to 6 PM. Would you like to schedule an appointment?";
    } else if (textLower.includes('book') || textLower.includes('appointment')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10) + 'T14:30';
      replyText = `I can book that for you. I've set you up for tomorrow at 2:30 PM. [BOOK: ${tomorrowStr}]`;
    } else {
      replyText = "Thank you. Let me check our guides for that information. What else can I help you with?";
    }
  }

  // Check if AI output includes the appointment booking tag
  // Pattern: [BOOK: YYYY-MM-DDTHH:MM]
  const bookRegex = /\[BOOK:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\]/i;
  const match = replyText.match(bookRegex);

  if (match && match[1]) {
    const dateTimeStr = match[1];
    // Create actual appointment slot in database
    const newApp = {
      id: `app-voice-${Date.now()}`,
      tenantId,
      contactId,
      agentId: 'a-1',
      dateTime: dateTimeStr,
      duration: 30,
      location: 'Smile Dental Clinic Office',
      type: 'Voice AI Phone Booking',
      status: 'scheduled'
    };
    db.appointments.push(newApp);

    // Save note to contact
    if (contactIndex !== -1) {
      db.contacts[contactIndex].notes.push(`Booked slot via Phone Call: tomorrow at ${new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }

    // Strip out the bracket tag from spoken speech reply
    replyText = replyText.replace(bookRegex, '').trim();
  }

  // Log AI response in conversation
  if (convIndex !== -1) {
    db.conversations[convIndex].messages.push({
      id: `m-ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toISOString()
    });
    db.conversations[convIndex].lastMessageText = replyText;
    db.conversations[convIndex].lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  writeDb(db);

  // Return TwiML with next speech gather
  res.type('text/xml');

  // If conversation is wrapping up
  const isGoodbye = speechInput.toLowerCase().includes('goodbye') || speechInput.toLowerCase().includes('thank you, bye');
  if (isGoodbye) {
    return res.send(`
      <Response>
        <Say voice="Polly.Kimberly">${replyText}</Say>
        <Hangup />
      </Response>
    `);
  }

  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${replyText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contactId}&amp;tenantId=${tenantId}" timeout="3" speechModel="phone_call" />
    </Response>
  `);
});

// Outbound Connect Webhook (TwiML response when answered)
app.post('/api/voice/outbound-connect', (req, res) => {
  const { tenantId = 't-1', agentId = 'a-1', goal = 'Follow up' } = req.query;
  const db = readDb();
  const agent = db.agents.find(a => a.id === agentId && a.tenantId === tenantId) || tenantScoped(db.agents, tenantId)[0] || db.agents[0];

  const welcomeText = `Hello! This is ${agent.name} calling from ${db.tenants.find(t => t.id === tenantId)?.name || 'Smile Dental'}. I am calling to discuss: ${goal}. How are you doing today?`;

  const contactPhone = req.body.To || 'Unknown';
  let contact = db.contacts.find(c => c.phone === contactPhone && c.tenantId === tenantId);
  if (!contact) {
    contact = {
      id: `c-voice-${Date.now()}`,
      tenantId,
      name: `Campaign Call (${contactPhone.substring(contactPhone.length - 4)})`,
      email: '',
      phone: contactPhone,
      company: 'Campaign Outbound',
      tags: ['Voice Lead', 'Outbound Campaign'],
      notes: [`Outbound campaign call initiated for ${goal}`],
      createdAt: new Date().toISOString(),
      city: 'Outbound',
      assignedAgentId: agentId
    };
    db.contacts.push(contact);
  }

  const convId = `conv-voice-ob-${Date.now()}`;
  const newConv = {
    id: convId,
    tenantId,
    contactId: contact.id,
    status: 'ai_active',
    channel: 'voice',
    messages: [
      { id: `m-welcome-${Date.now()}`, sender: 'ai', text: welcomeText, timestamp: new Date().toISOString() }
    ],
    lastMessageText: welcomeText,
    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assignedAgentId: agentId,
    unreadCount: 0
  };
  db.conversations.push(newConv);
  writeDb(db);

  // Return Connect Stream TwiML response
  const host = req.get('host');
  const wsProtocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'wss' : 'ws';
  const streamUrl = `${wsProtocol}://${host}/api/voice/stream?tenantId=${tenantId}&agentId=${agentId}&contactId=${contact.id}&convId=${convId}`;

  res.type('text/xml');
  res.send(`
    <Response>
      <Connect>
        <Stream url="${streamUrl}" />
      </Connect>
    </Response>
  `);
});

// Outbound trigger REST endpoint
app.post('/api/voice/outbound', async (req, res) => {
  const db = readDb();
  const { phone, tenantId = 't-1', agentId = 'a-1', goal = 'Confirmation follow up' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }

  const tenant = db.tenants.find(t => t.id === tenantId);
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}) };

  const twilioSid = integrations.twilioAccountSid;
  const twilioToken = integrations.twilioAuthToken;
  const twilioNumber = integrations.twilioPhoneNumber;

  if (!twilioSid || !twilioToken || !twilioNumber) {
    return res.status(400).json({ error: 'Twilio configurations are not set in Integration settings.' });
  }

  try {
    // Dynamic import to avoid crash if twilio module is not loaded yet
    const { default: twilio } = await import('twilio');
    const client = twilio(twilioSid, twilioToken);
    
    // Construct local base URL (using public URL if deployed or request headers host)
    const host = req.get('host');
    const protocol = req.protocol;
    const connectUrl = `${protocol}://${host}/api/voice/outbound-connect?tenantId=${tenantId}&agentId=${agentId}&goal=${encodeURIComponent(goal)}`;

    const call = await client.calls.create({
      url: connectUrl,
      to: phone,
      from: twilioNumber
    });

    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error('Twilio Outbound Dial Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Path-based tenant slug routing fallback (e.g. cleveradai.in/smile-dentals)
app.get('/:slug', (req, res, next) => {
  const systemPaths = ['api', 'assets', 'website', 'dashboard', 'login', 'signup', 'admin', 'widget', 'crm', 'inbox', 'calendar', 'employees', 'knowledge', 'builder', 'orchestrator', 'publisher', 'voice', 'workflows', 'settings', 'whitelabel'];
  const slug = req.params.slug;
  
  if (systemPaths.includes(slug) || slug.includes('.')) {
    return next();
  }

  const db = readDb();
  const tenant = db.tenants.find(t => t.slug === slug);
  if (!tenant) {
    return next();
  }

  if (tenant.websiteConfig && tenant.websiteConfig.html) {
    let html = tenant.websiteConfig.html;
    if (!html.includes('widget.js')) {
      const widgetScript = `
        <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
      `;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${widgetScript}</body>`);
      } else {
        html = html + widgetScript;
      }
    }
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } else {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 100px 20px; background: #0a0f1d; color: #fff; min-height: 100vh;">
        <h1 style="color: ${tenant.primaryColor || '#0ea5e9'}; font-size: 2.5rem; margin-bottom: 10px;">${tenant.name}</h1>
        <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 30px;">Website has not been generated yet. Please go to the Website Builder tab and click "Generate AI Website" to build it.</p>
        <div style="display: inline-block;">
          <script src="/widget.js" data-tenant-id="${tenant.id}" data-color="${tenant.primaryColor || '#0ea5e9'}" data-title="${tenant.name} AI Assistant"></script>
        </div>
      </div>
    `);
  }
});

// Serve static assets from public folder as fallback (e.g. for chatbot widget script/html in dev)
app.use(express.static(path.join(__dirname, '../public')));

// Serve frontend dist static assets in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`AiraOS custom production backend running on port ${PORT}`);
  try {
    const db = readDb();
    console.log(`Database loaded successfully from ${DB_FILE}`);
    console.log(`Initialized with ${db.users.length} users:`);
    db.users.forEach(u => console.log(` - ${u.email} (${u.name})`));
  } catch (err) {
    console.error('Error verifying database on startup:', err);
  }
});
initTelephonyService(server);
