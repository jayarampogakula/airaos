const DEFAULT_CHATWOOT_URL = process.env.CHATWOOT_URL || process.env.VITE_CHATWOOT_URL || '';
const PLATFORM_TOKEN = process.env.CHATWOOT_PLATFORM_API_TOKEN || '';
const DEFAULT_API_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || '';

export const CHANNEL_TYPES = ['website', 'whatsapp', 'gmail', 'outlook', 'smtp', 'telegram', 'instagram', 'facebook'];

export function displayChannelName(type) {
  const labels = {
    website: 'Website Chat',
    whatsapp: 'WhatsApp Business',
    gmail: 'Gmail',
    outlook: 'Outlook',
    smtp: 'SMTP Email',
    telegram: 'Telegram',
    instagram: 'Instagram DM',
    facebook: 'Facebook Messenger'
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

export function getChatwootBaseUrl(tenant) {
  const url = tenant?.settings?.chatwootUrl || DEFAULT_CHATWOOT_URL || '';
  return url.replace(/\/+$/, '');
}

export function getChatwootAccountId(tenant) {
  return tenant?.chatwootMapping?.accountId || tenant?.settings?.chatwootAccountId || '';
}

export function getChatwootApiToken(tenant) {
  return tenant?.settings?.chatwootApiAccessToken || tenant?.chatwootMapping?.apiAccessToken || DEFAULT_API_TOKEN || PLATFORM_TOKEN || '';
}

function chatwootHeaders(token) {
  return {
    'Content-Type': 'application/json',
    api_access_token: token
  };
}

export async function chatwootRequest({ tenant, path, method = 'GET', body, platform = false }) {
  const baseUrl = getChatwootBaseUrl(tenant);
  const token = platform ? PLATFORM_TOKEN : getChatwootApiToken(tenant);
  if (!baseUrl || !token) {
    const missing = !baseUrl ? 'CHATWOOT_URL' : 'CHATWOOT_API_ACCESS_TOKEN';
    throw new Error(`${missing} is not configured.`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: chatwootHeaders(token),
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Chatwoot returned ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function ensureChatwootAccount(db, tenant) {
  const tenantIndex = db.tenants.findIndex((item) => item.id === tenant.id);
  if (tenantIndex === -1) throw new Error('Tenant not found.');

  const existingAccountId = getChatwootAccountId(db.tenants[tenantIndex]);
  if (existingAccountId) {
    return db.tenants[tenantIndex].chatwootMapping;
  }

  const account = await chatwootRequest({
    tenant: db.tenants[tenantIndex],
    platform: true,
    method: 'POST',
    path: '/platform/api/v1/accounts',
    body: {
      name: tenant.name,
      locale: 'en',
      domain: tenant.domain,
      support_email: `support@${tenant.slug || tenant.id}.airaos.com`,
      status: 'active',
      limits: {},
      custom_attributes: { airaosTenantId: tenant.id }
    }
  });

  const accountId = String(account.id);
  db.tenants[tenantIndex].settings = {
    ...(db.tenants[tenantIndex].settings || {}),
    chatwootAccountId: accountId
  };
  db.tenants[tenantIndex].chatwootMapping = {
    ...(db.tenants[tenantIndex].chatwootMapping || {}),
    accountId,
    accountName: account.name || tenant.name,
    status: 'connected',
    provisionedAt: new Date().toISOString()
  };
  db.chatwootAccounts.push({
    id: `cw-account-${tenant.id}-${accountId}`,
    tenantId: tenant.id,
    chatwootAccountId: accountId,
    name: account.name || tenant.name,
    status: 'connected',
    createdAt: new Date().toISOString()
  });

  return db.tenants[tenantIndex].chatwootMapping;
}

export async function createChatwootInbox(db, tenant, channelConfig) {
  const accountId = getChatwootAccountId(tenant);
  if (!accountId) throw new Error('Chatwoot account is not mapped for this tenant.');

  const normalizedType = normalizeChannelType(channelConfig.type);
  const channelBody = buildInboxChannelBody(normalizedType, channelConfig);
  if (!channelBody) {
    return {
      status: 'requires_chatwoot_setup',
      message: `${displayChannelName(normalizedType)} requires OAuth or provider setup inside Chatwoot. Configuration has been stored for this tenant.`
    };
  }

  const inbox = await chatwootRequest({
    tenant,
    method: 'POST',
    path: `/api/v1/accounts/${accountId}/inboxes`,
    body: {
      name: channelConfig.displayName || displayChannelName(normalizedType),
      enable_auto_assignment: true,
      greeting_enabled: normalizedType === 'website',
      greeting_message: 'Hello, how can we help you?',
      channel: channelBody
    }
  });

  const record = {
    id: `cw-inbox-${tenant.id}-${inbox.id}`,
    tenantId: tenant.id,
    channelConfigId: channelConfig.id,
    chatwootAccountId: accountId,
    chatwootInboxId: String(inbox.id),
    chatwootChannelId: inbox.channel_id ? String(inbox.channel_id) : '',
    channelType: normalizedType,
    name: inbox.name || channelConfig.displayName,
    websiteToken: inbox.website_token || '',
    webWidgetScript: inbox.web_widget_script || '',
    status: 'connected',
    createdAt: new Date().toISOString()
  };
  db.chatwootInboxes.push(record);
  return record;
}

function buildInboxChannelBody(type, channelConfig) {
  const config = channelConfig.config || {};
  if (type === 'website') {
    return {
      type: 'web_widget',
      website_url: config.websiteUrl || 'https://example.com',
      welcome_title: config.welcomeTitle || `Welcome to ${channelConfig.displayName || 'Support'}`,
      welcome_tagline: config.welcomeTagline || 'We are here to help you',
      widget_color: config.widgetColor || '#0ea5e9'
    };
  }

  if (type === 'smtp' || type === 'gmail' || type === 'outlook') {
    return {
      type: 'email',
      email: config.email || config.supportEmail || '',
      forward_to_email: config.forwardToEmail || ''
    };
  }

  return null;
}

export function localConversationToChatwoot(conversation, db) {
  const contact = (db.contacts || []).find((item) => item.id === conversation.contactId && item.tenantId === conversation.tenantId);
  const inbox = (db.chatwootInboxes || []).find((item) => item.tenantId === conversation.tenantId && conversationChannel(item.channelType) === conversation.channel);
  return {
    id: conversation.chatwootConversationId || conversation.id,
    localId: conversation.id,
    account_id: getChatwootAccountId((db.tenants || []).find((tenant) => tenant.id === conversation.tenantId)),
    inbox_id: inbox?.chatwootInboxId || '',
    status: conversation.status === 'closed' ? 'resolved' : conversation.status === 'human_escalated' ? 'open' : 'pending',
    channel: conversation.channel,
    source: conversation.channel,
    contact: contact ? {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone
    } : null,
    meta: {
      sender: contact ? {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone_number: contact.phone
      } : null,
      assignee: conversation.assignedAgentId ? { id: conversation.assignedAgentId } : null
    },
    messages: (conversation.messages || []).map((message) => ({
      id: message.id,
      content: message.text,
      message_type: message.sender === 'customer' ? 0 : 1,
      private: message.private || message.sender === 'note',
      created_at: Math.floor(new Date(message.timestamp).getTime() / 1000),
      sender: { name: message.sender }
    })),
    labels: conversation.labels || [],
    notes: conversation.notes || [],
    unread_count: conversation.unreadCount || 0,
    last_non_activity_message: {
      content: conversation.lastMessageText,
      created_at: Math.floor(Date.now() / 1000)
    },
    last_activity_at: Math.floor(Date.now() / 1000)
  };
}

export function normalizeChatwootConversation(raw, db, tenantId) {
  const sender = raw.meta?.sender || raw.contact || raw.sender || {};
  const inbox = (db.chatwootInboxes || []).find((item) => item.tenantId === tenantId && String(item.chatwootInboxId) === String(raw.inbox_id));
  const channel = conversationChannel(inbox?.channelType || raw.channel_type || raw.channel || 'website');
  const messages = raw.messages || raw.payload || [];
  const lastMessage = raw.last_non_activity_message || messages[messages.length - 1] || {};

  return {
    id: String(raw.id),
    localId: String(raw.localId || raw.id),
    tenantId,
    contactId: String(sender.id || raw.contact_id || ''),
    contact: {
      id: String(sender.id || raw.contact_id || ''),
      name: sender.name || sender.available_name || 'Unknown Contact',
      email: sender.email || '',
      phone: sender.phone_number || ''
    },
    channel,
    status: raw.status || 'open',
    labels: raw.labels || raw.label_list || [],
    unreadCount: raw.unread_count || raw.unreadCount || 0,
    assignedAgentId: raw.meta?.assignee?.id ? String(raw.meta.assignee.id) : '',
    lastMessageText: lastMessage.content || raw.lastMessageText || '',
    lastMessageTime: raw.last_activity_at ? new Date(raw.last_activity_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    messages: messages.map((message) => ({
      id: String(message.id),
      text: message.content || '',
      sender: message.private ? 'note' : message.message_type === 0 ? 'customer' : 'human',
      private: !!message.private,
      timestamp: message.created_at ? new Date(message.created_at * 1000).toISOString() : new Date().toISOString()
    }))
  };
}
