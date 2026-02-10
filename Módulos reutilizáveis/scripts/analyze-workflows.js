#!/usr/bin/env node
/**
 * Analyze n8n workflows and extract patterns
 */

const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '../raw');
const files = fs.readdirSync(rawDir).filter(f => f.startsWith('workflow-') && f.endsWith('.json'));

console.log(`\n=== Analyzing ${files.length} workflows ===\n`);

const analysis = {
  workflows: [],
  nodeTypes: {},
  triggerTypes: {},
  patterns: {
    webhooks: [],
    schedulers: [],
    aiAgents: [],
    integrations: [],
    errorHandling: [],
    dataTransform: []
  }
};

files.forEach(file => {
  const filePath = path.join(rawDir, file);
  const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`\n📋 Workflow: ${workflow.name}`);
  console.log(`   ID: ${workflow.id}`);
  console.log(`   Nodes: ${workflow.nodes.length}`);

  const workflowInfo = {
    id: workflow.id,
    name: workflow.name,
    active: workflow.active,
    nodeCount: workflow.nodes.length,
    nodeTypes: [],
    triggers: [],
    hasAIAgent: false,
    hasErrorHandling: false
  };

  workflow.nodes.forEach(node => {
    const nodeType = node.type;

    // Count node types
    if (!analysis.nodeTypes[nodeType]) {
      analysis.nodeTypes[nodeType] = 0;
    }
    analysis.nodeTypes[nodeType]++;

    if (!workflowInfo.nodeTypes.includes(nodeType)) {
      workflowInfo.nodeTypes.push(nodeType);
    }

    // Identify triggers
    if (nodeType.includes('Trigger') || nodeType === 'n8n-nodes-base.webhook') {
      workflowInfo.triggers.push({ type: nodeType, name: node.name });
      if (!analysis.triggerTypes[nodeType]) {
        analysis.triggerTypes[nodeType] = 0;
      }
      analysis.triggerTypes[nodeType]++;

      if (nodeType === 'n8n-nodes-base.webhook') {
        analysis.patterns.webhooks.push({
          workflow: workflow.name,
          node: node.name,
          path: node.parameters?.path || 'unknown'
        });
      } else if (nodeType.includes('Schedule')) {
        analysis.patterns.schedulers.push({
          workflow: workflow.name,
          node: node.name
        });
      }
    }

    // Identify AI Agent nodes
    if (nodeType === '@n8n/n8n-nodes-langchain.agent') {
      workflowInfo.hasAIAgent = true;
      analysis.patterns.aiAgents.push({
        workflow: workflow.name,
        node: node.name
      });
    }

    // Identify integrations
    if (nodeType.includes('Google') || nodeType.includes('Gmail') ||
        nodeType.includes('Calendar') || nodeType.includes('Sheets') ||
        nodeType.includes('WhatsApp') || nodeType.includes('Notion')) {
      analysis.patterns.integrations.push({
        workflow: workflow.name,
        node: node.name,
        type: nodeType
      });
    }

    // Identify error handling
    if (node.onError || nodeType.includes('ErrorTrigger')) {
      workflowInfo.hasErrorHandling = true;
      analysis.patterns.errorHandling.push({
        workflow: workflow.name,
        node: node.name
      });
    }

    // Identify data transformation nodes
    if (nodeType === 'n8n-nodes-base.code' || nodeType === 'n8n-nodes-base.set' ||
        nodeType === 'n8n-nodes-base.if' || nodeType === 'n8n-nodes-base.switch') {
      analysis.patterns.dataTransform.push({
        workflow: workflow.name,
        node: node.name,
        type: nodeType
      });
    }
  });

  console.log(`   Triggers: ${workflowInfo.triggers.map(t => t.type).join(', ')}`);
  console.log(`   Has AI Agent: ${workflowInfo.hasAIAgent}`);
  console.log(`   Has Error Handling: ${workflowInfo.hasErrorHandling}`);

  analysis.workflows.push(workflowInfo);
});

console.log('\n\n=== SUMMARY ===\n');
console.log(`Total Workflows: ${analysis.workflows.length}`);
console.log(`\nNode Type Distribution:`);
Object.entries(analysis.nodeTypes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

console.log(`\nTrigger Type Distribution:`);
Object.entries(analysis.triggerTypes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

console.log(`\nPattern Summary:`);
console.log(`  Webhooks: ${analysis.patterns.webhooks.length}`);
console.log(`  Schedulers: ${analysis.patterns.schedulers.length}`);
console.log(`  AI Agents: ${analysis.patterns.aiAgents.length}`);
console.log(`  Integrations: ${analysis.patterns.integrations.length}`);
console.log(`  Error Handling: ${analysis.patterns.errorHandling.length}`);
console.log(`  Data Transform: ${analysis.patterns.dataTransform.length}`);

// Save analysis to file
fs.writeFileSync(
  path.join(__dirname, '../raw/analysis.json'),
  JSON.stringify(analysis, null, 2)
);

console.log('\n✅ Analysis complete! Results saved to raw/analysis.json\n');
