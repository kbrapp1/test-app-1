# Test info

- Name: FAQ Management - Critical User Workflows >> should handle edge cases - empty form save
- Location: D:\Projects\test-app-1\tests\e2e\chatbot-widget\faq-management.spec.ts:180:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('h1')
Expected string: "Knowledge Base"
Received string: "Chatbot Widget"
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('h1')
    7 × locator resolved to <h1 class="text-lg font-semibold text-gray-900">Chatbot Widget</h1>
      - unexpected value "Chatbot Widget"

    at D:\Projects\test-app-1\tests\e2e\chatbot-widget\faq-management.spec.ts:17:38
```

# Page snapshot

```yaml
- link "Ironmark Logo":
  - /url: /dashboard
  - img "Ironmark Logo"
- list:
  - listitem:
    - button "Quick Create"
    - button "Inbox"
- list:
  - listitem:
    - link "Dashboard":
      - /url: /dashboard
      - button "Dashboard"
  - heading "Digital Asset Management" [level=3]:
    - button "Digital Asset Management"
  - heading "Collaboration" [level=3]:
    - button "Collaboration"
  - heading "Playbooks" [level=3]:
    - button "Playbooks"
  - heading "Marketing Automation" [level=3]:
    - button "Marketing Automation"
  - heading "Analytics" [level=3]:
    - button "Analytics"
  - heading "Ignition" [level=3]:
    - button "Ignition"
  - heading "Integrations & API" [level=3]:
    - button "Integrations & API"
  - heading "AI Playground" [level=3]:
    - button "AI Playground"
- list:
  - listitem:
    - link "Settings":
      - /url: /settings
      - button "Settings"
  - listitem:
    - link "Get Help":
      - /url: "#"
      - button "Get Help"
- list:
  - listitem:
    - button "TE test test@vistaonemarketing.com"
- main:
  - button "Toggle Sidebar"
  - heading "Chatbot Widget" [level=1]
  - button "Open command palette"
  - button "Toggle theme"
  - main:
    - complementary:
      - navigation:
        - link "Configuration":
          - /url: /ai-playground/chatbot-widget/config
        - link "Knowledge Base":
          - /url: /ai-playground/chatbot-widget/knowledge
        - link "Website Sources":
          - /url: /ai-playground/chatbot-widget/website-sources
        - link "Lead Settings":
          - /url: /ai-playground/chatbot-widget/leads
        - link "Parameters":
          - /url: /ai-playground/chatbot-widget/parameters
        - link "Testing":
          - /url: /ai-playground/chatbot-widget/testing
        - link "Analytics":
          - /url: /ai-playground/chatbot-widget/analytics
    - heading "Knowledge Base" [level=2]
    - paragraph: Manage your chatbot's knowledge base including company information, FAQs, and support documentation.
    - heading "Company Information" [level=3]
    - text: Basic information about your company that the chatbot can reference. Configured
    - button "Edit"
    - text: Company Information
    - textbox "Company Information" [disabled]: For nearly 71 years, Ironmark has been helping businesses navigate the evolving marketing landscape. We specialize in bridging the gap between digital and physical marketing, offering integrated solutions that streamline your campaigns and drive measurable results—all under one roof. From strategy and creative to execution and reporting, our data-driven approach ensures your marketing efforts are both strategic and impactful.
    - text: Product/Service Catalog
    - textbox "Product/Service Catalog" [disabled]: "# Integrated Marketing Solutions ## Data-Driven Marketing Transform your data into actionable insights with hyper-personalized campaigns and closed-loop attribution to maximize ROI. ## Multi-Location Marketing Ensure consistent messaging and localized targeting across all your business locations, streamlining your marketing efforts. ## Privacy-Compliant Communications Navigate data security complexities confidently with SOC-2 audited services, ensuring secure and compliant marketing campaigns. ## Brand Management Platform (Ignition) Centralize brand assets, streamline approvals, and empower your teams with our custom platform, ensuring brand consistency. ## Marketing & Event Logistics From concept to execution, manage all aspects of your events, including inventory and delivery, for seamless experiences. ## Core Capabilities ### Digital Services #### Digital Advertising Reach your target audience effectively through strategic online advertising campaigns. #### Lead Intelligence Identify and nurture potential leads with data-driven strategies to boost conversions. #### Content Marketing Engage your audience with compelling content tailored to your brand's voice and goals. ### Physical Services #### Commercial Print Deliver high-quality printed materials, from brochures to business cards, with precision and care. #### Large Format Print Create impactful signage and displays for events, retail spaces, and more. #### Direct Mail Reach your audience directly with personalized mail campaigns that drive engagement. #### Branded Merchandise Offer a wide range of promotional products to showcase your brand with style and relevance. ### Strategic Services #### Predictive Analytics & Data Modeling Leverage data to forecast trends and make informed marketing decisions. #### Marketing Strategy Develop comprehensive marketing plans tailored to your business objectives. #### Creative & Brand Craft compelling brand narratives and visuals that resonate with your target audience. ### Execution Services #### Warehouse & Shipping Manage inventory, fulfillment, and distribution efficiently with our warehousing solutions. #### Web & Technical Development Build and maintain robust digital platforms to support your online presence. #### Advanced Mail Services Execute complex mailing campaigns with precision and compliance."
    - text: Support Documentation
    - textbox "Support Documentation" [disabled]
    - text: Compliance Guidelines
    - textbox "Compliance Guidelines" [disabled]
    - heading "Frequently Asked Questions" [level=3]
    - text: Add common questions and answers for your chatbot to reference. How much are your services? Pricing is based on the type of service you need. general Where are you located? We are located at 9040 Junction Dr, Annapolis Junction, MD 20701 general Do you take insurance? Yes general
    - heading "Supercharge Your Chatbot" [level=3]
    - text: Import content from your websites automatically. Our AI will crawl, categorize, and extract relevant information to make your chatbot more knowledgeable and helpful. 1
    - heading "Add Your Website" [level=4]
    - paragraph: Enter your website URL and configure crawling settings
    - text: "2"
    - heading "AI Processing" [level=4]
    - paragraph: Our AI crawls, categorizes, and extracts relevant content
    - text: "3"
    - heading "Ready to Use" [level=4]
    - paragraph: Content is immediately available for chatbot responses
    - button "Add Your First Website"
- region "Notifications alt+T"
- region "Notifications (F8)":
  - list
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * FAQ Management E2E Tests
   5 |  * 
   6 |  * These tests verify the critical FAQ management workflow that was previously failing.
   7 |  * The main issue was that users could fill out FAQ forms and click "Save Changes" 
   8 |  * but the FAQ would disappear after page refresh (silent data loss).
   9 |  */
   10 |
   11 | test.describe('FAQ Management - Critical User Workflows', () => {
   12 |   test.beforeEach(async ({ page }) => {
   13 |     // Navigate to chatbot widget knowledge base
   14 |     await page.goto('/ai-playground/chatbot-widget/knowledge');
   15 |     
   16 |     // Wait for page to load
>  17 |     await expect(page.locator('h1')).toContainText('Knowledge Base');
      |                                      ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
   18 |   });
   19 |
   20 |   test('should persist FAQ when user fills form and saves without clicking Add FAQ button', async ({ page }) => {
   21 |     // This test covers the exact workflow that was previously failing
   22 |     
   23 |     // Enter edit mode
   24 |     await page.click('text=Edit');
   25 |     await expect(page.locator('text=Save Changes')).toBeVisible();
   26 |     
   27 |     // Fill FAQ form (without clicking "Add FAQ" button)
   28 |     const questionInput = page.locator('[data-testid="faq-question-input"]').or(
   29 |       page.locator('input[placeholder*="question"]')
   30 |     );
   31 |     const answerInput = page.locator('[data-testid="faq-answer-input"]').or(
   32 |       page.locator('textarea[placeholder*="answer"]')
   33 |     );
   34 |     
   35 |     await questionInput.fill('What are your business hours?');
   36 |     await answerInput.fill('We are open Monday-Friday 9am-5pm EST');
   37 |     
   38 |     // Save directly (this was the problematic workflow)
   39 |     await page.click('text=Save Changes');
   40 |     
   41 |     // Wait for save to complete and edit mode to exit
   42 |     await expect(page.locator('text=Edit')).toBeVisible();
   43 |     await expect(page.locator('text=Save Changes')).not.toBeVisible();
   44 |     
   45 |     // Verify FAQ appears in the UI immediately
   46 |     await expect(page.locator('text=What are your business hours?')).toBeVisible();
   47 |     await expect(page.locator('text=We are open Monday-Friday 9am-5pm EST')).toBeVisible();
   48 |     
   49 |     // Critical test: Refresh page to verify persistence (this was failing before)
   50 |     await page.reload();
   51 |     
   52 |     // Wait for page to load after refresh
   53 |     await expect(page.locator('h1')).toContainText('Knowledge Base');
   54 |     
   55 |     // Verify FAQ is still there after refresh (this would fail before the fix)
   56 |     await expect(page.locator('text=What are your business hours?')).toBeVisible();
   57 |     await expect(page.locator('text=We are open Monday-Friday 9am-5pm EST')).toBeVisible();
   58 |   });
   59 |
   60 |   test('should handle multiple FAQs added through form workflow', async ({ page }) => {
   61 |     // Test adding multiple FAQs using the problematic workflow
   62 |     
   63 |     await page.click('text=Edit');
   64 |     
   65 |     // Add first FAQ
   66 |     const questionInput = page.locator('[data-testid="faq-question-input"]').or(
   67 |       page.locator('input[placeholder*="question"]')
   68 |     );
   69 |     const answerInput = page.locator('[data-testid="faq-answer-input"]').or(
   70 |       page.locator('textarea[placeholder*="answer"]')
   71 |     );
   72 |     
   73 |     await questionInput.fill('Where are you located?');
   74 |     await answerInput.fill('We are located at 123 Main Street');
   75 |     
   76 |     // Save first FAQ
   77 |     await page.click('text=Save Changes');
   78 |     await expect(page.locator('text=Edit')).toBeVisible();
   79 |     
   80 |     // Add second FAQ using same workflow
   81 |     await page.click('text=Edit');
   82 |     await questionInput.fill('Do you offer remote services?');
   83 |     await answerInput.fill('Yes, we offer remote consultations via video call');
   84 |     
   85 |     // Save second FAQ
   86 |     await page.click('text=Save Changes');
   87 |     await expect(page.locator('text=Edit')).toBeVisible();
   88 |     
   89 |     // Verify both FAQs are visible
   90 |     await expect(page.locator('text=Where are you located?')).toBeVisible();
   91 |     await expect(page.locator('text=Do you offer remote services?')).toBeVisible();
   92 |     
   93 |     // Critical test: Refresh and verify both persist
   94 |     await page.reload();
   95 |     await expect(page.locator('h1')).toContainText('Knowledge Base');
   96 |     
   97 |     await expect(page.locator('text=Where are you located?')).toBeVisible();
   98 |     await expect(page.locator('text=123 Main Street')).toBeVisible();
   99 |     await expect(page.locator('text=Do you offer remote services?')).toBeVisible();
  100 |     await expect(page.locator('text=Yes, we offer remote consultations')).toBeVisible();
  101 |   });
  102 |
  103 |   test('should still work with traditional Add FAQ button workflow', async ({ page }) => {
  104 |     // Verify the traditional workflow still functions correctly
  105 |     
  106 |     await page.click('text=Edit');
  107 |     
  108 |     const questionInput = page.locator('[data-testid="faq-question-input"]').or(
  109 |       page.locator('input[placeholder*="question"]')
  110 |     );
  111 |     const answerInput = page.locator('[data-testid="faq-answer-input"]').or(
  112 |       page.locator('textarea[placeholder*="answer"]')
  113 |     );
  114 |     
  115 |     await questionInput.fill('What payment methods do you accept?');
  116 |     await answerInput.fill('We accept credit cards, PayPal, and bank transfers');
  117 |     
```