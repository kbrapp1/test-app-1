# Complete Feature Flag Implementation Checklist

**Purpose:** This document serves as a comprehensive checklist for implementing complete feature flag protection for any feature set. It ensures defense-in-depth security and proper UX across all layers.

**Reference Implementation:** DAM and TTS features serve as examples of complete implementation.

---

## 🏗️ **Architecture Overview**

Feature flag protection must be implemented across **4 critical layers** for complete security:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND LAYER (UX Protection)                          │
│   • Navigation hiding                                      │
│   • Page-level protection                                  │
│   • Component-level hiding                                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVER ACTIONS LAYER (Critical Backend Security)        │
│   • Feature flag checks in ALL server actions              │
│   • Prevents direct server action calls                    │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│ 3. API ROUTES LAYER (HTTP Endpoint Protection)             │
│   • Feature flag checks in API route handlers              │
│   • Prevents direct HTTP requests                          │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│ 4. DATABASE LAYER (Ultimate Fallback - Optional)           │
│   • Row Level Security policies                            │
│   • Database-level feature flag enforcement                │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Implementation Checklist**

### **1. Frontend Layer Protection**

#### **A. Navigation Configuration**
- [ ] **File:** `lib/config/navigation.ts`
- [ ] Add `featureFlag: 'feature_name'` to main navigation items
- [ ] Add `featureFlag: 'feature_name'` to sub-navigation items
- [ ] Test navigation hiding with flag disabled

```typescript
// Example:
{
    title: "My Feature",
    url: "#",
    icon: FeatureIcon,
    featureFlag: 'my_feature', // ← ADD THIS
    items: [
        { 
            title: "Sub Feature", 
            url: "/my-feature/sub", 
            featureFlag: 'my_feature' // ← AND THIS
        },
    ],
}
```

#### **B. Navigation Component**
- [ ] **File:** `components/nav-main.tsx` 
- [ ] Verify filtering logic includes feature flag checks
- [ ] Test that disabled features don't appear in navigation

#### **C. Page-Level Protection**
- [ ] **Files:** `app/(protected)/[feature]/page.tsx`
- [ ] Add server-side feature flag check at page entry
- [ ] Return "Feature Not Enabled" UI when disabled
- [ ] Use consistent error page design (Ban icon + message)

```typescript
// Example implementation:
const organization = await getActiveOrganizationWithFlags(supabase);
const flags = organization?.feature_flags as Record<string, boolean> | undefined;
const isFeatureEnabled = flags?.my_feature ?? false;

if (!isFeatureEnabled) {
  return (
    <main className="flex-1 px-4 pt-2 pb-4 overflow-auto">
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center">
        <Ban className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Feature Not Enabled</h1>
        <p className="text-muted-foreground">
          The [Feature Name] feature is not enabled for your organization.
        </p>
      </div>
    </main>
  );
}
```

#### **D. Component-Level Protection**
- [ ] Add `useFeatureFlag('feature_name')` checks in feature components
- [ ] Hide/disable feature-specific UI elements
- [ ] Test component behavior when feature is disabled

---

### **2. Server Actions Layer Protection**

#### **A. Feature Flag Service (Recommended: Hybrid Approach)**
- [ ] **Shared Core:** Use `lib/organization/application/services/FeatureFlagService.ts`
- [ ] **Feature Service:** Create `lib/[feature]/application/services/FeatureFlagService.ts`
- [ ] Import shared core functions to maintain DDD boundaries

```typescript
// Feature-specific service (recommended):
import { checkFeatureFlag, isFeatureEnabled } from '@/lib/organization/application/services/FeatureFlagService';

export async function checkMyFeatureFlag(): Promise<void> {
  await checkFeatureFlag('my_feature', 'My Feature');
}

export async function isMyFeatureEnabled(): Promise<boolean> {
  return await isFeatureEnabled('my_feature');
}
```

**Alternative: Direct helper in action files**
```typescript
// Direct implementation (less preferred):
async function checkMyFeatureFlag() {
  const supabase = createSupabaseServerClient();
  const organization = await getActiveOrganizationWithFlags(supabase);
  const flags = organization?.feature_flags as Record<string, boolean> | undefined;

  if (!flags?.my_feature) {
    throw new Error('My Feature is not enabled for this organization.');
  }
}
```

#### **B. Server Action Protection**
- [ ] Add feature flag check to **ALL** server actions for the feature
- [ ] Place check at the beginning of each action function
- [ ] Test that disabled features throw appropriate errors

```typescript
// Example implementation:
export async function myFeatureAction(params: any): Promise<ActionResult> {
  try {
    await checkMyFeatureFlag(); // ← ADD THIS TO ALL ACTIONS
    
    // ... existing action logic
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### **C. Complete Action Coverage**
- [ ] **Audit all server action files:**
  - [ ] `[feature]/application/actions/*.ts`
  - [ ] `lib/actions/[feature]/*.ts` (legacy locations)
- [ ] Ensure NO server action is unprotected
- [ ] Test each action with feature disabled

---

### **3. API Routes Layer Protection**

#### **A. API Route Handler Protection**
- [ ] **Files:** `app/api/[feature]/route.ts`
- [ ] Add feature flag check at the beginning of route handlers
- [ ] Return appropriate HTTP error when feature disabled
- [ ] Test direct API calls with feature disabled

```typescript
// Example implementation:
export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    const organization = await getActiveOrganizationWithFlags(supabase);
    const flags = organization?.feature_flags as Record<string, boolean> | undefined;
    
    if (!flags?.my_feature) {
      return NextResponse.json(
        { error: 'Feature not enabled for this organization' },
        { status: 403 }
      );
    }
    
    // ... existing API logic
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### **B. All HTTP Methods**
- [ ] Protect GET, POST, PUT, DELETE, PATCH handlers
- [ ] Use consistent error responses (403 Forbidden)
- [ ] Test each endpoint with feature disabled

---

### **4. Database Layer Protection (Optional)**

#### **A. Row Level Security Policies**
- [ ] **Files:** `supabase/migrations/*.sql`
- [ ] Create RLS policies that check organization feature flags
- [ ] Apply to all feature-related tables
- [ ] Test database-level enforcement

```sql
-- Example RLS policy:
CREATE POLICY "Users can only access feature data if feature is enabled"
ON my_feature_table
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = organization_id
    AND (o.feature_flags->>'my_feature')::boolean = true
  )
);
```

---

## 🧪 **Testing Checklist**

### **Feature Enabled Testing**
- [ ] Navigation items visible
- [ ] Pages load normally
- [ ] Server actions work
- [ ] API routes respond correctly
- [ ] All functionality works as expected

### **Feature Disabled Testing**
- [ ] Navigation items hidden
- [ ] Direct page access shows "Feature Not Enabled"
- [ ] Server actions throw errors
- [ ] API routes return 403 Forbidden
- [ ] No feature functionality accessible

### **Edge Case Testing**
- [ ] Empty feature flags object `{}`
- [ ] Missing feature flags column
- [ ] Invalid organization context
- [ ] Direct server action calls (form submissions)
- [ ] Direct API calls (Postman/curl)

---

## 📋 **Security Validation**

### **Attack Vector Prevention**
- [ ] ✅ **Frontend bypass:** Direct URL access blocked
- [ ] ✅ **Server action bypass:** Direct form submission blocked  
- [ ] ✅ **API bypass:** Direct HTTP requests blocked
- [ ] ✅ **JavaScript disabled:** Server-side protection active
- [ ] ✅ **Malicious requests:** All entry points protected

### **Defense in Depth Verification**
- [ ] Multiple layers of protection active
- [ ] No single point of failure
- [ ] Consistent error handling across layers
- [ ] Proper fallback behavior

---

## 📚 **Reference Examples**

### **Complete Implementation Examples:**
- **DAM Feature:** `lib/dam/` - Navigation, pages, server actions, API routes
- **TTS Feature:** `lib/actions/tts.ts` - Server actions protection

### **Incomplete Implementation Examples:**
- **DAM API Route:** `app/api/dam/route.ts` - Missing feature flag check
- **DAM Server Actions:** Only folder actions protected, others missing

---

## 🔄 **Maintenance**

### **When Adding New Features:**
1. Use this checklist for complete implementation
2. Test all layers before deployment
3. Document any deviations or special cases
4. Update this checklist if patterns change

### **When Modifying Existing Features:**
1. Verify all layers remain protected
2. Test after changes
3. Update protection if new entry points added

---

## 🎯 **Key Principles**

1. **Default Off:** Features disabled unless explicitly enabled
2. **Defense in Depth:** Multiple layers of protection
3. **Fail Secure:** Errors should disable access, not enable it
4. **Consistent UX:** Similar error messages and behavior
5. **Complete Coverage:** No unprotected entry points
6. **Testable:** All layers must be easily testable

---

**Remember:** Feature flags are not just for gradual rollouts - they're a critical security mechanism that must be implemented comprehensively across all architectural layers. 