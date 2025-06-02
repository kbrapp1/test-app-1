# Image Generation Polling Optimization Implementation

## Summary

Successfully implemented a **simplified, fixed-interval polling strategy** for image generation that provides predictable timing and automatic timeout handling.

## Simplified Polling Strategy

### **Fixed Timing Pattern:**
- **t=0s**: Generation starts
- **t=2s**: First check
- **t=7s**: Second check (after 5s interval)
- **t=12s**: Third check (after 5s interval)
- **t=22s**: Fourth check (after 10s interval)
- **t=32s**: Fifth check (after 10s interval)
- **t=42s**: Sixth check (after 10s interval)
- **t=52s**: Seventh check (after 10s interval)
- **t=60s**: **TIMEOUT** - Generation marked as failed

### **Key Characteristics:**
- **No Background/Foreground Difference**: Same intervals regardless of tab visibility
- **Fixed Intervals**: Predictable 2s → 5s → 5s → 10s pattern
- **Automatic Timeout**: Hard 60-second limit enforced by server
- **Stop on Completion**: Zero polling for completed/failed/cancelled generations
- **Restart-Aware**: Uses generation's actual creation time, handles app crashes/restarts correctly

## Implementation Details

### **Frontend Polling** (`useGenerationPolling`)

**File:** `lib/image-generator/presentation/hooks/specialized/useGenerationPolling.ts`

**Polling Logic:**
```typescript
// Calculate actual age from generation's creation time (handles app restarts)
const now = Date.now();
const createdAt = new Date(data.createdAt).getTime();
const elapsedSeconds = (now - createdAt) / 1000;

if (elapsedSeconds < 2) {
  return Math.max(100, 2000 - (elapsedSeconds * 1000)); // Wait until 2 seconds
} else if (elapsedSeconds < 7) {
  return 5000; // 5 second intervals
} else if (elapsedSeconds < 12) {
  return 5000; // 5 second intervals
} else {
  return 10000; // 10 second intervals
}
```

**Removed Features:**
- ❌ Page visibility detection
- ❌ Adaptive intervals based on status
- ❌ Background polling reduction
- ❌ Complex timing calculations

### **Server-Side Timeout** (`checkGenerationStatus`)

**File:** `lib/image-generator/application/actions/commands/command-actions.ts`

**Timeout Logic:**
```typescript
const timeoutAge = 60 * 1000; // 60 seconds timeout

if (generationAge > timeoutAge && ['pending', 'processing'].includes(generation.getStatus().value)) {
  generation.markAsFailed('Generation timed out after 60 seconds');
  await generationRepository.update(generation);
  return { success: true, data: GenerationMapper.toDto(generation) };
}
```

**Removed Features:**
- ❌ Smart API throttling
- ❌ Grace periods between calls
- ❌ Provider orphan detection
- ❌ Complex age-based logic

## App Restart Behavior

### **How Restarts Are Handled:** ✅

When the app crashes and restarts, the polling system automatically recovers:

1. **Database as Source of Truth**: Generation creation time comes from `data.createdAt` in database
2. **Correct Age Calculation**: Frontend calculates real elapsed time, not time since hook mounted
3. **Resume Correct Interval**: Picks up polling at the right frequency for the generation's actual age

### **Example Restart Scenario:**
```
t=0s   🚀 Generation starts (stored in DB)
t=30s  💥 App crashes
t=35s  🔄 App restarts
t=35s  📡 Hook mounts, fetches generation, sees it's 35s old
t=35s  ⏱️  Calculates: elapsedSeconds = 35, so use 10s intervals
t=45s  📡 Next poll (10s later)
t=55s  📡 Next poll (10s later)  
t=60s  ❌ Server timeout (based on real 60s age)
```

### **Before Fix (Problem):**
```
t=35s  🔄 App restart
t=37s  📡 Poll (hook thinks generation is 2s old) ❌ WRONG
t=42s  📡 Poll (5s interval) ❌ WRONG TIMING
```

### **After Fix (Correct):**
```
t=35s  🔄 App restart  
t=35s  📡 Poll immediately (knows generation is 35s old) ✅ CORRECT
t=45s  📡 Poll (10s interval for 35s+ old generation) ✅ CORRECT TIMING
```

## Architecture Flow

### **Current Flow (Simplified)**
```
Frontend Timer → Server Action → Database Check → Provider API (always) → Database Update → Response
```

**Key Characteristics:**
1. **Predictable**: Fixed timing pattern every time
2. **Simple**: No complex conditions or adaptive logic
3. **Reliable**: Hard timeout prevents infinite polling
4. **Consistent**: Same behavior regardless of environment

## Polling Frequency Details

### **Total API Calls per Generation:**
- **Successful Generation (completes in 30s)**: ~4-5 calls
- **Failed Generation (60s timeout)**: ~7-8 calls
- **Immediate Failure**: 1 call

### **API Call Pattern:**
```
t=2s  → Call 1 (check status)
t=7s  → Call 2 (check status)
t=12s → Call 3 (check status)
t=22s → Call 4 (check status)
t=32s → Call 5 (check status)
t=42s → Call 6 (check status)
t=52s → Call 7 (check status)
t=60s → Server timeout (no more calls)
```

### **Per Hour Estimates:**
- **Active Generation**: ~7-8 calls max per generation
- **Multiple Generations**: Linear scaling (no batching optimization)
- **Background**: Same as foreground (no reduction)

## Usage

### **Single Generation Polling**
```typescript
const { data: generation, isLoading } = useGenerationPolling(
  generationId,
  shouldPoll // Only when generation is active
);
```

### **Behavior:**
- Starts checking after 2 seconds
- Follows 5s, 5s, then 10s intervals
- Automatically stops when completed/failed
- Times out at 60 seconds if still pending

## File Changes Made

### **Modified Files:**
- `lib/image-generator/presentation/hooks/specialized/useGenerationPolling.ts` - Simplified to fixed intervals
- `lib/image-generator/application/actions/commands/command-actions.ts` - Added 60s timeout logic

### **Removed Features:**
- Complex adaptive interval calculations
- Page visibility awareness
- Background polling reduction
- Smart API throttling
- Batch polling optimization (useBatchGenerationPolling.ts can be removed)

## Benefits of Simplified Approach

### **Advantages:**
- ✅ **Predictable**: Same timing every time
- ✅ **Simple**: Easy to understand and debug
- ✅ **Reliable**: Hard timeout prevents runaway polling
- ✅ **Consistent**: No environment-dependent behavior
- ✅ **Testable**: Fixed timing makes testing easier

### **Trade-offs:**
- ❌ No background optimization (same polling when tab hidden)
- ❌ No adaptive timing (may poll more than needed)
- ❌ No batch optimization for multiple generations
- ❌ Fixed timeout (may cut off slow generations)

## Success Criteria Met ✅

- [x] **Simple fixed intervals: 2s, 5s, 5s, 10s**
- [x] **Hard 60-second timeout**
- [x] **No active/background difference**
- [x] **Zero polling for completed generations**
- [x] **Clean, predictable architecture**
- [x] **All tests passing**

The simplified polling strategy provides a clean, predictable approach to generation monitoring with automatic timeout handling, making it easier to understand and maintain. 