const fs = require('fs');
const path = require('path');

const targetFiles = [
  'README.md',
  'deploy_guide.md',
  'local_setup_guide.md',
  'index.html',
  'public/widget-chat.html',
  'public/widget.js',
  'server/auth.js',
  'server/db.js',
  'server/index.js',
  'server/seed.js',
  'server/vault.js',
  'src/App.tsx',
  'src/auth/AuthProvider.tsx',
  'src/components/AIBrainView.tsx',
  'src/components/CommunicationHubView.tsx',
  'src/components/DashboardView.tsx',
  'src/components/IntegrationsView.tsx',
  'src/components/LandingPageView.tsx',
  'src/components/Sidebar.tsx',
  'src/components/SuperAdminView.tsx',
  'src/components/TenantSettingsView.tsx',
  'src/components/TenantSupportView.tsx',
  'src/components/WhiteLabelView.tsx',
  'src/components/WidgetBuilderView.tsx',
  'src/index.css',
  'src/mockData.ts'
];

const replacements = [
  // Specific phrases
  [/AiraOS Technologies/g, 'GatiDesk Technologies'],
  [/AiraOS Inc\./gi, 'GatiDesk Technologies'],
  [/AiraOS/g, 'GatiDesk'],
  [/airaos/g, 'gatidesk'],
  [/AIRAOS/g, 'GATIDESK'],
  
  // CleverAdAI
  [/CleverAdAI/g, 'GatiDesk'],
  [/cleveradai/g, 'gatidesk'],
  
  // Aira (keeping case match)
  [/Aira/g, 'Gati'],
  [/aira/g, 'gati'],
  
  // Widget selectors and properties
  [/airaos-widget-launcher/g, 'gatidesk-widget-launcher'],
  [/airaos-widget-container/g, 'gatidesk-widget-container'],
  [/airaos-widget-iframe/g, 'gatidesk-widget-iframe'],
  [/airaos-platform-bot-script/g, 'gatidesk-platform-bot-script'],
  [/AiraOSWidgetLoaded/g, 'GatiDeskWidgetLoaded'],
  [/airaos_chat_history/g, 'gatidesk_chat_history'],
  [/airaos_session_time/g, 'gatidesk_session_time'],
  [/airaos_identity/g, 'gatidesk_identity'],
  [/airaos-widget-close/g, 'gatidesk-widget-close']
];

// Special replacements
const fileSpecificReplacements = {
  'index.html': [
    [/<title>agentstackos<\/title>/g, '<title>GatiDesk — Global Automation & Telephony Intelligence</title>']
  ]
};

const projectRoot = path.resolve(__dirname, '..');

console.log('Starting rebranding search and replace...');

for (const relPath of targetFiles) {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  // Apply global replacements
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  // Apply file-specific replacements if any
  if (fileSpecificReplacements[relPath]) {
    for (const [regex, replacement] of fileSpecificReplacements[relPath]) {
      content = content.replace(regex, replacement);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${relPath}`);
  } else {
    console.log(`No changes needed: ${relPath}`);
  }
}

console.log('Global rebranding replacements completed successfully!');
