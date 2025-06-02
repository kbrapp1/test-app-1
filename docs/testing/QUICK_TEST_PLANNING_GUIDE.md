# Quick Test Planning Guide

## 🚀 5-Second Decision Guide

**Question: What am I testing?**

| Testing | Use This | Example |
|---------|----------|---------|
| 🧮 **Pure Logic** | Unit Tests | `calculateFileSize()`, validation functions |
| 🎯 **User Actions** | Behavior Tests (MSW) | Form submissions, button clicks, UI feedback |
| 🔗 **Multiple Components** | Integration Tests | Complete workflows, component communication |
| 🌐 **Network Layer** | Implementation Tests | Fetch wrappers, retry logic, error handling |

---

## 📋 Copy-Paste Test Plan Prompt

```markdown
## Feature Test Plan Request

**Feature:** [Your Feature Name]

**User Story:** [What the user wants to accomplish]

**Components Involved:**
- [ ] React Components: [List them]
- [ ] Hooks: [List them]  
- [ ] API Endpoints: [List them]
- [ ] Services/Utilities: [List them]

**Key User Workflows:**
1. [Happy path workflow]
2. [Error scenarios]
3. [Edge cases]

**UI Feedback Required:**
- [ ] Success messages/toasts
- [ ] Loading states  
- [ ] Error messages
- [ ] Form validation
- [ ] Form resets

**Integration Points:**
- [ ] API calls
- [ ] File uploads
- [ ] Real-time updates
- [ ] Authentication

**URL/Parameter Handling:**
- [ ] Query parameter construction
- [ ] Special character encoding
- [ ] Malformed URL handling
- [ ] Parameter validation

Please provide:
1. Test approach recommendations (unit/behavior/integration)
2. MSW handlers needed
3. Key test scenarios to cover
4. Edge cases and error scenarios
5. UI feedback testing strategy
6. URL construction validation tests
```

---

## ⚡ Quick Testing Recipes

### React Hook Testing
```typescript
// Use MSW + behavior testing
describe('useAssetDelete', () => {
  it('shows success when API succeeds', async () => {
    result.current.mutate('asset-id');
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({ success: true });
    });
  });
});
```

### Form Component Testing  
```typescript
// Use User Events + MSW
describe('MyForm', () => {
  it('submits successfully and shows feedback', async () => {
    await user.type(nameInput, 'Test');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(nameInput).toHaveValue(''); // Form reset
    });
  });
});
```

### Service Layer Testing
```typescript
// Disable MSW, use global mocks
describe('ApiService', () => {
  beforeAll(() => server.close());
  
  it('retries on network failure', async () => {
    global.fetch = mockFetch;
    // Test implementation details
  });
});
```

---

## 🎯 Test Coverage Checklist

**For Every Feature:**
- [ ] ✅ Happy path works
- [ ] ❌ Error handling works  
- [ ] ⏳ Loading states work
- [ ] 🔄 Form resets work
- [ ] 📱 Mobile/accessibility works

**MSW Handlers Needed:**
- [ ] Success responses
- [ ] Error responses (400, 401, 403, 500)
- [ ] Network failures
- [ ] Slow responses (timeout testing)

---

## 🚨 Common Mistakes to Avoid

❌ **Don't test implementation:**
```typescript
expect(mockFetch).toHaveBeenCalled(); // Implementation detail
```

✅ **Do test behavior:**
```typescript
expect(screen.getByText('Success!')).toBeInTheDocument(); // User experience
```

❌ **Don't mix MSW with fetch mocks:**
```typescript
server.use(handler);
global.fetch = mockFetch; // Conflicts!
```

✅ **Do choose one approach:**
```typescript
// Either MSW for behavior OR global mocks for implementation
```

---

*Reference the full [Testing Best Practices Guide](./TESTING_BEST_PRACTICES_GUIDE.md) for detailed explanations.* 