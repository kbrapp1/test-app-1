#!/usr/bin/env node

/**
 * Domain Generator Script
 * Creates a new DDD domain structure based on the successful DAM pattern
 * 
 * Usage: node scripts/create-domain.js marketing-automation [--with-templates]
 * 
 * Options:
 *   --with-templates  Generate example entity, repository, and use case templates
 */

const fs = require('fs');
const path = require('path');

function createDomainStructure(domainName, withTemplates = false) {
  const basePath = `lib/${domainName}`;
  
  const directories = [
    `${basePath}/domain/entities`,
    `${basePath}/domain/repositories`,
    `${basePath}/domain/services`,
    `${basePath}/domain/value-objects`,
    `${basePath}/application/use-cases`,
    `${basePath}/application/dto`,
    `${basePath}/application/services`,
    `${basePath}/infrastructure/persistence/supabase/mappers`,
    `${basePath}/infrastructure/persistence/supabase/repositories`,
    `${basePath}/infrastructure/storage`,
    `${basePath}/presentation/components`,
    `${basePath}/presentation/hooks`,
    `${basePath}/presentation/types`,
    `${basePath}/types`,
  ];

  // Create directories
  directories.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  });

  // Create index.ts files with proper exports
  createIndexFiles(basePath);
  
  // Create templates if requested
  if (withTemplates) {
    createTemplateFiles(basePath, domainName);
  }

  console.log(`\n✅ Domain structure created for: ${domainName}`);
  console.log(`📁 Location: ${basePath}`);
  
  if (withTemplates) {
    console.log(`📝 Templates created - check the example files to get started`);
  } else {
    console.log(`🎯 Next: Start building your entities in ${basePath}/domain/entities/`);
    console.log(`💡 Tip: Use --with-templates flag to generate example files`);
  }
}

function createIndexFiles(basePath) {
  const indexFiles = [
    {
      path: `${basePath}/index.ts`,
      content: `// ${path.basename(basePath)} Domain Public API
// Export only what external modules need to know about this domain

// Domain Entities
export * from './domain/entities';

// Application Use Cases
export * from './application/use-cases';

// Application DTOs
export * from './application/dto';

// Presentation Components
export * from './presentation/components';

// Presentation Hooks
export * from './presentation/hooks';

// Types
export * from './types';
`
    },
    {
      path: `${basePath}/domain/entities/index.ts`,
      content: `// Domain Entities
// Export all entities from this domain
`
    },
    {
      path: `${basePath}/domain/repositories/index.ts`,
      content: `// Domain Repository Interfaces
// Export repository contracts (interfaces only)
`
    },
    {
      path: `${basePath}/domain/services/index.ts`,
      content: `// Domain Services
// Export domain services that contain business logic
`
    },
    {
      path: `${basePath}/application/use-cases/index.ts`,
      content: `// Application Use Cases
// Export all use cases for this domain
`
    },
    {
      path: `${basePath}/application/dto/index.ts`,
      content: `// Application DTOs
// Export data transfer objects for this domain
`
    },
    {
      path: `${basePath}/infrastructure/persistence/supabase/mappers/index.ts`,
      content: `// Infrastructure Mappers
// Export database mappers for this domain
`
    },
    {
      path: `${basePath}/presentation/components/index.ts`,
      content: `// Presentation Components
// Export React components for this domain
`
    },
    {
      path: `${basePath}/presentation/hooks/index.ts`,
      content: `// Presentation Hooks
// Export React hooks for this domain
`
    },
  ];

  indexFiles.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(`Created: ${file.path}`);
  });
}

function createTemplateFiles(basePath, domainName) {
  const capitalizedDomain = domainName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
  
  // Create example entity
  const entityTemplate = `/**
 * ${capitalizedDomain} Domain Entity
 * TODO: Replace this with your actual entity
 * Follows the same DDD pattern as Asset entity
 */

export interface ${capitalizedDomain}Props {
  id: string;
  name: string;
  organizationId: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  // TODO: Add your domain-specific properties
}

export class ${capitalizedDomain} {
  private constructor(private props: ${capitalizedDomain}Props) {
    this.validate();
  }

  // Factory method - following Asset pattern
  static create(props: Omit<${capitalizedDomain}Props, 'id' | 'createdAt'> & { 
    id?: string; 
    createdAt?: Date;
  }): ${capitalizedDomain} {
    return new ${capitalizedDomain}({
      id: props.id || crypto.randomUUID(),
      createdAt: props.createdAt || new Date(),
      ...props,
    });
  }

  // Getters - following Asset pattern
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get organizationId(): string { return this.props.organizationId; }
  get userId(): string { return this.props.userId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // Business methods - TODO: Add your domain logic
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
  }

  // Validation - following Asset pattern
  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    
    if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
      throw new Error('Organization ID is required');
    }

    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
  }
}
`;

  // Create example repository interface
  const repositoryTemplate = `import { ${capitalizedDomain} } from '../entities/${capitalizedDomain}';

/**
 * ${capitalizedDomain} Repository Interface
 * Defines the contract for ${domainName} data persistence
 * Following the same pattern as AssetRepository
 */
export interface ${capitalizedDomain}Repository {
  // Basic CRUD operations
  findById(id: string): Promise<${capitalizedDomain} | null>;
  findByOrganizationId(organizationId: string): Promise<${capitalizedDomain}[]>;
  save(${domainName.replace('-', '')}: ${capitalizedDomain}): Promise<${capitalizedDomain}>;
  update(${domainName.replace('-', '')}: ${capitalizedDomain}): Promise<${capitalizedDomain}>;
  delete(id: string): Promise<void>;
  
  // Domain-specific queries - TODO: Add your specific queries
  findByUserId(userId: string): Promise<${capitalizedDomain}[]>;
  findByName(name: string, organizationId: string): Promise<${capitalizedDomain} | null>;
}
`;

  // Create example use case
  const useCaseTemplate = `import { ${capitalizedDomain} } from '../../domain/entities/${capitalizedDomain}';
import { ${capitalizedDomain}Repository } from '../../domain/repositories/${capitalizedDomain}Repository';

/**
 * Create ${capitalizedDomain} Use Case
 * Handles the business logic for creating a new ${domainName}
 * Following the same pattern as DAM use cases
 */

export interface Create${capitalizedDomain}Request {
  name: string;
  organizationId: string;
  userId: string;
  // TODO: Add your specific properties
}

export interface Create${capitalizedDomain}Response {
  ${domainName.replace('-', '')}: ${capitalizedDomain};
  success: boolean;
  message?: string;
}

export class Create${capitalizedDomain}UseCase {
  constructor(
    private ${domainName.replace('-', '')}Repository: ${capitalizedDomain}Repository
  ) {}

  async execute(request: Create${capitalizedDomain}Request): Promise<Create${capitalizedDomain}Response> {
    try {
      // Validate request
      this.validateRequest(request);

      // Check if ${domainName} with same name already exists
      const existing = await this.${domainName.replace('-', '')}Repository.findByName(
        request.name, 
        request.organizationId
      );
      
      if (existing) {
        throw new Error(\`\${capitalizedDomain} with name "\${request.name}" already exists\`);
      }

      // Create new ${domainName}
      const ${domainName.replace('-', '')} = ${capitalizedDomain}.create({
        name: request.name,
        organizationId: request.organizationId,
        userId: request.userId,
      });

      // Save to repository
      const saved${capitalizedDomain} = await this.${domainName.replace('-', '')}Repository.save(${domainName.replace('-', '')});

      return {
        ${domainName.replace('-', '')}: saved${capitalizedDomain},
        success: true,
        message: \`\${capitalizedDomain} created successfully\`,
      };
    } catch (error) {
      console.error(\`Error creating \${domainName}:\`, error);
      throw new Error(\`Failed to create \${domainName}: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }
  }

  private validateRequest(request: Create${capitalizedDomain}Request): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!request.organizationId || request.organizationId.trim().length === 0) {
      throw new Error('Organization ID is required');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
  }
}
`;

  // Write template files
  fs.writeFileSync(`${basePath}/domain/entities/${capitalizedDomain}.ts`, entityTemplate);
  fs.writeFileSync(`${basePath}/domain/repositories/${capitalizedDomain}Repository.ts`, repositoryTemplate);
  fs.writeFileSync(`${basePath}/application/use-cases/Create${capitalizedDomain}UseCase.ts`, useCaseTemplate);

  console.log(`📝 Created template entity: ${basePath}/domain/entities/${capitalizedDomain}.ts`);
  console.log(`📝 Created template repository: ${basePath}/domain/repositories/${capitalizedDomain}Repository.ts`);
  console.log(`📝 Created template use case: ${basePath}/application/use-cases/Create${capitalizedDomain}UseCase.ts`);
}

const domainName = process.argv[2];
const withTemplates = process.argv.includes('--with-templates');

if (!domainName) {
  console.error('❌ Please provide a domain name');
  console.log('Usage: node scripts/create-domain.js <domain-name> [--with-templates]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/create-domain.js marketing-automation');
  console.log('  node scripts/create-domain.js team-management --with-templates');
  process.exit(1);
}

createDomainStructure(domainName, withTemplates); 