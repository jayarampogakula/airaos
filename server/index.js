import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readDb, writeDb } from './db.js';
import { runCrew } from './crewEngine.js';
import {
  CHANNEL_TYPES,
  chatwootRequest,
  conversationChannel,
  createChatwootInbox,
  displayChannelName,
  ensureChatwootAccount,
  getChatwootAccountId,
  localConversationToChatwoot,
  normalizeChannelType,
  normalizeChatwootConversation
} from './chatwoot.js';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      provider: type === 'website' ? 'chatwoot_web_widget' : `chatwoot_${type}`,
      displayName: displayChannelName(type),
      status: 'not_connected',
      config: {},
      chatwootAccountId: getChatwootAccountId(getTenantFromDb(db, tenantId)),
      chatwootInboxId: '',
      chatwootChannelId: '',
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
    provider: payload.provider || existing.provider || `chatwoot_${type}`,
    displayName: payload.displayName || existing.displayName || displayChannelName(type),
    status: payload.status || existing.status || 'not_connected',
    config: {
      ...(existing.config || {}),
      ...(payload.config || {})
    },
    chatwootAccountId: payload.chatwootAccountId || existing.chatwootAccountId || getChatwootAccountId(getTenantFromDb(db, tenantId)),
    chatwootInboxId: payload.chatwootInboxId || existing.chatwootInboxId || '',
    chatwootChannelId: payload.chatwootChannelId || existing.chatwootChannelId || '',
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

function localInboxResponse(db, tenantId, query = {}) {
  const search = String(query.q || '').trim().toLowerCase();
  const requestedChannel = query.channel ? conversationChannel(query.channel) : '';
  let items = tenantScoped(db.conversations, tenantId);
  if (requestedChannel) {
    items = items.filter((conversation) => conversation.channel === requestedChannel);
  }
  if (search) {
    items = items.filter((conversation) => {
      const contact = db.contacts.find((item) => item.id === conversation.contactId && item.tenantId === tenantId);
      const haystack = [
        contact?.name,
        contact?.email,
        contact?.phone,
        conversation.lastMessageText,
        ...(conversation.messages || []).map((message) => message.text)
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }

  const payload = items.map((conversation) => localConversationToChatwoot(conversation, db));
  return {
    data: {
      meta: {
        mine_count: payload.filter((conversation) => conversation.meta?.assignee?.id).length,
        unassigned_count: payload.filter((conversation) => !conversation.meta?.assignee?.id).length,
        assigned_count: payload.filter((conversation) => conversation.meta?.assignee?.id).length,
        all_count: payload.length,
        unread_count: payload.reduce((total, conversation) => total + (conversation.unread_count || 0), 0)
      },
      payload
    },
    source: 'local'
  };
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
  const db = readDb();
  const user = (db.users || []).find((u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase());
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const tenants = getUserTenants(db, user.id);
  if (tenants.length === 0) {
    return res.status(403).json({ error: 'User does not belong to any workspace.' });
  }

  const session = createSession(db, user.id, tenants[0].id);
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
    settings: req.tenant.settings || {}
  });
});

app.get('/api/current-tenant/contacts', authMiddleware, tenantMiddleware, (req, res) => {
  res.json(tenantScoped(req.db.contacts, req.tenantId));
});

app.post('/api/current-tenant/contacts', authMiddleware, tenantMiddleware, (req, res) => {
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
    assignedAgentId: req.body.assignedAgentId || tenantScoped(req.db.agents, req.tenantId)[0]?.id
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
// Tenant Chatwoot Channel Management
// ----------------------------------------
app.get('/api/current-tenant/channels', authMiddleware, tenantMiddleware, (req, res) => {
  res.json({
    chatwoot: req.tenant.chatwootMapping || {},
    channels: tenantChannelConfigs(req.db, req.tenantId),
    inboxes: tenantScoped(req.db.chatwootInboxes, req.tenantId)
  });
});

app.post('/api/current-tenant/chatwoot/provision', authMiddleware, tenantMiddleware, async (req, res) => {
  try {
    const mapping = await ensureChatwootAccount(req.db, req.tenant);
    saveDb(req);
    res.status(201).json({ mapping });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/current-tenant/channels/:type/connect', authMiddleware, tenantMiddleware, async (req, res) => {
  const type = normalizeChannelType(req.params.type);
  const tenantIndex = currentTenantIndex(req.db, req.tenantId);
  if (tenantIndex === -1) return res.status(404).json({ error: 'Tenant not found.' });

  req.db.tenants[tenantIndex].settings = {
    ...(req.db.tenants[tenantIndex].settings || {}),
    ...(req.body.chatwootUrl ? { chatwootUrl: req.body.chatwootUrl } : {}),
    ...(req.body.chatwootAccountId ? { chatwootAccountId: String(req.body.chatwootAccountId) } : {}),
    ...(req.body.chatwootApiAccessToken ? { chatwootApiAccessToken: req.body.chatwootApiAccessToken } : {})
  };
  req.db.tenants[tenantIndex].chatwootMapping = {
    ...(req.db.tenants[tenantIndex].chatwootMapping || {}),
    accountId: req.db.tenants[tenantIndex].settings.chatwootAccountId || req.db.tenants[tenantIndex].chatwootMapping?.accountId || '',
    accountName: req.tenant.name,
    status: req.db.tenants[tenantIndex].settings.chatwootAccountId ? 'connected' : req.db.tenants[tenantIndex].chatwootMapping?.status || 'not_provisioned'
  };

  let channel = upsertChannelConfig(req.db, req.tenantId, {
    type,
    displayName: req.body.displayName,
    status: req.body.status || 'connected',
    config: req.body.config || {},
    chatwootAccountId: req.db.tenants[tenantIndex].settings.chatwootAccountId || ''
  });

  if (req.body.chatwootInboxId) {
    channel = upsertChannelConfig(req.db, req.tenantId, {
      ...channel,
      status: 'connected',
      chatwootInboxId: String(req.body.chatwootInboxId),
      chatwootChannelId: req.body.chatwootChannelId ? String(req.body.chatwootChannelId) : channel.chatwootChannelId
    });
  } else if (req.body.autoCreateInbox) {
    try {
      if (!getChatwootAccountId(req.db.tenants[tenantIndex]) && req.body.autoProvisionAccount) {
        await ensureChatwootAccount(req.db, req.db.tenants[tenantIndex]);
      }
      const inbox = await createChatwootInbox(req.db, req.db.tenants[tenantIndex], channel);
      channel = upsertChannelConfig(req.db, req.tenantId, {
        ...channel,
        status: inbox.status === 'requires_chatwoot_setup' ? 'pending_provider_setup' : 'connected',
        chatwootInboxId: inbox.chatwootInboxId || '',
        chatwootChannelId: inbox.chatwootChannelId || '',
        config: {
          ...(channel.config || {}),
          websiteToken: inbox.websiteToken || channel.config?.websiteToken,
          webWidgetScript: inbox.webWidgetScript || channel.config?.webWidgetScript,
          setupMessage: inbox.message || ''
        }
      });
    } catch (err) {
      channel = upsertChannelConfig(req.db, req.tenantId, {
        ...channel,
        status: 'needs_attention',
        config: {
          ...(channel.config || {}),
          lastError: err.message
        }
      });
    }
  }

  saveDb(req);
  res.status(201).json({
    channel,
    chatwoot: req.db.tenants[tenantIndex].chatwootMapping,
    inboxes: tenantScoped(req.db.chatwootInboxes, req.tenantId)
  });
});

app.get('/api/current-tenant/chatwoot/inbox', authMiddleware, tenantMiddleware, async (req, res) => {
  const accountId = getChatwootAccountId(req.tenant);
  if (!accountId) {
    return res.json(localInboxResponse(req.db, req.tenantId, req.query));
  }

  const params = new URLSearchParams();
  params.set('status', req.query.status || 'all');
  params.set('assignee_type', req.query.assignee_type || 'all');
  params.set('page', req.query.page || '1');
  if (req.query.q) params.set('q', req.query.q);
  if (req.query.inbox_id) params.set('inbox_id', req.query.inbox_id);
  if (req.query.labels) params.set('labels', req.query.labels);

  try {
    const payload = await chatwootRequest({
      tenant: req.tenant,
      path: `/api/v1/accounts/${accountId}/conversations?${params.toString()}`
    });
    
    // Get all inbox IDs configured for the active tenant
    const tenantInboxes = new Set([
      ...(req.db.chatwootInboxes || []).filter((inbox) => inbox.tenantId === req.tenantId).map((inbox) => String(inbox.chatwootInboxId)),
      ...(req.db.channelConfigs || []).filter((channel) => channel.tenantId === req.tenantId && channel.chatwootInboxId).map((channel) => String(channel.chatwootInboxId))
    ]);

    const rawConversations = payload?.data?.payload || payload?.payload || [];
    const filteredConversations = rawConversations.filter((c) => tenantInboxes.has(String(c.inbox_id)));

    const normalizedPayload = filteredConversations.map((conversation) => normalizeChatwootConversation(conversation, req.db, req.tenantId));
    res.json({
      ...payload,
      data: {
        ...(payload.data || {}),
        payload: normalizedPayload
      },
      source: 'chatwoot'
    });
  } catch (err) {
    res.json({
      ...localInboxResponse(req.db, req.tenantId, req.query),
      warning: err.message
    });
  }
});

app.get('/api/current-tenant/chatwoot/conversations/:id', authMiddleware, tenantMiddleware, async (req, res) => {
  const accountId = getChatwootAccountId(req.tenant);
  if (accountId) {
    try {
      const payload = await chatwootRequest({
        tenant: req.tenant,
        path: `/api/v1/accounts/${accountId}/conversations/${req.params.id}`
      });
      return res.json({ conversation: normalizeChatwootConversation(payload, req.db, req.tenantId), source: 'chatwoot' });
    } catch (err) {
      // Continue to local fallback.
    }
  }

  const conversation = tenantScoped(req.db.conversations, req.tenantId).find((item) => item.id === req.params.id || item.chatwootConversationId === req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
  res.json({ conversation: normalizeChatwootConversation(localConversationToChatwoot(conversation, req.db), req.db, req.tenantId), source: 'local' });
});

app.post('/api/current-tenant/chatwoot/conversations/:id/messages', authMiddleware, tenantMiddleware, async (req, res) => {
  const accountId = getChatwootAccountId(req.tenant);
  if (accountId) {
    try {
      const payload = await chatwootRequest({
        tenant: req.tenant,
        method: 'POST',
        path: `/api/v1/accounts/${accountId}/conversations/${req.params.id}/messages`,
        body: {
          content: req.body.content,
          message_type: req.body.messageType || 'outgoing',
          private: !!req.body.private,
          content_type: 'text',
          content_attributes: req.body.contentAttributes || {}
        }
      });
      return res.status(201).json({ message: payload, source: 'chatwoot' });
    } catch (err) {
      if (!req.body.allowLocalFallback) return res.status(400).json({ error: err.message });
    }
  }

  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && (item.id === req.params.id || item.chatwootConversationId === req.params.id));
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });
  const message = {
    id: `m-${Date.now()}`,
    tenantId: req.tenantId,
    conversationId: req.db.conversations[conversationIndex].id,
    sender: req.body.private ? 'note' : req.body.sender || 'human',
    private: !!req.body.private,
    text: req.body.content,
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

app.post('/api/current-tenant/chatwoot/conversations/:id/assignments', authMiddleware, tenantMiddleware, async (req, res) => {
  const accountId = getChatwootAccountId(req.tenant);
  if (accountId) {
    try {
      const payload = await chatwootRequest({
        tenant: req.tenant,
        method: 'POST',
        path: `/api/v1/accounts/${accountId}/conversations/${req.params.id}/assignments`,
        body: {
          assignee_id: req.body.assigneeId ? Number(req.body.assigneeId) : undefined,
          team_id: req.body.teamId ? Number(req.body.teamId) : undefined
        }
      });
      return res.json({ assignment: payload, source: 'chatwoot' });
    } catch (err) {
      if (!req.body.allowLocalFallback) return res.status(400).json({ error: err.message });
    }
  }

  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });
  req.db.conversations[conversationIndex].assignedAgentId = req.body.assigneeId || '';
  req.db.conversations[conversationIndex].status = 'human_escalated';
  saveDb(req);
  res.json({ conversation: req.db.conversations[conversationIndex], source: 'local' });
});

app.post('/api/current-tenant/chatwoot/conversations/:id/labels', authMiddleware, tenantMiddleware, async (req, res) => {
  const labels = Array.isArray(req.body.labels) ? req.body.labels : [];
  const accountId = getChatwootAccountId(req.tenant);
  if (accountId) {
    try {
      const payload = await chatwootRequest({
        tenant: req.tenant,
        method: 'POST',
        path: `/api/v1/accounts/${accountId}/conversations/${req.params.id}/labels`,
        body: { labels }
      });
      return res.json({ labels: payload, source: 'chatwoot' });
    } catch (err) {
      if (!req.body.allowLocalFallback) return res.status(400).json({ error: err.message });
    }
  }

  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && item.id === req.params.id);
  if (conversationIndex === -1) return res.status(404).json({ error: 'Conversation not found.' });
  req.db.conversations[conversationIndex].labels = labels;
  saveDb(req);
  res.json({ labels, source: 'local' });
});

app.post('/api/current-tenant/chatwoot/conversations/:id/status', authMiddleware, tenantMiddleware, async (req, res) => {
  const status = req.body.status;
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const accountId = getChatwootAccountId(req.tenant);
  const conversationIndex = req.db.conversations.findIndex((item) => item.tenantId === req.tenantId && (item.id === req.params.id || item.chatwootConversationId === req.params.id));
  const conversation = conversationIndex !== -1 ? req.db.conversations[conversationIndex] : null;
  const chatwootConvId = conversation?.chatwootConversationId || (!req.params.id.startsWith('conv-') ? req.params.id : null);

  if (accountId && chatwootConvId) {
    try {
      const chatwootStatus = status === 'closed' ? 'resolved' : status === 'ai_active' ? 'pending' : 'open';
      await chatwootRequest({
        tenant: req.tenant,
        method: 'POST',
        path: `/api/v1/accounts/${accountId}/conversations/${chatwootConvId}/toggle_status`,
        body: { status: chatwootStatus }
      });
    } catch (err) {
      if (!req.body.allowLocalFallback) return res.status(400).json({ error: err.message });
    }
  }

  if (conversationIndex !== -1) {
    req.db.conversations[conversationIndex].status = status;
    saveDb(req);
    return res.json({ conversation: req.db.conversations[conversationIndex], source: accountId && chatwootConvId ? 'chatwoot' : 'local' });
  }

  res.status(404).json({ error: 'Conversation not found.' });
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

app.post('/api/contacts', (req, res) => {
  const db = readDb();
  const newContact = {
    id: `c-${Date.now()}`,
    tenantId: tenantFromPublicRequest(req),
    createdAt: new Date().toISOString(),
    tags: req.body.tags || ['New Lead'],
    notes: req.body.notes || [],
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company || 'Individual',
    city: req.body.city || '',
    assignedAgentId: req.body.assignedAgentId || 'a-1'
  };

  db.contacts.push(newContact);
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
  res.json(db.integrations || {});
});

app.put('/api/integrations', (req, res) => {
  const db = readDb();
  db.integrations = {
    ...(db.integrations || {}),
    ...req.body
  };
  writeDb(db);
  res.json(db.integrations);
});

// Platform Support Bot endpoints
app.get('/api/platform-support-bot', (req, res) => {
  const db = readDb();
  res.json(db.platformSupportBot || {
    enabled: true,
    name: 'Platform Guide',
    avatar: '🤖',
    welcomeMessage: 'Hi! I am the AiraOS Platform Assistant. How can I help you integrate SIP, Twilio, configure BYO, or understand our packages and rates today?',
    prompt: 'You are the AiraOS Platform Assistant, a friendly and extremely helpful digital receptionist for AiraOS platform users (tenants).\n\nYour task is to clarify doubts regarding:\n1. Twilio Integration: Enter Twilio Account SID, Auth Token, and Twilio Phone Number in the Integrations panel.\n2. BYO (Bring Your Own) Carrier: Configure BYO SIP Server host, username, password, and the custom phone number.\n3. SIP Integration: Use the BYO SIP Server credentials to route inbound and outbound calls through custom PBX/carriers.\n4. Packages & Rates: Growth ($499/mo, 2000 chats, 500 voice mins, 2 web edits), Scale ($1200/mo, 5000 chats, 1000 voice mins, 5 web edits), and Enterprise ($2500/mo, 10000 chats, 2500 voice mins, unlimited web edits). Overage rates: $0.05 per chat, $0.15 per voice minute, $0.10/min inbound, $0.20/min outbound.\n\nBe professional, brief, and clear. Help users understand how to set these up in their Settings and Integrations sections.'
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

// Tenant-Specific Integrations
app.get('/api/tenants/:id/integrations', authMiddleware, (req, res) => {
  const db = req.db;
  const hasAccess = db.memberships.some((m) => m.userId === req.user.id && m.tenantId === req.params.id && m.status === 'active');
  if (!hasAccess) return res.status(403).json({ error: 'You do not have access to this tenant.' });
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant.integrations || {});
});

app.put('/api/tenants/:id/integrations', authMiddleware, (req, res) => {
  const db = req.db;
  const hasAccess = db.memberships.some((m) => m.userId === req.user.id && m.tenantId === req.params.id && m.status === 'active');
  if (!hasAccess) return res.status(403).json({ error: 'You do not have access to this tenant.' });
  const tenantIndex = db.tenants.findIndex(t => t.id === req.params.id);
  if (tenantIndex === -1) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  db.tenants[tenantIndex].integrations = {
    ...(db.tenants[tenantIndex].integrations || {}),
    ...req.body
  };
  writeDb(db);
  res.json(db.tenants[tenantIndex].integrations);
});

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
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}) };

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
  let chatwootConversationId = null;

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
  }

  // Chatwoot synchronization details
  const hasChatwoot = tenant && tenant.settings && tenant.settings.chatwootAccountId && tenant.settings.chatwootApiAccessToken;
  let websiteChannel = null;
  if (hasChatwoot) {
    websiteChannel = (db.channelConfigs || []).find(
      (c) => c.tenantId === tenantId && c.type === 'website' && c.chatwootInboxId
    );
  }

  if (hasChatwoot && websiteChannel && identity && identity.email) {
    try {
      const accountId = tenant.settings.chatwootAccountId;
      // Search contact in Chatwoot
      let cwContact = null;
      const searchRes = await chatwootRequest({
        tenant,
        path: `/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(identity.email)}`
      });
      const searchPayload = searchRes.payload || searchRes.data?.payload || [];
      if (searchPayload.length > 0) {
        cwContact = searchPayload[0];
      } else {
        // Create contact in Chatwoot
        cwContact = await chatwootRequest({
          tenant,
          method: 'POST',
          path: `/api/v1/accounts/${accountId}/contacts`,
          body: {
            name: identity.name || 'Web Visitor',
            email: identity.email,
            phone_number: identity.phone || '',
            inbox_id: parseInt(websiteChannel.chatwootInboxId)
          }
        });
        if (cwContact.payload) cwContact = cwContact.payload;
      }

      if (cwContact && cwContact.id) {
        chatwootConversationId = conversation.chatwootConversationId;
        if (!chatwootConversationId) {
          // Create conversation in Chatwoot
          const cwConv = await chatwootRequest({
            tenant,
            method: 'POST',
            path: `/api/v1/accounts/${accountId}/conversations`,
            body: {
              source_id: `web-${conversation.id}`,
              inbox_id: parseInt(websiteChannel.chatwootInboxId),
              contact_id: parseInt(cwContact.id),
              status: 'open'
            }
          });
          chatwootConversationId = String(cwConv.id);
          conversation.chatwootConversationId = chatwootConversationId;
          // Persist the mapping
          const currentDb = readDb();
          const targetConv = currentDb.conversations.find(c => c.id === conversation.id);
          if (targetConv) {
            targetConv.chatwootConversationId = chatwootConversationId;
            writeDb(currentDb);
          }
        }

        // Post customer message to Chatwoot
        await chatwootRequest({
          tenant,
          method: 'POST',
          path: `/api/v1/accounts/${accountId}/conversations/${chatwootConversationId}/messages`,
          body: {
            content: message,
            message_type: 'incoming'
          }
        });
      }
    } catch (cwErr) {
      console.error('Chatwoot customer message sync error:', cwErr.message);
    }
  }

  const apiKey = integrations.difyApiKey || process.env.OPENAI_API_KEY;

  if (apiKey) {
    // Call live OpenAI
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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with ${response.status}`);
      }

      const resData = await response.json();
      const reply = resData.choices[0].message.content;

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

        // Sync AI reply to Chatwoot
        if (hasChatwoot && chatwootConversationId) {
          try {
            const accountId = tenant.settings.chatwootAccountId;
            await chatwootRequest({
              tenant,
              method: 'POST',
              path: `/api/v1/accounts/${accountId}/conversations/${chatwootConversationId}/messages`,
              body: {
                content: reply,
                message_type: 'outgoing'
              }
            });
          } catch (cwErr) {
            console.error('Chatwoot AI message sync error (OpenAI flow):', cwErr.message);
          }
        }
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
    if (agentId === 'platform-support') {
      if (/\b(sip|byo|carrier|trunk)\b/i.test(message)) {
        reply = `To integrate SIP or Bring Your Own (BYO) carrier in AiraOS, go to **Settings > Integrations**. Under the **BYO Carrier Settings** section, input your custom SIP server host address, username, password, and the phone number. Click **Save Settings** to persist the details to the system.`;
      } else if (/\b(twilio)\b/i.test(message)) {
        reply = `To integrate Twilio, go to **Settings > Integrations** and expand **Twilio Settings**. Enter your Twilio Account SID, Auth Token, and Twilio Phone Number, then save the configuration. The platform routes outbound/inbound calls using these credentials.`;
      } else if (/\b(rate|rates|price|prices|pricing|package|packages|pack|tier|tiers|cost|costs|credit|credits|billing|subscribe|subscription)\b/i.test(message)) {
        reply = `AiraOS has 3 subscription packages:\n- **Growth ($499/mo):** 2,000 chats, 500 voice minutes, 2 web edits.\n- **Scale ($1,200/mo):** 5,000 chats, 1,000 voice minutes, 5 web edits.\n- **Enterprise ($2,500/mo):** 10,000 chats, 2,500 voice minutes, unlimited web edits.\n\n**Overage fees:** $0.05 per extra chat, $0.15 per extra voice minute. Inbound calls are $0.10/min, and outbound calls are $0.20/min. Custom voice synthesis costs $0.02/min.`;
      } else if (/\b(hi|hello|help|hey|greetings|support)\b/i.test(message)) {
        reply = `Hello! I am the Platform Assistant. I am here to help you resolve doubts on integrating SIP trunking, connecting Twilio API keys, configuring BYO Carriers, or reviewing plan packages and rates. How can I help you today?`;
      } else {
        reply = `I understand your concern about "${message}". To set up integrations (like Twilio, BYO SIP Carrier, PhonePe API keys, or CRM sync channels), navigate to **Settings > Integrations**. You can configure billing limits under **Settings > Billing & Subscriptions**. Let me know if you need more details!`;
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

      // Sync AI reply to Chatwoot
      if (hasChatwoot && chatwootConversationId) {
        try {
          const accountId = tenant.settings.chatwootAccountId;
          await chatwootRequest({
            tenant,
            method: 'POST',
            path: `/api/v1/accounts/${accountId}/conversations/${chatwootConversationId}/messages`,
            body: {
              content: reply,
              message_type: 'outgoing'
            }
          });
        } catch (cwErr) {
          console.error('Chatwoot AI message sync error (Fallback flow):', cwErr.message);
        }
      }
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
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}) };
  const apiKey = integrations.difyApiKey || process.env.OPENAI_API_KEY;

  try {
    const result = await runCrew({
      crewAgentIds: crewAgents,
      tasks,
      inputs,
      db,
      apiKey,
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

app.post('/api/webhook/chatwoot', (req, res) => {
  const body = req.body;
  const event = body.event;

  console.log(`Received Chatwoot webhook event: ${event}`);

  if (!event) {
    return res.status(200).json({ success: true, message: 'No event field' });
  }

  const db = readDb();

  if (event === 'message_created') {
    const chatwootConversationId = String(body.conversation?.id || body.conversation_id || '');
    const inboxId = String(body.inbox?.id || body.conversation?.inbox_id || '');

    if (!chatwootConversationId) {
      return res.status(200).json({ success: true, message: 'No conversation ID' });
    }

    let conversation = db.conversations.find(c => String(c.chatwootConversationId) === chatwootConversationId);
    const localInbox = db.chatwootInboxes.find(i => String(i.chatwootInboxId) === inboxId);

    if (!conversation && localInbox) {
      const tenantId = localInbox.tenantId;
      const sender = body.sender || {};
      const contactEmail = sender.email || '';

      // Find or create contact
      let contact = db.contacts.find(c => c.tenantId === tenantId && (c.email === contactEmail || (c.phone && c.phone === sender.phone_number)));
      if (!contact) {
        contact = {
          id: `c-cw-${Date.now()}`,
          tenantId,
          name: sender.name || sender.available_name || 'Chatwoot Contact',
          email: contactEmail,
          phone: sender.phone_number || '',
          createdAt: new Date().toISOString(),
          company: 'Chatwoot Sync'
        };
        db.contacts.push(contact);
      }

      conversation = {
        id: `conv-cw-${chatwootConversationId}`,
        tenantId,
        contactId: contact.id,
        chatwootConversationId,
        status: body.conversation?.status === 'resolved' ? 'closed' : 'human_escalated',
        channel: localInbox.channelType || 'web',
        messages: [],
        lastMessageText: '',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0
      };
      db.conversations.push(conversation);
    }

    if (conversation) {
      const msgContent = body.content || '';
      const msgTimestamp = body.created_at || new Date().toISOString();
      const isPrivate = !!body.private;
      const senderType = body.sender?.type;
      const messageType = body.message_type;

      let mappedSender = 'human';
      if (messageType === 'incoming') {
        mappedSender = 'customer';
      } else if (senderType === 'bot') {
        mappedSender = 'ai';
      } else if (isPrivate) {
        mappedSender = 'note';
      }

      // Prevent duplicate processing of messages synced by other routes
      const isDuplicate = conversation.messages.some(m =>
        m.text === msgContent &&
        Math.abs(new Date(m.timestamp) - new Date(msgTimestamp)) < 15000
      );

      if (!isDuplicate) {
        const newMessage = {
          id: `m-cw-${body.id || Date.now()}`,
          tenantId: conversation.tenantId,
          conversationId: conversation.id,
          sender: mappedSender,
          text: msgContent,
          private: isPrivate,
          timestamp: new Date(msgTimestamp).toISOString()
        };

        conversation.messages.push(newMessage);

        if (!isPrivate) {
          conversation.lastMessageText = msgContent;
          conversation.lastMessageTime = new Date(msgTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (mappedSender === 'customer') {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          } else {
            conversation.unreadCount = 0;
          }
        }

        if (mappedSender === 'human') {
          conversation.status = 'human_escalated';
        }

        writeDb(db);
        console.log(`Synced message to conversation ${conversation.id}`);
      }
    }
  } else if (event === 'conversation_status_changed') {
    const chatwootConversationId = String(body.id || body.conversation?.id || '');
    const newStatus = body.status || body.conversation?.status;

    if (chatwootConversationId && newStatus) {
      const conversation = db.conversations.find(c => String(c.chatwootConversationId) === chatwootConversationId);
      if (conversation) {
        if (newStatus === 'resolved') {
          conversation.status = 'closed';
        } else if (newStatus === 'open') {
          conversation.status = 'human_escalated';
        } else if (newStatus === 'pending') {
          conversation.status = 'ai_active';
        }
        writeDb(db);
        console.log(`Synced status of conversation ${conversation.id} to ${conversation.status}`);
      }
    }
  }

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

  // Return welcome TwiML response
  res.type('text/xml');
  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${welcomeText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contact.id}&amp;tenantId=${tenantId}" timeout="3" speechModel="phone_call" />
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
  const integrations = { ...(db.integrations || {}), ...(tenant?.integrations || {}) };
  const apiKey = integrations.difyApiKey || process.env.OPENAI_API_KEY;

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.5
        })
      });

      if (response.ok) {
        const resData = await response.json();
        replyText = resData.choices[0].message.content;
      }
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

  res.type('text/xml');
  res.send(`
    <Response>
      <Say voice="Polly.Kimberly">${welcomeText}</Say>
      <Gather input="speech" action="/api/voice/gather?convId=${convId}&amp;contactId=${contact.id}&amp;tenantId=${tenantId}" timeout="3" speechModel="phone_call" />
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

app.listen(PORT, () => {
  console.log(`AiraOS custom production backend running on port ${PORT}`);
});
