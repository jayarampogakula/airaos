import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  GitBranch, Play, CheckCircle2, AlertCircle, RefreshCw, Layers,
  Sliders, PlayCircle, ChevronRight, Plus, X, Mail, MessageSquare,
  Eye, Code, Copy, Save, Trash2, Clock, Search, FileText, Database,
  Sparkles, Share2, History, Download, Upload, Info, Settings, HelpCircle, PhoneCall
} from 'lucide-react';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowRun, WorkflowVersion } from '../types';

// Prebuilt Template Libraries
const PREBUILT_TEMPLATES = [
  {
    id: 'tpl-lead-nurture',
    name: 'Lead Follow-up Automation',
    description: 'Triggered when website lead submits form. Sends immediate welcome email, wait 2 days, and classify reply using AI.',
    nodes: [
      { id: 'n-1', type: 'trigger', label: 'Form Submitted', component: 'Website Form', description: 'Fires when lead details are captured on the landing page widget', status: 'active', position: { x: 100, y: 150 } },
      { id: 'n-2', type: 'action', label: 'Send Welcome Email', component: 'Email Connector', description: 'Sends predesigned onboarding welcome email immediately', status: 'active', config: { connectorType: 'email', emailTemplateId: 'welcome_onboarding', timingMode: 'immediate' }, position: { x: 350, y: 150 } },
      { id: 'n-3', type: 'action', label: 'Wait 2 Days', component: 'Delay / Wait', description: 'Suspends the execution flow for 2 days', status: 'active', config: { timingMode: 'delay', delayValue: 2, delayUnit: 'days' }, position: { x: 600, y: 150 } },
      { id: 'n-4', type: 'ai', label: 'Classify Lead Reply', component: 'AI Classifier', description: 'AI evaluates reply content and routes accordingly', status: 'active', config: { aiNodeType: 'classifier', classifierCategories: 'Interested, Not Interested, Question' }, position: { x: 850, y: 150 } }
    ],
    edges: [
      { id: 'e-1', source: 'n-1', target: 'n-2' },
      { id: 'e-2', source: 'n-2', target: 'n-3' },
      { id: 'e-3', source: 'n-3', target: 'n-4' }
    ]
  },
  {
    id: 'tpl-missed-call',
    name: 'Missed Call Recovery',
    description: 'Triggers when call is unanswered. Creates CRM lead, sends WhatsApp, wait 2 hours, then triggers AI Call campaign.',
    nodes: [
      { id: 'n-1', type: 'trigger', label: 'Missed Call', component: 'Telephony Node', description: 'Fires when an incoming call is unanswered by agents', status: 'active', position: { x: 100, y: 150 } },
      { id: 'n-2', type: 'action', label: 'Create CRM Lead', component: 'Native CRM', description: 'Registers a contact and deal in pipeline lead stage', status: 'active', config: { connectorType: 'crm', crmAction: 'create_deal', pipelineStage: 'lead' }, position: { x: 350, y: 150 } },
      { id: 'n-3', type: 'action', label: 'Send WhatsApp Alert', component: 'WhatsApp Node', description: 'Dispatched automated templates saying we will call back', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplate: 'welcome_lead' }, position: { x: 600, y: 150 } },
      { id: 'n-4', type: 'action', label: 'Trigger AI Callback', component: 'AI Phone Call', description: 'Initiates callback outbound call with Sarah receptionist', status: 'active', config: { connectorType: 'voice' }, position: { x: 850, y: 150 } }
    ],
    edges: [
      { id: 'e-1', source: 'n-1', target: 'n-2' },
      { id: 'e-2', source: 'n-2', target: 'n-3' },
      { id: 'e-3', source: 'n-3', target: 'n-4' }
    ]
  },
  {
    id: 'tpl-remind-seq',
    name: 'Appointment Reminder Sequence',
    description: 'Triggered when appointment scheduled. Sends WhatsApp confirmation, and relative reminders before booking time.',
    nodes: [
      { id: 'n-1', type: 'trigger', label: 'Appointment Scheduled', component: 'Calendar Engine', description: 'Fires when client schedules calendar slot', status: 'active', position: { x: 100, y: 150 } },
      { id: 'n-2', type: 'action', label: 'Send Booking WhatsApp', component: 'WhatsApp Node', description: 'Confirmation details sent immediately', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplate: 'appointment_confirm', timingMode: 'immediate' }, position: { x: 350, y: 150 } },
      { id: 'n-3', type: 'action', label: '1-Hour WhatsApp Alert', component: 'WhatsApp Node', description: 'Sends second WhatsApp exactly 1 hour before appointment', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplate: 'appointment_remind_1h', timingMode: 'relative', relativeValue: 1, relativeUnit: 'hours', relativeAnchor: 'before' }, position: { x: 600, y: 150 } }
    ],
    edges: [
      { id: 'e-1', source: 'n-1', target: 'n-2' },
      { id: 'e-2', source: 'n-2', target: 'n-3' }
    ]
  },
  {
    id: 'tpl-sales-outreach',
    name: 'AI Sales Outreach',
    description: 'Triggered on new lead. AI decides if VIP; If Yes, triggers AI outbound call and alerts dev Slack.',
    nodes: [
      { id: 'n-1', type: 'trigger', label: 'New Lead Created', component: 'Native CRM', description: 'Fires when customer record enters database', status: 'active', position: { x: 100, y: 150 } },
      { id: 'n-2', type: 'ai', label: 'AI VIP Qualifier', component: 'AI Classifier', description: 'AI classifies if lead has high-budget intent', status: 'active', config: { aiNodeType: 'classifier', classifierCategories: 'VIP, Standard' }, position: { x: 350, y: 150 } },
      { id: 'n-3', type: 'condition', label: 'Is VIP?', component: 'If / Else Branch', description: 'Evaluates if AI output equals VIP', status: 'active', config: { conditionType: 'if_else', conditionField: 'ai_result', conditionOperator: 'equals', conditionCompareValue: 'VIP' }, position: { x: 600, y: 150 } },
      { id: 'n-4', type: 'action', label: 'Outbound AI Call', component: 'AI Phone Call', description: 'Outbound voice bot dialer to schedule property tours', status: 'active', config: { connectorType: 'voice' }, position: { x: 850, y: 50 } },
      { id: 'n-5', type: 'action', label: 'WhatsApp Outreach', component: 'WhatsApp Node', description: 'Standard introductory message sequence', status: 'active', config: { connectorType: 'whatsapp', whatsappTemplate: 'welcome_lead' }, position: { x: 850, y: 250 } }
    ],
    edges: [
      { id: 'e-1', source: 'n-1', target: 'n-2' },
      { id: 'e-2', source: 'n-2', target: 'n-3' },
      { id: 'e-3', source: 'n-3', target: 'n-4', sourceHandle: 'true' },
      { id: 'e-4', source: 'n-3', target: 'n-5', sourceHandle: 'false' }
    ]
  }
];

// Custom Node component displaying dynamic details and execution state highlights
const CustomWorkflowNode = ({ data, id }: { data: any; id: string }) => {
  const { label, type, component, description, status, executionState } = data;
  
  // Icon and HSL colors according to category
  let icon = <Play size={16} />;
  let colorClass = 'border-[#0ea5e9] text-[#0ea5e9] bg-[#0ea5e9]/5';
  let badgeColor = 'bg-[#0ea5e9]/10 text-[#38bdf8]';

  if (type === 'action') {
    const isEmail = label.toLowerCase().includes('email') || data.config?.connectorType === 'email';
    const isWhatsApp = label.toLowerCase().includes('whatsapp') || data.config?.connectorType === 'whatsapp';
    const isVoice = label.toLowerCase().includes('call') || label.toLowerCase().includes('phone') || data.config?.connectorType === 'voice';
    const isCrm = label.toLowerCase().includes('crm') || label.toLowerCase().includes('deal') || label.toLowerCase().includes('contact') || data.config?.connectorType === 'crm';
    
    if (isEmail) icon = <Mail size={16} />;
    else if (isWhatsApp) icon = <MessageSquare size={16} />;
    else if (isVoice) icon = <PhoneCall size={16} />;
    else if (isCrm) icon = <Database size={16} />;
    else icon = <Sliders size={16} />;
    
    colorClass = 'border-[#6366f1] text-[#6366f1] bg-[#6366f1]/5';
    badgeColor = 'bg-[#6366f1]/10 text-[#818cf8]';
  } else if (type === 'ai') {
    icon = <Sparkles size={16} />;
    colorClass = 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5';
    badgeColor = 'bg-[#a855f7]/10 text-[#c084fc]';
  } else if (type === 'condition') {
    icon = <GitBranch size={16} />;
    colorClass = 'border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/5';
    badgeColor = 'bg-[#f59e0b]/10 text-[#fbbf24]';
  } else if (type === 'loop') {
    icon = <RefreshCw size={16} />;
    colorClass = 'border-[#10b981] text-[#10b981] bg-[#10b981]/5';
    badgeColor = 'bg-[#10b981]/10 text-[#34d399]';
  }

  // Visual glows representing debug execution highlights
  let executionGlowClass = 'border-white/10';
  let statusIndicator = null;

  if (executionState === 'active') {
    executionGlowClass = 'border-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.55)] scale-105';
    statusIndicator = (
      <div className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#6366f1] animate-ping" />
    );
  } else if (executionState === 'success') {
    executionGlowClass = 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.35)]';
    statusIndicator = (
      <div className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#10b981] border border-slate-900">
        <CheckCircle2 size={10} className="text-slate-900" />
      </div>
    );
  } else if (executionState === 'failed') {
    executionGlowClass = 'border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.35)]';
    statusIndicator = (
      <div className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ef4444] border border-slate-900">
        <AlertCircle size={10} className="text-white" />
      </div>
    );
  }

  return (
    <div
      className={`glass-panel p-4 rounded-xl border relative transition-all duration-300 min-w-[220px] max-w-[260px] bg-slate-900/90 text-left ${executionGlowClass}`}
    >
      {statusIndicator}

      {/* Target connection handles */}
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="w-3.5 h-3.5 bg-slate-800 border-2 border-slate-700 hover:border-[#6366f1] transition-colors"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          {icon}
        </div>
        <div>
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
            {type}
          </span>
          <h4 className="text-[0.82rem] font-bold text-slate-100 mt-1 truncate">{label}</h4>
        </div>
      </div>

      <p className="text-[0.72rem] text-slate-400 line-clamp-2 leading-relaxed mb-1">
        {description}
      </p>

      <div className="flex justify-between items-center text-[0.6rem] text-slate-500 mt-2 pt-2 border-t border-slate-800">
        <span>{component}</span>
        <span className={status === 'active' ? 'text-emerald-400' : 'text-slate-600'}>
          {status === 'active' ? '● Active' : '○ Disabled'}
        </span>
      </div>

      {/* Source handles */}
      {type === 'condition' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '35%', background: '#10b981' }}
            className="w-3.5 h-3.5 border-2 border-slate-900 hover:scale-110 transition-transform"
          />
          <div className="absolute right-4 top-[24%] text-[0.55rem] text-[#10b981] font-bold">YES</div>
          
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '65%', background: '#ef4444' }}
            className="w-3.5 h-3.5 border-2 border-slate-900 hover:scale-110 transition-transform"
          />
          <div className="absolute right-4 top-[56%] text-[0.55rem] text-[#ef4444] font-bold">NO</div>
        </>
      ) : type === 'loop' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="loop"
            style={{ top: '35%', background: '#3b82f6' }}
            className="w-3.5 h-3.5 border-2 border-slate-900 hover:scale-110 transition-transform"
          />
          <div className="absolute right-4 top-[24%] text-[0.55rem] text-[#3b82f6] font-bold">LOOP</div>
          
          <Handle
            type="source"
            position={Position.Right}
            id="done"
            style={{ top: '65%', background: '#10b981' }}
            className="w-3.5 h-3.5 border-2 border-slate-900 hover:scale-110 transition-transform"
          />
          <div className="absolute right-4 top-[56%] text-[0.55rem] text-[#10b981] font-bold">DONE</div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="w-3.5 h-3.5 bg-slate-800 border-2 border-slate-700 hover:border-[#6366f1] transition-colors"
        />
      )}
    </div>
  );
};

const nodeTypes = {
  workflowNode: CustomWorkflowNode
};

interface WorkflowViewProps {
  workflows: Workflow[];
  onToggleWorkflow: (wfId: string) => void;
  onIncrementRuns: (wfId: string) => void;
  onAddWorkflow: (wf: Workflow) => void;
  onUpdateWorkflow: (wf: Workflow) => void;
}

// Inner Component with access to ReactFlow instance
const WorkflowBuilderInner: React.FC<WorkflowViewProps> = ({
  workflows,
  onToggleWorkflow,
  onIncrementRuns,
  onAddWorkflow,
  onUpdateWorkflow
}) => {
  const [selectedWfId, setSelectedWfId] = useState(workflows[0]?.id || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Layout states
  const [activeSubTab, setActiveSubTab] = useState<'canvas' | 'library' | 'runs' | 'versions'>('canvas');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<'success' | null>(null);

  // Property Editor input state values
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeStatus, setNodeStatus] = useState<'active' | 'inactive'>('active');
  const [nodeConfig, setNodeConfig] = useState<any>({});

  // Timeline / Runs histories
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');

  // UI variable picker popover
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variableTargetField, setVariableTargetField] = useState<string | null>(null);

  const reactFlowInstance = useReactFlow();

  const selectedWf = workflows.find(w => w.id === selectedWfId);

  // Map backend JSON structures to React Flow Nodes & Edges
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<any>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<any>([]);

  // WebSocket reference for live telemetry highlights
  const wsRef = useRef<WebSocket | null>(null);

  // Sync canvas nodes when selected workflow changes
  useEffect(() => {
    if (selectedWf) {
      const mappedNodes = selectedWf.nodes.map((n, idx) => ({
        id: n.id,
        type: 'workflowNode',
        position: n.position || { x: 100 + idx * 300, y: 150 + (idx % 2) * 50 },
        data: {
          ...n,
          executionState: undefined // cleared initially
        }
      }));

      const mappedEdges = selectedWf.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'source',
        targetHandle: e.targetHandle || 'target',
        animated: e.animated || false,
        style: e.style || { strokeWidth: 2.5, stroke: 'var(--border-glass)' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: '#6366f1'
        }
      }));

      setRfNodes(mappedNodes);
      setRfEdges(mappedEdges);
      setSelectedNodeId(null);
      
      // Fetch runs logs & versions from server
      fetchRunsLogs(selectedWf.id);
      fetchVersions(selectedWf.id);
    }
  }, [selectedWfId]);

  // WebSocket Live Highlights debugger setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/api/workflows/telemetry`;
    
    console.log('[WebSocket Telemetry] Connecting to:', socketUrl);
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Telemetry Payload]', message);

        if (message.workflowId !== selectedWfId) return;

        if (message.event === 'node-active') {
          setRfNodes(nodes => nodes.map(n => {
            if (n.id === message.nodeId) {
              return { ...n, data: { ...n.data, executionState: 'active' } };
            }
            return n;
          }));
        } else if (message.event === 'node-success') {
          setRfNodes(nodes => nodes.map(n => {
            if (n.id === message.nodeId) {
              return { ...n, data: { ...n.data, executionState: 'success', lastOutput: message.result } };
            }
            return n;
          }));
        } else if (message.event === 'node-failed') {
          setRfNodes(nodes => nodes.map(n => {
            if (n.id === message.nodeId) {
              return { ...n, data: { ...n.data, executionState: 'failed' } };
            }
            return n;
          }));
        } else if (message.event === 'edge-active') {
          setRfEdges(edges => edges.map(e => {
            if (e.id === message.edgeId) {
              return {
                ...e,
                animated: true,
                style: { strokeWidth: 3.5, stroke: '#c084fc' } // Purple active pulse edge
              };
            }
            return e;
          }));
        } else if (message.event === 'workflow-finished') {
          // Sync fresh runs logs
          fetchRunsLogs(selectedWfId);
          setTimeout(() => {
            // clear highlights
            setRfNodes(nodes => nodes.map(n => ({
              ...n,
              data: { ...n.data, executionState: undefined }
            })));
            setRfEdges(edges => edges.map(e => ({
              ...e,
              animated: false,
              style: { strokeWidth: 2.5, stroke: 'var(--border-glass)' }
            })));
          }, 4000);
        }
      } catch (err) {
        console.error('Error handling WebSocket telemetry package:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket Telemetry] Connection closed.');
    };

    return () => {
      ws.close();
    };
  }, [selectedWfId]);

  // Sync edits back to the Parent components & Autosave
  const autosaveTimer = useRef<any>(null);

  const triggerAutosave = useCallback((nodes: any[], edges: any[]) => {
    if (!selectedWf) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      const formattedNodes: WorkflowNode[] = nodes.map(n => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        component: n.data.component,
        description: n.data.description,
        status: n.data.status,
        config: n.data.config || {},
        position: n.position
      }));

      const formattedEdges: WorkflowEdge[] = edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        animated: e.animated,
        style: e.style
      }));

      const updatedWf: Workflow = {
        ...selectedWf,
        nodes: formattedNodes,
        edges: formattedEdges
      };

      onUpdateWorkflow(updatedWf);
      
      // Post changes to server database
      fetch(`/api/current-tenant/workflows/${selectedWf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWf)
      }).catch(err => console.warn('Could not sync update to server:', err));
    }, 1500); // 1.5s debounce save
  }, [selectedWf, onUpdateWorkflow]);

  // Handle position drag changes and save
  const onNodeDragStop = useCallback((event: any, node: any) => {
    triggerAutosave(rfNodes, rfEdges);
  }, [rfNodes, rfEdges, triggerAutosave]);

  // Connect handler connecting nodes on the canvas
  const onConnect = useCallback((params: any) => {
    const edgeId = `edge-${Date.now()}`;
    const newEdge = {
      ...params,
      id: edgeId,
      animated: false,
      style: { strokeWidth: 2.5, stroke: 'var(--border-glass)' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: '#6366f1'
      }
    };
    
    setRfEdges((eds) => {
      const updated = addEdge(newEdge, eds);
      triggerAutosave(rfNodes, updated);
      return updated;
    });
  }, [rfNodes, rfEdges, triggerAutosave, setRfEdges]);

  // Fetch runs execution timeline
  const fetchRunsLogs = async (wfId: string) => {
    try {
      const res = await fetch(`/api/current-tenant/workflows/${wfId}/runs`);
      if (res.ok) {
        const data = await res.json();
        // Sort descending
        data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRuns(data);
      }
    } catch (e) {
      console.warn('Could not fetch runs log timeline:', e);
    }
  };

  // Fetch versions
  const fetchVersions = async (wfId: string) => {
    try {
      const res = await fetch(`/api/current-tenant/workflows/${wfId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (e) {
      console.warn('Could not load workflow versions:', e);
    }
  };

  // Click handler to select and load node into properties panel
  const onNodeClick = (event: any, node: any) => {
    setSelectedNodeId(node.id);
    const nData = node.data;
    
    setNodeLabel(nData.label || '');
    setNodeDescription(nData.description || '');
    setNodeStatus(nData.status || 'active');
    setNodeConfig(nData.config || {});
    setSaveStatus(null);
  };

  // Update properties of selected node
  const handleSaveNodeConfig = () => {
    if (!selectedNodeId || !selectedWf) return;

    const updatedNodes = rfNodes.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            label: nodeLabel,
            description: nodeDescription,
            status: nodeStatus,
            config: nodeConfig
          }
        };
      }
      return n;
    });

    setRfNodes(updatedNodes);
    triggerAutosave(updatedNodes, rfEdges);

    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Delete node from canvas
  const handleDeleteNode = () => {
    if (!selectedNodeId || !selectedWf) return;

    const filteredNodes = rfNodes.filter(n => n.id !== selectedNodeId);
    const filteredEdges = rfEdges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);

    setRfNodes(filteredNodes);
    setRfEdges(filteredEdges);
    setSelectedNodeId(null);

    triggerAutosave(filteredNodes, filteredEdges);
  };

  // Sidebar list of nodes filtered by search query
  const SIDEBAR_NODE_TEMPLATES = [
    { type: 'trigger', label: 'Form Submitted', component: 'Website Form', description: 'Fires when client registers details.' },
    { type: 'trigger', label: 'New Lead Created', component: 'Native CRM', description: 'Fires when a new contact card is created.' },
    { type: 'trigger', label: 'Missed Call', component: 'Telephony Node', description: 'Fires when voice call goes unanswered.' },
    { type: 'trigger', label: 'New Call Received', component: 'Telephony Node', description: 'Fires when client dials inbound.' },
    { type: 'trigger', label: 'Appointment Booked', component: 'Calendar Engine', description: 'Fires when scheduled slot is registered.' },
    { type: 'trigger', label: 'CRM Status Changed', component: 'Native CRM', description: 'Fires when deal pipeline stages change.' },
    { type: 'trigger', label: 'Incoming WhatsApp', component: 'WhatsApp Node', description: 'Fires on text reply.' },
    { type: 'trigger', label: 'Webhook Trigger', component: 'Webhook API', description: 'Fires when endpoint gets POST request.' },
    { type: 'trigger', label: 'Schedule Trigger', component: 'Cron Job', description: 'Fires on intervals (daily, weekly).' },
    { type: 'trigger', label: 'Manual Trigger', component: 'Manual Control', description: 'Fires on click of button.' },
    
    { type: 'action', label: 'Send Email', component: 'Email Connector', description: 'Sends predesigned SMTP welcome/followups.' },
    { type: 'action', label: 'Send WhatsApp', component: 'WhatsApp Node', description: 'Sends client WhatsApp template text.' },
    { type: 'action', label: 'Send SMS', component: 'SMS Node', description: 'Sends SMS alerts using Twilio carrier.' },
    { type: 'action', label: 'AI Phone Call', component: 'Telephony Node', description: 'Dial outbound voice callback bot.' },
    { type: 'action', label: 'Create CRM Contact', component: 'Native CRM', description: 'Creates contact card.' },
    { type: 'action', label: 'Create Deal', component: 'Native CRM', description: 'Registers a new pipeline deal.' },
    { type: 'action', label: 'Delay / Wait', component: 'Delay / Wait', description: 'Wait a specified value in minutes/days.' },
    { type: 'action', label: 'HTTP API Request', component: 'Webhook API', description: 'Sends generic outbound JSON POST.' },
    
    { type: 'ai', label: 'AI Decision', component: 'AI Brain', description: 'AI outputs YES or NO based on text.' },
    { type: 'ai', label: 'AI Classifier', component: 'AI Brain', description: 'Classifies leads into custom categories.' },
    { type: 'ai', label: 'AI Summarizer', component: 'AI Brain', description: 'Summarizes transcripts.' },
    { type: 'ai', label: 'AI Response Generator', component: 'AI Brain', description: 'Generates email or SMS body response.' },
    { type: 'ai', label: 'AI Intent Detection', component: 'AI Brain', description: 'Detects intent of visitor.' },
    { type: 'ai', label: 'Knowledge Base Search', component: 'AI Brain', description: 'Searches knowledge base files.' },
    
    { type: 'condition', label: 'If / Else Branch', component: 'If / Else Branch', description: 'Splits execution based on variables.' },
    
    { type: 'loop', label: 'Retry Loop', component: 'Retry Loop', description: 'Retries a path up to max limit count.' }
  ];

  const filteredSidebarNodes = SIDEBAR_NODE_TEMPLATES.filter(n =>
    n.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    n.type.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    n.component.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Click handler adding template node onto canvas
  const handleAddNodeToCanvas = (tpl: typeof SIDEBAR_NODE_TEMPLATES[0]) => {
    if (!selectedWf) return;

    const newNodeId = `node-${Date.now()}`;
    const defaultPositions = { x: 250, y: 180 };
    
    // Attempt to center in visible viewport
    const viewport = reactFlowInstance.getViewport();
    const position = {
      x: (-viewport.x + window.innerWidth / 2) / viewport.zoom,
      y: (-viewport.y + window.innerHeight / 2) / viewport.zoom
    };

    const newNode = {
      id: newNodeId,
      type: 'workflowNode',
      position,
      data: {
        id: newNodeId,
        type: tpl.type,
        label: tpl.label,
        component: tpl.component,
        description: tpl.description,
        status: 'active',
        config: tpl.type === 'action' ? { connectorType: tpl.label.toLowerCase().includes('email') ? 'email' : tpl.label.toLowerCase().includes('whatsapp') ? 'whatsapp' : tpl.label.toLowerCase().includes('call') ? 'voice' : tpl.label.toLowerCase().includes('crm') ? 'crm' : 'webhook' } : {}
      }
    };

    setRfNodes(nodes => {
      const updated = [...nodes, newNode];
      triggerAutosave(updated, rfEdges);
      return updated;
    });

    setSelectedNodeId(newNodeId);
    setNodeLabel(tpl.label);
    setNodeDescription(tpl.description);
    setNodeStatus('active');
    setNodeConfig(newNode.data.config);
  };

  // Create customized manual workflow
  const [modalOpen, setModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  const handleCreateNewWorkflow = () => {
    if (!newWfName.trim()) return;

    const newId = `wf-custom-${Date.now()}`;
    const newWorkflow: Workflow = {
      id: newId,
      name: newWfName,
      description: newWfDesc || 'Custom visual flow automation.',
      active: true,
      nodes: [
        { id: 'wn-1', type: 'trigger', label: 'Manual Trigger', component: 'Manual Action', description: 'Click trigger to run', status: 'active', position: { x: 100, y: 150 } }
      ],
      edges: [],
      runsCount: 0,
      successCount: 0
    };

    onAddWorkflow(newWorkflow);
    setSelectedWfId(newId);
    setModalOpen(false);
    setNewWfName('');
    setNewWfDesc('');
  };

  // Trigger manual simulation from client
  const [simulating, setSimulating] = useState(false);
  const handleSimulateWorkflow = async () => {
    if (!selectedWf) return;
    
    setSimulating(true);
    try {
      const res = await fetch(`/api/current-tenant/workflows/${selectedWf.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            contact: { id: 'c-101', name: 'John Doe', email: 'john.doe@gmail.com', phone: '+15550192834' },
            appointment: { id: 'app-301', dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), type: 'Consultation' },
            variables: { customTag: 'promo_vip' }
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[Workflow Simulation Triggered] Run ID:', data.runId);
      }
    } catch (e) {
      console.error('Failed to trigger simulation:', e);
    } finally {
      setTimeout(() => setSimulating(false), 2000);
    }
  };

  // Load a preset template
  const handleLoadTemplate = (tpl: typeof PREBUILT_TEMPLATES[0]) => {
    if (!selectedWf) return;

    const mappedNodes = tpl.nodes.map(n => ({
      id: n.id,
      type: 'workflowNode',
      position: n.position,
      data: { ...n }
    }));

    const mappedEdges = tpl.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || 'source',
      targetHandle: e.targetHandle || 'target',
      animated: false,
      style: { strokeWidth: 2.5, stroke: 'var(--border-glass)' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: '#6366f1'
      }
    }));

    setRfNodes(mappedNodes);
    setRfEdges(mappedEdges);
    
    // Save template changes to DB
    const updatedWf: Workflow = {
      ...selectedWf,
      nodes: tpl.nodes,
      edges: tpl.edges
    };
    onUpdateWorkflow(updatedWf);
    fetch(`/api/current-tenant/workflows/${selectedWf.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedWf)
    });

    setActiveSubTab('canvas');
  };

  // Create version snapshot
  const handleSaveVersion = async () => {
    if (!newVersionName.trim() || !selectedWf) return;
    try {
      const res = await fetch(`/api/current-tenant/workflows/${selectedWf.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVersionName,
          description: newVersionDesc
        })
      });
      if (res.ok) {
        setNewVersionName('');
        setNewVersionDesc('');
        fetchVersions(selectedWf.id);
      }
    } catch (e) {
      console.error('Failed to create version snapshot:', e);
    }
  };

  // Rollback to version
  const handleRollbackVersion = async (verId: string) => {
    if (!selectedWf) return;
    try {
      const res = await fetch(`/api/current-tenant/workflows/${selectedWf.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: verId })
      });
      if (res.ok) {
        const data = await res.json();
        // Update frontend state
        setSelectedWfId('');
        setTimeout(() => setSelectedWfId(selectedWf.id), 10);
      }
    } catch (e) {
      console.error('Failed to rollback version:', e);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!selectedWf) return;
    const blob = new Blob([JSON.stringify(selectedWf, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedWf.name.replace(/\s+/g, '_')}_export.json`;
    link.click();
  };

  // Import JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/current-tenant/workflows/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          const imported = await res.json();
          // Reload
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid workflow JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Insert variable tag into selected input field
  const handleInsertVariable = (variable: string) => {
    if (!variableTargetField) return;
    
    if (variableTargetField === 'emailBody') {
      setNodeConfig((prev: any) => ({ ...prev, emailBody: (prev.emailBody || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'emailSubject') {
      setNodeConfig((prev: any) => ({ ...prev, emailSubject: (prev.emailSubject || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'smsMessage') {
      setNodeConfig((prev: any) => ({ ...prev, smsMessage: (prev.smsMessage || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'whatsappNumber') {
      setNodeConfig((prev: any) => ({ ...prev, whatsappNumber: (prev.whatsappNumber || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'aiInstructions') {
      setNodeConfig((prev: any) => ({ ...prev, aiInstructions: (prev.aiInstructions || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'aiTargetText') {
      setNodeConfig((prev: any) => ({ ...prev, aiTargetText: (prev.aiTargetText || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'dealName') {
      setNodeConfig((prev: any) => ({ ...prev, dealName: (prev.dealName || '') + ` {{${variable}}}` }));
    } else if (variableTargetField === 'contactName') {
      setNodeConfig((prev: any) => ({ ...prev, contactName: (prev.contactName || '') + ` {{${variable}}}` }));
    }

    setShowVariablePicker(false);
    setVariableTargetField(null);
  };

  const VARIABLES_LIST = [
    { label: 'Contact Name', key: 'contact.name' },
    { label: 'Contact Email', key: 'contact.email' },
    { label: 'Contact Phone', key: 'contact.phone' },
    { label: 'Contact Company', key: 'contact.company' },
    { label: 'Appointment Time', key: 'appointment.time' },
    { label: 'Appointment Date', key: 'appointment.dateTime' },
    { label: 'Appointment Location', key: 'appointment.location' },
    { label: 'Call Transcript', key: 'call.transcript' },
    { label: 'Last Messages Text', key: 'last_message' },
    { label: 'AI Output Result', key: 'ai_result' }
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full bg-[#0a0f1d] text-slate-100">
      
      {/* Visual Canvas Subtabs Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Layers size={18} className="text-[#6366f1]" />
            Enterprise Visual AI Flow Builder
          </h2>
          <p className="text-xs text-slate-400">Natively design drag-and-drop agent runbooks, decision paths, and scheduled CRM actions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('canvas')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeSubTab === 'canvas' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Canvas Designer
          </button>
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeSubTab === 'library' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Template Library
          </button>
          <button
            onClick={() => setActiveSubTab('runs')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeSubTab === 'runs' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Execution Logs ({runs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('versions')}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeSubTab === 'versions' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Versions ({versions.length})
          </button>
        </div>
      </div>

      {/* Main Tabbed Layout panels */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Template Library Tab Panel */}
        {activeSubTab === 'library' && (
          <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
            <h3 className="text-xl font-bold mb-2">Prebuilt Automation Flow Templates</h3>
            <p className="text-sm text-slate-400 mb-6">Choose from curated industry automation workflows to jumpstart your campaigns, recovery triggers, or AI classification steps.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PREBUILT_TEMPLATES.map(tpl => (
                <div key={tpl.id} className="glass-panel p-6 rounded-xl border border-white/5 bg-slate-900/40 hover:border-[#6366f1]/40 transition-all flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-100 text-lg mb-2">{tpl.name}</h4>
                    <p className="text-xs text-slate-400 mb-4">{tpl.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tpl.nodes.map(n => (
                        <span key={n.id} className="text-[0.65rem] bg-slate-800 border border-white/5 px-2.5 py-1 rounded-full text-slate-300">
                          {n.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleLoadTemplate(tpl)}
                    className="w-full btn btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sliders size={14} /> Replace Active Canvas with Preset
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Runs Logs Tab Panel */}
        {activeSubTab === 'runs' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left list of runs */}
            <div className="w-1/2 border-r border-white/5 p-6 overflow-y-auto">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                <History size={16} className="text-[#6366f1]" /> Execution Run Log Ledger
              </h3>
              
              <div className="flex flex-col gap-2">
                {runs.length === 0 ? (
                  <p className="text-xs text-slate-500">No runs logged yet. Simulate or trigger this workflow to write logs.</p>
                ) : (
                  runs.map(run => {
                    const isSelected = selectedRun?.id === run.id;
                    let statusColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
                    if (run.status === 'completed') statusColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                    else if (run.status === 'failed') statusColor = 'text-red-400 bg-red-400/10 border-red-400/20';
                    else if (run.status === 'delayed') statusColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';

                    return (
                      <div
                        key={run.id}
                        onClick={() => setSelectedRun(run)}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-800/40 transition-colors ${isSelected ? 'border-[#6366f1] bg-slate-800/30' : 'border-white/5 bg-slate-900/20'}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[0.72rem] font-mono text-slate-300 font-bold">{run.id}</span>
                          <span className={`text-[0.55rem] font-bold px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                            {run.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-[0.62rem] text-slate-500">
                          <span>{new Date(run.timestamp).toLocaleString()}</span>
                          <span>{run.timeline?.length || 0} nodes ran</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Run detail inspector */}
            <div className="w-1/2 p-6 overflow-y-auto bg-slate-950/20">
              {selectedRun ? (
                <div>
                  <h3 className="text-sm font-bold mb-4">Run Timeline Details: {selectedRun.id}</h3>
                  
                  <div className="glass-panel p-4 rounded-lg border border-white/5 bg-slate-900/30 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 mb-2">Run Context Variables Snapshot</h4>
                    <pre className="text-[0.68rem] text-emerald-400 font-mono overflow-x-auto bg-slate-950 p-3 rounded border border-white/5">
                      {JSON.stringify(selectedRun.variables, null, 2)}
                    </pre>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 mb-2">Node Execution Step Trace</h4>
                  <div className="flex flex-col gap-3">
                    {selectedRun.timeline?.map((step, idx) => {
                      let nodeColor = 'bg-[#6366f1]/20 border-[#6366f1]/30 text-slate-200';
                      if (step.status === 'success') nodeColor = 'bg-emerald-500/10 border-emerald-500/20 text-slate-200';
                      else if (step.status === 'failed') nodeColor = 'bg-red-500/10 border-red-500/20 text-slate-200';

                      return (
                        <div key={idx} className={`p-3 rounded-lg border ${nodeColor} text-left`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[0.72rem] font-bold">{step.label}</span>
                            <span className="text-[0.6rem] text-slate-500">{step.duration}ms</span>
                          </div>
                          
                          {step.output && (
                            <p className="text-[0.68rem] text-slate-300 font-mono mt-1 bg-slate-900/60 p-1.5 rounded border border-white/5 truncate">
                              Output: {step.output}
                            </p>
                          )}
                          {step.error && (
                            <p className="text-[0.68rem] text-red-400 font-mono mt-1 bg-red-950/20 p-1.5 rounded border border-red-900/20">
                              Error: {step.error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select a run from the left panel to inspect step-by-step variables and logs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Versions & Rollback Tab Panel */}
        {activeSubTab === 'versions' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Version Snapshot Creator */}
            <div className="w-1/2 border-r border-white/5 p-6 overflow-y-auto text-left">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                <Save size={16} className="text-[#6366f1]" /> Create Workflow Version Snapshot
              </h3>
              
              <div className="flex flex-col gap-4 glass-panel p-6 rounded-xl border border-white/5 bg-slate-900/20">
                <div className="form-group">
                  <label className="form-label text-xs">Version Label Name</label>
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="e.g. Production Release v1"
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs">Change Description Notes</label>
                  <textarea
                    value={newVersionDesc}
                    onChange={(e) => setNewVersionDesc(e.target.value)}
                    placeholder="Add notes about nodes changed or updated template configs"
                    className="form-input text-xs h-20 resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveVersion}
                  className="btn btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> Snapshot Active Canvas Version
                </button>
              </div>
            </div>

            {/* Versions List */}
            <div className="w-1/2 p-6 overflow-y-auto text-left">
              <h3 className="text-md font-bold mb-4">Saved Workflow Version History</h3>
              
              <div className="flex flex-col gap-3">
                {versions.length === 0 ? (
                  <p className="text-xs text-slate-500">No versions saved yet. Create a version snapshot on the left.</p>
                ) : (
                  versions.map(ver => (
                    <div key={ver.id} className="p-4 rounded-lg border border-white/5 bg-slate-900/20 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{ver.name}</h4>
                        <p className="text-[0.68rem] text-slate-400 mt-1">{ver.description || 'No description notes.'}</p>
                        <span className="text-[0.6rem] text-slate-500 mt-2 block">
                          Captured: {new Date(ver.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleRollbackVersion(ver.id)}
                        className="btn btn-secondary px-3 py-1.5 text-[0.68rem] font-bold text-[#6366f1] border-[#6366f1]/20 bg-[#6366f1]/5 hover:bg-[#6366f1]/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        <History size={12} /> Rollback
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Designer Tab Panel */}
        {activeSubTab === 'canvas' && (
          <>
            {/* Left Column: Workflows directories and category node palette */}
            <div className="w-[300px] border-r border-white/5 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-950/40 select-none">
              
              {/* Directory Select */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.72rem] font-bold text-slate-400 tracking-wider uppercase">Active Runbook</span>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-[0.68rem] text-[#6366f1] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus size={12} /> Create Flow
                  </button>
                </div>
                
                <select
                  value={selectedWfId}
                  onChange={(e) => setSelectedWfId(e.target.value)}
                  className="form-input text-xs py-1.5"
                >
                  {workflows.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.active ? '(Active)' : '(Disabled)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duplicate & Export options */}
              {selectedWf && (
                <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-2">
                  <button
                    onClick={() => {
                      const newWf: Workflow = {
                        ...selectedWf,
                        id: `wf-dup-${Date.now()}`,
                        name: `${selectedWf.name} (Copy)`,
                        runsCount: 0,
                        successCount: 0,
                        lastRun: undefined
                      };
                      onAddWorkflow(newWf);
                      setSelectedWfId(newWf.id);
                    }}
                    className="flex-1 py-1 px-2 border border-white/5 rounded text-[0.62rem] text-slate-300 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Duplicate active flow graph"
                  >
                    <Copy size={10} /> Duplicate
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 py-1 px-2 border border-white/5 rounded text-[0.62rem] text-slate-300 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Export flow graph configuration to JSON file"
                  >
                    <Download size={10} /> Export
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1 px-2 border border-white/5 rounded text-[0.62rem] text-slate-300 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Import workflow from export JSON file"
                  >
                    <Upload size={10} /> Import
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJSON}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              )}

              {/* Node palette header */}
              <div>
                <span className="text-[0.72rem] font-bold text-slate-400 tracking-wider uppercase block mb-3">
                  Workflow Node Palette
                </span>
                <div className="relative mb-3">
                  <Search size={12} className="absolute left-2.5 top-2 text-slate-500" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search triggers, AI logic, loops..."
                    className="form-input text-[0.72rem] pl-8 py-1 bg-slate-900 border-white/5"
                  />
                </div>
              </div>

              {/* Palette List */}
              <div className="flex flex-col gap-2">
                {filteredSidebarNodes.map((tpl, i) => {
                  let color = 'border-[#0ea5e9]/20 text-[#0ea5e9] bg-[#0ea5e9]/5 hover:bg-[#0ea5e9]/10';
                  if (tpl.type === 'action') color = 'border-[#6366f1]/20 text-[#6366f1] bg-[#6366f1]/5 hover:bg-[#6366f1]/10';
                  else if (tpl.type === 'ai') color = 'border-[#a855f7]/20 text-[#a855f7] bg-[#a855f7]/5 hover:bg-[#a855f7]/10';
                  else if (tpl.type === 'condition') color = 'border-[#f59e0b]/20 text-[#f59e0b] bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10';
                  else if (tpl.type === 'loop') color = 'border-[#10b981]/20 text-[#10b981] bg-[#10b981]/5 hover:bg-[#10b981]/10';

                  return (
                    <div
                      key={i}
                      onClick={() => handleAddNodeToCanvas(tpl)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between group ${color}`}
                    >
                      <div>
                        <h5 className="text-[0.72rem] font-bold text-slate-200 truncate">{tpl.label}</h5>
                        <p className="text-[0.62rem] text-slate-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                      </div>
                      <Plus size={12} className="text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Central Infinite Zoomable Canvas */}
            <div className="flex-1 h-full relative" style={{ background: '#070a13' }}>
              
              {/* Canvas Action Floating Bar */}
              {selectedWf && (
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 border border-white/5 rounded-lg p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
                  {/* Active workflow toggle */}
                  <button
                    onClick={() => onToggleWorkflow(selectedWf.id)}
                    className={`px-3 py-1 text-[0.68rem] font-semibold rounded ${selectedWf.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'} cursor-pointer`}
                  >
                    {selectedWf.active ? '● Active' : '○ Disabled'}
                  </button>

                  <div className="h-4 w-px bg-white/5" />

                  {/* Manual Execute simulator */}
                  <button
                    onClick={handleSimulateWorkflow}
                    disabled={!selectedWf.active || simulating}
                    className="btn btn-primary px-3 py-1 text-[0.68rem] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <PlayCircle size={12} />
                    {simulating ? 'Running...' : 'Simulate Run'}
                  </button>

                  {/* Export details */}
                  <span className="text-[0.65rem] text-slate-500 px-2">
                    Runs: {selectedWf.runsCount || 0}
                  </span>
                </div>
              )}

              {selectedWf ? (
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onNodeDragStop={onNodeDragStop}
                  nodeTypes={nodeTypes}
                  fitView
                  snapToGrid
                  snapGrid={[15, 15]}
                >
                  <Background color="#1e293b" gap={15} size={1} />
                  <Controls className="bg-slate-900 border border-white/5 rounded-lg overflow-hidden text-slate-200 fill-slate-200 [&_button]:bg-slate-900 [&_button]:border-white/5 [&_button:hover]:bg-slate-800" />
                  <MiniMap
                    nodeStrokeColor={(n) => {
                      if (n.data?.type === 'trigger') return '#0ea5e9';
                      if (n.data?.type === 'action') return '#6366f1';
                      if (n.data?.type === 'ai') return '#a855f7';
                      if (n.data?.type === 'condition') return '#f59e0b';
                      return '#10b981';
                    }}
                    nodeColor={() => '#090d16'}
                    maskColor="rgba(10, 15, 29, 0.6)"
                    className="bg-slate-900/90 border border-white/5 rounded-lg overflow-hidden"
                  />
                </ReactFlow>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Create a new workflow or select an existing one to load the canvas.
                </div>
              )}
            </div>

            {/* Right Column: Node Property Form Editor Panel */}
            {selectedNodeId && selectedWf && (
              <div className="w-[320px] border-l border-white/5 p-4 overflow-y-auto bg-slate-950/40 text-left relative select-none">
                
                {/* Popover Variable Picker */}
                {showVariablePicker && (
                  <div className="absolute inset-0 bg-slate-950/95 z-[100] p-4 flex flex-col">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-[#6366f1] flex items-center gap-1">
                        <Database size={12} /> Inject Flow Variable
                      </h4>
                      <button
                        onClick={() => { setShowVariablePicker(false); setVariableTargetField(null); }}
                        className="text-slate-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    <p className="text-[0.62rem] text-slate-400 mb-3">Select a runtime CRM, appointment, or transcription context variable to insert into your template.</p>
                    
                    <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                      {VARIABLES_LIST.map(v => (
                        <div
                          key={v.key}
                          onClick={() => handleInsertVariable(v.key)}
                          className="p-2 rounded bg-slate-900 border border-white/5 hover:border-[#6366f1] cursor-pointer text-[0.68rem] text-slate-300 font-bold transition-all"
                        >
                          {v.label} <span className="text-[0.55rem] text-slate-500 font-mono">({`{{${v.key}}}`})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-[#6366f1]" /> Node Properties
                  </h3>
                  <button onClick={() => setSelectedNodeId(null)} className="text-slate-500 hover:text-white cursor-pointer">
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Basic settings */}
                  <div className="form-group">
                    <label className="form-label text-xs">Node Title Label</label>
                    <input
                      type="text"
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs">Node Description</label>
                    <textarea
                      value={nodeDescription}
                      onChange={(e) => setNodeDescription(e.target.value)}
                      className="form-input text-xs h-14 resize-none"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs">Execution Status</label>
                    <select
                      value={nodeStatus}
                      onChange={(e) => setNodeStatus(e.target.value as any)}
                      className="form-input text-xs"
                    >
                      <option value="active">Active (Executes)</option>
                      <option value="inactive">Disabled (Skip node)</option>
                    </select>
                  </div>

                  <div className="border-t border-white/5 my-2 pt-2" />

                  {/* Category Action properties */}
                  {rfNodes.find(n => n.id === selectedNodeId)?.data?.type === 'action' && (
                    <div className="flex flex-col gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-[#6366f1]">Connector Channel Action</label>
                        <select
                          value={nodeConfig.connectorType || 'webhook'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, connectorType: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="email">Send Email (SMTP)</option>
                          <option value="whatsapp">Send WhatsApp (Business)</option>
                          <option value="sms">Send SMS (Twilio)</option>
                          <option value="voice">AI Phone Call (Dialer)</option>
                          <option value="crm">Native CRM Deal/Contact</option>
                          <option value="webhook">HTTP Webhook POST</option>
                        </select>
                      </div>

                      {/* Email fields */}
                      {nodeConfig.connectorType === 'email' && (
                        <>
                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">Recipient Email</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('emailRecipient'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <input
                              type="text"
                              value={nodeConfig.emailRecipient || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailRecipient: e.target.value })}
                              placeholder="e.g. {{contact.email}}"
                              className="form-input text-xs"
                            />
                          </div>
                          
                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">Email Subject</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('emailSubject'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <input
                              type="text"
                              value={nodeConfig.emailSubject || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailSubject: e.target.value })}
                              className="form-input text-xs"
                            />
                          </div>

                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">Email Body Content</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('emailBody'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <textarea
                              value={nodeConfig.emailBody || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailBody: e.target.value })}
                              placeholder="Enter text or HTML..."
                              className="form-input text-xs h-28"
                            />
                          </div>
                        </>
                      )}

                      {/* WhatsApp fields */}
                      {nodeConfig.connectorType === 'whatsapp' && (
                        <>
                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">Recipient Phone</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('whatsappNumber'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <input
                              type="text"
                              value={nodeConfig.whatsappNumber || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, whatsappNumber: e.target.value })}
                              placeholder="e.g. {{contact.phone}}"
                              className="form-input text-xs"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label text-xs">WhatsApp Template</label>
                            <select
                              value={nodeConfig.whatsappTemplate || 'welcome_lead'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, whatsappTemplate: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="welcome_lead">Welcome Lead Message</option>
                              <option value="appointment_confirm">Appointment Booking Confirmation</option>
                              <option value="appointment_remind_1h">1-Hour Before Appointment Reminder</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* SMS fields */}
                      {nodeConfig.connectorType === 'sms' && (
                        <>
                          <div className="form-group">
                            <label className="form-label text-xs">Recipient Phone</label>
                            <input
                              type="text"
                              value={nodeConfig.smsNumber || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, smsNumber: e.target.value })}
                              placeholder="e.g. {{contact.phone}}"
                              className="form-input text-xs"
                            />
                          </div>

                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">SMS Body Message</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('smsMessage'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <textarea
                              value={nodeConfig.smsMessage || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, smsMessage: e.target.value })}
                              className="form-input text-xs h-20"
                            />
                          </div>
                        </>
                      )}

                      {/* CRM Action fields */}
                      {nodeConfig.connectorType === 'crm' && (
                        <>
                          <div className="form-group">
                            <label className="form-label text-xs">CRM Action Type</label>
                            <select
                              value={nodeConfig.crmAction || 'create_deal'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, crmAction: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="create_deal">Create Deal Entity</option>
                              <option value="create_contact">Create Contact Card</option>
                              <option value="update_stage">Update Pipeline Stage</option>
                            </select>
                          </div>

                          {nodeConfig.crmAction === 'create_deal' && (
                            <>
                              <div className="form-group">
                                <div className="flex justify-between items-center">
                                  <label className="form-label text-xs">Deal Name</label>
                                  <button
                                    onClick={() => { setShowVariablePicker(true); setVariableTargetField('dealName'); }}
                                    className="text-[0.62rem] text-[#6366f1] font-bold"
                                  >
                                    {`{}`} Variable
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={nodeConfig.dealName || ''}
                                  onChange={(e) => setNodeConfig({ ...nodeConfig, dealName: e.target.value })}
                                  placeholder="e.g. {{contact.name}} - Whitening"
                                  className="form-input text-xs"
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label text-xs">Value (Price)</label>
                                <input
                                  type="text"
                                  value={nodeConfig.dealValue || '1200'}
                                  onChange={(e) => setNodeConfig({ ...nodeConfig, dealValue: e.target.value })}
                                  className="form-input text-xs"
                                />
                              </div>
                            </>
                          )}

                          <div className="form-group">
                            <label className="form-label text-xs">Pipeline Stage Stage</label>
                            <select
                              value={nodeConfig.pipelineStage || 'lead'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, pipelineStage: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="lead">Lead Entry</option>
                              <option value="qualified">Qualified</option>
                              <option value="proposal">Proposal</option>
                              <option value="negotiation">Negotiation</option>
                              <option value="won">Won / Success</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Webhook API fields */}
                      {nodeConfig.connectorType === 'webhook' && (
                        <>
                          <div className="form-group">
                            <label className="form-label text-xs">Target API URL</label>
                            <input
                              type="text"
                              value={nodeConfig.webhookUrl || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, webhookUrl: e.target.value })}
                              placeholder="https://api.example.com/endpoint"
                              className="form-input text-xs"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label text-xs">HTTP Method</label>
                            <select
                              value={nodeConfig.webhookMethod || 'POST'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, webhookMethod: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="POST">POST (JSON payload)</option>
                              <option value="GET">GET</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                            </select>
                          </div>
                        </>
                      )}

                      <div className="border-t border-white/5 my-2 pt-2" />

                      {/* Delay/Timing configuration */}
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-indigo-400">Execution Delay Mode</label>
                        <select
                          value={nodeConfig.timingMode || 'immediate'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, timingMode: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="immediate">Immediate (No delay)</option>
                          <option value="delay">Delayed Wait</option>
                          <option value="relative">Relative to Appointment Slot</option>
                        </select>
                      </div>

                      {nodeConfig.timingMode === 'delay' && (
                        <div className="flex gap-2">
                          <div className="flex-1 form-group">
                            <label className="form-label text-[0.65rem]">Wait Value</label>
                            <input
                              type="number"
                              value={nodeConfig.delayValue || 1}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, delayValue: parseInt(e.target.value) })}
                              className="form-input text-xs"
                            />
                          </div>
                          <div className="flex-1 form-group">
                            <label className="form-label text-[0.65rem]">Unit</label>
                            <select
                              value={nodeConfig.delayUnit || 'days'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, delayUnit: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {nodeConfig.timingMode === 'relative' && (
                        <>
                          <div className="flex gap-2">
                            <div className="flex-1 form-group">
                              <label className="form-label text-[0.65rem]">Value</label>
                              <input
                                type="number"
                                value={nodeConfig.relativeValue || 1}
                                onChange={(e) => setNodeConfig({ ...nodeConfig, relativeValue: parseInt(e.target.value) })}
                                className="form-input text-xs"
                              />
                            </div>
                            <div className="flex-1 form-group">
                              <label className="form-label text-[0.65rem]">Unit</label>
                              <select
                                value={nodeConfig.relativeUnit || 'hours'}
                                onChange={(e) => setNodeConfig({ ...nodeConfig, relativeUnit: e.target.value })}
                                className="form-input text-xs"
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label text-[0.65rem]">Schedule Anchor</label>
                            <select
                              value={nodeConfig.relativeAnchor || 'before'}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, relativeAnchor: e.target.value })}
                              className="form-input text-xs"
                            >
                              <option value="before">Before Slot Time</option>
                              <option value="after">After Slot Time</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Category AI properties */}
                  {rfNodes.find(n => n.id === selectedNodeId)?.data?.type === 'ai' && (
                    <div className="flex flex-col gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-[#a855f7]">AI Brain Node Type</label>
                        <select
                          value={nodeConfig.aiNodeType || 'decision'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, aiNodeType: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="decision">AI Decision Tree (YES/NO)</option>
                          <option value="classifier">AI Sentiment/Lead Classifier</option>
                          <option value="summarizer">AI Text Summarizer</option>
                          <option value="intent">AI Intent Detection</option>
                          <option value="response_gen">AI Response Generator</option>
                          <option value="kb_search">Knowledge Base Search</option>
                        </select>
                      </div>

                      {nodeConfig.aiNodeType !== 'kb_search' && (
                        <>
                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">AI Prompt Instructions</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('aiInstructions'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <textarea
                              value={nodeConfig.aiInstructions || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, aiInstructions: e.target.value })}
                              placeholder="e.g. Decide YES if customer mentions pricing questions"
                              className="form-input text-xs h-20"
                            />
                          </div>

                          <div className="form-group">
                            <div className="flex justify-between items-center">
                              <label className="form-label text-xs">Target Text to Analyze</label>
                              <button
                                onClick={() => { setShowVariablePicker(true); setVariableTargetField('aiTargetText'); }}
                                className="text-[0.62rem] text-[#6366f1] font-bold"
                              >
                                {`{}`} Variable
                              </button>
                            </div>
                            <input
                              type="text"
                              value={nodeConfig.aiTargetText || ''}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, aiTargetText: e.target.value })}
                              placeholder="e.g. {{last_message}}"
                              className="form-input text-xs"
                            />
                          </div>
                        </>
                      )}

                      {nodeConfig.aiNodeType === 'classifier' && (
                        <div className="form-group">
                          <label className="form-label text-xs">Classifier Categories (Comma Separated)</label>
                          <input
                            type="text"
                            value={nodeConfig.classifierCategories || 'Interested, Uninterested, Followup'}
                            onChange={(e) => setNodeConfig({ ...nodeConfig, classifierCategories: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      )}

                      {nodeConfig.aiNodeType === 'kb_search' && (
                        <div className="form-group">
                          <label className="form-label text-xs">Knowledge Base Query Query</label>
                          <input
                            type="text"
                            value={nodeConfig.kbQuery || ''}
                            onChange={(e) => setNodeConfig({ ...nodeConfig, kbQuery: e.target.value })}
                            placeholder="e.g. whitening guidelines"
                            className="form-input text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category Condition properties */}
                  {rfNodes.find(n => n.id === selectedNodeId)?.data?.type === 'condition' && (
                    <div className="flex flex-col gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-[#f59e0b]">Branching Evaluator</label>
                        <select
                          value={nodeConfig.conditionType || 'if_else'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, conditionType: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="if_else">If/Else Condition</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label text-xs">Field Variable to Inspect</label>
                        <select
                          value={nodeConfig.conditionField || 'crm_stage'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, conditionField: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="crm_stage">CRM Deal Stage Stage</option>
                          <option value="contact_email">Contact Email</option>
                          <option value="ai_result">AI Output (ai_result)</option>
                          <option value="ai_confidence">AI Confidence Score</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label text-xs">Comparison Operator</label>
                        <select
                          value={nodeConfig.conditionOperator || 'equals'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, conditionOperator: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="equals">Equals</option>
                          <option value="contains">Contains Substring</option>
                          <option value="greater_than">Greater Than (&gt;)</option>
                          <option value="less_than">Less Than (&lt;)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label text-xs">Value to Match Against</label>
                        <input
                          type="text"
                          value={nodeConfig.conditionCompareValue || ''}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, conditionCompareValue: e.target.value })}
                          className="form-input text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Category Loop properties */}
                  {rfNodes.find(n => n.id === selectedNodeId)?.data?.type === 'loop' && (
                    <div className="flex flex-col gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-[#10b981]">Looping Node Mode</label>
                        <select
                          value={nodeConfig.loopType || 'retry'}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, loopType: e.target.value })}
                          className="form-input text-xs"
                        >
                          <option value="retry">Retry Loop (Counter)</option>
                          <option value="foreach">For Each Contact (Batch)</option>
                        </select>
                      </div>

                      {nodeConfig.loopType === 'retry' && (
                        <div className="form-group">
                          <label className="form-label text-xs">Max Execution Retries</label>
                          <input
                            type="number"
                            value={nodeConfig.maxRetries || '3'}
                            onChange={(e) => setNodeConfig({ ...nodeConfig, maxRetries: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom editor actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveNodeConfig}
                      className="flex-1 btn btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save size={12} /> Save Configurations
                    </button>
                    <button
                      onClick={handleDeleteNode}
                      className="p-2 border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                      title="Delete Node"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {saveStatus === 'success' && (
                    <div className="text-[0.7rem] text-emerald-400 font-bold text-center mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} /> Configurations saved and synced.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Workflow Selection Custom Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-panel w-full max-w-md p-6 rounded-xl border border-white/10 bg-slate-900 shadow-2xl relative text-left">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>

            <h3 className="text-md font-bold mb-4 flex items-center gap-2">
              <Layers size={16} className="text-[#6366f1]" /> Create Custom Workflow Flow
            </h3>

            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label text-xs">Workflow Name</label>
                <input
                  type="text"
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="e.g. Lead Follow-up Automation"
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Change Description Summary</label>
                <textarea
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  placeholder="Summarize the automation trigger, context variables, and action nodes."
                  className="form-input text-xs h-20 resize-none"
                />
              </div>

              <button
                onClick={handleCreateNewWorkflow}
                className="w-full btn btn-primary py-2 text-xs font-semibold mt-2 cursor-pointer"
              >
                Create Custom Flow Graph
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const WorkflowView: React.FC<WorkflowViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
};
