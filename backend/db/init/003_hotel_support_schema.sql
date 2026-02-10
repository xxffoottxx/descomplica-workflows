-- Hotel Self-Service Support System Database Schema
-- Created: 2024-01-20
-- Purpose: Store chat sessions and analytics for hotel support system

-- ============================================================================
-- 1. Chat Sessions Table
-- ============================================================================
-- Stores conversation history and session metadata

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    conversation JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created
    ON chat_sessions(created_at DESC);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated
    ON chat_sessions(updated_at DESC);

-- Comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores chat conversation history and session data';
COMMENT ON COLUMN chat_sessions.session_id IS 'Unique session identifier (usually UUID)';
COMMENT ON COLUMN chat_sessions.conversation IS 'Array of message objects with role, content, and timestamp';
COMMENT ON COLUMN chat_sessions.metadata IS 'Additional session info like user_agent, ip, etc.';

-- ============================================================================
-- 2. Chat Analytics Table
-- ============================================================================
-- Stores detailed analytics for each query/response

CREATE TABLE IF NOT EXISTS chat_analytics (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    intent TEXT,
    intent_confidence DECIMAL(3,2),
    response_text TEXT,
    response_time_ms INTEGER,
    sources_used JSONB DEFAULT '[]'::jsonb,
    user_satisfied BOOLEAN,
    feedback_text TEXT,
    requires_human BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_session
    ON chat_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_intent
    ON chat_analytics(intent);

CREATE INDEX IF NOT EXISTS idx_analytics_created
    ON chat_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_satisfaction
    ON chat_analytics(user_satisfied)
    WHERE user_satisfied IS NOT NULL;

-- Comments
COMMENT ON TABLE chat_analytics IS 'Detailed analytics for each query/response interaction';
COMMENT ON COLUMN chat_analytics.intent IS 'Classified intent: room_info, service_info, policy_info, general';
COMMENT ON COLUMN chat_analytics.intent_confidence IS 'Confidence score from 0.00 to 1.00';
COMMENT ON COLUMN chat_analytics.response_time_ms IS 'Total response time in milliseconds';
COMMENT ON COLUMN chat_analytics.sources_used IS 'Array of Notion database records used';
COMMENT ON COLUMN chat_analytics.user_satisfied IS 'User feedback: true (thumbs up), false (thumbs down), null (no feedback)';

-- ============================================================================
-- 3. Analytics Views
-- ============================================================================
-- Useful views for reporting and dashboards

-- View: Daily Query Summary
CREATE OR REPLACE VIEW daily_query_summary AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_queries,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(response_time_ms) as avg_response_time_ms,
    COUNT(*) FILTER (WHERE intent = 'room_info') as room_queries,
    COUNT(*) FILTER (WHERE intent = 'service_info') as service_queries,
    COUNT(*) FILTER (WHERE intent = 'policy_info') as policy_queries,
    COUNT(*) FILTER (WHERE intent = 'general') as general_queries,
    COUNT(*) FILTER (WHERE user_satisfied = true) as satisfied_count,
    COUNT(*) FILTER (WHERE user_satisfied = false) as unsatisfied_count,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE user_satisfied = true) /
        NULLIF(COUNT(*) FILTER (WHERE user_satisfied IS NOT NULL), 0),
        2
    ) as satisfaction_rate
FROM chat_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_query_summary IS 'Daily aggregated statistics for chat analytics';

-- View: Top Queries (Most Common Questions)
CREATE OR REPLACE VIEW top_queries AS
SELECT
    query_text,
    intent,
    COUNT(*) as frequency,
    AVG(response_time_ms) as avg_response_time,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE user_satisfied = true) /
        NULLIF(COUNT(*) FILTER (WHERE user_satisfied IS NOT NULL), 0),
        2
    ) as satisfaction_rate
FROM chat_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query_text, intent
HAVING COUNT(*) > 1
ORDER BY frequency DESC
LIMIT 50;

COMMENT ON VIEW top_queries IS 'Most frequently asked questions in the last 30 days';

-- View: Intent Performance
CREATE OR REPLACE VIEW intent_performance AS
SELECT
    intent,
    COUNT(*) as query_count,
    AVG(response_time_ms) as avg_response_time_ms,
    MIN(response_time_ms) as min_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms,
    AVG(intent_confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE user_satisfied = true) as satisfied,
    COUNT(*) FILTER (WHERE user_satisfied = false) as unsatisfied,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE user_satisfied = true) /
        NULLIF(COUNT(*) FILTER (WHERE user_satisfied IS NOT NULL), 0),
        2
    ) as satisfaction_rate,
    COUNT(*) FILTER (WHERE requires_human = true) as escalations
FROM chat_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY intent
ORDER BY query_count DESC;

COMMENT ON VIEW intent_performance IS 'Performance metrics by intent type (last 7 days)';

-- ============================================================================
-- 4. Utility Functions
-- ============================================================================

-- Function: Clean old sessions (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_sessions
    WHERE updated_at < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_sessions IS 'Delete chat sessions older than specified days (default 90)';

-- Function: Get session statistics
CREATE OR REPLACE FUNCTION get_session_stats()
RETURNS TABLE(
    total_sessions BIGINT,
    active_sessions_24h BIGINT,
    avg_messages_per_session NUMERIC,
    total_analytics_records BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_sessions,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours')::BIGINT as active_sessions_24h,
        ROUND(AVG(jsonb_array_length(conversation)), 2) as avg_messages_per_session,
        (SELECT COUNT(*) FROM chat_analytics)::BIGINT as total_analytics_records
    FROM chat_sessions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_session_stats IS 'Get overall session statistics';

-- ============================================================================
-- 5. Sample Queries for Testing
-- ============================================================================

-- Test query: Check if tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'chat_%';

-- Test query: View recent sessions
-- SELECT session_id, created_at, updated_at,
--        jsonb_array_length(conversation) as message_count
-- FROM chat_sessions
-- ORDER BY updated_at DESC LIMIT 10;

-- Test query: View analytics summary
-- SELECT * FROM daily_query_summary LIMIT 7;

-- Test query: Get session stats
-- SELECT * FROM get_session_stats();

-- ============================================================================
-- 6. Grants (if needed for specific user)
-- ============================================================================

-- Uncomment and modify if you need specific user permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON chat_sessions TO n8n_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON chat_analytics TO n8n_user;
-- GRANT USAGE, SELECT ON SEQUENCE chat_analytics_id_seq TO n8n_user;
-- GRANT SELECT ON daily_query_summary TO n8n_user;
-- GRANT SELECT ON top_queries TO n8n_user;
-- GRANT SELECT ON intent_performance TO n8n_user;

-- ============================================================================
-- Schema Created Successfully
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Hotel Support System database schema created successfully!';
    RAISE NOTICE 'Tables created: chat_sessions, chat_analytics';
    RAISE NOTICE 'Views created: daily_query_summary, top_queries, intent_performance';
    RAISE NOTICE 'Functions created: cleanup_old_sessions, get_session_stats';
END $$;
