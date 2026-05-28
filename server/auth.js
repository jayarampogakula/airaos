import crypto from 'crypto';
import { readDb, writeDb } from './db.js';

export const ROLE_NAMES = ['Owner', 'Admin', 'Manager', 'Agent'];

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash, userRaw) {
  if (!storedHash && userRaw && userRaw.password) {
    return password === userRaw.password;
  }
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 48) || `tenant-${Date.now()}`;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export function getSessionToken(req) {
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return req.get('x-session-token') || req.query.sessionToken || null;
}

export function createSession(db, userId, activeTenantId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const session = {
    id: `sess-${Date.now()}`,
    token,
    userId,
    activeTenantId,
    createdAt: now.toISOString(),
    expiresAt
  };
  db.sessions = [...(db.sessions || []).filter((s) => s.userId !== userId || new Date(s.expiresAt) > now), session];
  return session;
}

export function getUserTenants(db, userId) {
  return (db.memberships || [])
    .filter((membership) => membership.userId === userId && membership.status === 'active')
    .map((membership) => {
      const tenant = (db.tenants || []).find((t) => t.id === membership.tenantId);
      if (!tenant) return null;
      return {
        ...tenant,
        membershipRole: membership.role,
        membershipId: membership.id
      };
    })
    .filter(Boolean);
}

export function authMiddleware(req, res, next) {
  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const db = readDb();
  const session = (db.sessions || []).find((s) => s.token === token);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  const user = (db.users || []).find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found for session.' });
  }

  req.db = db;
  req.session = session;
  req.user = user;
  next();
}

export function tenantMiddleware(req, res, next) {
  const db = req.db || readDb();
  const requestedTenantId = req.get('x-tenant-id') || req.get('x-active-tenant-id') || req.query.tenantId || req.body?.tenantId || req.session?.activeTenantId;
  const membership = (db.memberships || []).find((m) => (
    m.userId === req.user.id &&
    m.tenantId === requestedTenantId &&
    m.status === 'active'
  ));

  if (!membership) {
    return res.status(403).json({ error: 'You do not have access to this tenant.' });
  }

  const tenant = (db.tenants || []).find((t) => t.id === membership.tenantId);
  if (!tenant || tenant.status === 'suspended') {
    return res.status(403).json({ error: 'Tenant is unavailable.' });
  }

  req.db = db;
  req.tenant = tenant;
  req.tenantId = tenant.id;
  req.membership = membership;
  next();
}

export function optionalTenantId(req) {
  return req.get('x-tenant-id') || req.get('x-active-tenant-id') || req.query.tenantId || req.body?.tenantId || 't-1';
}

export function createTenantRecord({ companyName }) {
  const id = `t-${Date.now()}`;
  const slug = slugify(companyName);
  return {
    id,
    name: companyName,
    slug,
    domain: `${slug}.gatidesk.com`,
    plan: 'Growth',
    status: 'active',
    logo: companyName.charAt(0).toUpperCase(),
    primaryColor: '#0ea5e9',
    secondaryColor: '#0f172a',
    settings: {
      n8nUrl: '',
      timezone: 'Asia/Calcutta'
    },
    emailTemplates: {
      welcome: `Hello {contact_name}, welcome to ${companyName}!`,
      escalation: `Alert: Conversation with {contact_name} has been escalated.`
    },
    credits: 0,
    billingHistory: [],
    createdAt: new Date().toISOString()
  };
}

export function saveDb(reqOrDb) {
  const db = reqOrDb.db || reqOrDb;
  writeDb(db);
}
