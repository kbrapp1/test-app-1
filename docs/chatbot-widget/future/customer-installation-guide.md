# Chat Widget Installation Guide

## Overview

This guide explains how to install your AI-powered chat widget on any website. The widget provides a floating chat bubble that helps convert your website visitors into qualified leads through intelligent conversations.

## Quick Start (5 Minutes)

### Step 1: Get Your Embed Code
1. Log into your dashboard
2. Navigate to **Settings** → **Chatbots** → **[Your Bot Name]**
3. Click **"Get Embed Code"**
4. Customize appearance (optional)
5. Copy the generated code

### Step 2: Install on Your Website
Paste the embed code anywhere in your website's HTML, preferably before the closing `</body>` tag.

```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatBotWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','cb','https://cdn.yourapp.com/widget.js'));
  cb('init', { 
    botId: 'your-bot-id-here', 
    orgId: 'your-org-id-here'
  });
</script>
```

### Step 3: Verify Installation
- Save and refresh your website
- The chat bubble should appear in the bottom-right corner
- Click it to test the chat functionality
- Check your dashboard for installation confirmation

## Platform-Specific Installation

### WordPress

#### Method 1: Theme Editor (Recommended)
1. Go to **Appearance** → **Theme Editor**
2. Select **footer.php**
3. Paste the embed code before `</body>`
4. Click **Update File**

#### Method 2: Widget Area
1. Go to **Appearance** → **Widgets**
2. Add a **Custom HTML** widget to your footer
3. Paste the embed code
4. Save

#### Method 3: Plugin (Coming Soon)
We're developing a WordPress plugin for even easier installation.

### Shopify

#### Theme Integration
1. Go to **Online Store** → **Themes**
2. Click **Actions** → **Edit Code**
3. Open **Layout** → **theme.liquid**
4. Paste embed code before `</body>`
5. Click **Save**

#### Alternative: Using Scripts
1. Go to **Settings** → **Checkout**
2. Scroll to **Additional Scripts**
3. Paste embed code in **Order Status Page**

### Squarespace

#### Code Injection
1. Go to **Settings** → **Advanced** → **Code Injection**
2. Paste embed code in **Footer** section
3. Click **Save**

#### Page-Specific Installation
1. Edit any page
2. Add **Code Block**
3. Paste embed code
4. Save and publish

### Webflow

#### Site-Wide Installation
1. Go to **Project Settings** → **Custom Code**
2. Paste embed code in **Footer Code**
3. Publish your site

#### Page-Specific Installation
1. Open page settings
2. Go to **Custom Code** → **Before </body> tag**
3. Paste embed code
4. Publish

### Wix

#### HTML Element
1. Add **HTML Code** element to your page
2. Paste embed code
3. Apply to all pages if needed
4. Publish site

### Custom/Static HTML Sites

#### All Pages
Add to your main template file before `</body>`:
```html
<!-- Your existing HTML -->
<script>
  <!-- Chat widget embed code -->
</script>
</body>
</html>
```

#### Single Page
Add to specific HTML files where you want the widget to appear.

## Customization Options

### Basic Customization
```html
<script>
  cb('init', {
    botId: 'your-bot-id',
    orgId: 'your-org-id',
    
    // Positioning
    position: 'bottom-right',  // bottom-left, top-right, top-left
    
    // Styling
    theme: {
      primaryColor: '#007bff',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      borderRadius: '8px'
    },
    
    // Behavior
    behavior: {
      autoOpen: false,        // Auto-open chat window
      greetingDelay: 3000,    // Delay before showing greeting (ms)
      showOnMobile: true,     // Show on mobile devices
      minimizeOnClose: true   // Minimize instead of hiding
    }
  });
</script>
```

### Advanced Configuration
```html
<script>
  cb('init', {
    botId: 'your-bot-id',
    orgId: 'your-org-id',
    
    // Custom sizing
    size: {
      bubbleSize: 60,      // Chat bubble diameter (px)
      windowWidth: 380,    // Chat window width (px)
      windowHeight: 500    // Chat window height (px)
    },
    
    // Operating hours
    schedule: {
      timezone: 'America/New_York',
      hours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        // ... other days
      },
      offlineMessage: 'We\'re currently offline. Leave a message!'
    },
    
    // Analytics
    tracking: {
      googleAnalytics: true,
      customEvents: true,
      pixelTracking: ['facebook', 'linkedin']
    }
  });
</script>
```

## JavaScript API Reference

### Control Methods
```javascript
// Open/close chat window
cb('open');
cb('close');
cb('toggle');

// Show/hide chat bubble
cb('show');
cb('hide');

// Send programmatic messages
cb('sendMessage', 'Hello from the website!');

// Update user information
cb('setUser', {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  customerId: 'cust_12345'
});

// Set conversation context
cb('setContext', {
  pageUrl: window.location.href,
  pageTitle: document.title,
  referrer: document.referrer,
  userSegment: 'premium',
  product: 'Enterprise Plan'
});

// Track custom events
cb('track', 'button_clicked', {
  buttonName: 'Get Quote',
  pageSection: 'pricing'
});
```

### Event Listeners
```javascript
// Chat lifecycle events
cb('on', 'loaded', function() {
  console.log('Widget loaded successfully');
});

cb('on', 'opened', function() {
  // Chat window opened
  gtag('event', 'chat_opened');
});

cb('on', 'closed', function() {
  // Chat window closed
});

// Message events
cb('on', 'messageReceived', function(message) {
  console.log('Bot replied:', message.content);
});

cb('on', 'messageSent', function(message) {
  console.log('User sent:', message.content);
});

// Lead generation events
cb('on', 'leadCaptured', function(lead) {
  console.log('New lead:', lead);
  
  // Send to your CRM
  yourCRM.createLead(lead);
  
  // Track conversion
  gtag('event', 'conversion', {
    event_category: 'lead_generation',
    value: lead.score
  });
});

// Error handling
cb('on', 'error', function(error) {
  console.error('Widget error:', error);
});
```

## Advanced Use Cases

### E-commerce Integration
```html
<!-- Product page integration -->
<script>
  cb('init', { botId: 'sales-bot', orgId: 'your-org' });
  
  // Set product context
  cb('setContext', {
    productName: '{{ product.title }}',
    productPrice: '{{ product.price }}',
    productCategory: '{{ product.category }}',
    inStock: {{ product.available }},
    productId: '{{ product.id }}'
  });
  
  // Track product interest
  cb('on', 'chatStarted', function() {
    cb('track', 'product_interest', {
      productId: '{{ product.id }}',
      price: '{{ product.price }}'
    });
  });
</script>
```

### SaaS Lead Qualification
```html
<!-- Pricing page with smart targeting -->
<script>
  cb('init', { 
    botId: 'demo-bot',
    behavior: { 
      autoOpen: false,
      greetingDelay: 30000  // Wait 30 seconds
    }
  });
  
  // Trigger on specific actions
  document.querySelector('.pricing-card').addEventListener('click', function() {
    cb('open');
    cb('sendMessage', 'I see you\'re interested in our pricing. How can I help?');
  });
  
  // Lead scoring
  cb('on', 'leadCaptured', function(lead) {
    if (lead.score > 80) {
      // High-value lead - immediate notification
      fetch('/api/high-priority-lead', {
        method: 'POST',
        body: JSON.stringify(lead)
      });
    }
  });
</script>
```

### Multi-Bot Setup
```html
<!-- Different bots for different pages -->
<script>
  var botConfig = {
    '/pricing': { botId: 'sales-bot', autoOpen: true },
    '/support': { botId: 'support-bot', position: 'bottom-left' },
    '/blog': { botId: 'content-bot', greetingDelay: 60000 }
  };
  
  var currentPage = window.location.pathname;
  var config = botConfig[currentPage] || { botId: 'default-bot' };
  
  cb('init', Object.assign({
    orgId: 'your-org-id'
  }, config));
</script>
```

## Testing Your Installation

### Pre-Launch Checklist
- [ ] Widget appears on all intended pages
- [ ] Chat bubble is positioned correctly
- [ ] Colors match your brand
- [ ] Mobile responsiveness works
- [ ] Conversations flow properly
- [ ] Lead capture forms work
- [ ] Analytics tracking is active

### Testing Commands
```javascript
// Test in browser console
cb('open');                    // Should open chat window
cb('sendMessage', 'Test');     // Should send test message
cb('setUser', { name: 'Test User' }); // Should update user info
```

### Common Issues

#### Widget Not Appearing
1. Check browser console for JavaScript errors
2. Verify botId and orgId are correct
3. Ensure domain is whitelisted in dashboard
4. Check if ad blockers are interfering

#### Styling Conflicts
1. The widget runs in an isolated iframe
2. Host site styles cannot affect the widget
3. Use theme customization options instead

#### Performance Issues
1. Widget loads asynchronously (non-blocking)
2. Initial load is <50KB
3. Check network tab for load times

## Security & Privacy

### Data Protection
- All conversations are encrypted in transit
- Widget respects GDPR/CCPA compliance
- No personal data stored in browser beyond session
- User can request data deletion anytime

### Content Security Policy (CSP)
If your site uses CSP, add these directives:
```
script-src 'self' 'unsafe-inline' https://cdn.yourapp.com;
frame-src https://widget.yourapp.com;
connect-src https://api.yourapp.com;
```

### Domain Whitelisting
- Configure allowed domains in your dashboard
- Widget automatically validates origin
- Prevents unauthorized usage
- Real-time monitoring and alerts

## Analytics Integration

### Google Analytics 4
```javascript
cb('on', 'leadCaptured', function(lead) {
  gtag('event', 'generate_lead', {
    currency: 'USD',
    value: lead.estimatedValue || 0,
    lead_source: 'chatbot',
    lead_quality: lead.score
  });
});
```

### Facebook Pixel
```javascript
cb('on', 'leadCaptured', function(lead) {
  fbq('track', 'Lead', {
    content_name: 'Chatbot Lead',
    content_category: 'Lead Generation',
    value: lead.estimatedValue || 0,
    currency: 'USD'
  });
});
```

### Custom Analytics
```javascript
cb('on', 'chatStarted', function() {
  // Your custom tracking
  analytics.track('Chat Started', {
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  });
});
```

## Support & Troubleshooting

### Getting Help
- 📧 Email: support@yourapp.com
- 💬 Live Chat: Available in your dashboard
- 📚 Documentation: docs.yourapp.com
- 🎥 Video Tutorials: tutorials.yourapp.com

### Common Solutions

**Widget not loading?**
- Check your embed code is correctly pasted
- Verify your bot is active in the dashboard
- Ensure your domain is approved

**Styling issues?**
- Use the theme customization options
- The widget is isolated and won't conflict with your site
- Contact support for custom branding needs

**Performance concerns?**
- Widget loads asynchronously and won't slow your site
- Initial payload is optimized to <50KB
- CDN ensures fast global delivery

---

**Need Help?** Our support team is available 24/7 to assist with your installation. Contact us through your dashboard or email support@yourapp.com. 