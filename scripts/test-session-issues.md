# Session Management Testing Guide

This guide helps manually test the auth session issues we've fixed to ensure they work properly in practice.

## 🎯 Issues We Fixed

1. **Browser Focus Profile Loss**: Profile disappears when minimizing/switching browser tabs
2. **Org Roles Loading Hang**: Settings > Org Roles gets stuck loading after being idle
3. **Session Refresh Race Conditions**: Multiple auth state changes causing profile refetches
4. **Timeout Issues**: Requests hanging without proper timeout handling

## 🧪 Manual Test Scenarios

### Test 1: Browser Focus Profile Persistence

**Steps:**
1. Login to the app
2. Verify profile name appears in bottom left navigation
3. Minimize browser window for 10-15 seconds
4. Restore browser window
5. **Expected**: Profile name should still be visible (no spinning/loading)
6. **Fixed**: Profile should not disappear or require refresh

### Test 2: Org Roles After Idle Period

**Steps:**
1. Login to the app
2. Leave browser idle for 5+ minutes (or delete auth cookies: `sb-` cookies in DevTools)
3. Navigate to Settings > Org Roles
4. **Expected**: Should load within 8 seconds with proper error handling if needed
5. **Fixed**: Should not hang indefinitely or require multiple page refreshes

### Test 3: Session Refresh Logging

**Steps:**
1. Open browser DevTools console
2. Login to the app
3. Wait for idle period or force session refresh by switching browser tabs rapidly
4. Navigate to Settings > Org Roles
5. **Check Console Logs**:
   - Should see session refresh attempts with proper retry logic
   - Should see "Skipping profile fetch - same user or token refresh" for unnecessary profile calls
   - Should not see excessive profile fetch attempts

### Test 4: Quick Navigation After Login

**Steps:**
1. Login to the app
2. Immediately navigate to Settings > Org Roles (before profile loads)
3. **Expected**: Should wait for organization context to load before fetching members
4. **Fixed**: Should show "Loading organization context..." then proceed normally

## 🛠️ Debug Tools

### Browser DevTools
1. **Network Tab**: Check for hanging requests or excessive API calls
2. **Console**: Look for session refresh logs and error messages
3. **Application > Cookies**: Delete `sb-*` cookies to simulate session expiry

### Test Commands
```bash
# Run specific auth tests
npm test lib/auth/providers/__tests__/UserProfileProvider.test.tsx

# Run with watch mode for development
npm test -- --watch

# Run all auth-related tests
npm test lib/auth/
```

### Simulate Stale Session
```javascript
// In browser console - deletes auth cookies
document.cookie.split(";").forEach(function(c) { 
  if (c.indexOf("sb-") !== -1) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  }
});
```

## ✅ Success Criteria

### Profile Persistence
- ✅ Profile name stays visible after browser focus changes
- ✅ No unnecessary profile API calls on token refresh
- ✅ Proper loading states during auth initialization

### Org Roles Loading
- ✅ Loads within 8 seconds even after idle periods
- ✅ Shows helpful error messages on timeout
- ✅ Automatic session refresh with retry logic (max 2 attempts)
- ✅ No infinite loading states

### Performance
- ✅ Minimal API calls during normal navigation
- ✅ Efficient session refresh logic
- ✅ Proper cleanup on component unmount

## 🔍 Key Code Changes

### UserProfileProvider
- Smart auth state handling - only fetch profile on new user sign-in
- Skip profile fetch on TOKEN_REFRESHED events (browser focus)
- Proper useRef tracking to prevent unnecessary API calls

### useOrgMembers Hook
- 8-second timeout with helpful error messages
- Session refresh logic with max 2 retries
- Proper organization context dependency

### OrgRoleManager Component
- Wait for organization context before loading members
- Better loading state messages
- Proper error handling and user feedback

## 📝 Notes

- Tests validate the session management logic works correctly
- Manual testing ensures real-world scenarios work as expected
- Console logs help debug session refresh timing and behavior
- The 8-second timeout balances user experience with reliability 