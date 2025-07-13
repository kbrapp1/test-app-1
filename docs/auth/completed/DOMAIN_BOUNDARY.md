/**
 * AUTH DOMAIN BOUNDARY
 * 
 * BOUNDED CONTEXT: Authentication and Authorization Services
 * 
 * UBIQUITOUS LANGUAGE:
 * - User: System user with authentication credentials and profile
 * - Profile: User's personal information and preferences
 * - Role: Named collection of permissions (admin, editor, member, viewer, visitor)
 * - Permission: Granular authorization to perform specific actions (namespace:action format)
 * - Organization: Multi-tenant context for user access
 * - Session: Authenticated user's active connection to the system
 * - Token: JWT access token containing user claims and organization context
 * - Membership: User's association with an organization and assigned role
 * - SuperAdmin: Special role with cross-organization access capabilities
 * - AuthContext: Authenticated user with organization context for operations
 * 
 * AGGREGATES:
 * - UserAggregate: User identity, profile, and authentication state
 * - OrganizationMembershipAggregate: User's role and permissions within organizations
 * - SessionAggregate: Active user session with token and organization context
 * 
 * OWNS:
 * - User authentication and identity management
 * - Role-based access control (RBAC) system
 * - Organization membership and context switching
 * - JWT token management and validation
 * - Permission checking and authorization
 * - User profile management
 * - Session lifecycle management
 * - Super admin functionality and cross-org access
 * - Authentication middleware and wrappers
 * - Global authentication service for performance optimization
 * 
 * DOES NOT OWN:
 * - Business domain logic (chatbot, DAM, TTS, etc.)
 * - External system integrations (except auth providers)
 * - UI components (except auth-specific ones)
 * - Database schema management
 * - Email/notification sending
 * - Feature-specific permissions (these are defined here but owned by respective domains)
 * 
 * PUBLISHES EVENTS:
 * - UserAuthenticatedEvent: When user successfully logs in
 * - UserLoggedOutEvent: When user logs out
 * - OrganizationSwitchedEvent: When user changes active organization
 * - PasswordResetEvent: When user resets password
 * - MembershipCreatedEvent: When user joins organization
 * - RoleChangedEvent: When user's role is updated
 * - SuperAdminAccessGrantedEvent: When super admin privileges are granted
 * - AuthenticationCacheInvalidatedEvent: When auth cache needs refresh
 * 
 * SUBSCRIBES TO EVENTS:
 * - SecurityViolationDetectedEvent: From monitoring domain
 * - OrganizationCreatedEvent: From organization domain
 * - FeatureAccessRequestedEvent: From various domains for permission checks
 * 
 * EXTERNAL DEPENDENCIES:
 * - Supabase Auth: Identity provider and session management
 * - JWT: Token format and validation
 * - Database: User profiles, roles, permissions, memberships
 * - Shared Infrastructure: ApiDeduplicationService, GlobalAuthenticationService
 * 
 * ANTI-CORRUPTION LAYERS:
 * - SupabaseAuthAdapter: Translates between Supabase auth and domain models
 * - JwtTokenAdapter: Handles JWT token parsing and validation
 * - DatabaseUserAdapter: Maps database user records to domain entities
 * 
 * INTEGRATION PATTERNS:
 * - Customer-Supplier: Auth → All other domains (auth provides services)
 * - Shared Kernel: Common auth types and interfaces used across domains
 * - Conformist: Other domains conform to auth's permission model
 * 
 * CURRENT VIOLATIONS (TO BE FIXED):
 * - Business domain permissions mixed with auth domain (TTS, DAM, etc.)
 * - Infrastructure services scattered across layers
 * - Missing proper domain events and error types
 * - No composition root for dependency injection
 * - Presentation layer mixed with other concerns
 */ 