# ADR-001: Centralized Agent Execution Logging

**Status:** Proposed
**Date:** 2026-03-06
**Author:** Architect Agent
**Deciders:** OpenCode Team
**Related:** AGENTS.md, opencode.json

---

## Context

OpenCode is a multi-agent orchestration system with 17 specialized agents (build, orchestrator, explore, librarian, executor, code-reviewer, architect, etc.) and 91+ skills. Each agent execution generates valuable data including:
- Agent invocation chains and hierarchies
- Tool calls and outputs
- Session metadata (models used, token counts, execution time)
- Error traces and debugging information
- Decision rationale and plan execution details

Currently, logging is fragmented across:
- Sequential thinking MCP (thought logging)
- Individual agent memory (knowledge graph)
- Terminal output during execution
- No centralized queryable store for historical analysis

### Current State Analysis

**Existing Infrastructure:**
- Local-only architecture (config repository on developer machines)
- Bun/Node.js runtime
- Single dependency: `@opencode-ai/plugin`
- Memory MCP for knowledge graph storage
- Sequential thinking MCP for reasoning traces
- No persistent storage for execution logs

**Pain Points:**
1. No queryable history of agent executions
2. Difficult to debug multi-agent orchestration failures
3. No analytics on token usage, success rates, or bottlenecks
4. Logs are lost between sessions
5. Hard to audit agent behavior or measure performance

---

## Requirements

### Functional Requirements
1. **Log Storage**: Store all agent execution logs with metadata
2. **Query Capability**: Support filtering by agent, session, date, status
3. **Retention**: Configurable retention policies (e.g., 30 days, 90 days)
4. **Export**: Ability to export logs for external analysis
5. **Real-time**: Capture logs as they are generated

### Non-Functional Requirements
1. **Performance**: Minimal impact on agent execution speed (<5% overhead)
2. **Scalability**: Handle high-frequency logging (1000+ logs/day)
3. **Security**: No sensitive data leakage (API keys, credentials)
4. **Reliability**: Data integrity guarantees
5. **Privacy**: Data stays local by default (developer's machine)
6. **Maintenance**: Simple setup, minimal operational overhead
7. **Cost**: Low ongoing cost (free or <$5/month)

### Data Volume Estimates
Based on typical agent usage:
- **Logs per session**: 50-200 entries
- **Sessions per day**: 10-50
- **Daily volume**: 500-10,000 logs
- **Log size**: 0.5-2 KB each
- **Daily storage**: 250 KB - 20 MB
- **Monthly storage**: 7.5 MB - 600 MB (with compression)

---

## Decision

We evaluated two approaches for centralized logging:

### Option A: Local File-Based (SQLite/JSON)
**Recommended:** SQLite with structured JSON storage

### Option B: External Database (Supabase/PostgreSQL)

**Decision:** **Option A - Local SQLite with JSON storage**

---

## Trade-Off Analysis

### Option A: Local File-Based Logging

**Architecture:**
```
~/.config/opencode/
├── logs/
│   ├── agent-logs.db          # SQLite database
│   ├── archive/               # Compressed historical logs
│   └── .gitignore             # Exclude from version control
```

**Schema Design:**
```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  user_id TEXT,
  model TEXT,
  total_tokens INTEGER DEFAULT 0,
  agent_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('active', 'completed', 'failed'))
);

-- Agent executions table
CREATE TABLE agent_executions (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  agent_name TEXT NOT NULL,
  model TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  status TEXT CHECK(status IN ('running', 'success', 'failed', 'timeout')),
  token_count INTEGER DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Tool calls table
CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  agent_execution_id TEXT REFERENCES agent_executions(id),
  tool_name TEXT NOT NULL,
  input_json JSONB NOT NULL,
  output_json JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER,
  status TEXT CHECK(status IN ('success', 'failed', 'timeout')),
  FOREIGN KEY (agent_execution_id) REFERENCES agent_executions(id)
);

-- Thoughts table (sequential thinking)
CREATE TABLE thoughts (
  id TEXT PRIMARY KEY,
  agent_execution_id TEXT REFERENCES agent_executions(id),
  thought_number INTEGER,
  total_thoughts INTEGER,
  content TEXT NOT NULL,
  is_revision BOOLEAN DEFAULT FALSE,
  revises_thought INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_execution_id) REFERENCES agent_executions(id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_agent_executions_session ON agent_executions(session_id);
CREATE INDEX idx_agent_executions_agent ON agent_executions(agent_name);
CREATE INDEX idx_agent_executions_status ON agent_executions(status, started_at DESC);
CREATE INDEX idx_tool_calls_agent ON tool_calls(agent_execution_id);
CREATE INDEX idx_thoughts_agent ON thoughts(agent_execution_id);
```

**Pros:**
- ✅ **Zero network latency**: Local file I/O is extremely fast
- ✅ **No external dependencies**: No account setup, API keys, or billing
- ✅ **Privacy by default**: Data stays on developer's machine
- ✅ **Offline capable**: Works without internet connection
- ✅ **No ongoing costs**: Free forever
- ✅ **Simple migration**: SQLite is a single file; easy to backup/move
- ✅ **Full-text search**: SQLite FTS5 extension for searching logs
- ✅ **ACID compliance**: Data integrity guarantees
- ✅ **Mature ecosystem**: SQLite is battle-tested, 20+ years old
- ✅ **Low operational overhead**: No database maintenance required
- ✅ **Portable**: Database file works across platforms

**Cons:**
- ❌ **Single-user**: Not designed for multi-user scenarios
- ❌ **Storage bound**: Limited by local disk space
- ❌ **No built-in analytics**: Requires custom queries/visualization
- ❌ **No real-time monitoring**: Can't monitor across multiple machines
- ❌ **Manual backups**: User responsible for backups
- ❌ **Limited scalability**: Not suitable for high-volume (>1M logs/day)

**Technical Implementation:**
```javascript
// Logger service using better-sqlite3 (synchronous, fast)
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

class AgentLogger {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  initializeSchema() {
    this.db.exec(`
      -- Schema definition as above
    `);
  }

  // Session management
  startSession(userId, model) {
    const sessionId = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, model, status)
      VALUES (?, ?, ?, 'active')
    `);
    stmt.run(sessionId, userId, model);
    return sessionId;
  }

  endSession(sessionId, status) {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET ended_at = CURRENT_TIMESTAMP, status = ?
      WHERE id = ?
    `);
    stmt.run(status, sessionId);
  }

  // Agent execution logging
  logAgentStart(sessionId, agentName, model) {
    const executionId = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO agent_executions (id, session_id, agent_name, model, status)
      VALUES (?, ?, ?, ?, 'running')
    `);
    stmt.run(executionId, sessionId, agentName, model);
    return executionId;
  }

  logAgentEnd(executionId, status, tokenCount, errorMessage = null) {
    const stmt = this.db.prepare(`
      UPDATE agent_executions
      SET ended_at = CURRENT_TIMESTAMP, status = ?, token_count = ?, error_message = ?
      WHERE id = ?
    `);
    stmt.run(status, tokenCount, errorMessage, executionId);
  }

  // Tool call logging
  logToolCall(executionId, toolName, input, output, durationMs, status) {
    const stmt = this.db.prepare(`
      INSERT INTO tool_calls (id, agent_execution_id, tool_name, input_json, output_json, duration_ms, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), executionId, toolName, JSON.stringify(input),
             output ? JSON.stringify(output) : null, durationMs, status);
  }

  // Query methods
  getSessionLogs(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_executions
      WHERE session_id = ?
      ORDER BY started_at
    `);
    return stmt.all(sessionId);
  }

  getAgentLogs(agentName, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT ae.*, s.user_id, s.model
      FROM agent_executions ae
      JOIN sessions s ON ae.session_id = s.id
      WHERE ae.agent_name = ?
      ORDER BY ae.started_at DESC
      LIMIT ?
    `);
    return stmt.all(agentName, limit);
  }

  getFailedSessions(days = 7) {
    const stmt = this.db.prepare(`
      SELECT s.*, COUNT(ae.id) as agent_count
      FROM sessions s
      LEFT JOIN agent_executions ae ON s.id = ae.session_id
      WHERE s.status = 'failed'
      AND s.started_at > datetime('now', '-' || ? || ' days')
      GROUP BY s.id
      ORDER BY s.started_at DESC
    `);
    return stmt.all(days);
  }
}
```

---

### Option B: External Database (Supabase/PostgreSQL)

**Architecture:**
```
Supabase PostgreSQL
├── Public schema (RLS policies)
│   ├── sessions table
│   ├── agent_executions table
│   ├── tool_calls table
│   └── thoughts table
└── Storage
    └── Log archives (exported data)
```

**Schema Design:**
```sql
-- Similar to SQLite but with PostgreSQL-specific features
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  user_id TEXT, -- Derived from session/cookie
  model TEXT NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  agent_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('active', 'completed', 'failed'))
);

-- Agent executions table
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  model TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT CHECK(status IN ('running', 'success', 'failed', 'timeout')),
  token_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

-- Tool calls table
CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input_json JSONB NOT NULL,
  output_json JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  status TEXT CHECK(status IN ('success', 'failed', 'timeout'))
);

-- Thoughts table
CREATE TABLE thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
  thought_number INTEGER NOT NULL,
  total_thoughts INTEGER,
  content TEXT NOT NULL,
  is_revision BOOLEAN DEFAULT FALSE,
  revises_thought INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = current_setting('app.user_id')::text);

-- Indexes
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX idx_agent_executions_session ON agent_executions(session_id);
CREATE INDEX idx_agent_executions_agent ON agent_executions(agent_name);
CREATE INDEX idx_agent_executions_status ON agent_executions(status, started_at DESC);
CREATE INDEX idx_tool_calls_agent ON tool_calls(agent_execution_id);
CREATE INDEX idx_thoughts_agent ON thoughts(agent_execution_id);
```

**Pros:**
- ✅ **Multi-user support**: Natural fit for team collaboration
- ✅ **Built-in analytics**: Supabase Dashboard provides query interface
- ✅ **Real-time subscriptions**: PostgreSQL LISTEN/NOTIFY for monitoring
- ✅ **Automatic backups**: Supabase handles backups
- ✅ **Scalability**: Handles high volumes (millions of logs)
- ✅ **Cloud hosting**: No local storage constraints
- ✅ **API access**: Supabase REST API for external tools
- ✅ **Edge functions**: Serverless functions for log processing
- ✅ **Row-Level Security**: Fine-grained access control

**Cons:**
- ❌ **Network latency**: HTTP/WS overhead for each log entry
- ❌ **External dependency**: Requires Supabase account and setup
- ❌ **Privacy concerns**: Logs stored in cloud (potential data leakage)
- ❌ **Internet required**: Breaks offline workflows
- ❌ **Cost**: Free tier limits (500 MB, 2 GB bandwidth); paid tier required for production
- ❌ **Complex setup**: Environment variables, auth, API keys
- ❌ **Rate limiting**: Free tier may throttle high-frequency logging
- ❌ **Vendor lock-in**: Migration to another provider requires data export
- ❌ **Ongoing billing**: Requires payment method, even if minimal

**Cost Analysis (Supabase Free Tier):**
- **Storage**: 500 MB (logs + indexes)
- **Bandwidth**: 2 GB/month (log writes + queries)
- **Database Size**: 500 MB PostgreSQL
- **Realtime**: 200 concurrent connections
- **Edge Functions**: 500K requests/month

**Estimated Usage:**
- Daily logs: 500-10,000 entries × 1 KB = 0.5-10 MB/day
- Monthly logs: 15-300 MB/month (within free tier)
- Query bandwidth: 100-500 MB/month
- **Verdict**: Free tier sufficient for personal use, but close to limits for heavy usage

**Paid Tier Requirements (Pro - $25/month):**
- 8 GB database storage
- 50 GB bandwidth
- No rate limits
- Daily backups

**Technical Implementation:**
```javascript
// Logger service using Supabase client
import { createClient } from '@supabase/supabase-js';

class AgentLogger {
  constructor(supabaseUrl, supabaseKey, userId) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { 'x-user-id': userId } }
    });
    this.userId = userId;
  }

  // Session management
  async startSession(model) {
    const { data, error } = await this.client
      .from('sessions')
      .insert({
        user_id: this.userId,
        model,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async endSession(sessionId, status) {
    const { error } = await this.client
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        status
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Agent execution logging
  async logAgentStart(sessionId, agentName, model) {
    const { data, error } = await this.client
      .from('agent_executions')
      .insert({
        session_id: sessionId,
        agent_name: agentName,
        model,
        status: 'running'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async logAgentEnd(executionId, status, tokenCount, errorMessage = null) {
    const { error } = await this.client
      .from('agent_executions')
      .update({
        ended_at: new Date().toISOString(),
        status,
        token_count: tokenCount,
        error_message: errorMessage
      })
      .eq('id', executionId);

    if (error) throw error;
  }

  // Tool call logging
  async logToolCall(executionId, toolName, input, output, durationMs, status) {
    const { error } = await this.client
      .from('tool_calls')
      .insert({
        agent_execution_id: executionId,
        tool_name: toolName,
        input_json: input,
        output_json: output || null,
        duration_ms: durationMs,
        status
      });

    if (error) throw error;
  }

  // Query methods
  async getSessionLogs(sessionId) {
    const { data, error } = await this.client
      .from('agent_executions')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at');

    if (error) throw error;
    return data;
  }

  async getAgentLogs(agentName, limit = 100) {
    const { data, error } = await this.client
      .from('agent_executions')
      .select('*, sessions!inner(user_id, model)')
      .eq('agent_name', agentName)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getFailedSessions(days = 7) {
    const { data, error } = await this.client
      .from('sessions')
      .select(`
        *,
        agent_executions(count)
      `)
      .eq('status', 'failed')
      .gt('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
```

---

## Comparison Matrix

| Criteria | SQLite (Local) | Supabase (Cloud) | Winner |
|----------|---------------|-------------------|---------|
| **Performance** | <1ms latency | 50-200ms latency | SQLite |
| **Privacy** | 100% local | Cloud storage | SQLite |
| **Cost** | Free forever | $0 (free) or $25/mo (pro) | SQLite |
| **Setup Complexity** | Simple (1 file) | Medium (account, env vars) | SQLite |
| **Offline Support** | Full | None | SQLite |
| **Multi-User** | No | Yes | Supabase |
| **Scalability** | ~1M logs/day | Unlimited | Supabase |
| **Analytics** | Custom queries | Built-in dashboard | Supabase |
| **Real-time Monitoring** | No | Yes (subscriptions) | Supabase |
| **Backups** | Manual | Automatic | Supabase |
| **Maintenance** | None | Low | Tie |
| **Data Export** | SQL dump | CSV/JSON export | Tie |

---

## Rationale

### Why SQLite (Option A) is Recommended

**1. Alignment with OpenCode Philosophy**
- OpenCode is a **config-only repo** designed for **local execution**
- Adding external dependencies contradicts the "simple, local-first" design
- Maintains the "zero-config" user experience

**2. Privacy and Security**
- Agent logs may contain sensitive code snippets, file paths, or project-specific context
- Local storage ensures no data leaves the developer's machine
- Aligns with developer expectations for a config repository

**3. Simplicity and Reliability**
- No account setup, no API keys, no billing
- Works offline (critical for local development)
- Single-file database: easy to backup, move, or delete
- No network failures or rate limits

**4. Cost Effectiveness**
- Free forever, no ongoing costs
- No risk of hitting free tier limits
- No surprise bills

**5. Performance**
- Zero network latency
- SQLite is extremely fast for read/write operations
- No impact on agent execution speed (<5% overhead target)

**6. Sufficient for Use Case**
- Single-user scenario (each developer has their own config)
- Moderate volume (500-10,000 logs/day)
- No need for multi-user collaboration on logs
- SQLite can handle millions of records easily

### When to Consider Supabase (Option B)

Option B becomes viable if:
1. **Team Collaboration**: Multiple developers need shared log access
2. **Cross-Machine Monitoring**: Need to monitor logs across multiple machines
3. **Advanced Analytics**: Require dashboards, visualizations, or ML on logs
4. **High Volume**: Logging >1M logs/day (unlikely for this use case)
5. **Cloud-Native**: OpenCode evolves to a cloud-hosted service

---

## Implementation Plan

### Phase 1: Core Logger Service (SQLite)
**Effort:** 2-3 days

1. **Dependencies**
   ```json
   {
     "better-sqlite3": "^9.0.0",
     "uuid": "^9.0.0"
   }
   ```

2. **Create Logger Module**
   - `plugins/logger.js` - Core logger service
   - `plugins/schema.sql` - Database schema
   - `plugins/query.js` - Query utilities

3. **Integration Points**
   - Hook into agent lifecycle (start/end callbacks)
   - Wrap tool calls to capture input/output
   - Connect to sequential thinking MCP for thought logging

4. **CLI Tools**
   - `bun run logs:query` - Query logs with filters
   - `bun run logs:export` - Export to JSON/CSV
   - `bun run logs:stats` - Show usage statistics

### Phase 2: Retention and Archival
**Effort:** 1 day

1. **Retention Policies**
   - Configurable via `opencode.json`
   - Default: keep 30 days of logs
   - Archive old logs to compressed files

2. **Automatic Cleanup**
   - Scheduled job to delete/archive old logs
   - Preserve failed sessions longer (90 days)

### Phase 3: Query Interface
**Effort:** 2 days

1. **SQL Query Interface**
   - Interactive CLI for ad-hoc queries
   - Pre-built queries (failed sessions, slow agents, etc.)

2. **Full-Text Search**
   - SQLite FTS5 for searching log content
   - Search by agent name, tool name, error messages

### Phase 4: Integration Tests
**Effort:** 1 day

1. **Test Coverage**
   - Unit tests for logger methods
   - Integration tests for agent lifecycle hooks
   - Performance tests (verify <5% overhead)

### Total Effort: 6-7 days

---

## Alternatives Considered

### Alternative 1: JSON Lines (newline-delimited JSON)
- **Pros**: Simple, human-readable, no dependencies
- **Cons**: Slow for large files, no indexing, difficult to query
- **Rejected**: SQLite provides same simplicity with better performance

### Alternative 2: Loki (Grafana Loki)
- **Pros**: Purpose-built log aggregation, query language (LogQL)
- **Cons**: Requires server setup, overkill for local use
- **Rejected**: Too complex for config-only repo

### Alternative 3: File System (one file per session)
- **Pros**: Simple, human-readable
- **Cons**: Thousands of files, hard to query, no indexing
- **Rejected**: SQLite is better for structured data

### Alternative 4: MongoDB
- **Pros**: Flexible schema, good for nested data
- **Cons**: Requires server, heavier than SQLite, overkill
- **Rejected**: SQLite sufficient, simpler setup

---

## Success Metrics

**Technical Metrics:**
- [ ] Logger overhead <5% of agent execution time
- [ ] Query response time <100ms for typical queries
- [ ] Database size <1 GB after 90 days of usage
- [ ] 100% uptime (no logger failures)

**User Experience Metrics:**
- [ ] Setup time <5 minutes (install deps, run init)
- [ ] Query logs in <10 seconds
- [ ] No additional configuration required for basic usage

**Data Integrity Metrics:**
- [ ] 100% of agent executions logged
- [ ] No log loss during crashes (SQLite WAL mode)
- [ ] Accurate token counts and timestamps

---

## Risks and Mitigations

### Risk 1: Database Corruption
**Likelihood:** Low
**Impact:** High

**Mitigation:**
- Use SQLite WAL (Write-Ahead Logging) mode for crash recovery
- Implement database integrity checks on startup
- Provide backup/restore utilities
- Auto-corruption detection and alerting

### Risk 2: Performance Impact on Agent Execution
**Likelihood:** Medium
**Impact:** Medium

**Mitigation:**
- Asynchronous logging (queue writes to background)
- Batch inserts for high-frequency logs
- Benchmark logging overhead during development
- Provide option to disable logging if needed

### Risk 3: Disk Space Exhaustion
**Likelihood:** Low
**Impact:** Medium

**Mitigation:**
- Automatic retention policies (delete old logs)
- Alert when disk space <1 GB
- Archive to compressed files instead of delete
- Provide cleanup commands

### Risk 4: Sensitive Data Leakage
**Likelihood:** Medium
**Impact:** High

**Mitigation:**
- Sanitize logs before storage (remove API keys, passwords)
- Implement redaction patterns for sensitive data
- Store logs in `~/.config/opencode/logs/` (local-only)
- Document what is logged in AGENTS.md

### Risk 5: SQLite File Locking Issues
**Likelihood:** Low
**Impact:** Low

**Mitigation:**
- Use better-sqlite3 (synchronous, handles locking well)
- Single-writer model (no concurrent writes)
- Connection pooling if multiple processes write

---

## Open Questions

1. **Retention Policy**: Should default retention be 30, 60, or 90 days?
2. **Sensitive Data Redaction**: What patterns should be automatically redacted?
3. **Query Interface**: CLI vs. web UI for querying logs?
4. **Compression**: Should logs be compressed on write or during archival?
5. **Backup Strategy**: Should logs be included in version control backups?

---

## Next Steps

1. **Validate Requirements**: Confirm requirements with stakeholders
2. **Prototype**: Build a minimal SQLite logger prototype
3. **Benchmark**: Measure performance impact on agent execution
4. **Review**: Present this ADR to team for feedback
5. **Implement**: Follow implementation plan (Phase 1-4)

---

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Row-Level Security in PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Confidence:** 0.95

**Decision is Recommended: Proceed with SQLite-based local logging**
