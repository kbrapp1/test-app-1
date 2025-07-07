# Feature Documentation Menu Command

## Description
Interactive menu for selecting domains and documentation types for comprehensive feature analysis.

## Usage
`/feature-menu`

## Instructions
You are an interactive menu system for the feature documentation generator.

**ALWAYS display the menu interface when this command is run, regardless of any parameters.**

### Step 1: Display Domain Selection Menu
```
📚 Feature Documentation Generator

🎯 Select Domain to Analyze:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🤖 chatbot-widget    → AI chat, lead management, knowledge base
2. 📁 dam               → Digital Asset Management system  
3. 🎨 image-generator   → AI image generation with FLUX
4. 🔊 tts               → Text-to-speech functionality
5. 🔐 auth              → Authentication and authorization
6. 📊 monitoring        → Performance and analytics tracking
7. 📝 forms             → Form validation and handling
8. 🏢 organization      → Multi-tenant organization management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: After User Selects Domain
Based on the selected domain, show relevant documentation options:

```
📁 Selected: {domain-name}

📋 Select Documentation Type:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏗️  design          → Architecture & DDD structure
2. 🔄 pipeline         → Business logic flows & examples  
3. ⭐ features         → Capabilities & API reference
4. 💡 examples         → Use case scenarios & walkthroughs
5. 📚 all              → Generate complete documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Commands:
   • Type: /feature-docs {domain} {section}
   • Example: /feature-docs chatbot-widget design
```

### Step 3: Smart Recommendations
After showing the menu, analyze the selected domain and provide intelligent suggestions:

```
🔍 Domain Analysis for {domain}:

Found in lib/{domain}/:
✅ {count} TypeScript files
✅ {count} API endpoints  
✅ {count} use cases
✅ {count} domain services
✅ {count} tests

🎯 Recommended for this domain:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• pipeline   → {reason based on analysis}
• design     → {reason based on analysis}
• features   → {reason based on analysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Pro tip: Start with 'all' for comprehensive documentation
```

### Step 4: Domain-Specific Context
Provide context about what each documentation type will include for the specific domain:

**For chatbot-widget:**
```
🤖 Chatbot Widget Documentation Preview:

design   → DDD architecture, AI service integration, entity relationships
pipeline → Chat flow, lead scoring, knowledge retrieval, AI response generation  
features → Chat API, admin panels, embedding system, lead capture
examples → Basic chat, lead qualification, knowledge base queries, AI workflows
```

**For dam:**
```
📁 DAM Documentation Preview:

design   → File storage architecture, metadata management, folder hierarchy
pipeline → Upload flow, asset processing, search & filtering, bulk operations
features → Asset API, folder management, tagging system, storage integration  
examples → File upload, asset search, batch operations, folder navigation
```

**For image-generator:**
```
🎨 Image Generator Documentation Preview:

design   → Provider abstraction, generation lifecycle, cost management
pipeline → Image generation flow, provider coordination, status tracking
features → Generation API, provider selection, DAM integration, cost estimation
examples → Basic generation, batch processing, DAM integration, cost optimization
```

### Step 5: Execution Confirmation
```
🚀 Ready to Generate Documentation

Domain: {selected-domain}
Type: {selected-type}

This will create/update:
• docs/{domain}/{type}.md
• Related example files (if applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue? (Y/n): 

[If user confirms, execute: /feature-docs {domain} {type}]
```

### Menu Interaction Flow:

**User Types:** `/feature-menu`

**Claude Shows:** Full domain selection menu

**User Responds:** "2" (for DAM)

**Claude Shows:** DAM-specific documentation options + analysis + recommendations

**User Responds:** "pipeline" or "2"

**Claude Shows:** Confirmation with preview of what will be generated

**User Responds:** "Y" or "yes"

**Claude Executes:** The actual `/feature-docs dam pipeline` command

### Keyboard Shortcuts & Quick Actions:
```
⌨️  Keyboard Shortcuts:
• 1-8: Select domain by number
• d: Go directly to design docs
• p: Go directly to pipeline docs 
• f: Go directly to features docs
• a: Generate all documentation
• q: Quit menu

🔗 Quick Commands:
• /feature-docs {domain}        → Skip menu, full docs
• /feature-docs {domain} {type} → Skip menu, specific docs
• /feature-menu {domain}        → Go directly to type selection
```

### Error Handling in Menu:
```
❌ Invalid Selection

Available options: 1-8
• Type a number (1-8) to select a domain
• Type 'q' to quit
• Type '/feature-docs domain section' for direct access

Try again:
```

### Menu State Management:
- Remember last selected domain across sessions
- Show recently generated documentation
- Highlight domains with existing documentation
- Show last update timestamps

**The menu provides a user-friendly interface while the direct `/feature-docs` command allows power users to skip the menu entirely.**