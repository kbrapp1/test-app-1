(function() {
  'use strict';
  
  // Widget configuration
  let widgetConfig = null;
  let sessionId = null;
  let isWidgetLoaded = false;
  let isWidgetOpen = false;
  let messageHistory = [];
  
  // Get configuration ID from script tag
  const currentScript = document.currentScript || 
    Array.from(document.querySelectorAll('script')).find(s => s.getAttribute('data-config-id'));
  
  if (!currentScript) {
    console.error('Chatbot Widget: No config ID found');
    return;
  }
  
  const configId = currentScript.getAttribute('data-config-id');
  const baseUrl = currentScript.src.replace('/widget/chatbot.js', '');
  
  // Widget HTML template
  const widgetHTML = `
    <div id="chatbot-widget-container" style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- Chat Button -->
      <div id="chatbot-toggle-btn" style="
        width: 60px;
        height: 60px;
        background: #3B82F6;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
      ">
        <svg id="chat-icon" width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <svg id="close-icon" width="24" height="24" fill="white" viewBox="0 0 24 24" style="display: none;">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </div>
      
      <!-- Chat Window -->
      <div id="chatbot-window" style="
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- Header -->
        <div id="chatbot-header" style="
          background: #3B82F6;
          color: white;
          padding: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: #10B981;
            border-radius: 50%;
          "></div>
          <span id="bot-name">Assistant</span>
        </div>
        
        <!-- Messages -->
        <div id="chatbot-messages" style="
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #F9FAFB;
        ">
          <div id="welcome-message" style="
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            Hello! How can I help you today?
          </div>
        </div>
        
        <!-- Input -->
        <div id="chatbot-input-container" style="
          padding: 16px;
          background: white;
          border-top: 1px solid #E5E7EB;
        ">
          <div style="display: flex; gap: 8px;">
            <input 
              id="chatbot-input" 
              type="text" 
              placeholder="Type your message..."
              style="
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #D1D5DB;
                border-radius: 6px;
                outline: none;
                font-size: 14px;
              "
            />
            <button id="chatbot-send-btn" style="
              background: #3B82F6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">Send</button>
          </div>
          <div id="typing-indicator" style="
            margin-top: 8px;
            font-size: 12px;
            color: #6B7280;
            display: none;
          ">Assistant is typing...</div>
        </div>
      </div>
    </div>
  `;
  
  // Load widget configuration
  async function loadConfig() {
    try {
      const response = await fetch(`${baseUrl}/api/chatbot-widget/config/${configId}`);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      widgetConfig = await response.json();
      return widgetConfig;
    } catch (error) {
      console.error('Chatbot Widget: Failed to load configuration', error);
      return null;
    }
  }
  
  // Initialize session
  async function initSession() {
    try {
      const response = await fetch(`${baseUrl}/api/chatbot-widget/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: configId,
          visitorId: getVisitorId(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          currentUrl: window.location.href
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize session: ${response.status}`);
      }
      
      const session = await response.json();
      sessionId = session.id;
      return session;
    } catch (error) {
      console.error('Chatbot Widget: Failed to initialize session', error);
      return null;
    }
  }
  
  // Get or create visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('chatbot_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbot_visitor_id', visitorId);
    }
    return visitorId;
  }
  
  // Send message to API
  async function sendMessage(message) {
    try {
      const response = await fetch(`${baseUrl}/api/chatbot-widget/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          configId: configId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Chatbot Widget: Failed to send message', error);
      return {
        response: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        error: true
      };
    }
  }
  
  // Add message to chat
  function addMessage(message, isUser = false, isError = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.style.cssText = `
      background: ${isUser ? '#3B82F6' : 'white'};
      color: ${isUser ? 'white' : '#1F2937'};
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      max-width: 80%;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      margin-left: ${isUser ? 'auto' : '0'};
      margin-right: ${isUser ? '0' : 'auto'};
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ${isError ? 'border-left: 3px solid #EF4444;' : ''}
    `;
    
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in history
    messageHistory.push({ message, isUser, timestamp: Date.now() });
  }
  
  // Show typing indicator
  function showTyping() {
    document.getElementById('typing-indicator').style.display = 'block';
  }
  
  // Hide typing indicator
  function hideTyping() {
    document.getElementById('typing-indicator').style.display = 'none';
  }
  
  // Handle message send
  async function handleSendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    input.value = '';
    
    // Show typing indicator
    showTyping();
    
    // Send to API
    const response = await sendMessage(message);
    
    // Hide typing indicator
    hideTyping();
    
    // Add response
    addMessage(response.response, false, response.error);
    
    // Handle lead capture if present
    if (response.leadCaptured) {
      console.log('Lead captured:', response.leadData);
    }
  }
  
  // Toggle widget
  function toggleWidget() {
    const window = document.getElementById('chatbot-window');
    const chatIcon = document.getElementById('chat-icon');
    const closeIcon = document.getElementById('close-icon');
    
    isWidgetOpen = !isWidgetOpen;
    
    if (isWidgetOpen) {
      window.style.display = 'flex';
      chatIcon.style.display = 'none';
      closeIcon.style.display = 'block';
    } else {
      window.style.display = 'none';
      chatIcon.style.display = 'block';
      closeIcon.style.display = 'none';
    }
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Toggle button
    document.getElementById('chatbot-toggle-btn').addEventListener('click', toggleWidget);
    
    // Send button
    document.getElementById('chatbot-send-btn').addEventListener('click', handleSendMessage);
    
    // Enter key
    document.getElementById('chatbot-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
    
    // Input focus styling
    const input = document.getElementById('chatbot-input');
    input.addEventListener('focus', function() {
      this.style.borderColor = '#3B82F6';
    });
    input.addEventListener('blur', function() {
      this.style.borderColor = '#D1D5DB';
    });
  }
  
  // Apply configuration to widget
  function applyConfig(config) {
    if (!config) return;
    
    // Update bot name
    const botNameElement = document.getElementById('bot-name');
    if (botNameElement && config.name) {
      botNameElement.textContent = config.name;
    }
    
    // Update welcome message
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement && config.personalitySettings?.conversationFlow?.greetingMessage) {
      welcomeElement.textContent = config.personalitySettings.conversationFlow.greetingMessage;
    }
    
    // Update placeholder
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.placeholder = 'Type your message...';
    }
  }
  
  // Check if widget should be shown (operating hours, etc.)
  function shouldShowWidget(config) {
    if (!config || !config.isActive) {
      return false;
    }
    
    // Check operating hours if configured
    if (config.operatingHours?.businessHours?.length > 0) {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 60 + now.getMinutes();
      
      const todayHours = config.operatingHours.businessHours.find(h => h.dayOfWeek === day);
      if (todayHours && todayHours.isOpen) {
        const [startHour, startMin] = todayHours.startTime.split(':').map(Number);
        const [endHour, endMin] = todayHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (time < startTime || time > endTime) {
          return false;
        }
      } else if (todayHours && !todayHours.isOpen) {
        return false;
      }
    }
    
    return true;
  }
  
  // Initialize widget
  async function initWidget() {
    if (isWidgetLoaded) return;
    
    // Load configuration
    const config = await loadConfig();
    if (!config) {
      console.error('Chatbot Widget: Failed to load configuration');
      return;
    }
    
    // Check if widget should be shown
    if (!shouldShowWidget(config)) {
      console.log('Chatbot Widget: Not showing due to configuration or operating hours');
      return;
    }
    
    // Initialize session
    const session = await initSession();
    if (!session) {
      console.error('Chatbot Widget: Failed to initialize session');
      return;
    }
    
    // Create widget HTML
    const container = document.getElementById(`chatbot-widget-${configId}`);
    if (container) {
      container.innerHTML = widgetHTML;
    } else {
      // Fallback: append to body
      const div = document.createElement('div');
      div.innerHTML = widgetHTML;
      document.body.appendChild(div.firstElementChild);
    }
    
    // Apply configuration
    applyConfig(config);
    
    // Setup event listeners
    setupEventListeners();
    
    isWidgetLoaded = true;
    console.log('Chatbot Widget: Initialized successfully');
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})(); 