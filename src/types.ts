export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'Growth' | 'Enterprise' | 'Scale';
  status: 'active' | 'suspended';
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  emailTemplates: {
    welcome: string;
    escalation: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  voice: string;
  language: string;
  personality: string;
  department: 'Support' | 'Sales' | 'Reception' | 'Billing' | 'Admissions';
  prompt: string;
  workingHours: {
    start: string;
    end: string;
  };
  status: 'online' | 'offline';
  tools: string[];
  knowledgeSources: string[];
  escalationRules: string;
}

export interface Contact {
  id: string;
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
}

export interface Deal {
  id: string;
  contactId: string;
  name: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  createdAt: string;
}

export type Channel = 'web' | 'whatsapp' | 'sms' | 'email' | 'instagram' | 'voice';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  text: string;
  timestamp: string;
  slots?: string[];
}

export interface Conversation {
  id: string;
  contactId: string;
  status: 'ai_active' | 'human_escalated' | 'closed';
  channel: Channel;
  messages: ChatMessage[];
  lastMessageText: string;
  lastMessageTime: string;
  assignedAgentId?: string;
  unreadCount?: number;
}

export interface Appointment {
  id: string;
  contactId: string;
  agentId: string;
  dateTime: string; // ISO format or YYYY-MM-DD HH:MM
  duration: number; // minutes
  location: string;
  type: string; // "Clinic Visit", "Consultation", etc.
  status: 'scheduled' | 'cancelled' | 'no_show';
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action';
  label: string;
  component: string;
  description: string;
  status: 'active' | 'inactive';
  config?: {
    connectorType?: 'whatsapp' | 'email' | 'sms' | 'slack' | 'webhook';
    whatsappNumber?: string;
    whatsappTemplate?: string;
    emailRecipient?: string;
    emailSubject?: string;
    emailBody?: string;
    smsNumber?: string;
    smsMessage?: string;
    slackChannel?: string;
    slackMessage?: string;
    webhookUrl?: string;
    webhookMethod?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  runsCount: number;
  successCount: number;
  lastRun?: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'file' | 'url' | 'drive';
  size: string; // e.g. "2.4 MB"
  tokenCount: number;
  status: 'synced' | 'indexing' | 'error';
  lastSync: string;
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
  name: string;
  email: string;
  role: 'Admin' | 'Support Staff' | 'Sales Agent' | 'Billing Manager';
  permissions: {
    viewCRM: boolean;
    editEmployees: boolean;
    viewBilling: boolean;
    deployWebsites: boolean;
  };
  status: 'active' | 'pending';
}
