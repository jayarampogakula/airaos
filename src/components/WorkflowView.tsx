import React, { useState, useEffect } from 'react';
import { GitBranch, Play, CheckCircle2, AlertCircle, RefreshCw, Layers, Sliders, PlayCircle, ChevronRight, Plus, X } from 'lucide-react';
import { Workflow, WorkflowNode } from '../types';

interface WorkflowViewProps {
  workflows: Workflow[];
  onToggleWorkflow: (wfId: string) => void;
  onIncrementRuns: (wfId: string) => void;
  onAddWorkflow: (wf: Workflow) => void;
  onUpdateWorkflow: (wf: Workflow) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  workflows,
  onToggleWorkflow,
  onIncrementRuns,
  onAddWorkflow,
  onUpdateWorkflow
}) => {
  const [selectedWfId, setSelectedWfId] = useState(workflows[0]?.id || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulatingNodeIdx, setSimulatingNodeIdx] = useState<number | null>(null);

  // Canvas Custom Node Form States
  const [showAddNodeForm, setShowAddNodeForm] = useState(false);
  const [customNodeType, setCustomNodeType] = useState<'trigger' | 'action'>('trigger');
  const [customNodeLabel, setCustomNodeLabel] = useState('Form Submitted');
  const [customNodeComponent, setCustomNodeComponent] = useState('Website Form');
  const [customNodeDesc, setCustomNodeDesc] = useState('Fires when lead details are submitted.');
  const [customConnectorType, setCustomConnectorType] = useState<'whatsapp' | 'email' | 'sms' | 'slack' | 'webhook' | 'crm'>('webhook');

  const handleAddCustomNode = () => {
    if (!selectedWf) return;

    const newNodeId = `${selectedWf.id}-node-${selectedWf.nodes.length + 1}`;
    const mappedConnector = customNodeType === 'trigger' ? 'webhook' : 
      customNodeLabel.includes('Webhook') ? 'webhook' : 
      customNodeLabel.includes('SMTP') ? 'email' : 
      customNodeLabel.includes('CRM') ? 'crm' : 'whatsapp';

    const newNode: WorkflowNode = {
      id: newNodeId,
      type: customNodeType,
      label: customNodeLabel,
      component: customNodeComponent,
      description: customNodeDesc,
      status: 'active',
      config: {
        connectorType: mappedConnector as any
      }
    };

    const newNodes = [...selectedWf.nodes, newNode];
    const newEdges = [...selectedWf.edges];

    if (selectedWf.nodes.length > 0) {
      const prevNodeId = selectedWf.nodes[selectedWf.nodes.length - 1].id;
      newEdges.push({
        id: `${selectedWf.id}-edge-${newEdges.length + 1}`,
        source: prevNodeId,
        target: newNodeId
      });
    }

    const updatedWf: Workflow = {
      ...selectedWf,
      nodes: newNodes,
      edges: newEdges
    };

    onUpdateWorkflow(updatedWf);
    setShowAddNodeForm(false);
  };
  
  // Custom creator modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [triggerType, setTriggerType] = useState('chat'); // 'chat' | 'cal' | 'escalation'
  const [action1Type, setAction1Type] = useState('whatsapp'); // 'whatsapp' | 'email' | 'sms' | 'slack' | 'webhook' | 'crm'
  const [action2Type, setAction2Type] = useState('none'); // 'none' | 'whatsapp' | 'email' | 'sms' | 'slack' | 'webhook' | 'crm'

  // Node configurations states
  const [saveStatus, setSaveStatus] = useState<'success' | null>(null);
  const [nodeConfig, setNodeConfig] = useState({
    connectorType: 'whatsapp',
    whatsappNumber: '',
    whatsappTemplate: 'welcome_lead',
    emailRecipient: '',
    emailSubject: '',
    emailBody: '',
    smsNumber: '',
    smsMessage: '',
    slackChannel: '#general',
    slackMessage: '',
    webhookUrl: '',
    webhookMethod: 'POST'
  });

  const selectedWf = workflows.find(w => w.id === selectedWfId);
  const selectedNode = selectedWf?.nodes.find(n => n.id === selectedNodeId) || selectedWf?.nodes[0] || null;

  // Sync node input values when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setNodeConfig({
        connectorType: selectedNode.config?.connectorType || (selectedNode.label.toLowerCase().includes('whatsapp') ? 'whatsapp' : selectedNode.label.toLowerCase().includes('email') ? 'email' : selectedNode.label.toLowerCase().includes('slack') ? 'slack' : selectedNode.label.toLowerCase().includes('webhook') ? 'webhook' : selectedNode.label.toLowerCase().includes('sms') ? 'sms' : 'whatsapp'),
        whatsappNumber: selectedNode.config?.whatsappNumber || '',
        whatsappTemplate: selectedNode.config?.whatsappTemplate || 'welcome_lead',
        emailRecipient: selectedNode.config?.emailRecipient || '',
        emailSubject: selectedNode.config?.emailSubject || '',
        emailBody: selectedNode.config?.emailBody || '',
        smsNumber: selectedNode.config?.smsNumber || '',
        smsMessage: selectedNode.config?.smsMessage || '',
        slackChannel: selectedNode.config?.slackChannel || '#general',
        slackMessage: selectedNode.config?.slackMessage || '',
        webhookUrl: selectedNode.config?.webhookUrl || '',
        webhookMethod: selectedNode.config?.webhookMethod || 'POST'
      });
      setSaveStatus(null);
    }
  }, [selectedNodeId, selectedWfId]);



  // Save Node configurations changes to global workflows array
  const handleSaveNodeConfig = () => {
    if (!selectedWf || !selectedNode) return;

    const updatedNodes = selectedWf.nodes.map(n => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          config: { ...nodeConfig } as any
        };
      }
      return n;
    });

    const updatedWf = {
      ...selectedWf,
      nodes: updatedNodes
    };

    onUpdateWorkflow(updatedWf);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Run visual simulator pulse
  const handleTriggerSimulation = () => {
    if (!selectedWf || !selectedWf.active) return;

    // Pulse nodes one by one
    setSimulatingNodeIdx(0);
    
    const interval = setInterval(() => {
      setSimulatingNodeIdx(prev => {
        if (prev === null) return null;
        if (prev >= selectedWf.nodes.length - 1) {
          clearInterval(interval);
          onIncrementRuns(selectedWf.id);
          setTimeout(() => setSimulatingNodeIdx(null), 1000); // clear simulator status
          return null;
        }
        return prev + 1;
      });
    }, 1200);
  };

  // Create new custom workflow runbook
  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    const wfId = `wf-custom-${Date.now()}`;
    const nodes: WorkflowNode[] = [];
    const edges: any[] = [];

    // Add Trigger Node
    let triggerLabel = 'Chat Lead Capture';
    let triggerComp = 'Communication Hub';
    let triggerDesc = 'User submits contact details in website widget';
    if (triggerType === 'cal') {
      triggerLabel = 'Calendar Scheduler Trigger';
      triggerComp = 'Appointment Engine';
      triggerDesc = 'Fires when client schedules calendar slot';
    } else if (triggerType === 'escalation') {
      triggerLabel = 'Human Escalation';
      triggerComp = 'AI Brain / Hub';
      triggerDesc = 'Conversation is flagged for human intervention';
    }

    nodes.push({
      id: `${wfId}-node-1`,
      type: 'trigger',
      label: triggerLabel,
      component: triggerComp,
      description: triggerDesc,
      status: 'active'
    });

    // Add Action 1 Node
    let action1Label = 'Send WhatsApp Message';
    let action1Comp = 'WhatsApp Node';
    let action1Desc = 'Dispatches automated WhatsApp message templates';
    if (action1Type === 'email') {
      action1Label = 'Send Email Alert';
      action1Comp = 'Email Connector';
      action1Desc = 'Sends outbound customer SMTP emails';
    } else if (action1Type === 'sms') {
      action1Label = 'Send SMS Notification';
      action1Comp = 'SMS Node';
      action1Desc = 'Sends SMS alerts using Twilio carrier';
    } else if (action1Type === 'slack') {
      action1Label = 'Slack Post Alert';
      action1Comp = 'Slack Integration';
      action1Desc = 'Pings workspace developer channels';
    } else if (action1Type === 'webhook') {
      action1Label = 'Trigger Webhook API';
      action1Comp = 'Webhook Node';
      action1Desc = 'Posts JSON payloads to target HTTP URLs';
    } else if (action1Type === 'crm') {
      action1Label = 'Create Pipeline Deal';
      action1Comp = 'CRM (Twenty)';
      action1Desc = 'Saves deals in CRM stages';
    }

    nodes.push({
      id: `${wfId}-node-2`,
      type: 'action',
      label: action1Label,
      component: action1Comp,
      description: action1Desc,
      status: 'active',
      config: { connectorType: action1Type as any }
    });
    edges.push({ id: `${wfId}-edge-1`, source: `${wfId}-node-1`, target: `${wfId}-node-2` });

    // Add Action 2 Node (optional)
    if (action2Type !== 'none') {
      let action2Label = 'Send WhatsApp Message';
      let action2Comp = 'WhatsApp Node';
      let action2Desc = 'Dispatches automated WhatsApp message templates';
      if (action2Type === 'email') {
        action2Label = 'Send Email Alert';
        action2Comp = 'Email Connector';
        action2Desc = 'Sends outbound customer SMTP emails';
      } else if (action2Type === 'sms') {
        action2Label = 'Send SMS Notification';
        action2Comp = 'SMS Node';
        action2Desc = 'Sends SMS alerts using Twilio carrier';
      } else if (action2Type === 'slack') {
        action2Label = 'Slack Post Alert';
        action2Comp = 'Slack Integration';
        action2Desc = 'Pings workspace developer channels';
      } else if (action2Type === 'webhook') {
        action2Label = 'Trigger Webhook API';
        action2Comp = 'Webhook Node';
        action2Desc = 'Posts JSON payloads to target HTTP URLs';
      } else if (action2Type === 'crm') {
        action2Label = 'Create Pipeline Deal';
        action2Comp = 'CRM (Twenty)';
        action2Desc = 'Saves deals in CRM stages';
      }

      nodes.push({
        id: `${wfId}-node-3`,
        type: 'action',
        label: action2Label,
        component: action2Comp,
        description: action2Desc,
        status: 'active',
        config: { connectorType: action2Type as any }
      });
      edges.push({ id: `${wfId}-edge-2`, source: `${wfId}-node-2`, target: `${wfId}-node-3` });
    }

    const newWf = {
      id: wfId,
      name: newWfName,
      description: newWfDesc || `Custom business automated flow runbook.`,
      active: true,
      nodes,
      edges,
      runsCount: 0,
      successCount: 0
    };

    onAddWorkflow(newWf);
    setSelectedWfId(wfId);
    setSelectedNodeId(null);
    setModalOpen(false);

    // Reset forms
    setNewWfName('');
    setNewWfDesc('');
    setTriggerType('chat');
    setAction1Type('whatsapp');
    setAction2Type('none');
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="view-header">
        <div>
          <h2 className="view-title">Automation Workflows</h2>
          <p className="view-subtitle">Design, test, and automate processes connecting AI decisions to system triggers.</p>
        </div>
      </div>

      <div className="grid-cols-12" style={{ height: 'calc(100vh - 160px)' }}>
        
        {/* Left Column: Workflows directory list */}
        <div className="col-span-4 glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={16} style={{ color: 'var(--primary-color)' }} /> Automation Runbooks
            </h3>
            <button 
              onClick={() => setModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.65rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <Plus size={12} /> Create
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workflows.map((wf) => {
              const isSelected = wf.id === selectedWfId;
              return (
                <div
                  key={wf.id}
                  onClick={() => { setSelectedWfId(wf.id); setSelectedNodeId(null); }}
                  className={`glass-card`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-glass)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{wf.name}</h4>
                    
                    {/* Toggle activation */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); onToggleWorkflow(wf.id); }}
                      style={{
                        width: '32px',
                        height: '18px',
                        background: wf.active ? 'var(--success-color)' : 'var(--bg-tertiary)',
                        borderRadius: '20px',
                        padding: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: wf.active ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%' }} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3', marginBottom: '10px', margin: '0 0 10px 0' }}>
                    {wf.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Runs: {wf.runsCount} ({wf.successCount} ok)</span>
                    <span>Last run: {wf.lastRun || 'never'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Node Canvas */}
        {selectedWf ? (
          <div className="col-span-8 glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Canvas Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Native Visual Workflow Designer: {selectedWf.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Natively design, simulate, and deploy trigger-action automations. Click nodes below to edit parameters.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowAddNodeForm(!showAddNodeForm)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Add Custom Node
                </button>
                <button 
                  onClick={handleTriggerSimulation}
                  className="btn btn-primary"
                  disabled={!selectedWf.active || simulatingNodeIdx !== null}
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <PlayCircle size={14} /> Simulate Trigger
                </button>
              </div>
            </div>

            {/* Visual Workspace (SVG + Flex Nodes) */}
            <div style={{ flex: 1, position: 'relative', background: '#090d16', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showAddNodeForm && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    right: '20px', 
                    width: '280px', 
                    padding: '16px', 
                    zIndex: 100, 
                    backgroundColor: 'rgba(10, 13, 22, 0.95)', 
                    border: '1px solid var(--primary-color)55', 
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Add Custom Flow Node</h5>
                    <button onClick={() => setShowAddNodeForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Node Type</label>
                      <select 
                        className="form-input" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                        value={customNodeType}
                        onChange={(e) => {
                          const val = e.target.value as 'trigger' | 'action';
                          setCustomNodeType(val);
                          if (val === 'trigger') {
                            setCustomNodeLabel('Form Submitted');
                            setCustomNodeComponent('Website Form');
                            setCustomNodeDesc('Fires when lead details are submitted.');
                          } else {
                            setCustomNodeLabel('Sync to Twenty CRM');
                            setCustomNodeComponent('CRM Integration');
                            setCustomNodeDesc('Updates client profile credentials in Twenty CRM pipeline.');
                          }
                        }}
                      >
                        <option value="trigger">Trigger Node (⚡)</option>
                        <option value="action">Action Node (⚙️)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Trigger/Action Event</label>
                      {customNodeType === 'trigger' ? (
                        <select 
                          className="form-input" 
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                          value={customNodeLabel}
                          onChange={(e) => {
                            setCustomNodeLabel(e.target.value);
                            if (e.target.value === 'Form Submitted') {
                              setCustomNodeComponent('Website Form');
                              setCustomNodeDesc('Fires when lead details are submitted.');
                            } else if (e.target.value === 'Deal Lost') {
                              setCustomNodeComponent('CRM Pipeline');
                              setCustomNodeDesc('Fires when client deal state drops to lost.');
                            } else if (e.target.value === 'SMS Received') {
                              setCustomNodeComponent('Twilio Carriers');
                              setCustomNodeDesc('Fires when custom SMS pings the Twilio Sid.');
                            } else {
                              setCustomNodeComponent('Voice SIP Gateway');
                              setCustomNodeDesc('Fires when call is ended on platform gateway.');
                            }
                          }}
                        >
                          <option value="Form Submitted">Form Submitted</option>
                          <option value="Deal Lost">Deal Lost</option>
                          <option value="SMS Received">SMS Received</option>
                          <option value="Call Finished">Call Finished</option>
                        </select>
                      ) : (
                        <select 
                          className="form-input" 
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                          value={customNodeLabel}
                          onChange={(e) => {
                            setCustomNodeLabel(e.target.value);
                            if (e.target.value === 'Generate Invoice PDF') {
                              setCustomNodeComponent('Invoice Engine');
                              setCustomNodeDesc('Compiles PDF invoice using item templates.');
                            } else if (e.target.value === 'Sync to Twenty CRM') {
                              setCustomNodeComponent('CRM Integration');
                              setCustomNodeDesc('Updates client profile credentials in Twenty CRM pipeline.');
                            } else if (e.target.value === 'Fire custom Webhook') {
                              setCustomNodeComponent('Webhook Connector');
                              setCustomNodeDesc('Posts JSON payload context to target url endpoints.');
                            } else {
                              setCustomNodeComponent('SMTP Mail');
                              setCustomNodeDesc('Dispatches custom HTML layout template to customer inbox.');
                            }
                          }}
                        >
                          <option value="Sync to Twenty CRM">Sync to Twenty CRM</option>
                          <option value="Generate Invoice PDF">Generate Invoice PDF</option>
                          <option value="Fire custom Webhook">Fire custom Webhook</option>
                          <option value="Send SMTP Email">Send SMTP Email</option>
                        </select>
                      )}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Component Tag</label>
                      <input type="text" className="form-input" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={customNodeComponent} onChange={(e) => setCustomNodeComponent(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Node Description</label>
                      <input type="text" className="form-input" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={customNodeDesc} onChange={(e) => setCustomNodeDesc(e.target.value)} />
                    </div>

                    <button 
                      type="button" 
                      onClick={handleAddCustomNode}
                      className="btn btn-primary" 
                      style={{ fontSize: '0.75rem', padding: '6px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Plus size={12} /> Add Node to Flow
                    </button>
                  </div>
                </div>
              )}
              
              {/* Node layout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '60px', zIndex: 10 }}>
                {selectedWf.nodes.map((node, index) => {
                  const isNodeSelected = selectedNode?.id === node.id;
                  const isRunning = simulatingNodeIdx === index;
                  const isPassed = simulatingNodeIdx !== null && index < simulatingNodeIdx;
                  
                  return (
                    <React.Fragment key={node.id}>
                      {/* Connection arrow */}
                      {index > 0 && (
                        <div style={{ position: 'relative', width: '60px', display: 'flex', alignItems: 'center' }}>
                          <div 
                            style={{ 
                              width: '100%', 
                              height: '2px', 
                              background: isPassed ? 'var(--success-color)' : isRunning ? 'var(--primary-color)' : 'var(--border-glass)',
                              position: 'relative'
                            }}
                          >
                            {/* Pulse animation dot */}
                            {simulatingNodeIdx !== null && index - 1 === simulatingNodeIdx && (
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  width: '8px', 
                                  height: '8px', 
                                  background: 'var(--primary-color)', 
                                  borderRadius: '50%',
                                  top: '-3px',
                                  left: 0,
                                  animation: 'slidePulse 1.2s infinite linear' 
                                }} 
                              />
                            )}
                          </div>
                          <ChevronRight 
                            size={12} 
                            style={{ 
                              position: 'absolute', 
                              right: '-6px', 
                              color: isPassed ? 'var(--success-color)' : 'var(--text-muted)' 
                            }} 
                          />
                        </div>
                      )}

                      {/* Node Box */}
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`glass-card ${isNodeSelected ? 'active' : ''} ${isRunning ? 'node-running' : ''}`}
                        style={{
                          width: '150px',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          borderWidth: isRunning ? '2px' : '1px',
                          borderColor: isPassed ? 'var(--success-color)' : isRunning ? 'var(--primary-color)' : isNodeSelected ? 'var(--primary-color)' : 'var(--border-glass)',
                          background: isRunning ? 'rgba(99,102,241,0.08)' : isPassed ? 'rgba(16,185,129,0.03)' : 'var(--bg-tertiary)',
                          boxShadow: isRunning ? '0 0 15px rgba(99,102,241,0.3)' : 'none'
                        }}
                      >
                        <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
                          {node.type === 'trigger' ? '⚡' : '⚙️'}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {node.label}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {node.component}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Grid Background Effect */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', 
                  backgroundSize: '16px 16px',
                  zIndex: 1 
                }} 
              />
            </div>

            {/* Canvas Footer: Node Configurator (WhatsApp, Email, SMS, Slack, Webhook integration settings) */}
            {selectedNode && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{selectedNode.type}</span>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{selectedNode.label}</h5>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {selectedNode.description}
                  </p>
                </div>

                {selectedNode.type === 'action' ? (
                  /* Interactive Parameter configuration editor */
                  <div style={{ width: '380px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONNECTOR CONFIGURATOR</div>
                      {saveStatus === 'success' && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--success-color)', fontWeight: 'bold' }}>✓ Config Saved</span>
                      )}
                    </div>
                    
                    <div className="grid-cols-12" style={{ gap: '8px' }}>
                      <div className="col-span-12 form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Connector Protocol</label>
                        <select 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          value={nodeConfig.connectorType}
                          onChange={(e) => setNodeConfig({ ...nodeConfig, connectorType: e.target.value })}
                        >
                          <option value="whatsapp">WhatsApp Integration</option>
                          <option value="email">Email SMTP Connector</option>
                          <option value="sms">SMS Text Alert</option>
                          <option value="slack">Slack Notification</option>
                          <option value="webhook">Webhook HTTP API</option>
                          <option value="crm">Twenty CRM Integrator</option>
                        </select>
                      </div>

                      {nodeConfig.connectorType === 'crm' && (
                        <>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Sync Action</label>
                            <select className="form-input" style={{ padding: '4px 8px', fontSize: '0.7rem', height: '30px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'white' }}>
                              <option value="create_deal">Create New Deal</option>
                              <option value="update_stage">Update Deal Stage</option>
                              <option value="add_contact">Create Contact Profile</option>
                            </select>
                          </div>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Target CRM List</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="e.g. Sales Pipeline"
                            />
                          </div>
                        </>
                      )}

                      {nodeConfig.connectorType === 'whatsapp' && (
                        <>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Recipient Number</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="+1 (555) 000-0000"
                              value={nodeConfig.whatsappNumber}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, whatsappNumber: e.target.value })}
                            />
                          </div>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Message Template</label>
                            <select 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              value={nodeConfig.whatsappTemplate}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, whatsappTemplate: e.target.value })}
                            >
                              <option value="welcome_lead">welcome_lead</option>
                              <option value="appointment_confirm">appointment_confirm</option>
                              <option value="escalation_alert">escalation_alert</option>
                            </select>
                          </div>
                        </>
                      )}

                      {nodeConfig.connectorType === 'email' && (
                        <>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Recipient Email</label>
                            <input 
                              type="email" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="client@mail.com"
                              value={nodeConfig.emailRecipient}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailRecipient: e.target.value })}
                            />
                          </div>
                          <div className="col-span-6 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Subject Line</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="Hello from support"
                              value={nodeConfig.emailSubject}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailSubject: e.target.value })}
                            />
                          </div>
                          <div className="col-span-12 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Email Body Template</label>
                            <textarea 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem', height: '40px', resize: 'none' }} 
                              placeholder="Write email contents here..."
                              value={nodeConfig.emailBody}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, emailBody: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {nodeConfig.connectorType === 'sms' && (
                        <>
                          <div className="col-span-5 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Phone Number</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="+15550000"
                              value={nodeConfig.smsNumber}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, smsNumber: e.target.value })}
                            />
                          </div>
                          <div className="col-span-7 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Carrier Message</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="SMS alert text..."
                              value={nodeConfig.smsMessage}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, smsMessage: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {nodeConfig.connectorType === 'slack' && (
                        <>
                          <div className="col-span-5 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Slack Channel</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="#general"
                              value={nodeConfig.slackChannel}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, slackChannel: e.target.value })}
                            />
                          </div>
                          <div className="col-span-7 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Message Layout</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="Slack notification alert..."
                              value={nodeConfig.slackMessage}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, slackMessage: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {nodeConfig.connectorType === 'webhook' && (
                        <>
                          <div className="col-span-8 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Target HTTP URL</label>
                            <input 
                              type="url" 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                              placeholder="https://api.site.com/hook"
                              value={nodeConfig.webhookUrl}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, webhookUrl: e.target.value })}
                            />
                          </div>
                          <div className="col-span-4 form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Method</label>
                            <select 
                              className="form-input" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              value={nodeConfig.webhookMethod}
                              onChange={(e) => setNodeConfig({ ...nodeConfig, webhookMethod: e.target.value })}
                            >
                              <option value="POST">POST</option>
                              <option value="GET">GET</option>
                              <option value="PUT">PUT</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      onClick={handleSaveNodeConfig}
                      className="btn btn-primary"
                      style={{ fontSize: '0.7rem', padding: '6px', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Save Node Parameters
                    </button>
                  </div>
                ) : (
                  /* Trigger node detail variables view */
                  <div style={{ width: '220px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>TRIGGER INBOUND HOOKS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem' }}>
                      <div>• Channel: <span style={{ color: 'var(--primary-color)' }}>AiraOS Websocket</span></div>
                      <div>• Listening: <span style={{ color: 'var(--success-color)' }}>Active</span></div>
                      <div>• Rate limit: <span>100 req/min</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="col-span-8 glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <span>Select a workflow from the list to view its nodes.</span>
          </div>
        )}
      </div>

      {/* Workflow creation modal dialog */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>Deploy Custom Automation Flow</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Workflow Name</label>
                <input type="text" className="form-input" placeholder="e.g. Inbound Lead Email Notification" value={newWfName} onChange={(e) => setNewWfName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Workflow Description</label>
                <input type="text" className="form-input" placeholder="Explain what this automation runbook achieves..." value={newWfDesc} onChange={(e) => setNewWfDesc(e.target.value)} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">System Trigger Node (⚡)</label>
                <select className="form-input" value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
                  <option value="chat">Chat Lead Capture (Communication Hub)</option>
                  <option value="cal">Calendar Scheduler Trigger</option>
                  <option value="escalation">Human Escalation (Unified Inbox Status)</option>
                </select>
              </div>

              <div className="grid-cols-12" style={{ gap: '10px' }}>
                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Action Node 1 (⚙️)</label>
                  <select className="form-input" value={action1Type} onChange={(e) => setAction1Type(e.target.value)}>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Email SMTP Connector</option>
                    <option value="sms">SMS Text Alert</option>
                    <option value="slack">Slack Channel Alert</option>
                    <option value="webhook">Webhook Post HTTP</option>
                    <option value="crm">Create CRM Pipeline Deal</option>
                  </select>
                </div>

                <div className="col-span-6 form-group" style={{ margin: 0 }}>
                  <label className="form-label">Action Node 2 (Optional)</label>
                  <select className="form-input" value={action2Type} onChange={(e) => setAction2Type(e.target.value)}>
                    <option value="none">None (Single action only)</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Email SMTP Connector</option>
                    <option value="sms">SMS Text Alert</option>
                    <option value="slack">Slack Channel Alert</option>
                    <option value="webhook">Webhook Post HTTP</option>
                    <option value="crm">Create CRM Pipeline Deal</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}>
                Deploy Runbook Node Flow
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Style overrides for custom slidePulse in keyframes */}
      <style>{`
        @keyframes slidePulse {
          0% { left: 0%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
