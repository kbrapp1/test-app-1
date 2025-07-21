# Feature Documentation Generator

## Command: `/feature-docs-generator {feature-name}`

Generates comprehensive, non-technical documentation for a specified feature set using a multi-agent analysis approach.

## Multi-Agent Architecture

This command orchestrates multiple specialized agents to create thorough documentation:

### 1. Code Analysis Agent
**Role**: Deep technical analysis of feature implementation
**Instructions**: 
```
ULTRATHINK: Perform comprehensive code analysis of the {feature-name} domain.

Analyze:
- All files in lib/{feature-name}/
- Domain structure and DDD patterns
- Key entities, services, and use cases
- Integration points with other domains
- External dependencies and providers
- Database schema and storage patterns

Provide:
- Technical architecture summary
- Core capabilities and features
- Data flow patterns
- Key abstractions and design patterns
- Performance considerations
- Security implementations
```

### 2. Architecture Agent  
**Role**: System design and pattern analysis
**Instructions**:
```
ULTRATHINK: Analyze the architectural patterns and design decisions for {feature-name}.

Focus on:
- DDD layer separation and boundaries
- Design patterns used (Repository, Factory, etc.)
- CQRS implementation if present
- Event-driven architecture elements
- Dependency injection patterns
- Error handling strategies

Provide:
- Architecture overview
- Design pattern usage
- Integration patterns
- Scalability considerations
- Architectural trade-offs
```

### 3. User Experience Agent
**Role**: User-facing functionality analysis
**Instructions**:
```
ULTRATHINK: Analyze {feature-name} from an end-user perspective.

Examine:
- Presentation layer components
- User interactions and workflows
- API endpoints and actions
- Form handling and validation
- State management patterns
- UI/UX patterns

Provide:
- User journey descriptions
- Feature capabilities from user POV
- Interaction patterns
- User workflow examples
- Common use cases
```

### 4. Diagram Agent
**Role**: Visual representation creation
**Instructions**:
```
ULTRATHINK: Create visual documentation for {feature-name} using Mermaid diagrams.

Generate:
- System architecture diagram
- Data flow diagrams  
- User journey flowcharts
- Entity relationship diagrams
- Process flow diagrams
- Integration diagrams

Use Mermaid syntax for all diagrams.
```

### 5. Technical Writer Agent
**Role**: Content organization and documentation compilation
**Instructions**:
```
ULTRATHINK: Compile all agent outputs into a cohesive, non-technical documentation.

Structure:
1. Executive Summary
2. Feature Overview
3. Core Capabilities  
4. User Workflows
5. Example Use Cases
6. Technical Architecture (simplified)
7. Integration Points
8. Visual Diagrams
9. Troubleshooting Guide
10. FAQ Section

Write for non-technical stakeholders while maintaining accuracy.
```

## Output Structure

The generated documentation will be saved as `/docs/features/{feature-name}-complete-guide.md` with the following structure:

```markdown
# {Feature Name} - Complete Feature Guide

## Executive Summary
[High-level overview for executives and stakeholders]

## Feature Overview
[What the feature does and why it exists]

## Core Capabilities
[List of key capabilities with descriptions]

## User Workflows
[Step-by-step user workflows and journeys]

### Primary User Journey
[Main use case workflow]

### Secondary Workflows  
[Additional use cases]

## Example Use Cases
[Real-world scenarios and examples]

## System Architecture
[Simplified technical overview]

## Integration Points
[How it connects with other systems]

## Visual Documentation
[Mermaid diagrams showing system flows]

## Troubleshooting Guide
[Common issues and solutions]

## Frequently Asked Questions
[FAQ section for users]
```

## Available Features

Based on the codebase analysis, the following features are available for documentation:

- `auth` - Authentication and Authorization System
- `chatbot-widget` - AI-Powered Conversational Interface
- `dam` - Digital Asset Management System  
- `image-generator` - AI Image Generation Platform
- `tts` - Text-to-Speech Synthesis
- `monitoring` - Performance and Network Monitoring
- `notes` - Note Management System
- `organization` - Multi-Tenant Organization Management

## Usage Examples

```bash
# Generate documentation for TTS feature
/feature-docs-generator tts

# Generate documentation for Digital Asset Management
/feature-docs-generator dam

# Generate documentation for AI Chatbot
/feature-docs-generator chatbot-widget
```

## Implementation Process

1. **Feature Validation**: Verify the specified feature exists in the codebase
2. **Agent Orchestration**: Launch all 5 specialized agents in parallel
3. **Parallel Analysis**: Each agent performs deep analysis using ULTRATHINK
4. **Content Synthesis**: Technical Writer Agent compiles all outputs
5. **Document Generation**: Create final markdown document in `/docs/features/`
6. **Quality Validation**: Ensure accuracy and completeness

## Quality Assurance

- Each agent uses ULTRATHINK for thorough analysis
- Cross-validation between technical and user perspectives
- Comprehensive coverage of all feature aspects
- Non-technical language while maintaining accuracy
- Visual aids for complex concepts
- Real-world examples and use cases

This command provides the most comprehensive feature documentation possible by leveraging multiple specialized AI agents, each focused on their area of expertise.

## Execution Logic

When you use this command, I will:

1. **Validate Feature**: Verify the specified feature exists in `lib/{feature-name}/`
2. **Create Output Directory**: Ensure `docs/features/` exists 
3. **Launch Agent Squad**: Execute all 5 agents in parallel using the Task tool
4. **Compile Results**: Synthesize all agent outputs into final documentation
5. **Generate Document**: Create the complete guide at `docs/features/{feature-name}-complete-guide.md`

### Agent Execution Prompts

#### Code Analysis Agent
```
You are the Code Analysis Agent. Use ULTRATHINK to perform comprehensive code analysis.

TASK: Analyze the {feature-name} domain implementation in lib/{feature-name}/

Your analysis should include:
1. **Technical Architecture**: Domain structure, DDD patterns, layer separation
2. **Core Components**: Key entities, services, repositories, use cases
3. **Integration Points**: Dependencies, external providers, cross-domain connections  
4. **Data Patterns**: Database schemas, storage patterns, data flow
5. **Implementation Details**: Design patterns, error handling, performance considerations

Provide a detailed technical summary that a technical writer can use to create user-friendly documentation.
```

#### Architecture Agent  
```
You are the Architecture Agent. Use ULTRATHINK to analyze architectural patterns and design decisions.

TASK: Examine the architectural design of {feature-name} in lib/{feature-name}/

Focus on:
1. **DDD Implementation**: Boundary definitions, layer responsibilities, aggregate design
2. **Design Patterns**: Repository, Factory, Strategy, Observer patterns used
3. **CQRS/Event Sourcing**: Command/query separation, event handling
4. **Dependency Management**: Injection patterns, composition roots
5. **Scalability Design**: Performance considerations, caching, async patterns

Provide architectural insights for creating comprehensive system documentation.
```

#### User Experience Agent
```
You are the User Experience Agent. Use ULTRATHINK to analyze user-facing functionality.

TASK: Examine user interactions and workflows for {feature-name} in lib/{feature-name}/

Analyze:
1. **User Journeys**: Primary and secondary user workflows
2. **UI Components**: Presentation layer, forms, interactions
3. **API Surface**: Actions, endpoints, user-facing operations  
4. **State Management**: User state, form handling, real-time updates
5. **Use Cases**: Common scenarios, edge cases, user goals

Create user-focused insights for non-technical documentation.
```

#### Diagram Agent
```
You are the Diagram Agent. Use ULTRATHINK to create visual representations.

TASK: Generate Mermaid diagrams for {feature-name} architecture and workflows.

Create:
1. **System Architecture Diagram**: Components and their relationships
2. **Data Flow Diagram**: How data moves through the system
3. **User Journey Flowchart**: Step-by-step user workflows
4. **Entity Relationship Diagram**: Data model relationships
5. **Integration Diagram**: External connections and dependencies

Use proper Mermaid syntax for all diagrams.
```

#### Technical Writer Agent
```
You are the Technical Writer Agent. Use ULTRATHINK to compile comprehensive documentation.

TASK: Create non-technical documentation for {feature-name} using all agent inputs.

Structure the final document with:
1. **Executive Summary**: High-level overview for stakeholders
2. **Feature Overview**: What it does and business value
3. **Core Capabilities**: Key features with clear descriptions
4. **User Workflows**: Step-by-step processes with examples
5. **Use Cases**: Real-world scenarios and applications
6. **Technical Overview**: Simplified architecture explanation
7. **Integration Points**: How it connects with other systems
8. **Visual Diagrams**: Include all Mermaid diagrams
9. **Troubleshooting**: Common issues and solutions
10. **FAQ**: Frequently asked questions

Write for non-technical stakeholders while maintaining technical accuracy.
```

## Command Implementation

The actual execution will use multiple Task agents running in parallel to ensure comprehensive analysis and high-quality documentation output.