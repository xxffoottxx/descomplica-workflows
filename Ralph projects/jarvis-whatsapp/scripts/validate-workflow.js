#!/usr/bin/env node

/**
 * Validation Script for Jarvis WhatsApp Workflow
 *
 * Checks:
 * - JSON parsing
 * - Node ID uniqueness
 * - Connection integrity
 * - Required parameters
 * - Credential placeholders
 * - Portuguese language in system prompt
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '../workflows/jarvis-whatsapp-assistant.json');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  log(title, 'blue');
  console.log('='.repeat(60));
}

// Load workflow
let workflow;
try {
  const fileContent = fs.readFileSync(WORKFLOW_PATH, 'utf8');
  workflow = JSON.parse(fileContent);
  log('✓ JSON parsing successful', 'green');
} catch (error) {
  log(`✗ JSON parsing failed: ${error.message}`, 'red');
  process.exit(1);
}

// Validation checks
const errors = [];
const warnings = [];
const info = [];

// 1. Check node ID uniqueness
logSection('1. Validating Node IDs');
const nodeIds = new Set();
const nodeNames = new Set();
workflow.nodes.forEach(node => {
  if (nodeIds.has(node.id)) {
    errors.push(`Duplicate node ID: ${node.id} (${node.name})`);
  } else {
    nodeIds.add(node.id);
  }

  if (nodeNames.has(node.name)) {
    warnings.push(`Duplicate node name: ${node.name}`);
  } else {
    nodeNames.add(node.name);
  }
});

if (errors.length === 0) {
  log(`✓ All ${nodeIds.size} node IDs are unique`, 'green');
} else {
  errors.forEach(err => log(`✗ ${err}`, 'red'));
}

// 2. Check connection integrity
logSection('2. Validating Connections');
const nodeNameSet = new Set(workflow.nodes.map(n => n.name));
let connectionErrors = 0;

Object.entries(workflow.connections).forEach(([sourceName, outputs]) => {
  if (!nodeNameSet.has(sourceName)) {
    errors.push(`Connection source node not found: ${sourceName}`);
    connectionErrors++;
    return;
  }

  Object.values(outputs).forEach(outputArray => {
    outputArray.forEach(connectionArray => {
      connectionArray.forEach(conn => {
        if (!nodeNameSet.has(conn.node)) {
          errors.push(`Connection target node not found: ${conn.node} (from ${sourceName})`);
          connectionErrors++;
        }
      });
    });
  });
});

if (connectionErrors === 0) {
  log(`✓ All connections reference existing nodes`, 'green');
  info.push(`Total connections: ${Object.keys(workflow.connections).length}`);
}

// 3. Check for placeholder credentials
logSection('3. Checking Credential Placeholders');
let credentialChecks = 0;
const requiredPlaceholders = [
  'YOUR_GMAIL_CREDENTIAL_ID',
  'YOUR_GCAL_CREDENTIAL_ID',
  'YOUR_GCONTACTS_CREDENTIAL_ID',
  'YOUR_GSHEETS_CREDENTIAL_ID',
  'YOUR_GTASKS_CREDENTIAL_ID',
  'YOUR_WHATSAPP_CREDENTIAL_ID',
];

workflow.nodes.forEach(node => {
  if (node.credentials) {
    Object.values(node.credentials).forEach(cred => {
      if (cred.id && cred.id.startsWith('YOUR_')) {
        credentialChecks++;
      }
    });
  }
});

if (credentialChecks > 0) {
  log(`✓ Found ${credentialChecks} credential placeholders (ready for customization)`, 'green');
} else {
  warnings.push('No credential placeholders found - might be already configured');
}

// 4. Check for personal data leaks
logSection('4. Checking for Personal Data');
const personalDataPatterns = [
  /\b\d{9,15}\b/g,  // Phone numbers
  /[a-zA-Z0-9._%+-]+@(?!example\.com|YOUR_)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,  // Real emails
];

const workflowString = JSON.stringify(workflow, null, 2);
let personalDataFound = false;

personalDataPatterns.forEach((pattern, idx) => {
  const matches = workflowString.match(pattern);
  if (matches) {
    const patternName = idx === 0 ? 'phone numbers' : 'email addresses';
    warnings.push(`Potential personal data found (${patternName}): ${matches.slice(0, 3).join(', ')}...`);
    personalDataFound = true;
  }
});

if (!personalDataFound) {
  log('✓ No obvious personal data found in workflow', 'green');
}

// 5. Check system prompt language
logSection('5. Validating System Prompt');
const jarvisNode = workflow.nodes.find(n => n.name === 'Jarvis');
if (jarvisNode) {
  const systemMessage = jarvisNode.parameters?.options?.systemMessage || '';

  // Check for Portuguese keywords
  const ptKeywords = ['Você', 'é', 'utilizador', 'André', 'Fuso horário'];
  const foundKeywords = ptKeywords.filter(kw => systemMessage.includes(kw));

  if (foundKeywords.length >= 3) {
    log('✓ System prompt appears to be in Portuguese (pt-PT)', 'green');
  } else {
    warnings.push('System prompt language unclear - verify pt-PT translation');
  }

  // Check timezone
  if (systemMessage.includes('Europe/Lisbon')) {
    log('✓ Timezone set to Europe/Lisbon', 'green');
  } else {
    warnings.push('Timezone not set to Europe/Lisbon');
  }
} else {
  errors.push('Jarvis node not found');
}

// 6. Check required nodes
logSection('6. Validating Required Nodes');
const requiredNodes = [
  'WhatsApp Trigger',
  'Filtro de Remetente Autorizado',
  'Verificar Tipo de Mensagem',
  'Gemini Flash 2.5',
  'Memória de Conversa',
  'Jarvis',
  'Enviar Resposta WhatsApp',
];

requiredNodes.forEach(nodeName => {
  if (nodeNameSet.has(nodeName)) {
    log(`✓ ${nodeName}`, 'green');
  } else {
    errors.push(`Required node missing: ${nodeName}`);
  }
});

// 7. Check tool nodes
logSection('7. Validating Tool Nodes');
const expectedTools = [
  { category: 'Gmail', count: 6 },
  { category: 'Google Calendar', count: 6 },
  { category: 'Google Contacts', count: 1 },
  { category: 'Google Sheets', count: 3 },
  { category: 'Google Tasks', count: 5 },
];

const toolNodes = workflow.nodes.filter(n =>
  n.type.includes('Tool') || n.type.includes('tool')
);

info.push(`Total tool nodes: ${toolNodes.length}`);

// Check AI connections
const aiToolConnections = Object.values(workflow.connections).filter(conn =>
  conn.ai_tool && conn.ai_tool.length > 0
).length;

log(`✓ ${aiToolConnections} tools connected to AI agent`, 'green');

// 8. Check Gemini configuration
logSection('8. Validating Gemini Configuration');
const geminiNode = workflow.nodes.find(n => n.name === 'Gemini Flash 2.5');
if (geminiNode) {
  if (geminiNode.type === '@n8n/n8n-nodes-langchain.lmChatGoogleGemini') {
    log('✓ Correct Gemini node type', 'green');
  } else {
    errors.push(`Wrong Gemini node type: ${geminiNode.type}`);
  }

  if (geminiNode.parameters?.model?.includes('gemini')) {
    log(`✓ Gemini model: ${geminiNode.parameters.model}`, 'green');
  } else {
    warnings.push('Gemini model not configured properly');
  }
} else {
  errors.push('Gemini node not found');
}

// 9. Check WhatsApp configuration
logSection('9. Validating WhatsApp Configuration');
const whatsappTrigger = workflow.nodes.find(n => n.name === 'WhatsApp Trigger');
if (whatsappTrigger) {
  if (whatsappTrigger.webhookId === 'YOUR_WEBHOOK_ID') {
    log('✓ Webhook ID is placeholder (ready for customization)', 'green');
  } else if (whatsappTrigger.webhookId) {
    warnings.push(`Webhook ID is set to: ${whatsappTrigger.webhookId} - verify this is correct`);
  }
}

const whatsappSend = workflow.nodes.find(n => n.name === 'Enviar Resposta WhatsApp');
if (whatsappSend) {
  const phoneNumberId = whatsappSend.parameters?.phoneNumberId;
  if (phoneNumberId === '1005307842661678') {
    log('✓ Phone Number ID set to Descomplica default', 'green');
  } else if (phoneNumberId) {
    info.push(`Phone Number ID: ${phoneNumberId}`);
  }
}

// Final Summary
logSection('VALIDATION SUMMARY');

console.log('\n📊 Statistics:');
log(`   Total nodes: ${workflow.nodes.length}`, 'blue');
log(`   Total connections: ${Object.keys(workflow.connections).length}`, 'blue');
log(`   Tool nodes: ${toolNodes.length}`, 'blue');
log(`   AI tool connections: ${aiToolConnections}`, 'blue');

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(err => log(`   - ${err}`, 'red'));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warn => log(`   - ${warn}`, 'yellow'));
}

if (info.length > 0) {
  console.log('\nℹ️  INFO:');
  info.forEach(i => log(`   - ${i}`, 'blue'));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  log('✅ VALIDATION PASSED - Workflow is ready to deploy!', 'green');
  process.exit(0);
} else if (errors.length === 0) {
  log('✅ VALIDATION PASSED with warnings - Review warnings before deploy', 'yellow');
  process.exit(0);
} else {
  log('❌ VALIDATION FAILED - Fix errors before deploy', 'red');
  process.exit(1);
}
