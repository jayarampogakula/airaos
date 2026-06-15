export interface Tenant {
  id: string;
  slug?: string;
  name: string;
  domain: string;
  plan: 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
  status: 'active' | 'suspended';
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  emailTemplates: {
    welcome: string;
    escalation: string;
  };
  credits?: number;
  billingHistory?: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    status: string;
  }>;
  settings?: Record<string, any>;
  membershipRole?: RoleName;
  websiteConfig?: {
    businessName?: string;
    slogan?: string;
    description?: string;
    services?: string;
    phone?: string;
    email?: string;
    theme?: string;
    isWebsiteGenerated?: boolean;
    html?: string;
  };
  widgetConfig?: {
    widgetTitle?: string;
    greeting?: string;
    widgetColor?: string;
    position?: 'right' | 'left';
    widgetMode?: 'chat' | 'voice' | 'hybrid';
    selectedAgentId?: string;
    requirePreChatLeadCapture?: boolean;
  };
}

export type RoleName = 'Owner' | 'Admin' | 'Manager' | 'Agent';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  role: RoleName;
  status: 'active' | 'pending' | 'disabled';
}

export interface Agent {
  id: string;
  tenantId?: string;
  name: string;
  avatar: string;
  voice: string;
  language: string;
  personality: string;
  department: 'Support' | 'Sales' | 'Reception' | 'Billing' | 'Admissions' | 'Appointment' | 'Follow-up' | 'WhatsApp' | 'Website';
  prompt: string;
  workingHours: {
    start: string;
    end: string;
  };
  status: 'online' | 'offline';
  tools: string[];
  knowledgeSources: string[];
  escalationRules: string;
  // Multi-agent ecosystem fields
  agentRole?: 'sales' | 'support' | 'appointment' | 'billing' | 'followup' | 'voice' | 'website' | 'whatsapp';
  routingKeywords?: string[];
  conversationsHandled?: number;
  avgResponseTime?: number; // seconds
}

export interface Contact {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  notes: string[];
  createdAt: string;
  city?: string;
  project?: string;
  assignedAgentId?: string;
  inquiryCount?: number;
  // Lead Intelligence fields
  leadScore?: number;        // 0-100
  leadCategory?: 'cold' | 'warm' | 'hot' | 'sales_ready';
  source?: LeadSourceType;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPage?: string;
  adSet?: string;
  adName?: string;
  visitorSessionIds?: string[];
  timelineEventIds?: string[];
}

export interface Deal {
  id: string;
  tenantId?: string;
  contactId: string;
  name: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  createdAt: string;
  // AI Pipeline Intelligence
  closeProbability?: number; // 0-100
  stalledFlag?: boolean;
  stalledDays?: number;
  aiNextAction?: string;
  aiSummary?: string;
  expectedCloseDate?: string;
}

export type Channel = 'web' | 'website' | 'whatsapp' | 'sms' | 'email' | 'gmail' | 'outlook' | 'smtp' | 'telegram' | 'instagram' | 'facebook' | 'voice';

export interface ChatMessage {
  id: string;
  tenantId?: string;
  conversationId?: string;
  sender: 'customer' | 'ai' | 'human' | 'note';
  text: string;
  timestamp: string;
  slots?: string[];
  private?: boolean;
}

export interface Conversation {
  id: string;
  tenantId?: string;
  contactId: string;
  status: 'ai_active' | 'human_escalated' | 'closed';
  channel: Channel;
  messages: ChatMessage[];
  lastMessageText: string;
  lastMessageTime: string;
  assignedAgentId?: string;
  unreadCount?: number;
  labels?: string[];
  notes?: string[];
  contact?: Partial<Contact>;
}

export type ManagedChannelType = 'website' | 'whatsapp' | 'gmail' | 'outlook' | 'smtp' | 'telegram' | 'instagram' | 'facebook' | 'sms';

export interface ChannelConfig {
  id: string;
  tenantId: string;
  type: ManagedChannelType;
  provider: string;
  displayName: string;
  status: 'not_connected' | 'connected' | 'pending_provider_setup' | 'needs_attention';
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  tenantId?: string;
  contactId: string;
  agentId: string;
  dateTime: string; // ISO format or YYYY-MM-DD HH:MM
  duration: number; // minutes
  location: string;
  type: string; // "Clinic Visit", "Consultation", etc.
  status: 'scheduled' | 'cancelled' | 'no_show';
  meetingLink?: string;
  reminderSent?: boolean;
  calendarSync?: 'google' | 'outlook' | 'none';
}

export interface WorkflowNode {
  id: string;
  type: string; // 'trigger' | 'action' | 'ai' | 'condition' | 'loop'
  position?: { x: number; y: number };
  data?: any;
  label?: string;
  component?: string;
  description?: string;
  status?: string;
  config?: {
    connectorType?: string;
    crmAction?: string;
    dealName?: string;
    dealValue?: string;
    pipelineStage?: string;
    whatsappNumber?: string;
    whatsappTemplate?: string;
    whatsappTemplateId?: string;
    emailRecipient?: string;
    emailSubject?: string;
    emailBody?: string;
    emailTemplateId?: string;
    smsNumber?: string;
    smsMessage?: string;
    slackChannel?: string;
    slackMessage?: string;
    webhookUrl?: string;
    webhookMethod?: string;
    timingMode?: string;
    delayValue?: number;
    delayUnit?: string;
    relativeValue?: number;
    relativeUnit?: string;
    relativeAnchor?: string;
    relativeAnchorEvent?: string;
    // AI configuration parameters
    aiNodeType?: string;
    aiInstructions?: string;
    aiTargetText?: string;
    classifierCategories?: string;
    kbQuery?: string;
    // Loop node parameters
    loopType?: string;
    maxRetries?: string;
    loopVariable?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface Workflow {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  runsCount: number;
  successCount: number;
  lastRun?: string;
  variables?: Record<string, string>;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  tenantId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: string;
}

export interface WorkflowRunLog {
  nodeId: string;
  label: string;
  type: string;
  startTime: string;
  status: 'running' | 'success' | 'failed';
  output?: string;
  error?: string;
  duration?: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  tenantId: string;
  status: 'running' | 'completed' | 'failed' | 'delayed';
  timestamp: string;
  timeline: WorkflowRunLog[];
  variables: Record<string, any>;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'file' | 'url' | 'drive' | 'notion' | 'google_docs' | 'faq';
  size: string; // e.g. "2.4 MB"
  tokenCount: number;
  status: 'synced' | 'indexing' | 'error';
  lastSync: string;
  usageCount?: number;
  confidenceScore?: number; // 0-100
  fileType?: 'pdf' | 'docx' | 'txt' | 'csv' | 'url';
}

export interface KbChunk {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  tokens: number;
}

export interface BillingLimit {
  name: string;
  limit: number | string;
  used: number;
  unit: string;
}

export interface SystemMetrics {
  mrr: number;
  conversionRate: number;
  aiResolutionRate: number;
  humanEscalationRate: number;
  activeCalls: number;
  chatCount: number;
  voiceDuration: number; // minutes
}

export interface TeamMember {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: RoleName | 'Support Staff' | 'Sales Agent' | 'Billing Manager';
  department?: string;
  permissions: {
    viewCRM: boolean;
    editEmployees: boolean;
    viewBilling: boolean;
    deployWebsites: boolean;
  };
  status: 'active' | 'pending';
}

export interface Notification {
  id: string;
  tenantId: string;
  type: string;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

// ============================================================
// NEW: Lead Intelligence & Attribution
// ============================================================

export type LeadSourceType =
  | 'facebook_lead_ads'
  | 'instagram'
  | 'website_form'
  | 'website_chat'
  | 'whatsapp'
  | 'google_ads'
  | 'google_business'
  | 'manual'
  | 'csv_import'
  | 'api'
  | 'voice_call'
  | 'organic';

export interface LeadSource {
  id: string;
  tenantId: string;
  type: LeadSourceType;
  name: string;
  campaign?: string;
  adSet?: string;
  adName?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  leadsCount: number;
  qualifiedCount: number;
  wonCount: number;
  revenue: number;
  costPerLead?: number;
  isActive: boolean;
  createdAt: string;
}

export interface LeadScore {
  id: string;
  tenantId: string;
  contactId: string;
  score: number; // 0-100
  category: 'cold' | 'warm' | 'hot' | 'sales_ready';
  factors: LeadScoreFactor[];
  computedAt: string;
  trendHistory: Array<{ date: string; score: number }>;
}

export interface LeadScoreFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  points: number;
  description: string;
}

// ============================================================
// NEW: Customer Timeline
// ============================================================

export type TimelineEventType =
  | 'lead_created'
  | 'website_visit'
  | 'page_viewed'
  | 'chat_started'
  | 'whatsapp_message'
  | 'email_sent'
  | 'voice_call'
  | 'appointment_booked'
  | 'appointment_completed'
  | 'proposal_sent'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'note_added'
  | 'score_updated'
  | 'recovery_triggered'
  | 'campaign_sent';

export interface CustomerTimelineEvent {
  id: string;
  tenantId: string;
  contactId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  channel?: Channel | 'system';
  actor: 'ai' | 'human' | 'system' | 'customer';
  actorName?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ============================================================
// NEW: Visitor Intelligence
// ============================================================

export interface VisitorSession {
  id: string;
  tenantId: string;
  contactId?: string; // null if anonymous
  visitorId: string; // anonymous fingerprint
  isIdentified: boolean;
  pages: VisitorPageView[];
  entryPage: string;
  exitPage: string;
  totalTimeSeconds: number;
  device: 'desktop' | 'mobile' | 'tablet';
  country: string;
  city?: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  intentScore: number;    // 0-100
  engagementScore: number; // 0-100
  purchaseProbability: number; // 0-100
  isActive: boolean;
  startedAt: string;
  lastSeenAt: string;
}

export interface VisitorPageView {
  page: string;
  title: string;
  timeSeconds: number;
  scrollDepth: number; // 0-100 percentage
  timestamp: string;
}

// ============================================================
// NEW: Revenue & Analytics
// ============================================================

export interface RevenueMetrics {
  tenantId: string;
  period: string; // "2026-06", "2026-05", etc.
  revenueGenerated: number;
  appointmentsBooked: number;
  qualifiedLeads: number;
  conversionRate: number;
  dealsWon: number;
  dealsLost: number;
  pipelineValue: number;
  costPerLead: number;
  costPerAcquisition: number;
  roi: number;
  avgDealSize: number;
}

export interface AnalyticsDataPoint {
  label: string;
  value: number;
  change?: number; // percent change vs previous period
  trend?: 'up' | 'down' | 'flat';
}

// ============================================================
// NEW: Marketing Campaigns
// ============================================================

export type CampaignChannel = 'email' | 'whatsapp' | 'sms';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  subject?: string; // for email
  message: string;
  audience: CampaignAudience;
  trigger?: CampaignTrigger;
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  repliedCount: number;
  convertedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAudience {
  type: 'all' | 'segment' | 'tag' | 'lead_score' | 'stage';
  filters: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }>;
  estimatedCount: number;
}

export interface CampaignTrigger {
  type: 'immediate' | 'scheduled' | 'behavior';
  behaviorEvent?: string; // "visited_pricing_page", "no_reply_24h", "appointment_noshow"
  delayMinutes?: number;
}

// ============================================================
// NEW: Missed Lead Recovery
// ============================================================

export interface RecoveryWorkflow {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  steps: RecoveryStep[];
  triggeredCount: number;
  recoveredCount: number;
  createdAt: string;
}

export interface RecoveryStep {
  id: string;
  delayHours: number;
  channel: 'ai_message' | 'whatsapp' | 'voice_call' | 'human_task' | 'email' | 'sms';
  message?: string;
  taskDescription?: string;
  order: number;
}

// ============================================================
// NEW: Conversation Replay
// ============================================================

export interface ConversationReplay {
  id: string;
  tenantId: string;
  conversationId: string;
  contactName: string;
  agentName: string;
  channel: Channel;
  duration: number; // seconds
  outcome: 'resolved' | 'escalated' | 'abandoned';
  steps: ConversationReplayStep[];
  createdAt: string;
}

export interface ConversationReplayStep {
  id: string;
  type: 'customer_message' | 'ai_reasoning' | 'knowledge_lookup' | 'ai_response' | 'action_triggered' | 'human_takeover';
  content: string;
  knowledgeSource?: string;
  confidenceScore?: number;
  actionType?: string;
  timestamp: string;
  durationMs?: number;
}

// ============================================================
// NEW: Audit & Activity Logs
// ============================================================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  memberIds: string[];
  agentIds: string[];
  createdAt: string;
}

// ============================================================
// NEW: Marketplace
// ============================================================

export type MarketplaceItemType = 'agent_template' | 'workflow_template' | 'knowledge_pack' | 'widget_template' | 'integration';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  type: MarketplaceItemType;
  category: string;
  price: number; // 0 = free
  rating: number; // 0-5
  reviewCount: number;
  installs: number;
  author: string;
  thumbnail?: string;
  tags: string[];
  isInstalled?: boolean;
  createdAt: string;
}
