# Image Generator Real-Time Architecture - Implementation Plan

**CURRENT STATUS:** Polling-Based System ✅ | Webhook Infrastructure Ready 🔥 | Target: Zero-Polling Event-Driven Architecture

**ARCHITECTURE TRANSFORMATION:**
✅ **Current State:** Frontend polling → Provider APIs → Database updates → UI refresh cycles
🎯 **Target State:** Provider webhooks → Job queues → Background workers → Real-time notifications → Instant UI updates

**MAJOR TECHNICAL ACHIEVEMENTS REQUIRED:**
✅ **Event-Driven Architecture:** Domain events, webhook handlers, job queues, background workers
✅ **Golden Rule Compliance:** All components under 250 lines with single responsibility
✅ **Real-Time Communication:** WebSocket/SSE connections with automatic fallback
✅ **Webhook Integration:** Direct provider notifications (Replicate, OpenAI future-ready)
✅ **Scalable Job Processing:** Redis-based queues with worker scaling
✅ **Zero-Polling System:** Eliminate all frontend and backend polling

**IMMEDIATE GOALS:**
1. 🔥 **Create job queue infrastructure** with Redis and BullMQ
2. 🔥 **Implement webhook endpoints** for provider notifications  
3. 🔥 **Build real-time notification system** with WebSocket/SSE
4. 🔥 **Update domain layer** with event-driven patterns
5. 🔥 **Migrate presentation layer** to real-time updates
6. 🔥 **Deploy with zero-downtime** migration strategy

**Goal:** Transform the image generation system from polling-based to event-driven architecture, achieving instant status updates, 95% reduction in API costs, and horizontal scalability while maintaining DDD principles and golden-rule compliance.

**Reference Architecture:**
- **Domain Layer:** `lib/image-generator/domain/` - Events, enhanced entities, event publisher
- **Application Layer:** `lib/image-generator/application/` - Webhook handlers, notification use cases
- **Infrastructure Layer:** `lib/image-generator/infrastructure/` - Job queues, webhook providers, real-time services
- **Presentation Layer:** `lib/image-generator/presentation/` - Real-time hooks, WebSocket components

**Target Benefits:**
- Zero polling API calls to providers
- Sub-second status update delivery
- 99.9% webhook delivery success rate
- Support for 1000+ concurrent connections
- 95% reduction in provider API costs
- Horizontal scalability with distributed processing

**CRITICAL IMPLEMENTATION NOTES:**
- 🔥 **DDD Event Patterns:** Domain entities must publish events, application layer handles side effects
- 🔥 **Golden Rule Compliance:** Every component under 250 lines with single responsibility
- 🔥 **Graceful Degradation:** Automatic fallback to polling if real-time systems fail
- 🔥 **Zero Downtime:** Dual-mode operation during migration, gradual rollout strategy

**Technology Stack:**
- **Job Queue:** Redis + BullMQ for scalable background processing
- **Real-Time:** Supabase Realtime (primary), WebSocket fallback for advanced features
- **Webhooks:** Provider-specific endpoints with signature validation
- **Events:** In-memory event bus with Supabase real-time persistence

## Phase 1: Infrastructure Foundation - Job Queue and Event System

**Step 1: Create Job Queue Infrastructure**
- [ ] **File:** `lib/infrastructure/jobs/JobQueue.ts` (≤180 lines)
- [ ] **Service 1.1: `JobQueue`**
  - [ ] **Dependencies:**
    - [ ] Redis connection with pooling and health checks
    - [ ] BullMQ for robust job processing with retry logic
    - [ ] Environment-based configuration and secrets management
  - [ ] **Methods:**
    - [ ] `addJob(queueName: string, jobData: JobData, options?: JobOptions): Promise<Job>` - Add job with priority
    - [ ] `getJob(jobId: string): Promise<Job | null>` - Retrieve job status and metadata
    - [ ] `removeJob(jobId: string): Promise<void>` - Clean up completed jobs
    - [ ] `getQueueStats(queueName: string): Promise<QueueStats>` - Metrics and health
    - [ ] `pauseQueue(queueName: string): Promise<void>` - Graceful pause for maintenance
    - [ ] `resumeQueue(queueName: string): Promise<void>` - Resume processing
  - [ ] **Queue Configuration:**
    - [ ] `generation-webhooks` - Process provider webhook events
    - [ ] `image-processing` - Download and store result images
    - [ ] `user-notifications` - Deliver real-time status updates
    - [ ] `cleanup-tasks` - Periodic maintenance and data cleanup
  - [ ] **Error Handling:**
    - [ ] Exponential backoff retry strategy with max attempts
    - [ ] Dead letter queue for permanently failed jobs
    - [ ] Circuit breaker pattern for Redis connection failures
  - [ ] **Testing (Unit):** 12+ tests covering job lifecycle, error scenarios, connection failures

- [ ] **File:** `lib/infrastructure/jobs/JobWorker.ts` (≤200 lines)
- [ ] **Service 1.2: `JobWorker`**
  - [ ] **Methods:**
    - [ ] `startWorker(queueName: string, processor: JobProcessor): Worker` - Initialize background worker
    - [ ] `stopWorker(workerId: string): Promise<void>` - Graceful shutdown with job completion
    - [ ] `registerProcessor(jobType: string, processor: JobProcessor): void` - Register job handler
    - [ ] `getWorkerStats(): WorkerStats` - Performance metrics and health status
    - [ ] `scaleWorkers(queueName: string, count: number): Promise<void>` - Dynamic scaling
  - [ ] **Worker Management:**
    - [ ] Automatic scaling based on queue depth and processing time
    - [ ] Health check endpoints for container orchestration
    - [ ] Graceful shutdown on SIGTERM with job completion
    - [ ] Resource monitoring (CPU, memory, processing rate)
  - [ ] **Performance Features:**
    - [ ] Concurrent job processing with configurable limits
    - [ ] Job prioritization and batch processing
    - [ ] Memory leak prevention with worker recycling
  - [ ] **Testing (Integration):** 8+ tests with Redis container, scaling scenarios

**Step 2: Create Domain Event System**
- [ ] **File:** `lib/image-generator/domain/events/DomainEvent.ts` (≤120 lines)
- [ ] **Interface 2.1: `DomainEvent`**
  - [ ] **Base Properties:**
    - [ ] `eventId: string` - Unique event identifier
    - [ ] `eventType: string` - Event type for routing
    - [ ] `aggregateId: string` - Related entity identifier
    - [ ] `aggregateType: string` - Entity type (Generation)
    - [ ] `eventVersion: number` - Event schema version
    - [ ] `occurredAt: Date` - Event timestamp
    - [ ] `userId: string` - User context
    - [ ] `organizationId: string` - Organization context
  - [ ] **Event Types:**
    - [ ] `GenerationStarted` - Generation initiated with provider
    - [ ] `GenerationStatusChanged` - Status transition events
    - [ ] `GenerationCompleted` - Successful completion with image
    - [ ] `GenerationFailed` - Failure with error details
    - [ ] `GenerationCancelled` - User or system cancellation
  - [ ] **Serialization:**
    - [ ] JSON serialization for event store persistence
    - [ ] Version compatibility and migration support
  - [ ] **Testing (Unit):** 8+ tests covering event creation, serialization

- [ ] **File:** `lib/image-generator/domain/events/EventPublisher.ts` (≤150 lines)
- [ ] **Service 2.2: `EventPublisher`**
  - [ ] **Methods:**
    - [ ] `publish(event: DomainEvent): Promise<void>` - Publish single event
    - [ ] `publishBatch(events: DomainEvent[]): Promise<void>` - Batch publication
    - [ ] `subscribe(eventType: string, handler: EventHandler): string` - Register handler
    - [ ] `unsubscribe(handlerId: string): void` - Remove event handler
    - [ ] `replay(fromEventId: string, handler: EventHandler): Promise<void>` - Event replay
  - [ ] **Event Store:**
    - [ ] In-memory event bus for immediate processing
    - [ ] Persistent event store for audit and replay
    - [ ] Event ordering guarantees within aggregate
    - [ ] Event deduplication based on eventId
  - [ ] **Performance:**
    - [ ] Async event handling to avoid blocking
    - [ ] Event batching for high-throughput scenarios
    - [ ] Circuit breaker for handler failures
  - [ ] **Testing (Unit):** 10+ tests covering pub/sub, persistence, replay

**Step 3: Create Webhook Infrastructure**
- [ ] **File:** `lib/infrastructure/webhooks/WebhookHandler.ts` (≤180 lines)
- [ ] **Service 3.1: `WebhookHandler`**
  - [ ] **Methods:**
    - [ ] `validateSignature(payload: string, signature: string, secret: string, provider: string): boolean` - Multi-provider validation
    - [ ] `parsePayload(payload: string, provider: string): WebhookEvent` - Provider-specific parsing
    - [ ] `routeEvent(event: WebhookEvent): Promise<void>` - Route to appropriate handler
    - [ ] `logEvent(event: WebhookEvent, result: ProcessingResult): Promise<void>` - Audit logging
    - [ ] `retryFailedEvent(eventId: string): Promise<void>` - Manual retry mechanism
  - [ ] **Provider Support:**
    - [ ] Replicate webhook signature validation (HMAC-SHA256)
    - [ ] OpenAI webhook format (future-ready implementation)
    - [ ] Generic webhook event normalization
    - [ ] Provider-specific error code mapping
  - [ ] **Security Features:**
    - [ ] Cryptographic signature validation for each provider
    - [ ] Rate limiting with sliding window algorithm
    - [ ] IP allowlist for known provider endpoints
    - [ ] Request size limits and timeout handling
  - [ ] **Testing (Unit):** 12+ tests covering all providers, security scenarios

- [ ] **File:** `lib/infrastructure/webhooks/WebhookRouter.ts` (≤100 lines)
- [ ] **Service 3.2: `WebhookRouter`**
  - [ ] **Methods:**
    - [ ] `registerRoute(provider: string, eventType: string, handler: EventHandler): void` - Register handler
    - [ ] `routeEvent(provider: string, event: WebhookEvent): Promise<void>` - Route to handler
    - [ ] `getRegisteredRoutes(): RouteConfig[]` - List all registered routes
    - [ ] `removeRoute(routeId: string): void` - Unregister handler
  - [ ] **Event Types:**
    - [ ] `prediction.started` - Generation began processing
    - [ ] `prediction.completed` - Generation finished successfully
    - [ ] `prediction.failed` - Generation failed with error
    - [ ] `prediction.cancelled` - Generation was cancelled
  - [ ] **Error Handling:**
    - [ ] Handler timeout protection
    - [ ] Failed handler retry with exponential backoff
    - [ ] Dead letter queue for persistently failing events
  - [ ] **Testing (Unit):** 6+ tests covering routing logic, error handling

## Phase 2: Application Layer - Event Handlers and Use Cases

**Step 4: Create Webhook Event Handlers**
- [ ] **File:** `lib/image-generator/application/handlers/WebhookEventHandler.ts` (≤220 lines)
- [ ] **Handler 4.1: `WebhookEventHandler`**
  - [ ] **Methods:**
    - [ ] `handleReplicateWebhook(event: ReplicateWebhookEvent): Promise<void>` - Process Replicate events
    - [ ] `handleOpenAIWebhook(event: OpenAIWebhookEvent): Promise<void>` - Process OpenAI events
    - [ ] `validateEventAuthenticity(event: WebhookEvent): boolean` - Verify event source and integrity
    - [ ] `processStatusUpdate(externalId: string, status: string, data: any): Promise<void>` - Update generation
    - [ ] `handleImageCompletion(externalId: string, imageUrl: string, metadata: any): Promise<void>` - Process results
  - [ ] **Event Processing:**
    - [ ] Map provider-specific events to domain events
    - [ ] Update generation entities with new status
    - [ ] Trigger user notification delivery
    - [ ] Handle event deduplication gracefully
    - [ ] Queue image download and storage jobs
  - [ ] **Error Handling:**
    - [ ] Invalid event format with detailed logging
    - [ ] Generation not found scenarios with provider sync
    - [ ] Provider API rate limiting and circuit breaker
    - [ ] Transient failure retry with exponential backoff
  - [ ] **Testing (Unit):** 15+ tests covering all providers, error scenarios

- [ ] **File:** `lib/image-generator/application/handlers/JobEventHandler.ts` (≤180 lines)
- [ ] **Handler 4.2: `JobEventHandler`**
  - [ ] **Methods:**
    - [ ] `processWebhookEvent(job: WebhookJob): Promise<void>` - Handle incoming webhook jobs
    - [ ] `processImageDownload(job: ImageDownloadJob): Promise<void>` - Download and store images
    - [ ] `processNotificationDelivery(job: NotificationJob): Promise<void>` - Send real-time notifications
    - [ ] `processCleanupTask(job: CleanupJob): Promise<void>` - Cleanup expired data
    - [ ] `retryFailedJob(job: FailedJob): Promise<void>` - Handle job retry logic
  - [ ] **Job Processing:**
    - [ ] Webhook event validation and processing
    - [ ] Image download with retry and validation
    - [ ] Multi-channel notification delivery
    - [ ] Database cleanup and maintenance tasks
  - [ ] **Performance:**
    - [ ] Concurrent job processing with resource limits
    - [ ] Job prioritization based on user tier
    - [ ] Batch processing for efficiency
  - [ ] **Testing (Unit):** 10+ tests covering job processing, failures

**Step 5: Create Enhanced Generation Use Cases**
- [ ] **File:** `lib/image-generator/application/use-cases/GenerateImageWithWebhooksUseCase.ts` (≤200 lines)
- [ ] **Use Case 5.1: `GenerateImageWithWebhooksUseCase`**
  - [ ] **Input:** `{ prompt: string; userId: string; organizationId: string; settings?: GenerationSettings }`
  - [ ] **Logic:**
    - [ ] Validate user permissions and rate limits
    - [ ] Create Generation entity with pending status
    - [ ] Generate unique webhook URL for this generation
    - [ ] Save to repository and publish GenerationStartedEvent
    - [ ] Call provider with webhook configuration
    - [ ] Return generation ID immediately (no polling required)
  - [ ] **Webhook Configuration:**
    - [ ] Dynamic webhook URL with embedded generation ID
    - [ ] Provider-specific webhook signature setup
    - [ ] Event type filtering for relevant notifications
    - [ ] Webhook retry configuration and timeout settings
  - [ ] **Error Handling:**
    - [ ] Provider webhook setup failures with fallback
    - [ ] Invalid webhook URL validation
    - [ ] Automatic fallback to polling if webhooks unavailable
    - [ ] Rate limiting and quota enforcement
  - [ ] **Testing (Unit):** 12+ tests covering success path, webhook failures, fallback

- [ ] **File:** `lib/image-generator/application/use-cases/ProcessWebhookEventUseCase.ts` (≤150 lines)
- [ ] **Use Case 5.2: `ProcessWebhookEventUseCase`**
  - [ ] **Input:** `{ provider: string; eventType: string; payload: any; signature: string; timestamp: Date }`
  - [ ] **Logic:**
    - [ ] Validate webhook signature using provider secret
    - [ ] Parse provider-specific payload format
    - [ ] Find associated generation by external provider ID
    - [ ] Update generation status and publish domain events
    - [ ] Queue notification delivery job
    - [ ] Handle image download if generation completed
  - [ ] **Security:**
    - [ ] Cryptographic signature validation for each provider
    - [ ] Event timestamp validation to prevent replay attacks
    - [ ] Event deduplication using unique event IDs
    - [ ] Rate limiting per provider to prevent abuse
  - [ ] **Testing (Unit):** 10+ tests covering validation, processing, security

**Step 6: Create Supabase Real-Time Notification System**
- [ ] **File:** `lib/infrastructure/notifications/SupabaseNotificationService.ts` (≤200 lines)
- [ ] **Service 6.1: `SupabaseNotificationService`**
  - [ ] **Methods:**
    - [ ] `sendToUser(userId: string, event: NotificationEvent): Promise<void>` - Send via Supabase channel
    - [ ] `sendToOrganization(orgId: string, event: NotificationEvent): Promise<void>` - Broadcast to org channel
    - [ ] `createUserChannel(userId: string): Promise<string>` - Create user-specific channel
    - [ ] `createOrganizationChannel(orgId: string): Promise<string>` - Create org-specific channel
    - [ ] `broadcastSystemNotification(event: SystemEvent): Promise<void>` - System-wide messages
    - [ ] `getChannelStats(): Promise<ChannelStats>` - Channel usage metrics
  - [ ] **Supabase Integration:**
    - [ ] Supabase Realtime channels for instant delivery
    - [ ] Database table updates triggering real-time events
    - [ ] Row Level Security for secure channel access
    - [ ] PostgreSQL triggers for automatic event publishing
  - [ ] **Channel Strategy:**
    - [ ] `user:{userId}` - User-specific generation updates
    - [ ] `organization:{orgId}` - Organization-wide notifications
    - [ ] `system` - System maintenance and announcements
    - [ ] `generation:{generationId}` - Generation-specific updates
  - [ ] **Event Types:**
    - [ ] `GenerationStatusUpdated` - Status change with metadata
    - [ ] `GenerationCompleted` - Completion with image URL and stats
    - [ ] `GenerationFailed` - Failure with error details and retry options
    - [ ] `SystemNotification` - Maintenance, updates, announcements
  - [ ] **Fallback Handling:**
    - [ ] Database polling fallback if Realtime unavailable
    - [ ] Graceful degradation with user notification
    - [ ] Automatic reconnection with Supabase client
    - [ ] Offline event queuing in database
  - [ ] **Testing (Integration):** 15+ tests with Supabase Realtime channels

## Phase 3: Infrastructure Layer - Provider Integration and Real-Time Services

**Step 7: Update Provider Implementations for Webhooks**
- [ ] **File:** `lib/image-generator/infrastructure/providers/replicate/ReplicateWebhookProvider.ts` (≤220 lines)
- [ ] **Provider 7.1: `ReplicateWebhookProvider`**
  - [ ] **Methods:**
    - [ ] `generateImageWithWebhook(request: GenerationRequest, webhookUrl: string): Promise<GenerationResult>` - Start with webhook
    - [ ] `configureWebhook(predictionId: string, webhookUrl: string): Promise<void>` - Post-creation webhook setup
    - [ ] `validateWebhookSignature(payload: string, signature: string): boolean` - Verify Replicate signature
    - [ ] `parseWebhookPayload(payload: string): ReplicateWebhookEvent` - Parse event data
    - [ ] `getWebhookStatus(predictionId: string): Promise<WebhookStatus>` - Check webhook health
  - [ ] **Webhook Configuration:**
    - [ ] Event type filtering (prediction.completed, prediction.failed)
    - [ ] Webhook retry configuration with exponential backoff
    - [ ] Webhook URL validation and reachability testing
    - [ ] Webhook secret management and rotation
  - [ ] **Fallback Strategy:**
    - [ ] Automatic detection of webhook delivery failures
    - [ ] Seamless fallback to polling mode
    - [ ] Webhook health monitoring and automatic re-enablement
    - [ ] Provider status page integration for outage detection
  - [ ] **Testing (Unit):** 15+ tests covering webhook setup, validation, fallback

- [ ] **File:** `lib/image-generator/infrastructure/providers/openai/OpenAIWebhookProvider.ts` (≤180 lines)
- [ ] **Provider 7.2: `OpenAIWebhookProvider`** (Future-Ready)
  - [ ] **Methods:**
    - [ ] `generateImageWithWebhook(request: GenerationRequest, webhookUrl: string): Promise<GenerationResult>` - DALL-E with webhooks
    - [ ] `validateWebhookSignature(payload: string, signature: string): boolean` - Verify OpenAI signature
    - [ ] `parseWebhookPayload(payload: string): OpenAIWebhookEvent` - Parse OpenAI events
    - [ ] `handleOpenAISpecificEvents(event: OpenAIEvent): Promise<void>` - OpenAI-specific processing
  - [ ] **Implementation Notes:**
    - [ ] Ready for future OpenAI webhook support implementation
    - [ ] OpenAI API structure analysis and preparation
    - [ ] Signature validation preparation for OpenAI format
  - [ ] **Testing (Unit):** 8+ tests for future webhook support readiness

**Step 8: Create Supabase Realtime Integration**
- [ ] **File:** `lib/infrastructure/realtime/SupabaseRealtimeManager.ts` (≤180 lines)
- [ ] **Service 8.1: `SupabaseRealtimeManager`**
  - [ ] **Methods:**
    - [ ] `initialize(): Promise<void>` - Initialize Supabase Realtime client
    - [ ] `createChannel(name: string, config: ChannelConfig): RealtimeChannel` - Create new channel
    - [ ] `subscribeToTable(table: string, filters: TableFilter[]): Promise<void>` - Table change subscriptions
    - [ ] `broadcastToChannel(channel: string, event: string, payload: any): Promise<void>` - Channel broadcasting
    - [ ] `getChannelPresence(channel: string): Promise<PresenceState>` - Active user presence
    - [ ] `cleanup(): Promise<void>` - Clean up connections and subscriptions
  - [ ] **Database Triggers:**
    - [ ] PostgreSQL triggers on `image_generations` table for status changes
    - [ ] Real-time events on INSERT, UPDATE, DELETE operations
    - [ ] Custom notification payloads with generation metadata
    - [ ] Row Level Security enforcement on real-time events
  - [ ] **Channel Management:**
    - [ ] Dynamic channel creation and cleanup
    - [ ] User presence tracking and management
    - [ ] Channel-based authorization with RLS
    - [ ] Automatic reconnection handling
  - [ ] **Performance Optimization:**
    - [ ] Connection pooling and reuse
    - [ ] Event filtering at database level
    - [ ] Batch event processing for high throughput
    - [ ] Memory efficient payload serialization
  - [ ] **Testing (Integration):** 12+ tests with Supabase Realtime, database triggers

**Step 9: Create Webhook API Endpoints**
- [ ] **File:** `app/api/webhooks/replicate/route.ts` (≤120 lines)
- [ ] **API 9.1: Replicate Webhook Endpoint**
  - [ ] **POST /api/webhooks/replicate:**
    - [ ] Validate Replicate webhook signature using HMAC-SHA256
    - [ ] Parse and validate webhook payload structure
    - [ ] Extract generation ID from webhook URL or payload
    - [ ] Add webhook event to job queue for async processing
    - [ ] Return 200 OK immediately to prevent webhook retries
    - [ ] Log webhook events for debugging and audit
  - [ ] **Security Measures:**
    - [ ] Signature validation using Replicate webhook secret
    - [ ] Rate limiting per IP address with sliding window
    - [ ] Request size limits to prevent DoS attacks
    - [ ] Timestamp validation to prevent replay attacks
  - [ ] **Error Handling:**
    - [ ] Invalid signature returns 401 Unauthorized
    - [ ] Malformed payload returns 400 Bad Request
    - [ ] Queue failures return 500 with retry headers
    - [ ] Detailed error logging for debugging
  - [ ] **Testing (API):** 8+ tests covering webhook processing, security

- [ ] **File:** `app/api/webhooks/openai/route.ts` (≤100 lines)
- [ ] **API 9.2: OpenAI Webhook Endpoint** (Future-Ready)
  - [ ] Similar structure to Replicate endpoint
  - [ ] OpenAI-specific signature validation algorithm
  - [ ] OpenAI payload format parsing and validation
  - [ ] Ready for future OpenAI webhook support activation
  - [ ] **Testing (API):** 6+ tests for future OpenAI integration

## Phase 4: Presentation Layer - Real-Time UI Components

**Step 10: Create Supabase Real-Time Connection Management**
- [ ] **File:** `lib/image-generator/presentation/hooks/shared/useSupabaseRealtime.ts` (≤160 lines)
- [ ] **Hook 10.1: `useSupabaseRealtime`**
  - [ ] **Methods:**
    - [ ] `subscribeToChannel(channelName: string, config: ChannelConfig): RealtimeChannel` - Subscribe to Supabase channel
    - [ ] `unsubscribeFromChannel(channelName: string): void` - Unsubscribe from channel
    - [ ] `subscribeToTableChanges(table: string, filters: TableFilter[]): void` - Subscribe to table changes
    - [ ] `getChannelStatus(channelName: string): ChannelStatus` - Get channel connection status
    - [ ] `broadcast(channel: string, event: string, payload: any): Promise<void>` - Broadcast to channel
    - [ ] `getPresence(channel: string): PresenceState` - Get channel presence information
  - [ ] **Supabase Integration:**
    - [ ] Native Supabase Realtime client integration
    - [ ] Automatic authentication with current user session
    - [ ] Built-in reconnection and error handling
    - [ ] Database-driven real-time events (no custom WebSocket server needed)
  - [ ] **Channel Types:**
    - [ ] `user:{userId}` - User-specific generation updates
    - [ ] `organization:{orgId}` - Organization-wide notifications
    - [ ] `generation:{generationId}` - Generation-specific status updates
    - [ ] `system` - System-wide announcements and maintenance
  - [ ] **Features:**
    - [ ] Automatic subscription lifecycle management
    - [ ] Built-in presence and broadcasting capabilities
    - [ ] Row Level Security enforcement on real-time events
    - [ ] Graceful degradation to database polling if needed
    - [ ] Connection quality monitoring and reporting
  - [ ] **Testing (Hook):** 10+ tests covering Supabase Realtime functionality

- [ ] **File:** `lib/image-generator/presentation/hooks/specialized/useGenerationRealtime.ts` (≤140 lines)
- [ ] **Hook 10.2: `useGenerationRealtime`**
  - [ ] **Props:** `{ generationId: string; onStatusChange: (status: GenerationStatus) => void; enabled?: boolean }`
  - [ ] **Methods:**
    - [ ] Subscribe to `image_generations` table changes for specific generation
    - [ ] Handle Supabase real-time database events (UPDATE, INSERT)
    - [ ] Update React Query cache with new data from database
    - [ ] Manage Supabase channel subscription lifecycle with cleanup
    - [ ] Provide Supabase connection status and health
  - [ ] **Database Events Handled:**
    - [ ] `UPDATE` on `image_generations` table - Status and metadata changes
    - [ ] `INSERT` operations for new generations (if subscribed to user/org)
    - [ ] Row-level changes filtered by generation ID and user permissions
    - [ ] Real-time payload includes full generation row data
  - [ ] **Supabase Integration:**
    - [ ] Direct table subscription with Row Level Security enforcement
    - [ ] Automatic cache updates from database change events
    - [ ] Built-in conflict resolution with database as source of truth
    - [ ] No custom event mapping needed (database row = domain entity)
  - [ ] **Cache Integration:**
    - [ ] Automatic React Query cache updates from database events
    - [ ] Optimistic updates with database event confirmation
    - [ ] Cache invalidation strategies on generation completion
    - [ ] Seamless integration with existing query keys and patterns
  - [ ] **Testing (Hook):** 8+ tests covering Supabase real-time database events

**Step 11: Update Generation Components for Real-Time**
- [ ] **File:** `lib/image-generator/presentation/components/GenerationCard.tsx` (Update existing, ≤180 lines)
- [ ] **Component 11.1: Enhanced `GenerationCard`**
  - [ ] **New Features:**
    - [ ] Real-time status indicators with smooth animations
    - [ ] Progress visualization with accurate completion estimates
    - [ ] Instant completion notifications with celebration effects
    - [ ] Connection status indicator for debugging
    - [ ] Fallback mode indicator when using polling
  - [ ] **Integration:**
    - [ ] Replace existing polling with `useGenerationRealtime` hook
    - [ ] Remove polling dependencies and cleanup intervals
    - [ ] Add Supabase connection health monitoring display
    - [ ] Implement graceful degradation to database polling if needed
  - [ ] **Performance:**
    - [ ] Memoization of expensive calculations
    - [ ] Debounced status updates to prevent UI flicker
    - [ ] Lazy loading of non-critical components
  - [ ] **Testing (Component):** 8+ additional tests for real-time features

- [ ] **File:** `lib/image-generator/presentation/components/SupabaseRealtimeIndicator.tsx` (≤90 lines)
- [ ] **Component 11.2: `SupabaseRealtimeIndicator`**
  - [ ] **Props:** `{ showDetails?: boolean; className?: string; onReconnect?: () => void }`
  - [ ] **Features:**
    - [ ] Visual Supabase Realtime connection status with color coding
    - [ ] Channel subscription count display for debugging
    - [ ] Connection quality indicator and latency display
    - [ ] Debug information panel with channel details
    - [ ] Manual reconnection trigger for Supabase client
  - [ ] **Connection States:**
    - [ ] Connected (green indicator with pulse animation)
    - [ ] Connecting (yellow indicator with spinner)
    - [ ] Disconnected (red indicator with retry button)
    - [ ] Closed (gray indicator with manual reconnect option)
  - [ ] **Supabase Integration:**
    - [ ] Direct integration with Supabase Realtime client status
    - [ ] Channel health monitoring and subscription tracking
    - [ ] Built-in reconnection handling via Supabase client
    - [ ] Real-time latency and quality metrics display
  - [ ] **Accessibility:**
    - [ ] Screen reader announcements for status changes
    - [ ] Keyboard navigation support
    - [ ] High contrast mode compatibility
  - [ ] **Testing (Component):** 5+ tests covering Supabase connection states

**Step 12: Create Real-Time Dashboard Component**
- [ ] **File:** `lib/image-generator/presentation/components/RealtimeDashboard.tsx` (≤200 lines)
- [ ] **Component 12.1: `RealtimeDashboard`**
  - [ ] **Features:**
    - [ ] Live generation queue status display
    - [ ] Real-time system health monitoring
    - [ ] Active Supabase Realtime connections count
    - [ ] Provider webhook status indicators
    - [ ] Performance metrics visualization
  - [ ] **Metrics Displayed:**
    - [ ] Average generation time trends
    - [ ] Webhook delivery success rates
    - [ ] Active Supabase Realtime channels and subscriptions
    - [ ] Job queue depth and processing rate
    - [ ] Database real-time event throughput and latency
  - [ ] **Admin Features:**
    - [ ] System-wide notification broadcasting via Supabase channels
    - [ ] Emergency fallback to database polling activation
    - [ ] Provider webhook health testing
    - [ ] Manual job queue management and Supabase trigger monitoring
  - [ ] **Testing (Component):** 10+ tests covering dashboard functionality

## Phase 5: Migration Strategy and Deployment

**Step 13: Create Migration Infrastructure**
- [ ] **File:** `lib/infrastructure/migration/DualModeManager.ts` (≤160 lines)
- [ ] **Service 13.1: `DualModeManager`**
  - [ ] **Methods:**
    - [ ] `enableDualMode(): Promise<void>` - Start dual polling/webhook operation
    - [ ] `disableDualMode(): Promise<void>` - Switch to webhook-only mode
    - [ ] `getSystemStatus(): SystemStatus` - Current operation mode status
    - [ ] `validateDataConsistency(): Promise<ValidationResult>` - Compare polling vs webhook data
    - [ ] `switchToFallbackMode(): Promise<void>` - Emergency fallback to polling
  - [ ] **Dual Mode Features:**
    - [ ] Run both polling and webhooks simultaneously
    - [ ] Compare results for data consistency validation
    - [ ] Gradual user migration with percentage rollout
    - [ ] Real-time monitoring of both systems
  - [ ] **Safety Features:**
    - [ ] Automatic rollback on high error rates
    - [ ] Data consistency checks and alerts
    - [ ] Performance comparison metrics
    - [ ] Emergency manual override capabilities
  - [ ] **Testing (Integration):** 12+ tests covering migration scenarios

- [ ] **File:** `docs/migration/realtime-migration-runbook.md`
- [ ] **Document 13.2: Migration Runbook**
  - [ ] **Pre-Migration Checklist:**
    - [ ] Infrastructure setup verification (Redis, WebSocket server)
    - [ ] Provider webhook configuration testing
    - [ ] Load testing with expected traffic volumes
    - [ ] Rollback procedure verification
  - [ ] **Migration Phases:**
    - [ ] Phase 1: Infrastructure deployment with dual mode
    - [ ] Phase 2: 10% user rollout with monitoring
    - [ ] Phase 3: 50% user rollout with performance validation
    - [ ] Phase 4: 100% rollout with polling cleanup
  - [ ] **Monitoring and Alerts:**
    - [ ] Key metrics to monitor during migration
    - [ ] Alert thresholds and escalation procedures
    - [ ] Performance benchmarks and success criteria
  - [ ] **Rollback Procedures:**
    - [ ] Emergency rollback triggers and procedures
    - [ ] Data consistency recovery steps
    - [ ] Communication plan for user impact

**Step 14: Create Monitoring and Observability**
- [ ] **File:** `lib/infrastructure/monitoring/RealtimeMonitoring.ts` (≤200 lines)
- [ ] **Service 14.1: `RealtimeMonitoring`**
  - [ ] **Metrics Collection:**
    - [ ] Webhook delivery success rate and latency
    - [ ] WebSocket connection count and duration
    - [ ] Job queue depth and processing time
    - [ ] Event processing latency and throughput
    - [ ] Error rates by component and provider
  - [ ] **Alerting:**
    - [ ] Webhook failure rate exceeding 5% threshold
    - [ ] Job queue depth exceeding 1000 jobs
    - [ ] WebSocket connection failures above baseline
    - [ ] Provider API downtime detection
    - [ ] System resource utilization alerts
  - [ ] **Dashboards:**
    - [ ] Real-time event flow visualization
    - [ ] Connection health status overview
    - [ ] Performance metrics trends and comparisons
    - [ ] Error tracking and resolution status
  - [ ] **Performance Analysis:**
    - [ ] Latency percentiles (p50, p95, p99)
    - [ ] Throughput trends and capacity planning
    - [ ] Resource utilization optimization recommendations
  - [ ] **Testing (Integration):** 8+ tests covering monitoring scenarios

**Step 15: Performance Testing and Optimization**
- [ ] **Test 15.1: Load Testing Suite**
  - [ ] **Concurrent Generations:** Test 100+ simultaneous image generations
    - [ ] Measure webhook processing latency under load
    - [ ] Validate job queue performance with high throughput
    - [ ] Monitor system resource utilization patterns
  - [ ] **WebSocket Connections:** Test 1000+ concurrent connections
    - [ ] Connection establishment and maintenance performance
    - [ ] Message broadcasting latency and reliability
    - [ ] Memory usage patterns and garbage collection
  - [ ] **Job Queue Processing:** Test job queue with 10000+ queued jobs
    - [ ] Processing throughput and latency measurements
    - [ ] Worker scaling effectiveness and resource usage
    - [ ] Queue depth management and prioritization
  - [ ] **Database Performance:** Query optimization for event storage
    - [ ] Event insertion and retrieval performance
    - [ ] Index optimization for event queries
    - [ ] Connection pool management under load

- [ ] **Test 15.2: Failover and Resilience Testing**
  - [ ] **Provider Downtime Scenarios:** Test fallback to polling when webhooks fail
    - [ ] Automatic detection of webhook delivery failures
    - [ ] Seamless transition to polling mode
    - [ ] Recovery and re-enablement of webhooks
  - [ ] **Infrastructure Failures:** Test system resilience
    - [ ] Redis downtime and job queue resilience
    - [ ] WebSocket server failures and reconnection
    - [ ] Database connection failures and recovery
  - [ ] **Network Issues:** Test network partition scenarios
    - [ ] WebSocket reconnection logic effectiveness
    - [ ] Event buffering and replay capabilities
    - [ ] Graceful degradation user experience

---

**Implementation Timeline (Real-Time Architecture Upgrade):**

**Week 1: Infrastructure Foundation (Steps 1-6)**
- **Day 1:** Job queue infrastructure and domain event system
- **Day 2:** Webhook infrastructure and routing system
- **Day 3:** Real-time notification service and WebSocket foundation
- **Day 4:** Webhook event handlers and enhanced use cases
- **Day 5:** Integration testing and performance validation

**Week 2: Provider Integration and Supabase Real-Time Services (Steps 7-12)**
- **Day 1:** Provider webhook implementations and API endpoints
- **Day 2:** Supabase Realtime integration and database triggers
- **Day 3:** Real-time UI hooks with Supabase integration
- **Day 4:** Real-time dashboard and monitoring components
- **Day 5:** End-to-end testing and optimization

**Week 3: Migration and Production Deployment (Steps 13-15)**
- **Day 1:** Migration infrastructure and dual-mode operation
- **Day 2:** Monitoring, alerting, and observability setup
- **Day 3:** Load testing, performance optimization, and resilience testing
- **Day 4:** Production deployment with gradual rollout
- **Day 5:** Monitoring, fine-tuning, and documentation completion

**Success Metrics:**
- ✅ Zero polling API calls to providers after migration
- ✅ Sub-200ms average notification delivery time via Supabase Realtime
- ✅ 99.9% webhook delivery success rate
- ✅ Support for 1000+ concurrent Supabase Realtime connections
- ✅ 95% reduction in provider API costs
- ✅ Real-time UI updates with sub-second latency
- ✅ Graceful fallback to database polling in under 2% of cases
- ✅ 99.95% system uptime during migration

**DDD Compliance Verification:**
- ✅ All components under 250 lines with single responsibility principle
- ✅ Clean layer separation maintained throughout architecture
- ✅ Domain events properly isolated from infrastructure concerns
- ✅ Repository pattern preserved with event publishing integration
- ✅ Use cases focused on single business operations
- ✅ Infrastructure concerns properly abstracted from domain logic

**Architecture Transformation Benefits:**

| Current Polling Architecture | Target Supabase Real-Time Architecture |
|-----------------------------|-----------------------------|
| API call every 2-3 seconds | Zero polling API calls |
| 2-3 second status update delay | Sub-200ms Supabase real-time updates |
| High server load from polling | Database-driven efficiency |
| Provider rate limit risks | Providers push to us |
| Custom WebSocket infrastructure | Built-in Supabase Realtime |
| Complex connection management | Automatic Supabase reconnection |
| Custom state synchronization | Database-driven state sync |
| High operational costs | 95% cost reduction + no WebSocket server costs |

This implementation plan transforms the image generation system into a truly scalable, real-time architecture while maintaining strict adherence to DDD principles, golden-rule compliance, and clean architecture patterns. The zero-downtime migration strategy ensures continuous service availability during the transformation. 