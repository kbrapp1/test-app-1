-- Drop redundant storage size function
-- The get_knowledge_vectors_storage_size function is redundant with existing get_vector_stats()
-- Using get_vector_stats() provides better performance and consistent API patterns

DROP FUNCTION IF EXISTS get_knowledge_vectors_storage_size(text, text);

-- Add comment to existing get_vector_stats function for clarity
COMMENT ON FUNCTION get_vector_stats IS 'Get comprehensive storage statistics for vector cache including size, count, and performance metrics. Use this instead of separate storage size functions.'; 