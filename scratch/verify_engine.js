import { readDb, writeDb } from '../server/db.js';
import { enqueueWorkflowTrigger } from '../server/workflowEngine.js';

async function test() {
  console.log('--- STARTING WORKFLOW ENGINE VERIFICATION TEST ---');
  
  const db = readDb();
  
  // Create a mock active workflow if none exist
  const wfId = 'wf-test-verification';
  const testWf = {
    id: wfId,
    tenantId: 't-1',
    name: 'Verification Test Flow',
    description: 'Verifies triggers, actions, AI logic, and conditional branching.',
    active: true,
    nodes: [
      { id: 'wn-1', type: 'trigger', label: 'Onboarding Lead Created', component: 'Native CRM', description: 'Fires on client creation', status: 'active' },
      { id: 'wn-2', type: 'action', label: 'Send Onboarding Email', component: 'Email Connector', description: 'Immediate welcome mail', status: 'active', config: { connectorType: 'email', emailRecipient: '{{contact.email}}', emailSubject: 'Welcome {{contact.name}}!', emailBody: 'Hi {{contact.name}}, welcome!', timingMode: 'immediate' } },
      { id: 'wn-3', type: 'ai', label: 'AI Lead Classifier', component: 'AI Classifier', description: 'Classifies lead intent', status: 'active', config: { aiNodeType: 'classifier', classifierCategories: 'Sales, Support', aiTargetText: '{{contact.company}}' }, position: { x: 400, y: 150 } },
      { id: 'wn-4', type: 'condition', label: 'Is Sales?', component: 'If / Else Branch', description: 'Checks if AI classified as Sales', status: 'active', config: { conditionType: 'if_else', conditionField: 'ai_result', conditionOperator: 'contains', conditionCompareValue: 'Sales' }, position: { x: 700, y: 150 } },
      { id: 'wn-5', type: 'action', label: 'VIP Pipeline Create', component: 'Native CRM', description: 'Creates deal in won stage', status: 'active', config: { connectorType: 'crm', crmAction: 'create_deal', pipelineStage: 'won', dealName: 'VIP {{contact.name}} Deal', dealValue: '5000' } }
    ],
    edges: [
      { id: 'we-1', source: 'wn-1', target: 'wn-2' },
      { id: 'we-2', source: 'wn-2', target: 'wn-3' },
      { id: 'we-3', source: 'wn-3', target: 'wn-4' },
      { id: 'we-4', source: 'wn-4', target: 'wn-5', sourceHandle: 'true' }
    ],
    runsCount: 0,
    successCount: 0
  };

  // Add/overwrite mock workflow
  db.workflows = db.workflows || [];
  const existingIdx = db.workflows.findIndex(w => w.id === wfId);
  if (existingIdx !== -1) {
    db.workflows[existingIdx] = testWf;
  } else {
    db.workflows.push(testWf);
  }
  
  // Clear previous runs logs for clean verification
  db.workflow_runs = (db.workflow_runs || []).filter(r => r.workflowId !== wfId);
  
  writeDb(db);
  console.log('[Test Setup] Mock workflow inserted into db and old run history cleared.');

  // Context for triggering
  const context = {
    contactId: 'c-101',
    contact: {
      id: 'c-101',
      name: 'Priya Menon',
      email: 'priya@example.com',
      phone: '+919000012345',
      company: 'High-Budget price consult'
    }
  };

  console.log('[Test Execution] Dispatching trigger: chat...');
  await enqueueWorkflowTrigger(db, 't-1', 'chat', context);

  // Wait 1.5 seconds for async steps to execute
  console.log('[Test Execution] Waiting for async execution steps...');
  await new Promise(r => setTimeout(r, 2000));

  // Inspect run history
  const finalDb = readDb();
  const runs = (finalDb.workflow_runs || []).filter(r => r.workflowId === wfId);
  
  console.log('--- VERIFICATION RESULTS ---');
  console.log(`Runs Found: ${runs.length}`);
  
  if (runs.length === 0) {
    console.error('FAIL: No workflow run log recorded!');
    process.exit(1);
  }

  const run = runs[0];
  console.log(`Run Status: ${run.status}`);
  console.log(`Variables Snapshot:`, run.variables);
  console.log(`Timeline Logs:`);
  run.timeline.forEach((step, idx) => {
    console.log(`  Step ${idx + 1}: ${step.label} (${step.type}) -> Status: ${step.status}, Output: "${step.output || step.error || ''}"`);
  });

  const conditionStep = run.timeline.find(step => step.type === 'condition' && step.label === 'Is Sales?');
  if (run.status === 'completed' && conditionStep?.output === 'TRUE') {
    console.log('SUCCESS: All nodes executed successfully and branching logic resolved TRUE.');
  } else {
    console.error(`FAIL: Workflow status=${run.status}, condition=${conditionStep?.output || 'missing'}`);
    process.exit(1);
  }

  // Cleanup test workflow and runs from DB
  const cleanDb = readDb();
  cleanDb.workflows = cleanDb.workflows.filter(w => w.id !== wfId);
  cleanDb.workflow_runs = cleanDb.workflow_runs.filter(r => r.workflowId !== wfId);
  writeDb(cleanDb);
  console.log('[Cleanup] Test workflow and run history removed from database.');
  
  console.log('--- TEST COMPLETED ---');
}

test().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
