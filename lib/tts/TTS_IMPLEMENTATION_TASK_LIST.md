# TTS Permissions Implementation Task List

This task list provides step-by-step implementation guidance for adding role-based permissions to the Text-to-Speech domain, following DDD principles and the established security architecture.

## Phase 1: Domain Layer Security Foundation

### Task 1.1: Define TTS-Specific Permissions
- [ ] **Add TtsPermission enum to `lib/auth/roles.ts`**
  ```typescript
  export enum TtsPermission {
    VIEW_TTS = 'view:tts',
    GENERATE_SPEECH = 'generate:speech',
    VIEW_HISTORY = 'view:tts_history',
    DELETE_HISTORY = 'delete:tts_history',
    SAVE_TO_DAM = 'save:tts_to_dam',
    CONFIGURE_VOICES = 'configure:voices',
    EXPORT_AUDIO = 'export:audio',
    MANAGE_TTS_SETTINGS = 'manage:tts_settings',
    VIEW_USAGE_STATS = 'view:tts_usage',
  }
  ```

### Task 1.2: Update Role-Permission Mapping
- [ ] **Update `ROLE_PERMISSIONS` in `lib/auth/roles.ts`**
  - [ ] Admin: All TTS permissions
  - [ ] Editor: All except MANAGE_TTS_SETTINGS
  - [ ] Member: Basic generation and personal history
  - [ ] Viewer: VIEW_TTS and VIEW_HISTORY only
  - [ ] Visitor: No TTS permissions

### Task 1.3: Add TTS Domain Events for Audit Trail
- [ ] **Create `lib/tts/domain/events/TtsDomainEvents.ts`**
  - [ ] `SpeechGenerationRequestedEvent`
  - [ ] `SpeechGenerationCompletedEvent`
  - [ ] `TtsAudioSavedToDamEvent`
  - [ ] Include organization context in all events

### Task 1.4: Update TTS Domain Service
- [ ] **Enhance `lib/tts/domain/services/TtsPredictionService.ts`**
  - [ ] Add organization context validation
  - [ ] Publish domain events for audit trail
  - [ ] Add business rule validation with proper error types

## Phase 2: Application Layer Access Control

### Task 2.1: Create TTS Access Control Service
- [ ] **Create `lib/tts/application/services/TtsAccessControlService.ts`**
  - [ ] `checkTtsAccess()` - Basic feature access
  - [ ] `checkSpeechGenerationAccess()` - Generation permissions
  - [ ] `checkHistoryAccess()` - History permissions
  - [ ] `checkDamIntegrationAccess()` - DAM save permissions
  - [ ] `checkAdminAccess()` - Administrative permissions

### Task 2.2: Add Access Control to Existing Application Services
- [ ] **Update `lib/tts/application/services/TtsApplicationService.ts`**
  - [ ] Add organization context validation to all methods
  - [ ] Ensure proper error handling for permission violations
  - [ ] Maintain audit trail through domain events

### Task 2.3: Create TTS-Specific Error Types
- [ ] **Add to `lib/tts/domain/common/TtsError.ts`**
  - [ ] `TtsPermissionDeniedError`
  - [ ] `TtsFeatureNotAvailableError`
  - [ ] `TtsOrganizationAccessError`

## Phase 3: Server Action Protection

### Task 3.1: Protect Core TTS Server Actions
- [ ] **Update `lib/tts/presentation/actions/tts.ts`**
  - [ ] `generateSpeechAction()` - Check GENERATE_SPEECH permission
  - [ ] `getTtsHistoryAction()` - Check VIEW_HISTORY permission
  - [ ] `saveToDamAction()` - Check SAVE_TO_DAM permission
  - [ ] `deleteHistoryItemAction()` - Check DELETE_HISTORY permission

### Task 3.2: Add Error Handling Helper
- [ ] **Create `handleTtsActionError()` function**
  - [ ] Handle feature not available errors
  - [ ] Handle permission denied errors
  - [ ] Handle domain errors
  - [ ] Provide consistent error response format

### Task 3.3: Protect TTS Page Access
- [ ] **Update `app/(protected)/ai-playground/text-to-speech/page.tsx`**
  - [ ] Check TTS feature access before rendering
  - [ ] Show appropriate error states for different scenarios
  - [ ] Use consistent error handling patterns

## Phase 4: Client-Side Permission Integration

### Task 4.1: Create TTS Permission Hooks
- [ ] **Create `lib/tts/presentation/hooks/useTtsPermissions.ts`**
  - [ ] Individual permission checks (canViewTts, canGenerateSpeech, etc.)
  - [ ] Convenience getters (isReadOnly, hasBasicAccess, hasFullAccess)
  - [ ] Loading state management
  - [ ] Integration with existing `useFeatureAccess` hook

### Task 4.2: Update TTS Interface Components
- [ ] **Update `lib/tts/presentation/components/tts-interface.tsx`**
  - [ ] Add permission-based conditional rendering
  - [ ] Show read-only mode for viewers
  - [ ] Hide/disable features based on permissions
  - [ ] Add loading states during permission resolution

### Task 4.3: Update TTS Input Component
- [ ] **Update `lib/tts/presentation/components/TtsInputCard.tsx`**
  - [ ] Disable generation for users without GENERATE_SPEECH permission
  - [ ] Show read-only message for viewers
  - [ ] Handle permission loading states

### Task 4.4: Update TTS History Components
- [ ] **Update `lib/tts/presentation/components/TtsHistoryPanel.tsx`**
  - [ ] Show/hide based on VIEW_HISTORY permission
  - [ ] Conditional rendering for delete actions
  - [ ] Conditional rendering for export/save actions

- [ ] **Update `lib/tts/presentation/components/TtsHistoryItem.tsx`**
  - [ ] Action buttons based on permissions
  - [ ] Tooltips for disabled actions
  - [ ] Consistent permission checking

### Task 4.5: Update TTS Output Component
- [ ] **Update `lib/tts/presentation/components/TtsOutputCard.tsx`**
  - [ ] Export button based on EXPORT_AUDIO permission
  - [ ] Save to DAM button based on SAVE_TO_DAM permission
  - [ ] Disable actions for insufficient permissions

## Phase 5: Access Guard Components

### Task 5.1: Create TTS Access Guard Components
- [ ] **Create `components/access-guards/TtsFeatureNotAvailable.tsx`**
  - [ ] Must be client component (interactive elements)
  - [ ] Show when organization doesn't have TTS enabled
  - [ ] Provide upgrade and contact options

- [ ] **Create `components/access-guards/TtsInsufficientPermissions.tsx`**
  - [ ] Show when user lacks required permissions
  - [ ] Provide information about required role
  - [ ] Include contact admin functionality

### Task 5.2: Update Access Guard Index
- [ ] **Update `components/access-guards/index.ts`**
  - [ ] Export new TTS access guard components
  - [ ] Maintain consistent export pattern

## Phase 6: Shared Access Control Integration

### Task 6.1: Add TTS to Shared Access Control
- [ ] **Update `lib/shared/access-control/server/checkFeatureAccess.ts`**
  - [ ] Add TTS convenience function
  - [ ] Ensure defaultEnabled: true for TTS feature
  - [ ] Maintain consistent error handling

### Task 6.2: Update Access Control Exports
- [ ] **Update `lib/shared/access-control/index.ts`**
  - [ ] Export TTS access control functions
  - [ ] Export TTS permission hooks
  - [ ] Maintain consistent export pattern

## Phase 7: Testing Implementation

### Task 7.1: Unit Tests for Permission Logic
- [ ] **Test `TtsAccessControlService`**
  - [ ] All convenience functions work correctly
  - [ ] Proper error handling for different scenarios
  - [ ] Organization context validation

- [ ] **Test `useTtsPermissions` hook**
  - [ ] Permission checks work for all roles
  - [ ] Loading states handled correctly
  - [ ] Convenience getters return expected values

### Task 7.2: Integration Tests for Server Actions
- [ ] **Test protected server actions**
  - [ ] Permission validation works correctly
  - [ ] Proper error responses for denied access
  - [ ] Organization isolation maintained

### Task 7.3: Component Testing
- [ ] **Test conditional rendering**
  - [ ] Components show/hide based on permissions
  - [ ] Read-only mode works correctly
  - [ ] Loading states display properly

### Task 7.4: End-to-End Permission Testing
- [ ] **Test complete user journeys**
  - [ ] Admin can access all features
  - [ ] Editor has appropriate access
  - [ ] Member has limited access
  - [ ] Viewer has read-only access
  - [ ] Visitor is denied access

## Phase 8: Documentation and Deployment

### Task 8.1: Update Documentation
- [ ] **Update TTS domain documentation**
  - [ ] Document new permission model
  - [ ] Update API documentation
  - [ ] Add permission examples

### Task 8.2: Feature Flag Management
- [ ] **Verify TTS feature flag behavior**
  - [ ] Defaults to enabled when missing (universal rule)
  - [ ] Can be explicitly disabled
  - [ ] Proper error handling for disabled state

### Task 8.3: Deployment Preparation
- [ ] **Create deployment checklist**
  - [ ] Database schema verification (already correct)
  - [ ] Feature flag configuration
  - [ ] Permission testing validation

### Task 8.4: Monitoring Setup
- [ ] **Add permission monitoring**
  - [ ] Track TTS permission check performance
  - [ ] Monitor denied access attempts
  - [ ] Alert on permission-related errors

## Validation Checklist

### Security Validation
- [ ] **Organization isolation verified**
  - [ ] Users cannot access other organization's TTS data
  - [ ] RLS policies enforce proper filtering
  - [ ] Super admin override works correctly

- [ ] **Permission enforcement verified**
  - [ ] All server actions check permissions
  - [ ] UI components respect permission states
  - [ ] Feature flags work as expected

### Functional Validation
- [ ] **Role-based access working**
  - [ ] Each role has appropriate TTS access
  - [ ] Permission changes take effect immediately
  - [ ] Error messages are user-friendly

- [ ] **UI/UX validation**
  - [ ] Loading states work properly
  - [ ] Read-only mode is clear to users
  - [ ] Error states provide helpful guidance

### Performance Validation
- [ ] **Permission checks are efficient**
  - [ ] No unnecessary database calls
  - [ ] Permission hooks cache results appropriately
  - [ ] Page load times remain acceptable

## Common Issues and Solutions

### Issue: Permission Hook Not Working
**Solution**: Verify that the component is wrapped in the proper context providers and that the hook is being called from a client component.

### Issue: Server Action Permission Denied
**Solution**: Check that the user has the required role and that the feature flag is enabled for the organization.

### Issue: Conditional Rendering Not Working
**Solution**: Ensure that permission checks are using the correct permission enum values and that loading states are handled properly.

### Issue: Organization Context Missing
**Solution**: Verify that the user has an active organization set and that the JWT token includes the organization context.

## Success Criteria

- [ ] All TTS features respect role-based permissions
- [ ] Organization data isolation is maintained
- [ ] Feature flags control TTS access appropriately
- [ ] UI provides clear feedback for permission states
- [ ] Performance remains acceptable with permission checks
- [ ] Security audit passes with no violations
- [ ] All test scenarios pass
- [ ] Documentation is complete and accurate

This task list ensures systematic implementation of TTS permissions while maintaining code quality, security, and user experience standards. 