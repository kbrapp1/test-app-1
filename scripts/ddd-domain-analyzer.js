/**
 * DDD Architecture Analyzer Command
 * 
 * Usage: node scripts/ddd-analyzer-command.js [domain]
 * Saves results to docs/refactor/ directory
 */

import fs from "fs";
import path from "path";
import { Project } from "ts-morph";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DDDAnalyzerCommand {
  constructor(targetDomain = null) {
    this.project = new Project({
      // Don't use tsconfig to avoid auto-loading all files
      useInMemoryFileSystem: false,
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Node",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true
      }
    });
    this.targetDomain = targetDomain;
    this.projectRoot = path.dirname(__dirname);
    this.libPath = path.join(this.projectRoot, "lib");
    this.outputPath = path.join(this.projectRoot, "docs", "refactor");
    
    this.results = {
      timestamp: new Date().toISOString(),
      domain: targetDomain || "all",
      summary: {},
      domainServices: [],
      fileSizes: [],
      layerViolations: [],
      entities: [],
      valueObjects: 0,
      repositoryViolations: [],
      crossDomainDependencies: [],
      anemicEntities: [],
      valueObjectViolations: [],
      businessRules: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log(`🔍 Starting DDD Analysis${this.targetDomain ? ` for domain: ${this.targetDomain}` : ' for all domains'}...\n`);

    try {
      // Add files based on domain filter - ONLY from lib/ directory
      if (this.targetDomain) {
        const domainPath = path.join(this.libPath, this.targetDomain);
        if (!fs.existsSync(domainPath)) {
          throw new Error(`Domain '${this.targetDomain}' not found at ${domainPath}`);
        }
        this.project.addSourceFilesAtPaths([
          `${domainPath}/**/*.ts`,
          `${domainPath}/**/*.tsx`
        ]);
        console.log(`📁 Analyzing domain: ${this.targetDomain}`);
      } else {
        this.project.addSourceFilesAtPaths([
          `${this.libPath}/**/*.ts`,
          `${this.libPath}/**/*.tsx`
        ]);
        console.log("📁 Analyzing all domains");
      }
      
      const allFiles = this.project.getSourceFiles();
      console.log(`📄 Found ${allFiles.length} TypeScript files\n`);

      if (allFiles.length === 0) {
        throw new Error("No TypeScript files found to analyze");
      }

      // Run analysis
      this.analyzeDomainServices();
      this.checkFileSizes();
      this.checkLayerBoundaries();
      this.checkRepositoryPatterns();
      this.checkCrossDomainDependencies();
      this.analyzeEntities();
      this.checkForAnemicDomainModel();
      this.checkValueObjectImmutability();
      this.analyzeBusinessRules();
      this.generateRecommendations();

      // Save results
      await this.saveResults();

      console.log("\n✨ Analysis complete!");
      
    } catch (error) {
      console.error("❌ Error during analysis:", error.message);
      process.exit(1);
    }
  }

  analyzeDomainServices() {
    console.log("🏗️  DOMAIN SERVICES ANALYSIS");
    console.log("-".repeat(40));
    
    const domainServiceFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/services/") && 
                     !file.getFilePath().includes("__tests__"));

    console.log(`Found ${domainServiceFiles.length} domain service files:`);
    
    domainServiceFiles.forEach(file => {
      const classes = file.getClasses();
      const interfaces = file.getInterfaces();
      const fileName = path.basename(file.getFilePath());
      const lineCount = file.getEndLineNumber();
      const domain = this.extractDomainFromPath(file.getFilePath());
      
      let serviceInfo = {
        name: fileName,
        path: file.getFilePath(),
        domain: domain,
        lines: lineCount,
        type: 'unknown',
        methods: 0,
        asyncMethods: 0
      };
      
      if (classes.length > 0) {
        const mainClass = classes[0];
        const methods = mainClass.getMethods();
        const asyncMethods = methods.filter(m => m.isAsync());
        serviceInfo.type = 'class';
        serviceInfo.methods = methods.length;
        serviceInfo.asyncMethods = asyncMethods.length;
        
        if (this.results.domainServices.length < 10) {
          console.log(`  📦 ${domain}/${fileName}: ${lineCount} lines, ${methods.length} methods${asyncMethods.length > 0 ? ` (${asyncMethods.length} async)` : ''}`);
        }
      } else if (interfaces.length > 0) {
        serviceInfo.type = 'interface';
        if (this.results.domainServices.length < 10) {
          console.log(`  📋 ${domain}/${fileName}: ${lineCount} lines (interface)`);
        }
      }
      
      this.results.domainServices.push(serviceInfo);
    });
    
    if (domainServiceFiles.length > 10) {
      console.log(`  ... and ${domainServiceFiles.length - 10} more services`);
    }
  }

  checkFileSizes() {
    console.log("\n📏 FILE SIZE ANALYSIS");
    console.log("-".repeat(40));
    
    const allFiles = this.project.getSourceFiles()
      .filter(file => !file.getFilePath().includes("__tests__"));
    
    const largeFiles = allFiles
      .map(file => ({
        path: file.getFilePath(),
        name: path.basename(file.getFilePath()),
        domain: this.extractDomainFromPath(file.getFilePath()),
        lines: file.getEndLineNumber()
      }))
      .filter(file => file.lines > 250)
      .sort((a, b) => b.lines - a.lines);

    if (largeFiles.length === 0) {
      console.log("✅ All files are under 250 lines - excellent!");
    } else {
      console.log(`⚠️  Found ${largeFiles.length} files over 250 lines:`);
      largeFiles.slice(0, 5).forEach(file => {
        console.log(`[ ] ${file.domain}/${file.name}: ${file.lines} lines`);
      });
    }

    // Store file size data
    this.results.fileSizes = allFiles.map(file => ({
      name: path.basename(file.getFilePath()),
      path: file.getFilePath(),
      domain: this.extractDomainFromPath(file.getFilePath()),
      lines: file.getEndLineNumber()
    })).sort((a, b) => b.lines - a.lines);

    const totalLines = allFiles.reduce((sum, file) => sum + file.getEndLineNumber(), 0);
    const avgLines = Math.round(totalLines / allFiles.length);
    console.log(`📊 Average file size: ${avgLines} lines`);
  }

  checkLayerBoundaries() {
    console.log("\n🏛️  LAYER BOUNDARY ANALYSIS");
    console.log("-".repeat(40));
    
    const domainFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/") && 
                     !file.getFilePath().includes("__tests__"));

    let violations = 0;
    let warnings = 0;
    
    domainFiles.forEach(file => {
      const imports = file.getImportDeclarations();
      imports.forEach(imp => {
        const modulePath = imp.getModuleSpecifierValue();
        if (modulePath.includes("/application/") || modulePath.includes("/infrastructure/")) {
          // Check if it's an allowed infrastructure import
          const isCompositionRoot = modulePath.includes("CompositionRoot") || modulePath.includes("composition");
          const isRepositoryInterface = modulePath.includes("Repository") && modulePath.includes("interfaces");
          const isDomainEvents = modulePath.includes("events") || modulePath.includes("Events");
          const domain = this.extractDomainFromPath(file.getFilePath());
          
          if (isCompositionRoot) {
            console.log(`⚠️  ${domain}/${path.basename(file.getFilePath())}: imports CompositionRoot - consider explicit DI`);
            warnings++;
            this.results.layerViolations.push({
              type: 'warning',
              file: path.basename(file.getFilePath()),
              domain: domain,
              issue: 'CompositionRoot import - consider explicit dependency injection',
              module: modulePath
            });
          } else if (!isRepositoryInterface && !isDomainEvents) {
            console.log(`❌ ${domain}/${path.basename(file.getFilePath())}: imports from ${modulePath}`);
            violations++;
            this.results.layerViolations.push({
              type: 'violation',
              file: path.basename(file.getFilePath()),
              domain: domain,
              issue: 'Direct layer boundary violation',
              module: modulePath
            });
          }
        }
      });
    });

    if (violations === 0 && warnings === 0) {
      console.log("✅ No layer boundary violations found - clean architecture!");
    } else {
      console.log(`⚠️  Found ${violations} violations and ${warnings} warnings`);
    }
  }

  analyzeEntities() {
    console.log("\n🏢 ENTITIES ANALYSIS");
    console.log("-".repeat(40));
    
    const entityFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/entities/"));

    console.log(`Found ${entityFiles.length} entity files:`);
    
    entityFiles.forEach(file => {
      const classes = file.getClasses();
      const fileName = path.basename(file.getFilePath());
      const domain = this.extractDomainFromPath(file.getFilePath());
      
      if (classes.length > 0) {
        const mainClass = classes[0];
        const properties = mainClass.getProperties();
        const methods = mainClass.getMethods();
        console.log(`  🏢 ${domain}/${fileName}: ${properties.length} properties, ${methods.length} methods`);
        
        this.results.entities.push({
          name: fileName,
          path: file.getFilePath(),
          domain: domain,
          properties: properties.length,
          methods: methods.length
        });
      }
    });

    // Check for value objects
    const valueObjectFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/value-objects/"));
    
    console.log(`\n📦 Found ${valueObjectFiles.length} value object files`);
    this.results.valueObjects = valueObjectFiles.length;
  }

  checkRepositoryPatterns() {
    console.log("\n🗄️  REPOSITORY PATTERN ANALYSIS");
    console.log("-".repeat(40));
    
    const domainFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/") && 
                     !file.getFilePath().includes("__tests__"));

    let violations = 0;
    
    domainFiles.forEach(file => {
      const imports = file.getImportDeclarations();
      imports.forEach(imp => {
        const modulePath = imp.getModuleSpecifierValue();
        const domain = this.extractDomainFromPath(file.getFilePath());
        
        // Detect direct database/ORM imports in domain
        if (modulePath.includes('supabase') || 
            modulePath.includes('@supabase') ||
            modulePath.includes('prisma') || 
            modulePath.includes('mongoose') ||
            modulePath.includes('typeorm') ||
            modulePath.includes('axios') ||
            modulePath.includes('fetch') ||
            modulePath.includes('http')) {
          console.log(`❌ ${domain}/${path.basename(file.getFilePath())}: direct infrastructure import (${modulePath})`);
          violations++;
          this.results.repositoryViolations.push({
            file: path.basename(file.getFilePath()),
            domain: domain,
            issue: 'Direct infrastructure dependency in domain',
            module: modulePath,
            type: this.getViolationType(modulePath)
          });
        }
      });
    });

    if (violations === 0) {
      console.log("✅ No direct infrastructure dependencies found in domain layer!");
    } else {
      console.log(`⚠️  Found ${violations} infrastructure dependency violations`);
    }
  }

  getViolationType(modulePath) {
    if (modulePath.includes('supabase') || modulePath.includes('@supabase')) return 'database';
    if (modulePath.includes('prisma') || modulePath.includes('mongoose') || modulePath.includes('typeorm')) return 'orm';
    if (modulePath.includes('axios') || modulePath.includes('fetch') || modulePath.includes('http')) return 'http';
    return 'infrastructure';
  }

  checkCrossDomainDependencies() {
    console.log("\n🔗 CROSS-DOMAIN DEPENDENCY ANALYSIS");
    console.log("-".repeat(40));
    
    const domainFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/") && 
                     !file.getFilePath().includes("__tests__") &&
                     !file.getFilePath().includes(".test.") &&
                     !file.getFilePath().includes(".spec."));
    
    let violations = 0;
    
    domainFiles.forEach(file => {
      const currentDomain = this.extractDomainFromPath(file.getFilePath());
      const imports = file.getImportDeclarations();
      
      imports.forEach(imp => {
        const modulePath = imp.getModuleSpecifierValue();
        
        // Check for imports from other domains (going up directory levels)
        if (modulePath.includes("../../../") && modulePath.includes("/lib/")) {
          // Extract the domain from the import path
          const pathSegments = modulePath.split('/');
          const libIndex = pathSegments.findIndex(seg => seg === 'lib');
          if (libIndex !== -1 && pathSegments[libIndex + 1]) {
            const importedDomain = pathSegments[libIndex + 1];
            
            if (importedDomain !== currentDomain && 
                importedDomain !== 'shared' && 
                importedDomain !== 'common') {
              console.log(`❌ ${currentDomain}/${path.basename(file.getFilePath())}: imports from ${importedDomain} domain`);
              violations++;
              this.results.crossDomainDependencies.push({
                file: path.basename(file.getFilePath()),
                currentDomain,
                importedDomain,
                issue: 'Cross-domain dependency in domain layer',
                module: modulePath
              });
            }
          }
        }
      });
    });

    if (violations === 0) {
      console.log("✅ No cross-domain dependencies found - good domain isolation!");
    } else {
      console.log(`⚠️  Found ${violations} cross-domain dependency violations`);
    }
  }

  checkForAnemicDomainModel() {
    console.log("\n🩸 ANEMIC DOMAIN MODEL ANALYSIS");
    console.log("-".repeat(40));
    
    let anemicCount = 0;
    
    this.results.entities.forEach(entity => {
      const file = this.project.getSourceFile(entity.path);
      if (!file) return;
      
      const classes = file.getClasses();
      
      if (classes.length > 0) {
        const mainClass = classes[0];
        const methods = mainClass.getMethods();
        
        // Check for anemic pattern: mostly getters/setters, few business methods
        const businessMethods = methods.filter(m => {
          const name = m.getName();
          return !name.startsWith('get') && 
                 !name.startsWith('set') &&
                 !name.startsWith('is') &&
                 name !== 'constructor' &&
                 name !== 'toString' &&
                 name !== 'toJSON';
        });
        
        const accessorMethods = methods.filter(m => {
          const name = m.getName();
          return name.startsWith('get') || name.startsWith('set') || name.startsWith('is');
        });
        
        // Entity is anemic if it has properties but no business methods
        if (entity.properties > 0 && businessMethods.length === 0 && accessorMethods.length > 0) {
          console.log(`⚠️  ${entity.domain}/${entity.name}: anemic entity (${entity.properties} properties, 0 business methods)`);
          anemicCount++;
          this.results.anemicEntities.push({
            name: entity.name,
            domain: entity.domain,
            properties: entity.properties,
            businessMethods: businessMethods.length,
            accessorMethods: accessorMethods.length,
            path: entity.path
          });
        }
      }
    });
    
    if (anemicCount === 0) {
      console.log("✅ No anemic domain models detected - entities have business logic!");
    } else {
      console.log(`⚠️  Found ${anemicCount} potentially anemic entities`);
    }
  }

  checkValueObjectImmutability() {
    console.log("\n🔒 VALUE OBJECT IMMUTABILITY ANALYSIS");
    console.log("-".repeat(40));
    
    const valueObjectFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/value-objects/"));
      
    let violations = 0;
    
    valueObjectFiles.forEach(file => {
      const classes = file.getClasses();
      const interfaces = file.getInterfaces();
      const domain = this.extractDomainFromPath(file.getFilePath());
      
      // Check classes for mutable properties
      classes.forEach(cls => {
        const properties = cls.getProperties();
        const mutableProps = properties.filter(prop => {
          try {
            return !prop.hasReadonlyKeyword() && 
                   !prop.isReadonly() &&
                   !prop.hasModifier('private') &&
                   !prop.hasModifier('protected');
          } catch (e) {
            // Fallback: check if property has readonly modifier in text
            const text = prop.getText();
            return !text.includes('readonly') &&
                   !text.includes('private') &&
                   !text.includes('protected');
          }
        });
        
        if (mutableProps.length > 0) {
          console.log(`⚠️  ${domain}/${path.basename(file.getFilePath())}: has ${mutableProps.length} mutable properties`);
          violations++;
          this.results.valueObjectViolations.push({
            file: path.basename(file.getFilePath()),
            domain: domain,
            issue: 'Value object has mutable properties',
            mutableProperties: mutableProps.length
          });
        }
      });
      
      // Check interfaces for readonly modifiers
      interfaces.forEach(iface => {
        const properties = iface.getProperties();
        const mutableProps = properties.filter(prop => {
          try {
            return !prop.hasReadonlyKeyword();
          } catch (e) {
            // Fallback: check if property has readonly modifier in text
            const text = prop.getText();
            return !text.includes('readonly');
          }
        });
        
        if (mutableProps.length > 0) {
          console.log(`⚠️  ${domain}/${path.basename(file.getFilePath())}: interface has ${mutableProps.length} mutable properties`);
          violations++;
          this.results.valueObjectViolations.push({
            file: path.basename(file.getFilePath()),
            domain: domain,
            issue: 'Value object interface has mutable properties',
            mutableProperties: mutableProps.length
          });
        }
      });
    });
    
    if (violations === 0) {
      console.log("✅ All value objects are properly immutable!");
    } else {
      console.log(`⚠️  Found ${violations} value object immutability violations`);
    }
  }

  analyzeBusinessRules() {
    console.log("\n💼 BUSINESS RULES ANALYSIS");
    console.log("-".repeat(40));
    
    const domainFiles = this.project.getSourceFiles()
      .filter(file => file.getFilePath().includes("/domain/") && 
                     !file.getFilePath().includes("__tests__"));
    
    let businessRuleFiles = 0;
    
    domainFiles.forEach(file => {
      const content = file.getFullText();
      const domain = this.extractDomainFromPath(file.getFilePath());
      
      // Look for business rule indicators
      const hasValidation = /validate|isValid|check|verify/i.test(content);
      const hasBusinessLogic = /calculate|determine|apply|enforce|process|execute/i.test(content);
      const hasConditionals = (content.match(/if\s*\(/g) || []).length;
      const hasBusinessExceptions = /throw\s+new\s+\w*Error|throw\s+new\s+\w*Exception/g.test(content);
      
      if (hasBusinessLogic || hasValidation || hasConditionals > 3) {
        businessRuleFiles++;
        
        let complexityScore = 0;
        if (hasValidation) complexityScore += 1;
        if (hasBusinessLogic) complexityScore += 2;
        if (hasConditionals > 5) complexityScore += 1;
        if (hasBusinessExceptions) complexityScore += 1;
        
        this.results.businessRules.push({
          file: path.basename(file.getFilePath()),
          domain: domain,
          hasValidation,
          hasBusinessLogic,
          conditionalCount: hasConditionals,
          hasBusinessExceptions,
          complexityScore,
          path: file.getFilePath()
        });
        
        if (this.results.businessRules.length <= 10) {
          console.log(`  💼 ${domain}/${path.basename(file.getFilePath())}: complexity ${complexityScore}/5 (${hasConditionals} conditionals)`);
        }
      }
    });
    
    if (businessRuleFiles === 0) {
      console.log("⚠️  No business rules detected - domain might be anemic");
    } else {
      console.log(`✅ Found ${businessRuleFiles} files with business rules`);
      if (businessRuleFiles > 10) {
        console.log(`  ... and ${businessRuleFiles - 10} more business rule files`);
      }
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const largeFiles = this.results.fileSizes.filter(f => f.lines > 250);
    const violations = this.results.layerViolations.filter(v => v.type === 'violation');
    const avgFileSize = Math.round(
      this.results.fileSizes.reduce((sum, f) => sum + f.lines, 0) / this.results.fileSizes.length
    );

    // Existing recommendations
    if (largeFiles.length > 0) {
      recommendations.push(`📏 Refactor ${largeFiles.length} files over 250 lines to improve maintainability`);
    }

    if (violations.length > 0) {
      recommendations.push(`🏛️ Fix ${violations.length} layer boundary violations to improve DDD compliance`);
    }

    // New DDD-specific recommendations
    if (this.results.repositoryViolations.length > 0) {
      recommendations.push(`🗄️ Fix ${this.results.repositoryViolations.length} direct infrastructure dependencies - use repository pattern`);
    }

    if (this.results.crossDomainDependencies.length > 0) {
      recommendations.push(`🔗 Fix ${this.results.crossDomainDependencies.length} cross-domain dependencies - improve domain isolation`);
    }

    if (this.results.anemicEntities.length > 0) {
      recommendations.push(`🩸 Enrich ${this.results.anemicEntities.length} anemic entities with business logic`);
    }

    if (this.results.valueObjectViolations.length > 0) {
      recommendations.push(`🔒 Make ${this.results.valueObjectViolations.length} value objects immutable with readonly properties`);
    }

    if (this.results.businessRules.length === 0) {
      recommendations.push(`💼 Add business rules to domain layer - currently appears anemic`);
    }

    const highComplexityRules = this.results.businessRules.filter(rule => rule.complexityScore >= 4);
    if (highComplexityRules.length > 0) {
      recommendations.push(`💼 Refactor ${highComplexityRules.length} highly complex business rules (complexity 4+/5)`);
    }

    if (avgFileSize > 200) {
      recommendations.push(`📊 Consider breaking down services - average file size is ${avgFileSize} lines`);
    }

    if (this.results.domainServices.length === 0) {
      recommendations.push(`🏗️ Consider creating domain services to encapsulate business logic`);
    }

    const asyncServices = this.results.domainServices.filter(s => s.asyncMethods > 0);
    if (asyncServices.length > 0) {
      recommendations.push(`⚡ Review ${asyncServices.length} services with async methods for potential infrastructure leaks`);
    }

    // Success message if everything is clean
    if (recommendations.length === 0) {
      recommendations.push("✅ Excellent DDD architecture! No major issues found");
    }

    this.results.recommendations = recommendations;
  }

  extractDomainFromPath(filePath) {
    const libIndex = filePath.indexOf('/lib/');
    if (libIndex === -1) return 'unknown';
    
    const afterLib = filePath.substring(libIndex + 5);
    const nextSlash = afterLib.indexOf('/');
    
    return nextSlash === -1 ? afterLib : afterLib.substring(0, nextSlash);
  }

  async saveResults() {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const domain = this.targetDomain || 'all';
      
      // Generate filename suffix: omit domain name for single domain analysis, keep for 'all'
      const filenameSuffix = this.targetDomain ? timestamp : `${domain}-${timestamp}`;
      
      // Generate summary
      const summary = {
        totalFiles: this.project.getSourceFiles().length,
        domainServicesCount: this.results.domainServices.length,
        entitiesCount: this.results.entities.length,
        valueObjectsCount: this.results.valueObjects,
        layerViolationsCount: this.results.layerViolations.filter(v => v.type === 'violation').length,
        layerWarningsCount: this.results.layerViolations.filter(v => v.type === 'warning').length,
        repositoryViolationsCount: this.results.repositoryViolations.length,
        crossDomainDependenciesCount: this.results.crossDomainDependencies.length,
        anemicEntitiesCount: this.results.anemicEntities.length,
        valueObjectViolationsCount: this.results.valueObjectViolations.length,
        businessRulesCount: this.results.businessRules.length,
        largeFilesCount: this.results.fileSizes.filter(f => f.lines > 250).length,
        averageFileSize: Math.round(
          this.results.fileSizes.reduce((sum, f) => sum + f.lines, 0) / this.results.fileSizes.length
        )
      };

      this.results.summary = summary;

      // Save JSON report
      const jsonPath = path.join(this.outputPath, `ddd-domain-analysis-${filenameSuffix}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

      // Save Markdown report
      const mdReport = this.generateMarkdownReport();
      const mdPath = path.join(this.outputPath, `ddd-domain-analysis-${filenameSuffix}.md`);
      fs.writeFileSync(mdPath, mdReport);

      console.log(`\n💾 Reports saved to docs/refactor/:`);
      console.log(`   📄 JSON: ${path.basename(jsonPath)}`);
      console.log(`   📝 Markdown: ${path.basename(mdPath)}`);

    } catch (error) {
      console.error("❌ Error saving results:", error.message);
    }
  }

  generateMarkdownReport() {
    const data = this.results;
    const domain = this.targetDomain ? ` - ${this.targetDomain}` : '';
    
    return `# DDD Domain Layer Analysis Report${domain}

**Generated:** ${data.timestamp}  
**Domain:** ${data.domain}

## 📊 Executive Summary

- **Total Files Analyzed:** ${data.summary.totalFiles}
- **Domain Services:** ${data.summary.domainServicesCount}
- **Entities:** ${data.summary.entitiesCount}
- **Value Objects:** ${data.summary.valueObjectsCount}
- **Layer Violations:** ${data.summary.layerViolationsCount}
- **Layer Warnings:** ${data.summary.layerWarningsCount}
- **Repository Violations:** ${data.summary.repositoryViolationsCount}
- **Cross-Domain Dependencies:** ${data.summary.crossDomainDependenciesCount}
- **Anemic Entities:** ${data.summary.anemicEntitiesCount}
- **Value Object Violations:** ${data.summary.valueObjectViolationsCount}
- **Business Rules:** ${data.summary.businessRulesCount}
- **Large Files (>250 lines):** ${data.summary.largeFilesCount}
- **Average File Size:** ${data.summary.averageFileSize} lines

## 🎯 Key Recommendations

${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🏗️ Domain Services Analysis

${data.domainServices.length > 0 ? 
  `Found ${data.domainServices.length} domain services across domains:

${data.domainServices.slice(0, 20).map(service => 
  `[ ] ${service.domain}/${service.name}: ${service.lines} lines, ${service.methods} methods${service.asyncMethods > 0 ? ` (${service.asyncMethods} async)` : ''}`
).join('\n')}` :
  'No domain services found.'
}

## ⚠️ Layer Boundary Issues

${data.layerViolations.length > 0 ? 
  data.layerViolations.map(v => 
    `[ ] ${v.domain}/${v.file}: ${v.issue} (${v.module})`
  ).join('\n') :
  'No layer boundary violations found! ✅'
}

## 🗄️ Repository Pattern Violations

${data.repositoryViolations.length > 0 ? 
  data.repositoryViolations.map(v => 
    `[ ] ${v.domain}/${v.file}: ${v.issue} - ${v.type} (${v.module})`
  ).join('\n') :
  'No direct infrastructure dependencies found! ✅'
}

## 🔗 Cross-Domain Dependencies

${data.crossDomainDependencies.length > 0 ? 
  data.crossDomainDependencies.map(v => 
    `[ ] ${v.currentDomain}/${v.file}: imports from ${v.importedDomain} domain (${v.module})`
  ).join('\n') :
  'No cross-domain dependencies found - good domain isolation! ✅'
}

## 🩸 Anemic Domain Model Analysis

${data.anemicEntities.length > 0 ? 
  data.anemicEntities.map(e => 
    `[ ] ${e.domain}/${e.name}: ${e.properties} properties, ${e.businessMethods} business methods (${e.accessorMethods} accessors)`
  ).join('\n') :
  'No anemic entities detected - entities have business logic! ✅'
}

## 🔒 Value Object Immutability

${data.valueObjectViolations.length > 0 ? 
  data.valueObjectViolations.map(v => 
    `[ ] ${v.domain}/${v.file}: ${v.mutableProperties} mutable properties`
  ).join('\n') :
  'All value objects are properly immutable! ✅'
}

## 💼 Business Rules Analysis

${data.businessRules.length > 0 ? 
  `Found ${data.businessRules.length} files with business rules:

${data.businessRules.slice(0, 15).map(rule => 
  `[ ] ${rule.domain}/${rule.file}: complexity ${rule.complexityScore}/5 (${rule.conditionalCount} conditionals, ${rule.hasValidation ? 'validation' : ''} ${rule.hasBusinessLogic ? 'business logic' : ''})`
).join('\n')}` :
  'No business rules detected - domain might be anemic ⚠️'
}

## 📏 File Size Analysis

### Large Files (>250 lines)

${data.fileSizes.filter(f => f.lines > 250).slice(0, 15).map(file => 
  `${file.domain}/${file.name}: ${file.lines} lines`
).join('\n') || 'All files are appropriately sized! ✅'}

### Largest Files by Domain

${Object.entries(
  data.fileSizes.reduce((acc, file) => {
    if (!acc[file.domain]) acc[file.domain] = [];
    acc[file.domain].push(file);
    return acc;
  }, {})
).map(([domain, files]) => {
  const largest = files.sort((a, b) => b.lines - a.lines)[0];
  return `[ ] ${domain}: ${largest.name} (${largest.lines} lines)`;
}).join('\n')}

## 🏢 Domain Model Analysis

### Entities by Domain

${data.entities.length > 0 ?
  Object.entries(
    data.entities.reduce((acc, entity) => {
      if (!acc[entity.domain]) acc[entity.domain] = [];
      acc[entity.domain].push(entity);
      return acc;
    }, {})
  ).map(([domain, entities]) => 
    `[ ] ${domain}: ${entities.length} entities (avg ${Math.round(entities.reduce((sum, e) => sum + e.methods, 0) / entities.length)} methods per entity)`
  ).join('\n') :
  'No entities found.'
}

### Value Objects Distribution

- **Total Value Objects:** ${data.valueObjects}
- **Ratio to Entities:** ${data.entities.length > 0 ? (data.valueObjects / data.entities.length).toFixed(1) : 'N/A'} value objects per entity

## 📈 Domain Health Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Average File Size | ${data.summary.averageFileSize} lines | ${data.summary.averageFileSize <= 250 ? '✅ Good' : '⚠️ Consider refactoring'} |
| Layer Violations | ${data.summary.layerViolationsCount} | ${data.summary.layerViolationsCount === 0 ? '✅ Clean' : '❌ Needs attention'} |
| Repository Violations | ${data.summary.repositoryViolationsCount} | ${data.summary.repositoryViolationsCount === 0 ? '✅ Clean' : '❌ Use repository pattern'} |
| Cross-Domain Dependencies | ${data.summary.crossDomainDependenciesCount} | ${data.summary.crossDomainDependenciesCount === 0 ? '✅ Good isolation' : '❌ Improve isolation'} |
| Anemic Entities | ${data.summary.anemicEntitiesCount} | ${data.summary.anemicEntitiesCount === 0 ? '✅ Rich domain' : '⚠️ Add business logic'} |
| Value Object Violations | ${data.summary.valueObjectViolationsCount} | ${data.summary.valueObjectViolationsCount === 0 ? '✅ Immutable' : '⚠️ Make readonly'} |
| Business Rules | ${data.summary.businessRulesCount} | ${data.summary.businessRulesCount > 0 ? '✅ Good' : '⚠️ Domain may be anemic'} |
| Large Files | ${data.summary.largeFilesCount} | ${data.summary.largeFilesCount === 0 ? '✅ Good' : '⚠️ Consider splitting'} |
| Domain Services | ${data.summary.domainServicesCount} | ${data.summary.domainServicesCount > 0 ? '✅ Good' : '⚠️ Consider adding'} |

---

*Generated by DDD Architecture Analyzer using ts-morph*  
*For questions or improvements, see: .claude/commands/analyze-ddd.md*
`;
  }
}

// CLI execution
async function main() {
  const domain = process.argv[2]; // Get domain from command line argument
  
  const analyzer = new DDDAnalyzerCommand(domain);
  await analyzer.analyze();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { DDDAnalyzerCommand };

