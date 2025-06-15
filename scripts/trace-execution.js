#!/usr/bin/env node

/**
 * Static Execution Flow Tracer
 * Analyzes imports to show execution flow without running code
 */

const fs = require('fs');
const path = require('path');

function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('@/')) {
        imports.push(importPath);
      }
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

function resolveImportPath(currentFile, importPath) {
  const currentDir = path.dirname(currentFile);
  let resolvedPath;
  
  if (importPath.startsWith('@/')) {
    // Handle absolute imports (@/ maps to root)
    resolvedPath = importPath.replace('@/', '');
  } else {
    // Handle relative imports
    const resolved = path.resolve(currentDir, importPath);
    resolvedPath = path.relative(process.cwd(), resolved);
  }
  
  // Normalize path separators
  resolvedPath = resolvedPath.replace(/\\/g, '/');
  
  // Try different extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const withExt = resolvedPath + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }
  
  // Try index files
  for (const ext of extensions) {
    const indexFile = path.join(resolvedPath, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
  }
  
  return resolvedPath;
}

function traceExecution(startFile, maxDepth = 3, visited = new Set()) {
  if (visited.has(startFile) || maxDepth <= 0) {
    return {};
  }
  
  visited.add(startFile);
  
  const imports = extractImports(startFile);
  const dependencies = {};
  
  for (const importPath of imports) {
    const resolvedPath = resolveImportPath(startFile, importPath);
    if (fs.existsSync(resolvedPath)) {
      dependencies[resolvedPath] = traceExecution(resolvedPath, maxDepth - 1, visited);
    }
  }
  
  return dependencies;
}

function printExecutionTree(tree, indent = 0) {
  const spaces = '  '.repeat(indent);
  
  for (const [file, dependencies] of Object.entries(tree)) {
    const fileName = path.basename(file);
    const dirName = path.dirname(file);
    console.log(`${spaces}📁 ${fileName} (${dirName})`);
    if (Object.keys(dependencies).length > 0) {
      printExecutionTree(dependencies, indent + 1);
    }
  }
}

// Show usage if no arguments
if (process.argv.length < 3) {
  console.log(`
🔍 Static Execution Flow Tracer

Usage:
  node scripts/trace-execution.js <file-path> [max-depth]

Examples:
  # Trace chat API flow
  node scripts/trace-execution.js app/api/chatbot-widget/chat/route.ts

  # Trace use case with depth limit
  node scripts/trace-execution.js lib/chatbot-widget/application/use-cases/ProcessChatMessageUseCase.ts 2

  # Trace domain service
  node scripts/trace-execution.js lib/chatbot-widget/domain/services/conversation/ConversationContextOrchestrator.ts

  # Trace from composition root
  node scripts/trace-execution.js lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot.ts
`);
  process.exit(0);
}

// Main execution
const startFile = process.argv[2];
const maxDepth = parseInt(process.argv[3]) || 3;

console.log(`🔍 Tracing execution flow from: ${startFile}`);
console.log(`📊 Max depth: ${maxDepth}\n`);

if (!fs.existsSync(startFile)) {
  console.error(`❌ File not found: ${startFile}`);
  console.log(`💡 Try running from project root directory`);
  process.exit(1);
}

const executionTree = traceExecution(startFile, maxDepth);
printExecutionTree({ [startFile]: executionTree });

console.log('\n✅ Static execution flow analysis complete!'); 