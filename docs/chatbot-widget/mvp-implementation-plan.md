# Chatbot MVP Implementation Plan
## WordPress Embedded Widget

### Overview
Build a working chatbot widget for deployment on your WordPress company site. This MVP focuses on cross-domain embedded widget functionality with real lead generation.

## Phase 1: Core Infrastructure (Week 1-2)

### Database Schema
```sql
-- Chatbot configurations (org-scoped)
CREATE TABLE chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  knowledge_base JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Chat sessions (anonymous visitors)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbot_configs(id),
  visitor_fingerprint TEXT,
  session_data JSONB DEFAULT '{}',
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  host_domain TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages in conversations
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  token_count INTEGER
);

-- Leads captured from conversations
CREATE TABLE chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contact_info JSONB NOT NULL,
  qualification_data JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- Org-scoped access for authenticated users
CREATE POLICY "chatbot_configs_org_access" ON chatbot_configs
  FOR ALL USING (organization_id = get_active_organization_id());

-- Public read access for active chatbots (for widget)
CREATE POLICY "chatbot_configs_public_read" ON chatbot_configs
  FOR SELECT USING (is_active = true);

-- Session and message policies (public for anonymous chat)
CREATE POLICY "chat_sessions_public" ON chat_sessions FOR ALL USING (true);
CREATE POLICY "chat_messages_public" ON chat_messages FOR ALL USING (true);

-- Lead policies (org-scoped for admin, public insert for lead capture)
CREATE POLICY "chat_leads_org_access" ON chat_leads
  FOR SELECT USING (organization_id = get_active_organization_id());
CREATE POLICY "chat_leads_public_insert" ON chat_leads
  FOR INSERT WITH CHECK (true);
```

### API Endpoints
```
Core Widget APIs:
├── GET /api/widget/config/[botId]           # Get bot configuration
├── POST /api/widget/session                 # Create chat session  
├── POST /api/widget/session/[id]/message    # Send message
├── POST /api/widget/leads                   # Capture lead
└── GET /widget.js                           # Serve widget script

Admin APIs:
├── GET /api/chatbot/configs                 # List org chatbots
├── POST /api/chatbot/configs                # Create chatbot
├── PUT /api/chatbot/configs/[id]            # Update chatbot
├── GET /api/chatbot/leads                   # List leads
└── GET /api/chatbot/analytics               # Basic analytics
```

## Phase 2: Widget Development (Week 2-3)

### Embedded Widget Architecture
```javascript
// public/widget.js - The embeddable script
(function() {
  'use strict';
  
  const WIDGET_API_BASE = 'https://yourapp.vercel.app/api/widget';
  const CHAT_UI_BASE = 'https://yourapp.vercel.app/widget-ui';
  
  class ChatWidget {
    constructor(config) {
      this.config = config;
      this.sessionId = null;
      this.isOpen = false;
      this.init();
    }
    
    init() {
      this.createBubble();
      this.loadConfig();
    }
    
    createBubble() {
      const bubble = document.createElement('div');
      bubble.innerHTML = `
        <div id="chatbot-bubble" style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: ${this.config.theme?.primaryColor || '#0070f3'};
          border-radius: 50%;
          cursor: pointer;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            fill: white;
          ">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
      `;
      
      document.body.appendChild(bubble);
      
      bubble.addEventListener('click', () => this.toggle());
    }
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
    
    open() {
      if (!this.iframe) {
        this.createChatWindow();
      }
      this.iframe.style.display = 'block';
      this.isOpen = true;
    }
    
    close() {
      if (this.iframe) {
        this.iframe.style.display = 'none';
      }
      this.isOpen = false;
    }
    
    createChatWindow() {
      this.iframe = document.createElement('iframe');
      this.iframe.src = `${CHAT_UI_BASE}?botId=${this.config.botId}&host=${encodeURIComponent(window.location.origin)}`;
      this.iframe.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        height: 500px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 999999;
        background: white;
      `;
      
      document.body.appendChild(this.iframe);
      
      // Listen for messages from iframe
      window.addEventListener('message', (event) => {
        if (event.origin !== 'https://yourapp.vercel.app') return;
        
        if (event.data.type === 'CHAT_CLOSE') {
          this.close();
        } else if (event.data.type === 'LEAD_CAPTURED') {
          this.onLeadCaptured(event.data.lead);
        }
      });
    }
    
    onLeadCaptured(lead) {
      // Trigger custom events for WordPress integration
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          lead_source: 'chatbot',
          value: lead.score || 0
        });
      }
      
      // Custom event for WordPress
      window.dispatchEvent(new CustomEvent('chatbotLeadCaptured', {
        detail: lead
      }));
    }
  }
  
  // Global API
  window.ChatBotWidget = ChatWidget;
  window.cb = function(action, ...args) {
    if (action === 'init') {
      window.chatWidget = new ChatWidget(args[0]);
    } else if (window.chatWidget) {
      window.chatWidget[action](...args);
    }
  };
})();
```

### Chat UI (Iframe Content)
```
app/widget-ui/page.tsx - The actual chat interface
├── Chat message list
├── Input field with send button  
├── Lead capture form (triggered by AI)
├── Typing indicators
└── Close button
```

## Phase 3: AI Integration (Week 3-4)

### OpenAI Integration
```typescript
// app/api/widget/session/[id]/message/route.ts
export async function POST(request: Request) {
  const { content, sessionId } = await request.json();
  
  // Save user message
  await saveMessage(sessionId, 'user', content);
  
  // Get session context and bot config
  const session = await getSession(sessionId);
  const bot = await getChatbotConfig(session.chatbot_id);
  
  // Build dynamic prompt
  const systemPrompt = buildSystemPrompt(bot.knowledge_base, session.session_data);
  
  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content }
    ],
    functions: [
      {
        name: 'capture_lead',
        description: 'Capture lead information when visitor shows interest',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            company: { type: 'string' },
            interests: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    ]
  });
  
  // Handle function calls (lead capture)
  if (response.choices[0].message.function_call) {
    await handleLeadCapture(sessionId, response.choices[0].message.function_call);
  }
  
  // Save and return AI response
  await saveMessage(sessionId, 'assistant', response.choices[0].message.content);
  return Response.json({ content: response.choices[0].message.content });
}
```

## Phase 4: Admin Interface (Week 4-5)

### Basic Chatbot Management
```
app/(protected)/settings/chatbots/page.tsx
├── Create new chatbot form
├── List existing chatbots  
├── Edit chatbot configuration
├── Knowledge base management
├── Lead dashboard
└── Basic analytics
```

### Knowledge Base Editor
```typescript
// Simple knowledge base management
interface KnowledgeBase {
  company_info: string;
  services: string[];
  pricing: string;
  faqs: Array<{ question: string; answer: string }>;
  contact_info: string;
}
```

## Phase 5: WordPress Integration (Week 5-6)

### Installation Script for Your WordPress Site
```html
<!-- Add to your WordPress footer.php -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatBotWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','cb','https://yourapp.vercel.app/widget.js'));
  
  cb('init', {
    botId: 'your-company-bot',
    orgId: 'your-platform-org-id',
    theme: {
      primaryColor: '#your-brand-color'
    },
    behavior: {
      autoOpen: false,
      greetingDelay: 5000
    }
  });
  
  // WordPress integration
  window.addEventListener('chatbotLeadCaptured', function(event) {
    console.log('New lead captured:', event.detail);
    // Could integrate with existing WordPress contact forms
  });
</script>
```

## Success Metrics

### Technical KPIs
- Widget loads in <2 seconds
- Cross-domain communication working
- Chat responses in <3 seconds
- 99%+ uptime during business hours

### Business KPIs  
- 5%+ visitor-to-chat conversion rate
- 20%+ chat-to-lead conversion rate
- Qualified leads per week
- Cost per lead vs other channels

## MVP Deliverables

### Week 6 Target:
✅ Working chatbot on your WordPress company site
✅ Admin interface to manage bot configuration
✅ Lead capture and basic CRM functionality
✅ OpenAI integration for intelligent responses
✅ Cross-domain widget architecture proven
✅ Foundation for customer rollout

This MVP gives you:
1. **Real business value** (leads for your company)
2. **Technical validation** (cross-domain widget works)
3. **Customer evidence** (working product to show prospects)
4. **Scaling foundation** (architecture for multiple customers)

Ready to start with Phase 1 database schema? 