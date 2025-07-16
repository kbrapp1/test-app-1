# Unified Context Performance Optimization Plan

## 🎯 **Objective**
Eliminate the slow page refresh issue by consolidating the provider cascade into a single efficient unified context system while preserving existing domain-specific unified contexts.

## 🔍 **Current Performance Problem**
- **5 sequential providers** making independent database calls during page refresh
- **Middleware auth call** + **4 provider auth calls** = 5x redundant authentication
- **Network waterfall effect** causing 3-5 second page load delays
- Each provider waits for previous provider before initializing

## 🏗️ **Current Architecture Issues**

### **Provider Cascade (SLOW)**
```
Middleware auth call →
  AuthenticationProvider (auth.getUser) →
    OrganizationProvider (get_user_accessible_orgs + get_active_org) →
      UserProfileProvider (profile lookup) →
        TeamMembersProvider (team members lookup) →
          Page Component
```

### **Domain Context Duplication**
- `TtsUnifiedContext` duplicates base context (user, org, profile)
- `NotesUnifiedContext` duplicates base context (user, org, profile)
- Both make independent auth/org calls

## 🚀 **Target Architecture**

### **Single Unified Base Context (FAST)**
```
Middleware auth call →
  AppUnifiedContextProvider (parallel queries) →
    Domain-specific contexts (consume base) →
      Page Components
```

### **Parallel Database Calls**
- Single service making **4 parallel queries** instead of 4 sequential calls
- Domain contexts consume shared base context
- Eliminate redundant auth/org lookups

## 📋 **Implementation Plan**

### **Phase 1: Create Unified Base Context Service (60-90 min)**

#### **Step 1.1: Create AppUnifiedContextService**
**File**: `lib/shared/application/services/AppUnifiedContextService.ts`

**Features**:
- Single method: `getCompleteAppContext()`
- Parallel execution of all base queries
- Uses existing `GlobalAuthenticationService` for caching
- Returns consolidated context object

**Parallel Queries**:
```typescript
const [user, organizations, profile, teamMembers] = await Promise.all([
  GlobalAuthenticationService.getUser(),
  OrganizationContextService.getUserAccessibleOrganizations(),
  UserProfileService.getProfile(),
  TeamMemberService.getTeamMembers()
]);
```

#### **Step 1.2: Create AppUnifiedContextProvider**
**File**: `lib/shared/presentation/providers/AppUnifiedContextProvider.tsx`

**Features**:
- Single provider replacing 4 current providers
- React Query integration for caching
- Loading states and error handling
- Context value includes all base data

#### **Step 1.3: Create useAppUnifiedContext Hook**
**File**: `lib/shared/presentation/hooks/useAppUnifiedContext.ts`

**Features**:
- Type-safe access to unified context
- Null checks and loading states
- Error state management

### **Phase 2: Update Protected Layout (15-30 min)**

#### **Step 2.1: Replace Provider Cascade**
**File**: `app/(protected)/layout.tsx`

**Changes**:
- Remove: `AuthenticationProvider`, `OrganizationProvider`, `UserProfileProvider`, `TeamMembersProvider`
- Add: `AppUnifiedContextProvider`
- Maintain: `SidebarProvider` (UI-only, no data dependencies)

**Before**:
```tsx
<AuthenticationProvider>
  <OrganizationProvider>
    <UserProfileProvider>
      <TeamMembersProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </TeamMembersProvider>
    </UserProfileProvider>
  </OrganizationProvider>
</AuthenticationProvider>
```

**After**:
```tsx
<AppUnifiedContextProvider>
  <SidebarProvider>
    {children}
  </SidebarProvider>
</AppUnifiedContextProvider>
```

### **Phase 3: Integrate Existing Domain Contexts (30-45 min)**

#### **Step 3.1: Update TtsUnifiedContextService**
**File**: `lib/tts/application/services/TtsUnifiedContextService.ts`

**Changes**:
- Remove: `getBaseContext()` method (lines 90-130)
- Update: `getUnifiedContext()` to consume `useAppUnifiedContext()`
- Reduce to TTS-specific data only

**Before**:
```typescript
async getUnifiedContext() {
  const baseContext = await this.getBaseContext(); // REMOVE
  const ttsData = await this.getTtsData();
  return { ...baseContext, ...ttsData };
}
```

**After**:
```typescript
async getUnifiedContext(baseContext: AppUnifiedContext) {
  const ttsData = await this.getTtsData();
  return { ...baseContext, ...ttsData };
}
```

#### **Step 3.2: Update NotesUnifiedContextService**
**File**: `lib/notes/application/services/NotesUnifiedContextService.ts`

**Same pattern as TTS**:
- Remove base context duplication
- Accept base context as parameter
- Focus on notes-specific data only

#### **Step 3.3: Update Domain Context Hooks**
**Files**: 
- `lib/tts/presentation/hooks/useTtsUnifiedContext.ts`
- `lib/notes/presentation/hooks/useNotesUnifiedContext.ts`

**Changes**:
- Import and use `useAppUnifiedContext()`
- Pass base context to service calls
- Maintain same external API for components

### **Phase 4: Update Components & Cleanup (30-45 min)**

#### **Step 4.1: Update Components Using Old Contexts**
**Search for**: Components using removed provider hooks
- `useAuthentication()` → `useAppUnifiedContext().user`
- `useOrganizationContext()` → `useAppUnifiedContext().organization`
- `useUserProfile()` → `useAppUnifiedContext().profile`
- `useTeamMembers()` → `useAppUnifiedContext().teamMembers`

#### **Step 4.2: Remove Old Provider Files**
**Files to delete**:
- `lib/auth/presentation/providers/AuthenticationProvider.tsx`
- `lib/organization/application/providers/OrganizationProvider.tsx`
- `lib/auth/presentation/providers/UserProfileProvider.tsx`
- `lib/auth/presentation/providers/TeamMembersProvider.tsx`

#### **Step 4.3: Update Hook Exports**
**File**: Update index files to export new unified hooks instead of old provider hooks

### **Phase 5: Performance Verification & Testing (15-30 min)**

#### **Step 5.1: Test Performance**
- Measure page refresh times (should be <1 second)
- Verify no duplicate database calls in network tab
- Test all protected pages load correctly

#### **Step 5.2: Test Domain Contexts**
- Verify TTS functionality still works
- Verify Notes functionality still works
- Ensure no regression in domain features

#### **Step 5.3: Error Handling**
- Test offline scenarios
- Test auth failures
- Test organization switching

## 🎯 **Expected Performance Improvements**

### **Before (Current)**
- **5 sequential database calls** during page refresh
- **3-5 second** page load times
- **Network waterfall** with blocking requests

### **After (Optimized)**
- **1 parallel database call set** during page refresh
- **<1 second** page load times  
- **Single request roundtrip** with parallel execution

## ⚠️ **Risk Mitigation**

### **High-Risk Areas**
1. **Breaking existing domain contexts** - Mitigated by maintaining external APIs
2. **Components depending on old providers** - Mitigated by comprehensive search/replace
3. **Auth state management changes** - Mitigated by using same GlobalAuthenticationService

### **Rollback Plan**
- Keep old provider files until testing complete
- Feature flag the new unified context
- Gradual migration path if needed

### **Testing Strategy**
- Test each phase independently
- Maintain functionality parity
- Performance benchmarking at each step

## 🚧 **Implementation Notes**

### **Dependencies**
- Must use existing `GlobalAuthenticationService` for auth caching
- Must preserve domain boundary separation
- Must maintain React Query caching patterns

### **Type Safety**
- Create comprehensive TypeScript interfaces for unified context
- Ensure all consuming components remain type-safe
- Add runtime validation for context data

### **Error Boundaries**
- Implement proper error boundaries for unified context failures
- Graceful degradation if partial context fails
- User-friendly error messages

## 📊 **Success Metrics**

### **Performance**
- [ ] Page refresh time < 1 second
- [ ] Network requests reduced from 5+ to 1 parallel set
- [ ] No duplicate auth/org calls in network tab

### **Functionality**
- [ ] All protected pages load correctly
- [ ] TTS domain features work unchanged
- [ ] Notes domain features work unchanged
- [ ] Organization switching works
- [ ] User profile updates work

### **Code Quality**
- [ ] No console errors
- [ ] TypeScript compilation clean
- [ ] Lint passes
- [ ] All tests pass

## 🔄 **Estimated Timeline**
- **Phase 1**: 60-90 minutes
- **Phase 2**: 15-30 minutes  
- **Phase 3**: 30-45 minutes
- **Phase 4**: 30-45 minutes
- **Phase 5**: 15-30 minutes

**Total**: 2.5-4 hours for complete implementation and testing 