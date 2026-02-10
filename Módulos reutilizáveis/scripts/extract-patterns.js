#!/usr/bin/env node
/**
 * Extract reusable patterns from n8n workflows
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Sanitize personal data from a value
function sanitizeValue(key, value, parentKey = '') {
  if (typeof value !== 'string') return value;

  // Skip sanitizing node IDs and position data - these are structural
  if (key === 'id' || key === 'node' || parentKey === 'position') {
    return value;
  }

  // Email patterns
  if (value.match(/[\w.-]+@[\w.-]+\.\w+/)) {
    return value.replace(/[\w.-]+@[\w.-]+\.\w+/g, 'your-email@example.com');
  }

  // Phone numbers (Portuguese format +351...)
  if (value.match(/\+351[\s]?\d{3}[\s]?\d{3}[\s]?\d{3}/g)) {
    return value.replace(/\+351[\s]?\d{3}[\s]?\d{3}[\s]?\d{3}/g, '+XX XXX XXX XXX');
  }

  // URLs with descomplicador domain
  if (value.match(/https?:\/\/[^\s]*descomplicador[^\s]*/gi)) {
    return value.replace(/https?:\/\/[^\s]*descomplicador[^\s]*/gi, 'https://your-domain.com');
  }

  // Graph Facebook and Google APIs
  if (value.match(/https?:\/\/(graph\.facebook\.com|generativelanguage\.googleapis\.com)/)) {
    return value.replace(/(graph\.facebook\.com|generativelanguage\.googleapis\.com)/, 'your-api-domain.com');
  }

  // Webhook paths - anonymize specific paths
  if (key === 'path' && value.startsWith('/') && !value.includes('webhook-test')) {
    // Keep generic structure, anonymize specific IDs
    return value.replace(/\/webhook\/[a-f0-9-]+/gi, '/webhook/YOUR_WEBHOOK_ID');
  }

  // Chatflow IDs - specific format
  if (key.toLowerCase().includes('chatflow') && value.length > 20) {
    return 'YOUR_CHATFLOW_ID';
  }

  // API keys in headers or authentication (but not UUIDs in workflow structure)
  if ((key.toLowerCase().includes('apikey') || key.toLowerCase().includes('authorization')) && value.length > 20) {
    return 'YOUR_API_KEY';
  }

  // Google Sheets IDs (44 characters)
  if (value.match(/^[A-Za-z0-9_-]{44}$/)) {
    return 'YOUR_SHEET_ID';
  }

  // Google Sheets IDs in URLs or document IDs
  if (value.match(/[A-Za-z0-9_-]{44}/)) {
    return value.replace(/[A-Za-z0-9_-]{44}/g, 'YOUR_SHEET_ID');
  }

  return value;
}

// Recursively sanitize object
function sanitizeObject(obj, parentKey = '', grandParentKey = '') {
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => sanitizeObject(item, `${parentKey}[${idx}]`, parentKey));
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip credential-related fields - they should just be placeholders
      if (key === 'credentials' || key === 'credential') {
        sanitized[key] = value; // Keep structure, credentials will be generic anyway
      } else {
        sanitized[key] = sanitizeObject(value, key, parentKey);
      }
    }
    return sanitized;
  }

  return sanitizeValue(parentKey, obj, grandParentKey);
}

// Extract a pattern with new UUIDs
function extractPattern(nodes, connections, metadata) {
  const oldToNewId = {};

  // Generate new UUIDs for all nodes
  const sanitizedNodes = nodes.map(node => {
    const newId = generateUUID();
    oldToNewId[node.id] = newId;

    const sanitizedNode = {
      ...node,
      id: newId,
      parameters: sanitizeObject(node.parameters || {}),
      credentials: node.credentials || {}
    };

    // Sanitize credentials to generic names
    if (sanitizedNode.credentials) {
      Object.keys(sanitizedNode.credentials).forEach(credType => {
        sanitizedNode.credentials[credType] = {
          id: 'YOUR_CREDENTIAL_ID',
          name: 'YOUR_CREDENTIAL_NAME'
        };
      });
    }

    return sanitizedNode;
  });

  // Copy connections as-is — n8n uses node names (not UUIDs) as keys and in conn.node
  const sanitizedConnections = {};
  for (const [nodeName, nodeConnections] of Object.entries(connections)) {
    sanitizedConnections[nodeName] = {};
    for (const [connectionType, connectionsList] of Object.entries(nodeConnections)) {
      sanitizedConnections[nodeName][connectionType] = connectionsList.map(connGroup =>
        connGroup.map(conn => {
          const sanitizedConn = {};
          for (const [key, value] of Object.entries(conn)) {
            sanitizedConn[key] = typeof value === 'string' ? sanitizeValue(key, value) : value;
          }
          return sanitizedConn;
        })
      );
    }
  }

  return {
    _metadata: metadata,
    nodes: sanitizedNodes,
    connections: sanitizedConnections,
    settings: {
      executionOrder: 'v1'
    }
  };
}

// Main extraction logic
const rawDir = path.join(__dirname, '../raw');
const files = fs.readdirSync(rawDir).filter(f => f.startsWith('workflow-') && f.endsWith('.json'));

console.log(`\n=== Extracting patterns from ${files.length} workflows ===\n`);

// Track extracted patterns
const extracted = {
  triggers: [],
  integrations: [],
  utilities: [],
  fullWorkflows: []
};

files.forEach(file => {
  const filePath = path.join(rawDir, file);
  const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Processing: ${workflow.name}`);

  // Determine workflow category
  const name = workflow.name.toLowerCase();

  if (name.includes('vapi')) {
    // Vapi integration patterns
    const pattern = extractPattern(workflow.nodes, workflow.connections, {
      name: workflow.name,
      description: `Vapi integration pattern for ${workflow.name}`,
      category: 'integration',
      tags: ['vapi', 'voice', 'ai-calling'],
      requiredCredentials: ['vapi'],
      source: 'descomplica-production'
    });

    extracted.integrations.push({
      filename: `vapi-${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
      pattern
    });

  } else if (name.includes('whatsapp')) {
    // WhatsApp patterns
    const pattern = extractPattern(workflow.nodes, workflow.connections, {
      name: workflow.name,
      description: `WhatsApp integration pattern - ${workflow.name}`,
      category: 'integration',
      tags: ['whatsapp', 'messaging', 'webhook'],
      requiredCredentials: ['whatsapp'],
      source: 'descomplica-production'
    });

    if (workflow.nodes.length <= 5) {
      // Simple patterns go to triggers
      extracted.triggers.push({
        filename: `whatsapp-${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
        pattern
      });
    } else {
      // Complex patterns go to full workflows
      extracted.fullWorkflows.push({
        filename: `whatsapp-${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
        pattern
      });
    }

  } else if (name.includes('flowise')) {
    // Flowise AI agent patterns
    const pattern = extractPattern(workflow.nodes, workflow.connections, {
      name: workflow.name,
      description: `Flowise AI assistant integration - ${workflow.name}`,
      category: 'ai-integration',
      tags: ['flowise', 'ai', 'chatbot', 'webhook'],
      requiredCredentials: ['flowise', 'http'],
      source: 'descomplica-production'
    });

    extracted.fullWorkflows.push({
      filename: `flowise-${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
      pattern
    });

  } else if (name.includes('invoice') || name.includes('ocr')) {
    // Document processing patterns
    const pattern = extractPattern(workflow.nodes, workflow.connections, {
      name: workflow.name,
      description: `Automated document processing workflow - ${workflow.name}`,
      category: 'automation',
      tags: ['ocr', 'document-processing', 'gmail', 'dropbox', 'scheduled'],
      requiredCredentials: ['gmail', 'dropbox', 'postgres'],
      source: 'descomplica-production'
    });

    extracted.fullWorkflows.push({
      filename: `invoice-ocr-processing.json`,
      pattern
    });

  } else {
    // Generic workflow
    const pattern = extractPattern(workflow.nodes, workflow.connections, {
      name: workflow.name,
      description: workflow.name,
      category: 'general',
      tags: ['webhook'],
      requiredCredentials: [],
      source: 'descomplica-production'
    });

    extracted.fullWorkflows.push({
      filename: workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json',
      pattern
    });
  }
});

// Write extracted patterns to their directories
console.log('\n=== Writing extracted patterns ===\n');

extracted.triggers.forEach(({ filename, pattern }) => {
  const outputPath = path.join(__dirname, '../triggers', filename);
  fs.writeFileSync(outputPath, JSON.stringify(pattern, null, 2));
  console.log(`✓ triggers/${filename}`);
});

extracted.integrations.forEach(({ filename, pattern }) => {
  const outputPath = path.join(__dirname, '../integrations', filename);
  fs.writeFileSync(outputPath, JSON.stringify(pattern, null, 2));
  console.log(`✓ integrations/${filename}`);
});

extracted.utilities.forEach(({ filename, pattern }) => {
  const outputPath = path.join(__dirname, '../utilities', filename);
  fs.writeFileSync(outputPath, JSON.stringify(pattern, null, 2));
  console.log(`✓ utilities/${filename}`);
});

extracted.fullWorkflows.forEach(({ filename, pattern }) => {
  const outputPath = path.join(__dirname, '../full-workflows', filename);
  fs.writeFileSync(outputPath, JSON.stringify(pattern, null, 2));
  console.log(`✓ full-workflows/${filename}`);
});

console.log('\n=== Summary ===');
console.log(`Triggers: ${extracted.triggers.length}`);
console.log(`Integrations: ${extracted.integrations.length}`);
console.log(`Utilities: ${extracted.utilities.length}`);
console.log(`Full Workflows: ${extracted.fullWorkflows.length}`);
console.log('\n✅ Pattern extraction complete!\n');
