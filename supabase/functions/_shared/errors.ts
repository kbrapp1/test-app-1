// General Errors
export const INTERNAL_SERVER_ERROR = { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.', error: 'internal_server_error' };
export const USER_JWT_NOT_FOUND = { code: 'USER_JWT_NOT_FOUND', message: 'User JWT not found or invalid.', error: 'user_jwt_not_found' };
export const MISSING_REQUIRED_PARAMS = { code: 'MISSING_REQUIRED_PARAMS', message: 'Missing required parameters.', error: 'missing_required_params' };
export const SERVICE_ROLE_KEY_MISSING = { code: 'SERVICE_ROLE_KEY_MISSING', message: 'Service role key is not configured.', error: 'service_role_key_missing' };
export const SUPABASE_URL_MISSING = { code: 'SUPABASE_URL_MISSING', message: 'Supabase URL is not configured.', error: 'supabase_url_missing' };

// Org/User specific errors
export const USER_NOT_ADMIN = { code: 'USER_NOT_ADMIN', message: 'User is not an admin of the organization.', error: 'user_not_admin' };
export const ORGANIZATION_NOT_FOUND = { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.', error: 'organization_not_found' };
export const USER_METADATA_MISSING = { code: 'USER_METADATA_MISSING', message: 'User metadata is missing necessary invitation details.', error: 'user_metadata_missing' };
export const ORG_ID_OR_ROLE_ID_MISSING = { code: 'ORG_ID_OR_ROLE_ID_MISSING', message: 'Organization ID or Role ID is missing in user metadata.', error: 'org_id_or_role_id_missing' };
export const MEMBERSHIP_INSERT_FAILED = { code: 'MEMBERSHIP_INSERT_FAILED', message: 'Failed to insert organization membership.', error: 'membership_insert_failed' };
export const USER_APP_METADATA_UPDATE_FAILED = { code: 'USER_APP_METADATA_UPDATE_FAILED', message: 'Failed to update user app metadata.', error: 'user_app_metadata_update_failed' };
export const PROFILE_NOT_FOUND = { code: 'PROFILE_NOT_FOUND', message: 'User profile not found.', error: 'profile_not_found' };
export const ROLE_NOT_FOUND = { code: 'ROLE_NOT_FOUND', message: 'Specified role not found.', error: 'role_not_found' };
export const USER_ALREADY_EXISTS_IN_ORG = { code: 'USER_ALREADY_EXISTS_IN_ORG', message: 'User is already a member of this organization.', error: 'user_already_exists_in_org' };
export const EMAIL_SEND_FAILED = { code: 'EMAIL_SEND_FAILED', message: 'Failed to send invitation email.', error: 'email_send_failed' };
export const AUTH_ADMIN_ERROR = { code: 'AUTH_ADMIN_ERROR', message: 'An error occurred with an auth admin operation.', error: 'auth_admin_error' };

// Add any other shared error constants here 