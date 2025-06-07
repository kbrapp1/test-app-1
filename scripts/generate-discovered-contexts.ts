#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

// Import the discovery service
import { DomainDiscoveryService } from '../lib/monitoring/infrastructure/discovery/DomainDiscoveryService';
import { PageContext } from '../lib/monitoring/domain/repositories/PageContextRepository';

async function generateDiscoveredContexts() {
  console.log('🔍 Discovering domains for build-time generation...');
  
  try {
    // Run actual server-side discovery
    const discoveryService = new DomainDiscoveryService();
    const discoveredContexts = await discoveryService.discoverDomains();
    
    // Generate TypeScript file with discovered data
    const fallbackData = {
      generated: new Date().toISOString(),
      contexts: discoveredContexts
    };
    
    const tsContent = `// Auto-generated contexts from build-time discovery - DO NOT EDIT MANUALLY
// Generated: ${fallbackData.generated}
// Run 'npm run generate:contexts' to update

import { PageContext } from '../../domain/repositories/PageContextRepository';

export const DISCOVERED_CONTEXTS: PageContext[] = ${JSON.stringify(discoveredContexts, null, 2)};
`;

    // Write to infrastructure directory
    const outputPath = path.join(__dirname, '../lib/monitoring/infrastructure/generated/DiscoveredContexts.ts');
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, tsContent);
    
    console.log(`✅ Generated discovered contexts: ${outputPath}`);
    console.log(`📊 Discovered ${discoveredContexts.length} domains:`);
    
    discoveredContexts.forEach((context: PageContext) => {
      console.log(`   • ${context.domain}: ${context.components.length} components, ${context.endpoints.length} endpoints`);
    });
    
  } catch (error) {
    console.error('❌ Failed to generate discovered contexts:', error);
    process.exit(1);
  }
}



// Run if called directly
if (require.main === module) {
  generateDiscoveredContexts();
}

export { generateDiscoveredContexts }; 