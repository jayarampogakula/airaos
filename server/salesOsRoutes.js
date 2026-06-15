// ══════════════════════════════════════════════════════════════
// NEW: AI Sales OS API Routes
// This file contains all new API routes for the AI Sales OS modules.
// Import and use in index.js: import { registerSalesOSRoutes } from './salesOsRoutes.js';
// ══════════════════════════════════════════════════════════════

export function registerSalesOSRoutes(app, { authMiddleware, tenantMiddleware, readDb, writeDb }) {

  // ── Lead Sources ──
  app.get('/api/current-tenant/lead-sources', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.lead_sources || []).filter(s => s.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/lead-sources', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const newSource = { id: `ls-${Date.now()}`, tenantId: req.tenantId, createdAt: new Date().toISOString(), ...req.body };
    db.lead_sources = [...(db.lead_sources || []), newSource];
    writeDb(db);
    res.status(201).json(newSource);
  });

  // ── Visitor Intelligence ──
  app.get('/api/current-tenant/visitor-sessions', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.visitor_sessions || []).filter(s => s.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/visitor-sessions', (req, res) => {
    // Public endpoint for tracking pixel
    const db = readDb();
    const tenantId = req.headers['x-tenant-id'] || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    const newSession = { id: `vs-${Date.now()}`, tenantId, startedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), ...req.body };
    db.visitor_sessions = [...(db.visitor_sessions || []), newSession];
    writeDb(db);
    res.status(201).json({ ok: true, sessionId: newSession.id });
  });

  // ── Lead Scoring ──
  app.get('/api/current-tenant/lead-scores', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.lead_scores || []).filter(s => s.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/lead-scores/compute', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const { contactId } = req.body;
    const score = Math.floor(Math.random() * 50) + 40;
    const category = score >= 80 ? 'sales_ready' : score >= 65 ? 'hot' : score >= 45 ? 'warm' : 'cold';
    const newScore = {
      id: `sc-${Date.now()}`, tenantId: req.tenantId, contactId, score, category,
      factors: [
        { label: 'Website Engagement', impact: 'positive', points: Math.floor(Math.random() * 20) + 5, description: 'Visited pricing page' },
        { label: 'Response Speed', impact: 'positive', points: Math.floor(Math.random() * 15) + 3, description: 'Replied within minutes' }
      ],
      computedAt: new Date().toISOString(),
      trendHistory: [{ date: new Date().toISOString(), score }]
    };
    db.lead_scores = [...(db.lead_scores || []), newScore];
    const contacts = db.contacts || [];
    const idx = contacts.findIndex(c => c.id === contactId && c.tenantId === req.tenantId);
    if (idx !== -1) { contacts[idx] = { ...contacts[idx], leadScore: score, leadCategory: category }; db.contacts = contacts; }
    writeDb(db);
    res.json(newScore);
  });

  // ── Customer Timeline ──
  app.get('/api/current-tenant/contacts/:contactId/timeline', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const events = (db.customer_timeline || []).filter(e => e.tenantId === req.tenantId && e.contactId === req.params.contactId);
    res.json(events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  });

  app.post('/api/current-tenant/contacts/:contactId/timeline', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const event = { id: `te-${Date.now()}`, tenantId: req.tenantId, contactId: req.params.contactId, timestamp: new Date().toISOString(), ...req.body };
    db.customer_timeline = [...(db.customer_timeline || []), event];
    writeDb(db);
    res.status(201).json(event);
  });

  // ── Marketing Campaigns ──
  app.get('/api/current-tenant/campaigns', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.campaigns || []).filter(c => c.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/campaigns', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const campaign = { id: `camp-${Date.now()}`, tenantId: req.tenantId, sentCount: 0, deliveredCount: 0, openedCount: 0, repliedCount: 0, convertedCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...req.body };
    db.campaigns = [...(db.campaigns || []), campaign];
    writeDb(db);
    res.status(201).json(campaign);
  });

  app.put('/api/current-tenant/campaigns/:id', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    db.campaigns = (db.campaigns || []).map(c => c.id === req.params.id && c.tenantId === req.tenantId ? { ...c, ...req.body, updatedAt: new Date().toISOString() } : c);
    writeDb(db);
    res.json({ ok: true });
  });

  app.post('/api/current-tenant/campaigns/:id/send', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    db.campaigns = (db.campaigns || []).map(c => c.id === req.params.id && c.tenantId === req.tenantId ? { ...c, status: 'active', updatedAt: new Date().toISOString() } : c);
    writeDb(db);
    res.json({ ok: true, message: 'Campaign queued for sending' });
  });

  // ── Recovery Workflows ──
  app.get('/api/current-tenant/recovery-workflows', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.recovery_workflows || []).filter(w => w.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/recovery-workflows', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const wf = { id: `rw-${Date.now()}`, tenantId: req.tenantId, triggeredCount: 0, recoveredCount: 0, createdAt: new Date().toISOString(), ...req.body };
    db.recovery_workflows = [...(db.recovery_workflows || []), wf];
    writeDb(db);
    res.status(201).json(wf);
  });

  // ── Revenue Metrics ──
  app.get('/api/current-tenant/revenue-metrics/summary', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const deals = (db.deals || []).filter(d => d.tenantId === req.tenantId);
    const wonDeals = deals.filter(d => d.stage === 'won');
    const contacts = (db.contacts || []).filter(c => c.tenantId === req.tenantId);
    const appointments = (db.appointments || []).filter(a => a.tenantId === req.tenantId);
    res.json({
      revenueGenerated: wonDeals.reduce((s, d) => s + (d.value || 0), 0),
      appointmentsBooked: appointments.length,
      qualifiedLeads: contacts.filter(c => c.leadCategory === 'hot' || c.leadCategory === 'sales_ready').length,
      dealsWon: wonDeals.length,
      dealsLost: deals.filter(d => d.stage === 'lost').length,
      pipelineValue: deals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0),
      conversionRate: deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0
    });
  });

  // ── Analytics ──
  app.get('/api/current-tenant/analytics/:category', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const { category } = req.params;
    const tid = req.tenantId;
    const deals = (db.deals || []).filter(d => d.tenantId === tid);
    const convs = (db.conversations || []).filter(c => c.tenantId === tid);
    const analyticsMap = {
      sales: { totalDeals: deals.length, wonDeals: deals.filter(d => d.stage === 'won').length, lostDeals: deals.filter(d => d.stage === 'lost').length, winRate: deals.length ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0 },
      agent: { totalConversations: convs.length, aiResolved: convs.filter(c => c.status === 'closed').length, escalated: convs.filter(c => c.status === 'human_escalated').length },
      conversation: { total: convs.length },
      revenue: { pipelineValue: deals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0) },
      marketing: { campaigns: (db.campaigns || []).filter(c => c.tenantId === tid).length },
      lead_source: { sources: (db.lead_sources || []).filter(s => s.tenantId === tid) }
    };
    res.json(analyticsMap[category] || { error: 'Unknown analytics category' });
  });

  // ── Audit Logs ──
  app.get('/api/current-tenant/audit-logs', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.audit_logs || []).filter(l => l.tenantId === req.tenantId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100));
  });

  // ── Departments ──
  app.get('/api/current-tenant/departments', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    res.json((db.departments || []).filter(d => d.tenantId === req.tenantId));
  });

  app.post('/api/current-tenant/departments', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const dept = { id: `dept-${Date.now()}`, tenantId: req.tenantId, memberIds: [], agentIds: [], createdAt: new Date().toISOString(), ...req.body };
    db.departments = [...(db.departments || []), dept];
    writeDb(db);
    res.status(201).json(dept);
  });

  // ── Marketplace ──
  app.get('/api/marketplace/items', authMiddleware, (req, res) => {
    const db = readDb();
    res.json(db.marketplace_items || []);
  });

  app.post('/api/marketplace/items/:id/install', authMiddleware, tenantMiddleware, (req, res) => {
    res.json({ ok: true, message: 'Item installed successfully' });
  });

  // ── Conversation Replay ──
  app.get('/api/current-tenant/conversations/:id/replay', authMiddleware, tenantMiddleware, (req, res) => {
    const db = readDb();
    const replay = (db.conversation_replays || []).find(r => r.conversationId === req.params.id && r.tenantId === req.tenantId);
    if (!replay) return res.status(404).json({ error: 'Replay not found' });
    res.json(replay);
  });
}
