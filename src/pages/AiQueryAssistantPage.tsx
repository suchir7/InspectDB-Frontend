import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  Code,
  Database,
  Info,
  Lightbulb,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sliders,
  History,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import {
  ChatMessage,
  GenerateQueryResponse,
  AiServiceStatus,
  CompatibilityReport,
  MongoTestResult,
  AiQueryHistoryEntry
} from '../types';
import { DemoBanner } from '../components/common/DemoBanner';

const SUGGESTED_QUESTIONS = [
  { label: "Simple Nested Query", q: "Find reports with findings in Main Switchgear Enclosure SG-02." },
  { label: "Array ($elemMatch)", q: "Find all reports with high-severity findings." },
  { label: "Complex Nested Query", q: "Find electrical reports with open issues under NEC 110.14." },
  { label: "Incompatible ($elemMatch in $all)", q: "Find reports where findings match all tags with elemMatch" },
  { label: "Behavior Difference (Regex)", q: "Find inspection reports by inspector named Sarah." }
];

const LOCAL_STORAGE_HISTORY_KEY = 'inspectdb_ai_query_history';

export const AiQueryAssistantPage: React.FC = () => {
  const [targetVersion, setTargetVersion] = useState<string>('5.0');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: "Hello! I am your AI Amazon DocumentDB Query Assistant & Local Compatibility Analyzer. Ask me any question in natural language, and I will generate the MongoDB query filter, test its read-only execution against your local MongoDB database, and analyze DocumentDB compatibility against the official AWS Rules Engine.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);
  const engineName = aiStatus?.storage_mode === 'documentdb' ? 'Amazon DocumentDB' : 'Local MongoDB';
  const [historyOpen, setHistoryOpen] = useState(false);
  const [queryHistory, setQueryHistory] = useState<AiQueryHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await api.getAiStatus();
        setAiStatus(status);
        if (status.documentdb_target_version) {
          setTargetVersion(status.documentdb_target_version);
        }
      } catch (err) {
        // ignore offline check
      }
    };
    fetchStatus();
  }, []);

  const saveHistoryItem = (
    prompt: string,
    resp: GenerateQueryResponse
  ) => {
    if (!resp.query) return;
    const historyItem: AiQueryHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user_request: prompt,
      generated_query: resp.query,
      operation: resp.operation || 'find',
      mongo_execution_status: resp.mongo_test_result?.status || 'unavailable',
      mongo_execution_time_ms: resp.mongo_test_result?.execution_time_ms || 0,
      documents_matched: resp.mongo_test_result?.documents_matched || 0,
      documentdb_compatibility_status: resp.compatibility?.status || 'UNKNOWN',
      detected_issues: resp.compatibility?.issues?.map(i => i.feature) || [],
      has_alternative: Boolean(resp.compatibility?.alternative_query)
    };

    setQueryHistory(prev => {
      const updated = [historyItem, ...prev].slice(0, 30);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage quota errors
      }
      return updated;
    });
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const tempAsstMsg: ChatMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: `Generating query, executing local MongoDB test, and analyzing DocumentDB ${targetVersion} compatibility...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: true
    };

    setMessages(prev => [...prev, userMsg, tempAsstMsg]);
    setInput('');
    setLoading(true);

    try {
      const response: GenerateQueryResponse = await api.generateAiQuery({
        question: textToSend,
        target_version: targetVersion,
        execute_local_test: true
      });

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              text: response.explanation,
              response,
              loading: false,
              error: response.error || null
            };
          }
          return msg;
        })
      );

      saveHistoryItem(textToSend, response);

    } catch (err: any) {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              text: "I encountered an error generating the database query. Please ensure the backend server is running and try again.",
              loading: false,
              error: err.message || 'API request failed'
            };
          }
          return msg;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuery = (queryObj: any, copyKey: string) => {
    const jsonStr = JSON.stringify(queryObj, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(copyKey);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: "Conversation cleared. Feel free to ask a new question about inspection report queries or DocumentDB compatibility!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const toggleSampleDocs = (msgId: string) => {
    setExpandedDocs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - var(--topbar-height) - 3rem)' }}>
      <DemoBanner message={`${engineName} Testing + Amazon DocumentDB Compatibility: Generated queries are tested read-only against ${engineName} and checked against official AWS DocumentDB Compatibility rules.`} />

      {/* Main Chat Container */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        position: 'relative'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  AI Query Assistant & Compatibility Analyzer
                </h3>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  Read-Only Safe
                </span>
                {aiStatus?.local_mongodb_available ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                    {engineName} Online
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    {engineName} Offline (Simulation)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Translates questions into MongoDB queries, tests execution locally, and checks Amazon DocumentDB compatibility
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Version Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <Sliders size={14} color="var(--color-primary)" />
              <span>Target Engine:</span>
              <select
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                className="form-control"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  height: 'auto'
                }}
              >
                <option value="5.0">DocumentDB 5.0 (Default)</option>
                <option value="4.0">DocumentDB 4.0</option>
                <option value="3.6">DocumentDB 3.6</option>
                <option value="8.0">DocumentDB 8.0</option>
              </select>
            </div>

            {/* History Toggle */}
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`btn btn-sm ${historyOpen ? 'btn-primary' : 'btn-secondary'}`}
              title="Toggle Query History"
            >
              <History size={14} />
              <span>History ({queryHistory.length})</span>
            </button>

            <button
              onClick={handleClearChat}
              className="btn btn-secondary btn-sm"
              title="Clear chat history"
              disabled={loading}
            >
              <Trash2 size={14} />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* API Key Status Notice Banner (if unconfigured) */}
        {aiStatus && !aiStatus.gemini_configured && (
          <div style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            fontSize: '0.8rem',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={15} color="#d97706" style={{ flexShrink: 0 }} />
              <span>
                <strong>Deterministic Fallback Mode:</strong> Running with deterministic schema-guided pattern templates. Set <code>GEMINI_API_KEY</code> in <code>backend/.env</code> for generative AI.
              </span>
            </div>
          </div>
        )}

        {/* Content Area with optional History Sidebar */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Chat Messages Scrollable Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backgroundColor: 'var(--color-bg-app)'
          }}>
            {messages.map((msg) => {
              const resp = msg.response;
              const mongo = resp?.mongo_test_result;
              const compat: CompatibilityReport | undefined = resp?.compatibility || undefined;
              const isCompat = compat?.status === 'COMPATIBLE';
              const isIncompat = compat?.status === 'INCOMPATIBLE';
              const isBehaviorDiff = compat?.status === 'BEHAVIOR_DIFFERENCE';
              const isPartial = compat?.status === 'PARTIALLY_COMPATIBLE';
              const showSamples = Boolean(expandedDocs[msg.id]);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    alignItems: 'flex-start',
                    maxWidth: msg.sender === 'user' ? '80%' : '96%',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Bubble Body */}
                  <div style={{
                    backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--color-text-primary)',
                    padding: '0.85rem 1.15rem',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    width: msg.sender === 'user' ? 'auto' : '100%'
                  }}>
                    {/* Header info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      fontSize: '0.72rem',
                      color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-muted)'
                    }}>
                      <span style={{ fontWeight: 600 }}>{msg.sender === 'user' ? 'You' : 'InspectDB AI Assistant'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Loading State */}
                    {msg.loading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <div className="typing-dot" />
                        <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                        <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                        <span style={{ marginLeft: '0.25rem' }}>{msg.text}</span>
                      </div>
                    )}

                    {/* Message Text */}
                    {!msg.loading && (
                      <div style={{ fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* SECTION 2: GENERATED MONGODB QUERY CARD */}
                    {/* ========================================================= */}
                    {!msg.loading && resp && resp.query && (
                      <div style={{
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid #1e293b',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.85rem',
                          backgroundColor: '#1e293b',
                          borderBottom: '1px solid #334155'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#93c5fd' }}>
                            <Code size={14} />
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Generated MongoDB Query
                            </span>
                            <code style={{ fontSize: '0.7rem', backgroundColor: '#0f172a', color: '#38bdf8', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                              {resp.collection}.{resp.operation || 'find'}(...)
                            </code>
                          </div>

                          <button
                            onClick={() => handleCopyQuery(resp.query, `orig-${msg.id}`)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#94a3b8', fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                          >
                            {copiedId === `orig-${msg.id}` ? (
                              <>
                                <Check size={13} color="#10b981" />
                                <span style={{ color: '#34d399' }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Query</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre style={{
                          margin: 0,
                          padding: '0.85rem',
                          fontSize: '0.8rem',
                          color: isIncompat ? '#fca5a5' : '#34d399',
                          lineHeight: '1.5',
                          overflowX: 'auto'
                        }}>
                          <code>{`db.${resp.collection}.${resp.operation || 'find'}(\n  ${JSON.stringify(resp.query, null, 2)}\n)`}</code>
                        </pre>

                        <div style={{
                          padding: '0.4rem 0.85rem',
                          backgroundColor: '#0b1120',
                          borderTop: '1px solid #1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.72rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: resp.is_validated ? '#34d399' : '#f87171'
                          }}>
                            {resp.is_validated ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                            <span>
                              {resp.is_validated
                                ? `Validated Read-Only Query (DocumentDB ${targetVersion})`
                                : `Validation Notice: Incompatible or Unverified for DocumentDB ${targetVersion}`}
                            </span>
                          </div>
                          <span style={{ color: '#94a3b8' }}>
                            Operation: <strong>{resp.operation || 'find'}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* SECTION 3: LOCAL MONGODB TEST RESULT */}
                    {/* ========================================================= */}
                    {!msg.loading && resp && (
                      <div style={{
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: `1px solid ${
                          mongo?.status === 'success'
                            ? '#86efac'
                            : mongo?.status === 'rejected'
                            ? '#fca5a5'
                            : '#fed7aa'
                        }`,
                        backgroundColor: mongo?.status === 'success' ? '#f0fdf4' : mongo?.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-primary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Database size={16} color={mongo?.status === 'success' ? '#16a34a' : mongo?.status === 'rejected' ? '#dc2626' : '#d97706'} />
                            <strong style={{
                              color: mongo?.status === 'success' ? '#15803d' : mongo?.status === 'rejected' ? '#991b1b' : '#92400e',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              fontSize: '0.8rem'
                            }}>
                              {engineName} Test
                            </strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {mongo?.status === 'success' && (
                              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                ✓ Query executed successfully
                              </span>
                            )}
                            {mongo?.status === 'unavailable' && (
                              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                MongoDB Local Test: Unavailable
                              </span>
                            )}
                            {mongo?.status === 'rejected' && (
                              <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                                ✕ Execution Rejected (Safety Rules)
                              </span>
                            )}
                            {mongo?.status === 'error' && (
                              <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                                ✕ Execution Error
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Success Details */}
                        {mongo?.status === 'success' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#ffffff',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid #dcfce7',
                              fontSize: '0.75rem'
                            }}>
                              <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Database:</span>
                                <strong>{mongo.database}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Collection:</span>
                                <strong>{mongo.collection}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Documents matched:</span>
                                <strong style={{ color: '#15803d' }}>{mongo.documents_matched}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Execution time:</span>
                                <strong style={{ color: '#0284c7' }}>{mongo.execution_time_ms} ms</strong>
                              </div>
                            </div>

                            {/* Sample Results Collapsible */}
                            {mongo.sample_results && mongo.sample_results.length > 0 && (
                              <div>
                                <button
                                  onClick={() => toggleSampleDocs(msg.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.4rem',
                                    color: '#065f46',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  {showSamples ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  <span>{showSamples ? 'Hide Sample Documents' : `View Matched Documents (${mongo.sample_results.length} of ${mongo.documents_matched})`}</span>
                                </button>

                                {showSamples && (
                                  <pre style={{
                                    marginTop: '0.35rem',
                                    padding: '0.65rem',
                                    backgroundColor: '#0f172a',
                                    color: '#e2e8f0',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    lineHeight: '1.4'
                                  }}>
                                    <code>{JSON.stringify(mongo.sample_results, null, 2)}</code>
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Unavailable Notice */}
                        {mongo?.status === 'unavailable' && (
                          <div style={{ fontSize: '0.78rem', color: '#78350f' }}>
                            <p style={{ margin: '0 0 0.35rem 0' }}>
                              <strong>Reason:</strong> {mongo.reason || 'Could not connect to the document database.'}
                            </p>
                            <p style={{ margin: 0, color: '#92400e', fontSize: '0.74rem' }}>
                              InspectDB is running smoothly. Local test will automatically become available once <code>mongod</code> is started locally. DocumentDB compatibility analysis remains active below.
                            </p>
                          </div>
                        )}

                        {/* Rejected Notice */}
                        {mongo?.status === 'rejected' && (
                          <div style={{ fontSize: '0.78rem', color: '#991b1b' }}>
                            <strong>Safety Rejection:</strong> {mongo.reason || 'Only read-only find/aggregate queries are allowed.'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* SECTION 4: AMAZON DOCUMENTDB COMPATIBILITY ANALYSIS */}
                    {/* ========================================================= */}
                    {!msg.loading && resp && compat && (
                      <div style={{
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isIncompat ? 'rgba(239, 68, 68, 0.08)' : isBehaviorDiff ? 'rgba(2, 132, 199, 0.08)' : isPartial ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        border: `1px solid ${isIncompat ? '#fca5a5' : isBehaviorDiff ? '#bae6fd' : isPartial ? '#fde68a' : '#a7f3d0'}`,
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isCompat && <CheckCircle2 size={18} color="#10b981" />}
                            {isIncompat && <AlertTriangle size={18} color="#ef4444" />}
                            {isBehaviorDiff && <Info size={18} color="#0284c7" />}
                            {isPartial && <AlertTriangle size={18} color="#f59e0b" />}
                            
                            <span style={{
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: isIncompat ? '#991b1b' : isBehaviorDiff ? '#0369a1' : isPartial ? '#92400e' : '#065f46',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              Amazon DocumentDB Compatibility: {compat.status}
                            </span>
                          </div>

                          {/* Comparison matrix */}
                          <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.72rem' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              fontWeight: 700
                            }}>
                              MongoDB API: ✓ Supported
                            </span>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: compat.documentdb_supported ? '#d1fae5' : '#fee2e2',
                              color: compat.documentdb_supported ? '#065f46' : '#991b1b',
                              fontWeight: 700
                            }}>
                              DocumentDB {compat.documentdb_version}: {compat.documentdb_supported ? '✓ Supported' : '✕ Unsupported'}
                            </span>
                          </div>
                        </div>

                        {/* Summary text */}
                        <div style={{ fontSize: '0.8rem', color: isIncompat ? '#7f1d1d' : isBehaviorDiff ? '#0c4a6e' : isPartial ? '#78350f' : '#064e3b', lineHeight: 1.45 }}>
                          {compat.summary}
                        </div>

                        {/* Incompatibility issues breakdown */}
                        {compat.issues && compat.issues.length > 0 && (
                          <div style={{
                            padding: '0.65rem 0.85rem',
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #fecaca',
                            fontSize: '0.78rem'
                          }}>
                            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.35rem' }}>
                              ⚠ Amazon DocumentDB Compatibility Issues Detected:
                            </div>
                            {compat.issues.map((issue, iIdx) => (
                              <div key={iIdx} style={{ marginBottom: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', fontWeight: 600 }}>
                                  <XCircle size={13} />
                                  <span>Feature: {issue.feature}</span>
                                </div>
                                <p style={{ margin: '0.2rem 0 0.25rem 1.25rem', color: '#4b5563', lineHeight: 1.4 }}>
                                  <strong>Why:</strong> {issue.message}
                                </p>
                                {issue.source && (
                                  <a
                                    href={issue.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      marginLeft: '1.25rem',
                                      fontSize: '0.72rem',
                                      color: '#2563eb',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    <span>AWS DocumentDB Supported MongoDB APIs</span>
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Behavioral Differences breakdown */}
                        {compat.behavioral_differences && compat.behavioral_differences.length > 0 && (
                          <div style={{
                            padding: '0.65rem 0.85rem',
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #bae6fd',
                            fontSize: '0.78rem'
                          }}>
                            <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '0.35rem' }}>
                              ℹ Functional & Behavioral Differences:
                            </div>
                            {compat.behavioral_differences.map((diff, dIdx) => (
                              <div key={dIdx} style={{ marginBottom: '0.4rem' }}>
                                <div style={{ fontWeight: 600, color: '#0369a1' }}>• {diff.feature}:</div>
                                <div style={{ paddingLeft: '0.75rem', color: '#475569', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                  <div><strong>MongoDB:</strong> {diff.mongodb_behavior}</div>
                                  <div><strong>DocumentDB:</strong> {diff.documentdb_behavior}</div>
                                  <div style={{ color: '#0284c7' }}><strong>Impact:</strong> {diff.impact}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DocumentDB-Compatible Alternative */}
                        {compat.alternative_query && (
                          <div style={{
                            marginTop: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            backgroundColor: '#06281e',
                            color: '#f8fafc'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.85rem',
                              backgroundColor: '#0b3d2e',
                              borderBottom: '1px solid rgba(52, 211, 153, 0.3)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#6ee7b7' }}>
                                <CheckCircle2 size={15} />
                                <strong>DocumentDB-Compatible Alternative:</strong>
                              </div>

                              <button
                                onClick={() => handleCopyQuery(compat.alternative_query, `alt-${msg.id}`)}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#10b981',
                                  color: '#022c22',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.6rem'
                                }}
                              >
                                {copiedId === `alt-${msg.id}` ? (
                                  <>
                                    <Check size={13} />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span>Copy Alternative</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', color: '#a7f3d0' }}>
                              💡 <strong>Strategy:</strong> {compat.alternative_explanation || "Transformed to native Amazon DocumentDB syntax."}
                            </div>

                            <pre style={{
                              margin: 0,
                              padding: '0.75rem 0.85rem',
                              fontSize: '0.8rem',
                              color: '#6ee7b7',
                              lineHeight: '1.5',
                              overflowX: 'auto',
                              backgroundColor: '#041f17'
                            }}>
                              <code>{`db.${resp.collection}.find(\n  ${JSON.stringify(compat.alternative_query, null, 2)}\n)`}</code>
                            </pre>

                            <div style={{
                              padding: '0.35rem 0.85rem',
                              backgroundColor: '#031711',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.72rem',
                              color: '#34d399'
                            }}>
                              <ShieldCheck size={13} />
                              <span>✓ Rules Engine Validated Alternative</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================= */}
          {/* QUERY HISTORY SIDEBAR / DRAWER */}
          {/* ========================================================= */}
          {historyOpen && (
            <div style={{
              width: '320px',
              borderLeft: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              zIndex: 10
            }}>
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <History size={16} color="var(--color-primary)" />
                  <span>Query History</span>
                </div>
                {queryHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {queryHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '2rem 1rem' }}>
                    No queries tested yet. Run natural language queries to see history.
                  </div>
                ) : (
                  queryHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSend(item.user_request)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-app)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        transition: 'border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        "{item.user_request}"
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        <span>
                          Mongo: <strong style={{ color: item.mongo_execution_status === 'success' ? '#16a34a' : '#d97706' }}>{item.mongo_execution_status}</strong>
                        </span>
                        <span>
                          DocDB: <strong style={{ color: item.documentdb_compatibility_status === 'COMPATIBLE' ? '#16a34a' : item.documentdb_compatibility_status === 'INCOMPATIBLE' ? '#dc2626' : '#0284c7' }}>{item.documentdb_compatibility_status}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div style={{
          padding: '0.65rem 1.25rem',
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            <Lightbulb size={14} color="var(--color-primary)" />
            <span>Suggested Test Queries (Local MongoDB & DocumentDB Compatibility):</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {SUGGESTED_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.q)}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="e.g. Find all electrical reports with critical findings in Building A..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="form-control"
              style={{
                fontSize: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-primary);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AiQueryAssistantPage;
