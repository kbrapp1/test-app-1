// Composition Root
export { ChatbotWidgetCompositionRoot } from './composition/ChatbotWidgetCompositionRoot';

// Repository Implementations
export { ChatbotConfigSupabaseRepository } from './persistence/supabase/ChatbotConfigSupabaseRepository';
export { ChatSessionSupabaseRepository } from './persistence/supabase/ChatSessionSupabaseRepository';
export { ChatMessageSupabaseRepository } from './persistence/supabase/ChatMessageSupabaseRepository';
export { LeadSupabaseRepository } from './persistence/supabase/LeadSupabaseRepository';

// Mappers
export { ChatbotConfigMapper } from './persistence/supabase/mappers/ChatbotConfigMapper';
export { ChatSessionMapper } from './persistence/supabase/mappers/ChatSessionMapper';
export { ChatMessageMapper } from './persistence/supabase/mappers/ChatMessageMapper';
export { LeadMapper } from './persistence/supabase/mappers/LeadMapper';

// Types
export type { RawChatbotConfigDbRecord, InsertChatbotConfigData, UpdateChatbotConfigData } from './persistence/supabase/mappers/ChatbotConfigMapper';
export type { RawChatSessionDbRecord, InsertChatSessionData, UpdateChatSessionData } from './persistence/supabase/mappers/ChatSessionMapper';
export type { RawChatMessageDbRecord, InsertChatMessageData, UpdateChatMessageData } from './persistence/supabase/mappers/ChatMessageMapper';
export type { RawLeadDbRecord, InsertLeadData, UpdateLeadData } from './persistence/supabase/mappers/LeadMapper'; 