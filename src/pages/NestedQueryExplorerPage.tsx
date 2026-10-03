import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SearchCode,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Code,
  Clock,
  Layers,
  CheckCircle,
  Database,
  ArrowRight,
  Info,
  HelpCircle,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  FolderTree,
  Bookmark,
  History,
  Sliders,
  Terminal,
  ShieldCheck,
  Compass,
  ChevronDown,
  ChevronUp,
  Tag,
  Flame,
  Zap,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import {
  QueryCondition,
  QueryRequest,
  QueryResponse,
  InspectionReport,
  SchemaOverviewResponse,
  RawQueryResponse,
  ExplainQueryResponse,
  SavedQuery,
  QueryHistoryItem,
  QueryPreset
} from '../types';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';
import { JsonViewer } from '../components/common/JsonViewer';
import { useDocumentStore } from '../services/storageStatus';
import {
  QUERY_PRESETS,
  FIELD_TYPE_OPERATORS,
  KNOWN_FIELD_TYPE_MAP,
  EDUCATIONAL_DOCUMENTDB_POINTS
} from '../services/queryPresets';

export const NestedQueryExplorerPage: React.FC = () => {
  const store = useDocumentStore();
  // Query Builder State
  const [queryMode, setQueryMode] = useState<'visual' | 'raw'>('visual');
  const [matchType, setMatchType] = useState<'and' | 'or' | 'not'>('and');
  const [conditions, setConditions] = useState<QueryCondition[]>([
    { field: 'findings.severity', operator: 'equals', value: 'high', value_type: 'categorical' }
  ]);
  const [rawQueryText, setRawQueryText] = useState<string>(
    JSON.stringify({ "findings.severity": "high" }, null, 2)
  );
  const [limit, setLimit] = useState<number>(20);

  // Schema & Statistics State
  const [schemaOverview, setSchemaOverview] = useState<SchemaOverviewResponse | null>(null);
  const [loadingSchema, setLoadingSchema] = useState<boolean>(false);
  const [showSchemaTree, setShowSchemaTree] = useState<boolean>(false);
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('');

  // Results & Execution State
  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<RawQueryResponse | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Gemini AI Explanation State
  const [explainingAi, setExplainingAi] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<ExplainQueryResponse | null>(null);

  // Local History & Saved Queries State
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('inspectdb_query_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(() => {
    try {
      const saved = localStorage.getItem('inspectdb_saved_queries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Expand / Copy State
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [viewJsonDocs, setViewJsonDocs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'presets' | 'saved' | 'history' | 'education'>('presets');

  // Load Schema on mount
  const fetchSchema = useCallback(async () => {
    setLoadingSchema(true);
    try {
      const res = await api.getDocumentSchema();
      setSchemaOverview(res);
    } catch (err: any) {
      console.error('Failed to load schema overview:', err);
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // Persist history & saved queries
  useEffect(() => {
    try {
      localStorage.setItem('inspectdb_query_history', JSON.stringify(queryHistory.slice(0, 20)));
    } catch (e) {
      console.error(e);
    }
  }, [queryHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('inspectdb_saved_queries', JSON.stringify(savedQueries));
    } catch (e) {
      console.error(e);
    }
  }, [savedQueries]);

  // Build generated MongoDB query preview
  const generatedMongoQuery = useMemo(() => {
    if (!conditions || conditions.length === 0) return {};

    // Check for array prefixes to group into $elemMatch if match_type is 'and'
    const arrayPrefixes = ["findings", "findings.issues", "custom_fields"];
    const groupedByPrefix: Record<string, QueryCondition[]> = {};
    const nonGrouped: QueryCondition[] = [];

    if (matchType === "and") {
      for (const cond of conditions) {
        let placed = false;
        for (const prefix of arrayPrefixes) {
          if (cond.field.startsWith(`${prefix}.`)) {
            const subField = cond.field.substring(prefix.length + 1);
            if (!groupedByPrefix[prefix]) groupedByPrefix[prefix] = [];
            groupedByPrefix[prefix].push({ ...cond, field: subField });
            placed = true;
            break;
          }
        }
        if (!placed) nonGrouped.push(cond);
      }
    } else {
      nonGrouped.push(...conditions);
    }

    const mongoParts: Record<string, any>[] = [];

    const conditionToMongo = (c: QueryCondition) => {
      const { field, operator, value, value_type } = c;
      let val = value;
      if (value_type === 'number' && val !== null && val !== undefined) {
        val = Number(val);
      } else if (value_type === 'boolean') {
        val = String(val).toLowerCase() === 'true';
      }

      if (operator === 'equals') return { [field]: val };
      if (operator === 'not_equals') return { [field]: { $ne: val } };
      if (operator === 'greater_than') return { [field]: { $gt: val } };
      if (operator === 'greater_than_or_equal') return { [field]: { $gte: val } };
      if (operator === 'less_than') return { [field]: { $lt: val } };
      if (operator === 'less_than_or_equal') return { [field]: { $lte: val } };
      if (operator === 'contains') return { [field]: { $regex: String(val), $options: 'i' } };
      if (operator === 'starts_with') return { [field]: { $regex: `^${String(val)}`, $options: 'i' } };
      if (operator === 'ends_with') return { [field]: { $regex: `${String(val)}$`, $options: 'i' } };
      if (operator === 'in') {
        const items = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
        return { [field]: { $in: items } };
      }
      if (operator === 'not_in') {
        const items = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
        return { [field]: { $nin: items } };
      }
      if (operator === 'exists') return { [field]: { $exists: Boolean(val) } };
      if (operator === 'is_true') return { [field]: true };
      if (operator === 'is_false') return { [field]: false };
      if (operator === 'array_size') return { [field]: { $size: Number(val) || 1 } };
      return { [field]: val };
    };

    for (const [prefix, subConds] of Object.entries(groupedByPrefix)) {
      if (subConds.length > 1) {
        const elemObj: Record<string, any> = {};
        for (const sc of subConds) {
          Object.assign(elemObj, conditionToMongo(sc));
        }
        mongoParts.push({ [prefix]: { $elemMatch: elemObj } });
      } else {
        const origField = `${prefix}.${subConds[0].field}`;
        mongoParts.push(conditionToMongo({ ...subConds[0], field: origField }));
      }
    }

    for (const ng of nonGrouped) {
      mongoParts.push(conditionToMongo(ng));
    }

    if (mongoParts.length === 0) return {};
    if (matchType === 'or') return { $or: mongoParts };
    if (matchType === 'not') return { $nor: mongoParts };
    return mongoParts.length > 1 ? { $and: mongoParts } : mongoParts[0];
  }, [conditions, matchType]);

  // Synchronize raw query editor when in visual mode
  useEffect(() => {
    if (queryMode === 'visual') {
      setRawQueryText(JSON.stringify(generatedMongoQuery, null, 2));
    }
  }, [generatedMongoQuery, queryMode]);

  // Real-time Query Validation
  const queryValidation = useMemo(() => {
    if (queryMode === 'visual') {
      for (const c of conditions) {
        if (!c.field.trim()) return { isValid: false, message: 'Please specify a field path for all conditions.' };
        // Check categorical operator mismatches
        const inferredType = KNOWN_FIELD_TYPE_MAP[c.field] || c.value_type;
        if (inferredType === 'categorical' && ['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'].includes(c.operator)) {
          return {
            isValid: false,
            message: `Operator '${c.operator}' is not valid for categorical enum field '${c.field}'. Use Equals or In List.`
          };
        }
      }
      return { isValid: true, message: 'Valid DocumentDB Query Structure' };
    } else {
      try {
        const parsed = JSON.parse(rawQueryText);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          return { isValid: false, message: 'Raw query must be a JSON object.' };
        }
        return { isValid: true, message: 'Valid JSON MongoDB Query Syntax' };
      } catch (err: any) {
        return { isValid: false, message: `JSON Syntax Error: ${err.message}` };
      }
    }
  }, [queryMode, conditions, rawQueryText]);

  // Execute Visual or Raw Query
  const handleExecuteQuery = async () => {
    if (!queryValidation.isValid) {
      setErrorBanner(queryValidation.message);
      return;
    }

    setExecuting(true);
    setErrorBanner(null);
    setAiExplanation(null);

    try {
      if (queryMode === 'visual') {
        const req: QueryRequest = {
          match_type: matchType,
          conditions,
          limit
        };
        const res = await api.executeNestedQuery(req);
        setQueryResponse(res);
        setRawResponse(null);

        // Record history
        const histItem: QueryHistoryItem = {
          id: `hist-${Date.now()}`,
          name: `${matchType.toUpperCase()} (${conditions.map(c => c.field).join(', ')})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          query: res.mongo_equivalent_query,
          total_matches: res.total_matches,
          execution_time_ms: res.execution_time_ms,
          conditions: [...conditions],
          match_type: matchType
        };
        setQueryHistory(prev => [histItem, ...prev.slice(0, 19)]);
      } else {
        const parsed = JSON.parse(rawQueryText);
        const res = await api.executeRawQuery({ query: parsed, limit });
        setRawResponse(res);
        setQueryResponse(null);

        // Record history
        const histItem: QueryHistoryItem = {
          id: `hist-${Date.now()}`,
          name: `Raw: ${Object.keys(parsed).join(', ') || 'Find All'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          query: parsed,
          total_matches: res.total_matches,
          execution_time_ms: res.execution_time_ms
        };
        setQueryHistory(prev => [histItem, ...prev.slice(0, 19)]);
      }
    } catch (err: any) {
      console.error('Query execution error:', err);
      setErrorBanner(err.message || 'Failed to execute query on local repository.');
    } finally {
      setExecuting(false);
    }
  };

  // Explain with Gemini AI
  const handleExplainWithGemini = async () => {
    setExplainingAi(true);
    setErrorBanner(null);
    try {
      const activeQuery = queryMode === 'visual' ? generatedMongoQuery : JSON.parse(rawQueryText);
      const res = await api.explainQuery({ query: activeQuery });
      setAiExplanation(res);
      setSuccessBanner('Gemini analyzed query mechanics and DocumentDB index considerations.');
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to generate AI query explanation.');
    } finally {
      setExplainingAi(false);
    }
  };

  // Apply Preset
  const handleSelectPreset = (preset: QueryPreset) => {
    setQueryMode('visual');
    setMatchType(preset.match_type);
    setConditions(preset.conditions);
    setQueryResponse(null);
    setRawResponse(null);
    setAiExplanation(null);
    setSuccessBanner(`Loaded preset: '${preset.name}'. Click "Execute Query" to run.`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Condition Handlers
  const handleAddCondition = (fieldPath: string = 'findings.severity') => {
    const inferredType = KNOWN_FIELD_TYPE_MAP[fieldPath] || 'string';
    const opDef = FIELD_TYPE_OPERATORS[inferredType] || FIELD_TYPE_OPERATORS.string;
    setConditions(prev => [
      ...prev,
      { field: fieldPath, operator: opDef.defaultOperator, value: '', value_type: inferredType }
    ]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<QueryCondition>) => {
    setConditions(prev => {
      const next = [...prev];
      const current = { ...next[index], ...updates };

      // If field changed, re-infer type and default operator
      if (updates.field && updates.field !== prev[index].field) {
        const inferredType = KNOWN_FIELD_TYPE_MAP[updates.field] || current.value_type || 'string';
        const opDef = FIELD_TYPE_OPERATORS[inferredType] || FIELD_TYPE_OPERATORS.string;
        current.value_type = inferredType;
        current.operator = opDef.defaultOperator;
      }

      next[index] = current;
      return next;
    });
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  // Save Query
  const handleSaveCurrentQuery = () => {
    const name = window.prompt('Enter a name for this saved query:', `Query on ${conditions.map(c => c.field).join(', ')}`);
    if (!name) return;
    const desc = window.prompt('Enter an optional description:', 'Saved for project demonstration');

    const item: SavedQuery = {
      id: `saved-${Date.now()}`,
      name: name.trim(),
      description: desc ? desc.trim() : '',
      query: queryMode === 'visual' ? generatedMongoQuery : JSON.parse(rawQueryText),
      created_at: new Date().toLocaleDateString(),
      conditions: queryMode === 'visual' ? [...conditions] : undefined,
      match_type: queryMode === 'visual' ? matchType : undefined
    };
    setSavedQueries(prev => [item, ...prev]);
    setSuccessBanner(`Saved query '${name}'.`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleLoadSavedQuery = (item: SavedQuery) => {
    if (item.conditions) {
      setQueryMode('visual');
      setConditions(item.conditions);
      if (item.match_type) setMatchType(item.match_type as any);
    } else {
      setQueryMode('raw');
      setRawQueryText(JSON.stringify(item.query, null, 2));
    }
    setSuccessBanner(`Loaded saved query '${item.name}'.`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleDeleteSavedQuery = (id: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== id));
  };

  // Copy Query helper
  const handleCopyQuery = () => {
    const textToCopy = queryMode === 'visual'
      ? `db.inspection_reports.find(${JSON.stringify(generatedMongoQuery, null, 2)})`
      : `db.inspection_reports.find(${rawQueryText})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleCopyDocJson = (report: InspectionReport) => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedDocId(report.id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  // Active matched reports list
  const activeMatches: InspectionReport[] = useMemo(() => {
    if (queryResponse) return queryResponse.matched_reports;
    if (rawResponse) return rawResponse.matched_reports;
    return [];
  }, [queryResponse, rawResponse]);

  const activeExecutionTime = queryResponse?.execution_time_ms ?? rawResponse?.execution_time_ms ?? 0;
  const activeMatchesCount = queryResponse?.total_matches ?? rawResponse?.total_matches ?? 0;
  const hasExecuted = queryResponse !== null || rawResponse !== null;

  // Filtered schema tree items
  const filteredSchemaFields = useMemo(() => {
    if (!schemaOverview) return [];
    if (!selectedFieldFilter.trim()) return schemaOverview.fields;
    const q = selectedFieldFilter.toLowerCase();
    return schemaOverview.fields.filter(f => f.path.toLowerCase().includes(q) || f.field_type.toLowerCase().includes(q));
  }, [schemaOverview, selectedFieldFilter]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}>
              <SearchCode size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                Nested Document Query Explorer
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Build, validate, understand, and evaluate MongoDB-compatible queries across nested and variable-schema inspection documents.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleExecuteQuery}
            disabled={executing || !queryValidation.isValid}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            {executing ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Evaluating Query...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Execute Query</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LOCAL DEMO MODE DISCLAIMER */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem',
        color: '#1e40af'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Database size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong>Amazon DocumentDB Nested Query Laboratory (Phase 1):</strong> Queries are currently evaluated against the local variable-schema inspection dataset with full MongoDB dot-notation and $elemMatch semantics. <strong>Live Amazon DocumentDB cluster connection will be enabled in Phase 2.</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSchemaTree(!showSchemaTree)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', color: '#1e40af', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FolderTree size={14} />
            <span>{showSchemaTree ? 'Hide Schema Tree' : 'Explore Document Schema'}</span>
          </button>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#dbeafe', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', color: '#1d4ed8' }}>
            {store.isDocumentDb ? 'Amazon DocumentDB Engine' : store.mode === 'mongodb' ? 'Local MongoDB Engine' : 'Local In-Memory Engine'}
          </span>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {errorBanner && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#991b1b',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#065f46',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 2. QUERY OVERVIEW PANEL (TOP STATISTICS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileJson size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Documents Available
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {schemaOverview?.total_documents ?? 6}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderTree size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Nested Paths
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {schemaOverview?.nested_fields_count ?? 99}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Array Fields
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {schemaOverview?.arrays_count ?? 7}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Query Conditions
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {queryMode === 'visual' ? conditions.length : 'Raw JSON'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Last Query Time
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {activeExecutionTime.toFixed(2)} ms
            </div>
          </div>
        </div>
      </div>

      {/* 19. DOCUMENT SCHEMA EXPLORER (COLLAPSIBLE DRAWER) */}
      {showSchemaTree && schemaOverview && (
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-surface-secondary)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FolderTree size={16} color="var(--color-primary)" />
                Discovered Document Structure & Variable-Schema Hierarchy
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Click any path to automatically add it as a query condition
              </span>
            </div>

            <input
              type="text"
              placeholder="Filter fields by name or type..."
              value={selectedFieldFilter}
              onChange={e => setSelectedFieldFilter(e.target.value)}
              className="form-control"
              style={{ width: '240px', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            />
          </div>

          <div style={{
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.45rem',
            padding: '0.25rem'
          }}>
            {filteredSchemaFields.map(field => (
              <button
                key={field.path}
                onClick={() => handleAddCondition(field.path)}
                type="button"
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
                title={`Click to add '${field.path}' to query`}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{field.display_name}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: field.is_variable_schema ? '#fef3c7' : '#f1f5f9',
                    color: field.is_variable_schema ? '#92400e' : '#475569',
                    fontWeight: 600
                  }}>
                    {field.field_type}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    {field.occurrence_count}/{field.total_documents}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABS: PRESETS / SAVED / HISTORY / EDUCATION */}
      <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
        {[
          { id: 'presets', label: '12 Pre-Configured Presets', icon: Sliders, count: QUERY_PRESETS.length },
          { id: 'saved', label: 'Saved Queries', icon: Bookmark, count: savedQueries.length },
          { id: 'history', label: 'Query History', icon: History, count: queryHistory.length },
          { id: 'education', label: 'Why Amazon DocumentDB?', icon: BookOpen }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-bg-surface-tertiary)',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. PRESETS TAB */}
      {activeTab === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {QUERY_PRESETS.map(preset => {
            const compColor = preset.complexity === 'Simple' ? '#10b981' : preset.complexity === 'Moderate' ? '#3b82f6' : preset.complexity === 'Complex' ? '#f59e0b' : '#ef4444';
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                type="button"
                className="card"
                style={{
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-surface)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                    {preset.name}
                  </strong>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: compColor,
                    backgroundColor: `${compColor}15`,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {preset.complexity}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                  {preset.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  <span>Path:</span>
                  <code style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-bg-surface-secondary)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)' }}>
                    {preset.expected_path}
                  </code>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* SAVED QUERIES TAB */}
      {activeTab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {savedQueries.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Bookmark size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No queries saved yet.</p>
              <span style={{ fontSize: '0.75rem' }}>Construct a query below and click &quot;Save Query&quot; to preserve it for quick access.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
              {savedQueries.map(item => (
                <div key={item.id} className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.created_at}</span>
                    </div>
                    {item.description && <p style={{ margin: '0.2rem 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.description}</p>}
                    <code style={{ fontSize: '0.72rem', color: 'var(--color-primary)', display: 'block', backgroundColor: 'var(--color-bg-surface-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', marginTop: '0.35rem' }}>
                      {JSON.stringify(item.query).substring(0, 80)}...
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleLoadSavedQuery(item)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem' }}>
                      Load Query
                    </button>
                    <button onClick={() => handleDeleteSavedQuery(item.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)', padding: '0.25rem 0.4rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUERY HISTORY TAB */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {queryHistory.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <History size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No query executions recorded in history yet.</p>
            </div>
          ) : (
            queryHistory.map(item => (
              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.timestamp}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{item.total_matches} matches</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.execution_time_ms.toFixed(2)}ms</span>
                  </div>
                  <code style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    {JSON.stringify(item.query)}
                  </code>
                </div>
                <button
                  onClick={() => {
                    if (item.conditions) {
                      setQueryMode('visual');
                      setConditions(item.conditions);
                      if (item.match_type) setMatchType(item.match_type as any);
                    } else {
                      setQueryMode('raw');
                      setRawQueryText(JSON.stringify(item.query, null, 2));
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem' }}
                >
                  Run Again
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 22. "WHY AMAZON DOCUMENTDB?" EDUCATIONAL TAB */}
      {activeTab === 'education' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {EDUCATIONAL_DOCUMENTDB_POINTS.map((pt, idx) => (
            <div key={idx} className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--color-primary)' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)', display: 'block', marginBottom: '0.35rem' }}>
                {pt.title}
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                {pt.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 4 & 5. MAIN 2-COLUMN SECTION: BUILDER VS GENERATED MONGODB QUERY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) minmax(380px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: QUERY BUILDER / RAW EDITOR */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Builder Mode Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={17} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {queryMode === 'visual' ? 'Visual Query Builder' : 'Raw MongoDB Query Editor'}
              </h3>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-surface-secondary)', padding: '0.15rem', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => setQueryMode('visual')}
                className={`btn btn-sm ${queryMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
              >
                Visual Builder
              </button>
              <button
                onClick={() => setQueryMode('raw')}
                className={`btn btn-sm ${queryMode === 'raw' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
              >
                Raw Query
              </button>
            </div>
          </div>

          {/* VISUAL BUILDER MODE */}
          {queryMode === 'visual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Logic Match Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface-secondary)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>Match Logic:</span>
                  <select
                    value={matchType}
                    onChange={e => setMatchType(e.target.value as any)}
                    className="form-control"
                    style={{ width: '160px', padding: '0.3rem 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    <option value="and">ALL Conditions (AND)</option>
                    <option value="or">ANY Condition (OR)</option>
                    <option value="not">NONE of Conditions (NOT)</option>
                  </select>
                </div>

                <button
                  onClick={() => setConditions([{ field: 'findings.severity', operator: 'equals', value: 'high', value_type: 'categorical' }])}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}
                >
                  Reset
                </button>
              </div>

              {/* Conditions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conditions.map((cond, idx) => {
                  const inferredType = KNOWN_FIELD_TYPE_MAP[cond.field] || cond.value_type || 'string';
                  const opDef = FIELD_TYPE_OPERATORS[inferredType] || FIELD_TYPE_OPERATORS.string;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--color-bg-surface-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          Condition #{idx + 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-bg-surface)',
                            color: 'var(--color-primary)'
                          }}>
                            {inferredType}
                          </span>
                          {conditions.length > 1 && (
                            <button
                              onClick={() => handleRemoveCondition(idx)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)', padding: '0.15rem 0.35rem' }}
                              title="Remove condition"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Field, Operator, Value Inputs Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.4fr', gap: '0.45rem' }}>
                        {/* Field input */}
                        <div>
                          <input
                            type="text"
                            placeholder="Field path (e.g. findings.severity)"
                            value={cond.field}
                            onChange={e => handleUpdateCondition(idx, { field: e.target.value })}
                            className="form-control"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)' }}
                          />
                        </div>

                        {/* Operator Select */}
                        <div>
                          <select
                            value={cond.operator}
                            onChange={e => handleUpdateCondition(idx, { operator: e.target.value })}
                            className="form-control"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                          >
                            {opDef.allowedOperators.map(op => (
                              <option key={op.id} value={op.id}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Value Input */}
                        <div>
                          {cond.operator === 'is_true' || cond.operator === 'is_false' ? (
                            <div style={{ fontSize: '0.78rem', padding: '0.35rem', color: 'var(--color-text-muted)' }}>
                              Fixed boolean
                            </div>
                          ) : cond.operator === 'exists' ? (
                            <select
                              value={String(cond.value !== false)}
                              onChange={e => handleUpdateCondition(idx, { value: e.target.value === 'true' })}
                              className="form-control"
                              style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                            >
                              <option value="true">Must Exist (True)</option>
                              <option value="false">Must NOT Exist (False)</option>
                            </select>
                          ) : (
                            <input
                              type={inferredType === 'number' || cond.operator === 'array_size' ? 'number' : 'text'}
                              placeholder={opDef.placeholder}
                              value={cond.value ?? ''}
                              onChange={e => handleUpdateCondition(idx, { value: e.target.value })}
                              className="form-control"
                              style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Condition Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => handleAddCondition()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Plus size={14} />
                  <span>Add Condition</span>
                </button>

                <button
                  onClick={handleSaveCurrentQuery}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Bookmark size={14} />
                  <span>Save Query</span>
                </button>
              </div>
            </div>
          ) : (
            /* RAW QUERY EDITOR MODE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>Enter valid read-only MongoDB filter dictionary:</span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Read-Only Filter</span>
              </div>
              <textarea
                value={rawQueryText}
                onChange={e => setRawQueryText(e.target.value)}
                rows={9}
                className="form-control"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  lineHeight: 1.45,
                  padding: '0.75rem'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: queryValidation.isValid ? '#10b981' : '#ef4444' }}>
                  {queryValidation.message}
                </span>
                <button
                  onClick={handleSaveCurrentQuery}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Bookmark size={14} />
                  <span>Save Raw Query</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: GENERATED MONGODB QUERY & MECHANICS */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={17} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Generated MongoDB / DocumentDB Query</h3>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyQuery}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
            >
              {copiedQuery ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedQuery ? 'Copied' : 'Copy Query'}</span>
            </button>
          </div>

          {/* Dark Syntax Query Box */}
          <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            overflowX: 'auto',
            border: '1px solid #334155'
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '0.35rem' }}>// Target: inspection_reports</div>
            <span style={{ color: '#f472b6' }}>db.inspection_reports.find</span>(
            <pre style={{ margin: '0.2rem 0 0 1rem', color: '#38bdf8' }}>
              {queryMode === 'visual'
                ? JSON.stringify(generatedMongoQuery, null, 2)
                : rawQueryText}
            </pre>
            );
          </div>

          {/* Query Metadata Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
            <span className="badge badge-primary">Collection: inspection_reports</span>
            <span className="badge badge-secondary">Operation: find</span>
            <span className="badge badge-info">
              {queryMode === 'visual' && JSON.stringify(generatedMongoQuery).includes('$elemMatch') ? '$elemMatch Enabled' : 'Dot Notation'}
            </span>
          </div>

          {/* 8. "HOW THIS QUERY WORKS" EXPLANATION */}
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={15} color="var(--color-primary)" />
              <span>How this query works</span>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              {JSON.stringify(generatedMongoQuery).includes('$elemMatch')
                ? 'This query uses the "$elemMatch" array operator. $elemMatch ensures that all specified conditions apply to the same individual finding or issue subdocument, preventing false positive cross-element matches.'
                : 'This query searches the collection using Amazon DocumentDB dot notation traversal to evaluate nested fields across root, object, and array structures.'}
            </p>

            {/* Explain with Gemini button */}
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleExplainWithGemini}
                disabled={explainingAi}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)' }}
              >
                {explainingAi ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                <span>Explain with Gemini</span>
              </button>
            </div>
          </div>

          {/* AI Explanation Drawer (if loaded) */}
          {aiExplanation && (
            <div style={{
              padding: '0.85rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem'
            }}>
              <strong style={{ color: '#166534', display: 'block', marginBottom: '0.25rem' }}>
                Gemini Query Analysis & Indexing Advice:
              </strong>
              <p style={{ margin: '0 0 0.5rem 0', color: '#15803d', lineHeight: 1.45 }}>
                {aiExplanation.explanation}
              </p>
              {aiExplanation.index_recommendations.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: '#166534', borderTop: '1px solid #dcfce7', paddingTop: '0.35rem' }}>
                  <strong>Recommended Index:</strong> <code>{aiExplanation.index_recommendations[0]}</code>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 11, 12, 13. QUERY RESULTS SECTION */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--color-primary)" />
              <span>Query Results ({activeMatchesCount} {activeMatchesCount === 1 ? 'document' : 'documents'} matched)</span>
            </h3>
            {hasExecuted && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Evaluated in {activeExecutionTime.toFixed(2)} ms on local in-memory dataset
              </span>
            )}
          </div>
        </div>

        {/* RESULTS LIST */}
        {activeMatches.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {activeMatches.map(report => {
              const isExpanded = !!expandedDocs[report.id];
              const isJsonView = !!viewJsonDocs[report.id];

              return (
                <div
                  key={report.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-bg-surface-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  {/* Card Top Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <code style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {report.id}
                        </code>
                        <StatusBadge status={report.status} />
                        <SeverityBadge severity={report.overall_severity} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Category: <strong>{report.category}</strong>
                        </span>
                      </div>
                      <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {report.title}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                        {report.location} • Inspector: {report.inspector_name} • Date: {report.inspection_date}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleCopyDocJson(report)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        {copiedDocId === report.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        <span>{copiedDocId === report.id ? 'Copied' : 'Copy JSON'}</span>
                      </button>

                      <button
                        onClick={() => setViewJsonDocs(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {isJsonView ? 'Visual View' : 'Raw JSON'}
                      </button>

                      <button
                        onClick={() => setExpandedDocs(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.3rem' }}
                        title="Expand document details"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* JSON VIEW */}
                  {isJsonView ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <JsonViewer data={report} />
                    </div>
                  ) : (
                    /* VISUAL FINDINGS TREE */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Layers size={14} color="var(--color-primary)" />
                        <span>Nested Findings Array ({report.findings.length} findings)</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--color-border)' }}>
                        {report.findings.slice(0, isExpanded ? 20 : 2).map((f, fIdx) => (
                          <div key={fIdx} style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <SeverityBadge severity={f.severity} />
                              <strong style={{ color: 'var(--color-text-primary)' }}>{f.category}</strong>
                              <span style={{ color: 'var(--color-text-secondary)' }}>— {f.description}</span>
                            </div>

                            {/* Sub-issues */}
                            {f.issues && f.issues.length > 0 && (
                              <div style={{ marginTop: '0.35rem', paddingLeft: '0.75rem', borderLeft: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {f.issues.map((iss, iIdx) => (
                                  <div key={iIdx} style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                                    • Issue: <strong>{iss.title}</strong> (Status: <code>{iss.status}</code>{iss.code_reference ? `, Ref: ${iss.code_reference}` : ''})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {!isExpanded && report.findings.length > 2 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            + {report.findings.length - 2} more findings (click expand to view all)
                          </span>
                        )}
                      </div>

                      {/* Dynamic attributes preview if present */}
                      {report.dynamic_attributes && Object.keys(report.dynamic_attributes).length > 0 && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          <span>Variable Schema Telemetry: </span>
                          <code style={{ color: 'var(--color-primary)' }}>
                            {Object.keys(report.dynamic_attributes).join(', ')}
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : hasExecuted ? (
          /* 13. ZERO-RESULT STATE */
          <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              No Matching Documents Found
            </h4>
            <p style={{ margin: 0, maxWidth: '480px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Evaluated {conditions.length} condition(s) across 6 sample inspection documents in {activeExecutionTime.toFixed(2)}ms with 0 matches.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => handleSelectPreset(QUERY_PRESETS[0])}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Try &quot;High Severity Findings&quot; Preset
              </button>
              <button
                onClick={() => setShowSchemaTree(true)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Explore Available Fields
              </button>
            </div>
          </div>
        ) : (
          /* INITIAL EMPTY STATE */
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <SearchCode size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Configure conditions above or pick a preset to execute queries.</p>
            <span style={{ fontSize: '0.75rem' }}>Supports deep nested object dot-notation and multi-condition $elemMatch arrays.</span>
          </div>
        )}

      </div>

    </div>
  );
};
