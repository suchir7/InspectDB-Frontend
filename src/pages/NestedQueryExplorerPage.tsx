import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bookmark,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileJson,
  FolderTree,
  History,
  Layers,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';
import {
  CompatibilityReport,
  ExplainQueryResponse,
  InspectionReport,
  QueryCondition,
  QueryHistoryItem,
  QueryPreset,
  QueryResponse,
  RawQueryResponse,
  SavedQuery,
  SchemaFieldInfo,
  SchemaOverviewResponse
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
import { combine, conditionMatches, conditionsUnder, filterPaths, valuesAtPath } from '../services/nestedMatch';
import '../styles/query-explorer.css';

type QueryMode = 'visual' | 'raw';
type LibraryTab = 'examples' | 'fields' | 'saved' | 'history';

interface LastRun {
  mode: QueryMode;
  conditions: QueryCondition[];
  matchType: string;
  limit: number;
}

const DEFAULT_CONDITION: QueryCondition = { field: 'findings.severity', operator: 'equals', value: 'high', value_type: 'categorical' };
const LIMITS = [10, 20, 50, 100];
const LEVELS = ['Simple', 'Moderate', 'Complex', 'Advanced'];
const MATCH_OPTIONS = [
  { id: 'and', label: 'All' },
  { id: 'or', label: 'Any' },
  { id: 'not', label: 'None' }
];
const JOINER: Record<string, string> = { and: 'and', or: 'or', not: 'nor' };
const ARRAY_PREFIXES = ['findings', 'findings.issues', 'custom_fields'];
const RANGE_OPERATORS = ['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'];

const HISTORY_KEY = 'inspectdb_query_history';
const SAVED_KEY = 'inspectdb_saved_queries';

const readStored = <T,>(key: string): T[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStored = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private window); history simply isn't kept
  }
};

/** Mirrors the server's filter builder so the preview matches what runs. */
const conditionToMongo = (c: QueryCondition): Record<string, any> => {
  const { field, operator } = c;
  let val = c.value;
  if (c.value_type === 'number' && val !== null && val !== undefined && val !== '') val = Number(val);
  else if (c.value_type === 'boolean') val = String(val).toLowerCase() === 'true';
  const list = () => (Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean));

  switch (operator) {
    case 'equals': return { [field]: val };
    case 'not_equals': return { [field]: { $ne: val } };
    case 'greater_than': return { [field]: { $gt: val } };
    case 'greater_than_or_equal': return { [field]: { $gte: val } };
    case 'less_than': return { [field]: { $lt: val } };
    case 'less_than_or_equal': return { [field]: { $lte: val } };
    case 'contains': return { [field]: { $regex: String(val), $options: 'i' } };
    case 'starts_with': return { [field]: { $regex: `^${String(val)}`, $options: 'i' } };
    case 'ends_with': return { [field]: { $regex: `${String(val)}$`, $options: 'i' } };
    case 'in': return { [field]: { $in: list() } };
    case 'not_in': return { [field]: { $nin: list() } };
    case 'exists': return { [field]: { $exists: Boolean(val) } };
    case 'is_true': return { [field]: true };
    case 'is_false': return { [field]: false };
    case 'array_size': return { [field]: { $size: Number(val) || 1 } };
    default: return { [field]: val };
  }
};

const buildFilter = (conditions: QueryCondition[], matchType: string): Record<string, any> => {
  if (conditions.length === 0) return {};
  const grouped: Record<string, QueryCondition[]> = {};
  const plain: QueryCondition[] = [];

  if (matchType === 'and') {
    for (const cond of conditions) {
      const prefix = ARRAY_PREFIXES.find(p => cond.field.startsWith(`${p}.`));
      if (prefix) (grouped[prefix] ||= []).push({ ...cond, field: cond.field.slice(prefix.length + 1) });
      else plain.push(cond);
    }
  } else {
    plain.push(...conditions);
  }

  const parts: Record<string, any>[] = [];
  for (const [prefix, subs] of Object.entries(grouped)) {
    if (subs.length > 1) {
      // Several conditions on one array must hold for the same element
      parts.push({ [prefix]: { $elemMatch: Object.assign({}, ...subs.map(conditionToMongo)) } });
    } else {
      parts.push(conditionToMongo({ ...subs[0], field: `${prefix}.${subs[0].field}` }));
    }
  }
  parts.push(...plain.map(conditionToMongo));

  if (parts.length === 0) return {};
  if (matchType === 'or') return { $or: parts };
  if (matchType === 'not') return { $nor: parts };
  return parts.length > 1 ? { $and: parts } : parts[0];
};

const validateQuery = (mode: QueryMode, conditions: QueryCondition[], rawText: string) => {
  if (mode === 'visual') {
    if (conditions.length === 0) return { isValid: false, message: 'Add at least one condition.' };
    for (const c of conditions) {
      if (!c.field.trim()) return { isValid: false, message: 'Every condition needs a field path.' };
      const type = KNOWN_FIELD_TYPE_MAP[c.field] || c.value_type;
      if (type === 'categorical' && RANGE_OPERATORS.includes(c.operator)) {
        return { isValid: false, message: `${c.field} holds fixed values; use Equals or In list instead of a range.` };
      }
    }
    return { isValid: true, message: 'Ready to run' };
  }
  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return { isValid: false, message: 'The filter must be a JSON object.' };
    }
    return { isValid: true, message: 'Valid JSON filter' };
  } catch (err: any) {
    return { isValid: false, message: `JSON error: ${err.message}` };
  }
};

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])/g;

/** Light syntax colouring for a pretty-printed JSON filter. */
const highlightJson = (text: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [whole, str, colon, num, lit, punc] = m;
    if (str && colon) {
      out.push(<span key={i++} className={str.startsWith('"$') ? 't-op' : 't-key'}>{str}</span>, <span key={i++} className="t-punc">{colon}</span>);
    } else if (str) out.push(<span key={i++} className="t-str">{str}</span>);
    else if (num || lit) out.push(<span key={i++} className="t-num">{num || lit}</span>);
    else if (punc) out.push(<span key={i++} className="t-punc">{punc}</span>);
    else out.push(whole);
    last = at + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

/** Array fields whose conditions were grouped under $elemMatch. */
const elemMatchFields = (node: unknown, prefix = ''): string[] => {
  if (Array.isArray(node)) return node.flatMap(n => elemMatchFields(n, prefix));
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => {
    if (key.startsWith('$')) return elemMatchFields(value, prefix);
    const path = prefix ? `${prefix}.${key}` : key;
    const own = value && typeof value === 'object' && '$elemMatch' in (value as object) ? [path] : [];
    return [...own, ...elemMatchFields(value, path)];
  });
};

const formatValue = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 40 ? `${s.slice(0, 39)}…` : s;
};

const ComplexityMeter: React.FC<{ level: string }> = ({ level }) => {
  const rank = LEVELS.indexOf(level) + 1;
  return (
    <span className="nq-level" title={`${level} query`}>
      <span className="nq-level-bars" aria-hidden="true">
        {LEVELS.map((l, i) => <span key={l} className={i < rank ? 'is-on' : undefined} />)}
      </span>
      {level}
    </span>
  );
};

export const NestedQueryExplorerPage: React.FC = () => {
  const store = useDocumentStore();

  // Query being edited
  const [queryMode, setQueryMode] = useState<QueryMode>('visual');
  const [matchType, setMatchType] = useState<string>('and');
  const [conditions, setConditions] = useState<QueryCondition[]>([DEFAULT_CONDITION]);
  const [rawQueryText, setRawQueryText] = useState(JSON.stringify({ 'findings.severity': 'high' }, null, 2));
  const [limit, setLimit] = useState(20);

  // Schema discovered from the user's documents
  const [schema, setSchema] = useState<SchemaOverviewResponse | null>(null);
  const [schemaState, setSchemaState] = useState<'loading' | 'ready' | 'error'>('loading');

  // Last execution
  const [executing, setExecuting] = useState(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<RawQueryResponse | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // DocumentDB compatibility of the current filter
  const [compat, setCompat] = useState<CompatibilityReport | null>(null);
  const [compatState, setCompatState] = useState<'idle' | 'checking' | 'error'>('idle');

  // Gemini explanation
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<ExplainQueryResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Library
  const [history, setHistory] = useState<QueryHistoryItem[]>(() => readStored<QueryHistoryItem>(HISTORY_KEY));
  const [saved, setSaved] = useState<SavedQuery[]>(() => readStored<SavedQuery>(SAVED_KEY));
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('examples');
  const [fieldFilter, setFieldFilter] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Result display
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [jsonView, setJsonView] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const fetchSchema = useCallback(async () => {
    setSchemaState('loading');
    try {
      setSchema(await api.getDocumentSchema());
      setSchemaState('ready');
    } catch {
      setSchemaState('error');
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  useEffect(() => writeStored(HISTORY_KEY, history.slice(0, 20)), [history]);
  useEffect(() => writeStored(SAVED_KEY, saved), [saved]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1800);
    } catch {
      showToast('Copy is blocked in this browser.');
    }
  };

  const generatedFilter = useMemo(() => buildFilter(conditions, matchType), [conditions, matchType]);

  // The JSON editor starts from whatever the visual builder produced
  useEffect(() => {
    if (queryMode === 'visual') setRawQueryText(JSON.stringify(generatedFilter, null, 2));
  }, [generatedFilter, queryMode]);

  const parsedRaw = useMemo<Record<string, any> | null>(() => {
    try {
      const v = JSON.parse(rawQueryText);
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }, [rawQueryText]);

  const activeFilter = useMemo(() => (queryMode === 'visual' ? generatedFilter : parsedRaw), [queryMode, generatedFilter, parsedRaw]);
  const activeFilterKey = activeFilter ? JSON.stringify(activeFilter) : '';
  const validation = useMemo(() => validateQuery(queryMode, conditions, rawQueryText), [queryMode, conditions, rawQueryText]);

  const schemaByPath = useMemo(() => {
    const map: Record<string, SchemaFieldInfo> = {};
    schema?.fields.forEach(f => { map[f.path] = f; });
    return map;
  }, [schema]);

  const fieldSuggestions = useMemo(
    () => Array.from(new Set([...(schema?.fields.map(f => f.path) ?? []), ...Object.keys(KNOWN_FIELD_TYPE_MAP)])).sort(),
    [schema]
  );

  const inferType = useCallback((path: string): string => {
    const known = KNOWN_FIELD_TYPE_MAP[path];
    if (known) return known;
    const discovered = schemaByPath[path]?.field_type;
    return discovered && FIELD_TYPE_OPERATORS[discovered] ? discovered : 'string';
  }, [schemaByPath]);

  // Check the filter against DocumentDB's supported features as it changes
  useEffect(() => {
    if (!activeFilterKey) {
      setCompat(null);
      setCompatState('idle');
      return;
    }
    let cancelled = false;
    setCompatState('checking');
    const timer = window.setTimeout(async () => {
      try {
        const report = await api.checkQueryCompatibility({ query: JSON.parse(activeFilterKey) });
        if (!cancelled) {
          setCompat(report as CompatibilityReport);
          setCompatState('idle');
        }
      } catch {
        if (!cancelled) setCompatState('error');
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeFilterKey]);

  // Gemini output belongs to the filter it explained
  useEffect(() => {
    setAiExplanation(null);
    setAiError(null);
  }, [activeFilterKey]);

  const timestamp = () => new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const runVisual = async (conds: QueryCondition[], match: string, lim = limit) => {
    const check = validateQuery('visual', conds, '');
    if (!check.isValid) {
      setRunError(check.message);
      return;
    }
    setExecuting(true);
    setRunError(null);
    try {
      const res = await api.executeNestedQuery({ match_type: match, conditions: conds, limit: lim });
      setQueryResponse(res);
      setRawResponse(null);
      setLastRun({ mode: 'visual', conditions: conds, matchType: match, limit: lim });
      setExpanded({});
      setJsonView({});
      setHistory(prev => [{
        id: `hist-${Date.now()}`,
        name: conds.map(c => c.field).join(` ${JOINER[match] ?? 'and'} `),
        timestamp: timestamp(),
        query: res.mongo_equivalent_query,
        total_matches: res.total_matches,
        execution_time_ms: res.execution_time_ms,
        conditions: conds,
        match_type: match
      }, ...prev.slice(0, 19)]);
    } catch (err: any) {
      setRunError(err.message || 'The query could not be run.');
    } finally {
      setExecuting(false);
    }
  };

  const runRaw = async (text: string, lim = limit) => {
    const check = validateQuery('raw', [], text);
    if (!check.isValid) {
      setRunError(check.message);
      return;
    }
    const parsed = JSON.parse(text);
    setExecuting(true);
    setRunError(null);
    try {
      const res = await api.executeRawQuery({ query: parsed, limit: lim });
      setRawResponse(res);
      setQueryResponse(null);
      setLastRun({ mode: 'raw', conditions: [], matchType: 'and', limit: lim });
      setExpanded({});
      setJsonView({});
      setHistory(prev => [{
        id: `hist-${Date.now()}`,
        name: Object.keys(parsed).join(', ') || 'All documents',
        timestamp: timestamp(),
        query: parsed,
        total_matches: res.total_matches,
        execution_time_ms: res.execution_time_ms
      }, ...prev.slice(0, 19)]);
    } catch (err: any) {
      setRunError(err.message || 'The query could not be run.');
    } finally {
      setExecuting(false);
    }
  };

  const handleRun = (lim = limit) => (queryMode === 'visual' ? runVisual(conditions, matchType, lim) : runRaw(rawQueryText, lim));

  const loadVisual = (conds: QueryCondition[], match: string) => {
    setQueryMode('visual');
    setMatchType(match);
    setConditions(conds);
  };

  const handleSelectPreset = (preset: QueryPreset) => {
    setActivePresetId(preset.id);
    loadVisual(preset.conditions, preset.match_type);
    runVisual(preset.conditions, preset.match_type);
  };

  const handleRunStored = (item: { conditions?: QueryCondition[]; match_type?: string; query: Record<string, any> }) => {
    setActivePresetId(null);
    if (item.conditions && item.conditions.length > 0) {
      const match = item.match_type || 'and';
      loadVisual(item.conditions, match);
      runVisual(item.conditions, match);
    } else {
      const text = JSON.stringify(item.query, null, 2);
      setQueryMode('raw');
      setRawQueryText(text);
      runRaw(text);
    }
  };

  const handleAddCondition = (fieldPath = '') => {
    const type = fieldPath ? inferType(fieldPath) : 'string';
    const op = (FIELD_TYPE_OPERATORS[type] || FIELD_TYPE_OPERATORS.string).defaultOperator;
    const next: QueryCondition = { field: fieldPath, operator: op, value: op === 'exists' ? true : '', value_type: type };
    setQueryMode('visual');
    setActivePresetId(null);
    // Replace a single untouched blank row instead of stacking another
    setConditions(prev => (prev.length === 1 && !prev[0].field.trim() ? [next] : [...prev, next]));
  };

  const handleUpdateCondition = (index: number, updates: Partial<QueryCondition>) => {
    setActivePresetId(null);
    setConditions(prev => prev.map((cond, i) => {
      if (i !== index) return cond;
      const next = { ...cond, ...updates };
      if (updates.field !== undefined && updates.field !== cond.field) {
        const type = inferType(updates.field);
        const op = (FIELD_TYPE_OPERATORS[type] || FIELD_TYPE_OPERATORS.string).defaultOperator;
        next.value_type = type;
        if (!(FIELD_TYPE_OPERATORS[type] || FIELD_TYPE_OPERATORS.string).allowedOperators.some(o => o.id === next.operator)) {
          next.operator = op;
        }
      }
      if (updates.operator === 'exists' && cond.operator !== 'exists') next.value = true;
      return next;
    }));
  };

  const handleRemoveCondition = (index: number) => {
    setActivePresetId(null);
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setActivePresetId(null);
    setQueryMode('visual');
    setMatchType('and');
    setConditions([DEFAULT_CONDITION]);
    setRunError(null);
  };

  const startSave = () => {
    const fields = queryMode === 'visual' ? conditions.map(c => c.field).filter(Boolean).join(', ') : Object.keys(parsedRaw ?? {}).join(', ');
    setSaveName(fields ? `Query on ${fields}` : 'Saved query');
    setSaving(true);
  };

  const confirmSave = () => {
    const name = saveName.trim();
    if (!name || !activeFilter) return;
    setSaved(prev => [{
      id: `saved-${Date.now()}`,
      name,
      description: '',
      query: activeFilter,
      created_at: new Date().toLocaleDateString(),
      conditions: queryMode === 'visual' ? conditions : undefined,
      match_type: queryMode === 'visual' ? matchType : undefined
    }, ...prev]);
    setSaving(false);
    showToast(`Saved “${name}”`);
  };

  const handleExplain = async () => {
    if (!activeFilter) return;
    setExplaining(true);
    setAiError(null);
    try {
      setAiExplanation(await api.explainQuery({ query: activeFilter }));
    } catch (err: any) {
      setAiError(err.message || 'The explanation could not be generated.');
    } finally {
      setExplaining(false);
    }
  };

  const applyRewrite = (query: Record<string, any>) => {
    setActivePresetId(null);
    setQueryMode('raw');
    setRawQueryText(JSON.stringify(query, null, 2));
    showToast('Loaded the DocumentDB-compatible rewrite into the JSON editor.');
  };

  // Results
  const matches: InspectionReport[] = queryResponse?.matched_reports ?? rawResponse?.matched_reports ?? [];
  const matchCount = queryResponse?.total_matches ?? rawResponse?.total_matches ?? 0;
  const execMs = queryResponse?.execution_time_ms ?? rawResponse?.execution_time_ms ?? 0;
  const hasRun = lastRun !== null;
  const atLimit = hasRun && matchCount >= (lastRun?.limit ?? limit);

  // Facts about the current filter
  const leafPaths = useMemo(() => {
    const all = Array.from(new Set(filterPaths(activeFilter ?? {})));
    return all.filter(p => !all.some(other => other.startsWith(`${p}.`)));
  }, [activeFilter]);
  const depth = leafPaths.reduce((max, p) => Math.max(max, p.split('.').length), 0);
  const elemFields = useMemo(() => Array.from(new Set(elemMatchFields(activeFilter ?? {}))), [activeFilter]);

  const explanation = useMemo(() => {
    const lines: string[] = [];
    const root = activeFilter ?? {};
    if (elemFields.length > 0) {
      lines.push(`Conditions on ${elemFields.join(', ')} are wrapped in $elemMatch, so they must all hold for the same array element rather than being spread across different ones.`);
    }
    const arrayPaths = leafPaths.filter(p => p.startsWith('findings.') && !elemFields.some(f => p.startsWith(`${f}.`)));
    if (arrayPaths.length > 0) {
      lines.push(`${arrayPaths.join(', ')} ${arrayPaths.length === 1 ? 'sits' : 'sit'} inside the findings array; dot notation matches a report when any element satisfies the condition.`);
    }
    if (leafPaths.some(p => p.startsWith('dynamic_attributes.'))) {
      lines.push('dynamic_attributes fields exist only on some report types. Reports without them simply do not match, with no schema change needed.');
    }
    if ('$or' in root) lines.push('A report matches when any condition holds ($or).');
    if ('$nor' in root) lines.push('A report matches only when none of the conditions hold ($nor).');
    if (leafPaths.length === 0) lines.push('An empty filter returns every report you own.');
    lines.push('The server also adds your user ID to the filter, so you only ever see your own reports.');
    return lines;
  }, [activeFilter, elemFields, leafPaths]);

  const filteredFields = useMemo(() => {
    if (!schema) return [];
    const q = fieldFilter.trim().toLowerCase();
    if (!q) return schema.fields;
    return schema.fields.filter(f => f.path.toLowerCase().includes(q) || f.field_type.toLowerCase().includes(q));
  }, [schema, fieldFilter]);

  // Why each returned report matched (visual queries only; the database decided the match)
  const highlight = lastRun?.mode === 'visual' && lastRun.matchType !== 'not' ? lastRun : null;
  const findingConds = highlight ? conditionsUnder(highlight.conditions, 'findings') : [];
  const issueConds = highlight ? conditionsUnder(highlight.conditions, 'findings.issues') : [];
  const findingMatches = (finding: unknown) =>
    findingConds.length > 0 && combine(findingConds.map(({ cond, relative }) => conditionMatches(finding, relative, cond)), highlight!.matchType);
  const issueMatches = (issue: unknown) =>
    issueConds.length > 0 && combine(issueConds.map(({ cond, relative }) => conditionMatches(issue, relative, cond)), highlight!.matchType);
  const matchedValues = (report: InspectionReport) =>
    (highlight?.conditions ?? [])
      .filter(c => !c.field.startsWith('findings.') && c.field.includes('.'))
      .map(c => ({ field: c.field, values: valuesAtPath(report, c.field).filter(v => v === null || typeof v !== 'object') }))
      .filter(m => m.values.length > 0);

  const compatTone = !compat ? '' : compat.status === 'COMPATIBLE' ? 'is-ok' : compat.status === 'INCOMPATIBLE' ? 'is-bad' : 'is-warn';
  const compatTitle = !compat
    ? ''
    : compat.status === 'COMPATIBLE'
      ? `Runs on DocumentDB ${compat.documentdb_version}`
      : compat.status === 'INCOMPATIBLE'
        ? `Not supported on DocumentDB ${compat.documentdb_version}`
        : `Check before running on DocumentDB ${compat.documentdb_version}`;

  const engineLabel = store.label;
  const statValue = (value: number | undefined) => (value !== undefined ? value.toLocaleString() : schemaState === 'loading' ? '…' : '—');

  const filterText = queryMode === 'raw' && !parsedRaw ? rawQueryText : JSON.stringify(activeFilter ?? {}, null, 2);

  const tabs: { id: LibraryTab; label: string; count?: number }[] = [
    { id: 'examples', label: 'Examples', count: QUERY_PRESETS.length },
    { id: 'fields', label: 'Fields', count: schema?.fields.length },
    { id: 'saved', label: 'Saved', count: saved.length },
    { id: 'history', label: 'History', count: history.length }
  ];

  return (
    <div className="nq-page">
      {/* Header */}
      <div className="nq-header">
        <div>
          <div className="eyebrow">Query explorer</div>
          <h2 style={{ marginTop: '0.2rem' }}>Nested Query Explorer</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: 760 }}>
            Query variable-schema inspection reports by nested fields, arrays inside arrays and per-report telemetry.
            Every filter is checked against DocumentDB&apos;s supported features as you build it.
          </p>
        </div>
        <span className="nq-engine" title={`Queries run against ${engineLabel}`}>
          <span className={`nq-engine-dot ${store.connected ? 'is-live' : ''}`} />
          {engineLabel}
          {store.isDocumentDb && <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>· {store.connected ? 'connected' : 'unreachable'}</span>}
        </span>
      </div>

      {/* Schema stats */}
      <div className="nq-stats">
        {[
          { label: 'Your reports', value: schema?.total_documents },
          { label: 'Field paths', value: schema?.fields.length },
          { label: 'Nested paths', value: schema?.nested_fields_count },
          { label: 'Array fields', value: schema?.arrays_count },
          { label: 'Variable-schema groups', value: schema?.variable_schema_groups.length }
        ].map(s => (
          <div key={s.label} className="nq-stat">
            <div className="nq-stat-label">{s.label}</div>
            <div className="nq-stat-value">{statValue(s.value)}</div>
          </div>
        ))}
      </div>

      {schemaState === 'error' && (
        <div className="alert alert-warning">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Your document schema could not be loaded, so field suggestions are limited. Queries still run.</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchSchema}><RefreshCw size={13} /> Retry</button>
        </div>
      )}

      <div className="nq-workbench">
        {/* Library */}
        <aside className="card nq-library" aria-label="Query library">
          <div className="nq-tabs" role="tablist">
            {tabs.map(t => (
              <button key={t.id} role="tab" aria-selected={libraryTab === t.id} className="nq-tab" onClick={() => setLibraryTab(t.id)}>
                {t.label}
                {t.count !== undefined && t.count > 0 && <span className="nq-tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {libraryTab === 'fields' && schema && schema.fields.length > 0 && (
            <div className="nq-library-tools">
              <input
                type="search"
                className="form-control"
                placeholder="Filter by path or type"
                value={fieldFilter}
                onChange={e => setFieldFilter(e.target.value)}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
              />
            </div>
          )}

          <div className="nq-library-body" role="tabpanel">
            {libraryTab === 'examples' && (
              <>
                <div className="nq-library-note">Click an example to load and run it.</div>
                {QUERY_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`nq-item ${activePresetId === preset.id ? 'is-active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                    title={preset.explanation}
                  >
                    <div className="nq-item-row">
                      <span className="nq-item-title">{preset.name}</span>
                    </div>
                    <div className="nq-item-desc">{preset.description}</div>
                    <div className="nq-item-meta">
                      <ComplexityMeter level={preset.complexity} />
                      <span className="nq-path">{preset.expected_path}</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {libraryTab === 'fields' && (
              schemaState === 'loading' ? (
                <div className="nq-empty-list"><RefreshCw size={16} className="spin" /> Reading your documents…</div>
              ) : !schema || schema.fields.length === 0 ? (
                <div className="nq-empty-list">
                  No fields yet. <Link to="/create-inspection">Create a report</Link> and its fields appear here.
                </div>
              ) : (
                <>
                  <div className="nq-library-note">
                    Discovered in {schema.total_documents} {schema.total_documents === 1 ? 'report' : 'reports'}. Click a field to add it as a condition.
                  </div>
                  {filteredFields.map(f => (
                    <button key={f.path} type="button" className="nq-item" onClick={() => { handleAddCondition(f.path); showToast(`Added ${f.path}`); }}>
                      <div className="nq-item-row">
                        <span className="nq-path" style={{ fontSize: '0.76rem' }}>{f.path}</span>
                        <span className={`nq-type ${f.is_variable_schema ? 'is-variable' : ''}`}>{f.field_type}</span>
                      </div>
                      <div className="nq-item-meta">
                        <span>in {f.occurrence_count} of {f.total_documents}</span>
                        {f.is_variable_schema && <span className="text-gold">variable schema</span>}
                        {f.example_value !== undefined && f.example_value !== null && <span>e.g. {formatValue(f.example_value)}</span>}
                      </div>
                    </button>
                  ))}
                  {filteredFields.length === 0 && <div className="nq-empty-list">No field matches “{fieldFilter}”.</div>}
                </>
              )
            )}

            {libraryTab === 'saved' && (
              saved.length === 0 ? (
                <div className="nq-empty-list">
                  <Bookmark size={20} style={{ opacity: 0.5 }} />
                  <div style={{ marginTop: '0.4rem' }}>Nothing saved yet. Use <strong>Save</strong> in the builder to keep a query here.</div>
                </div>
              ) : saved.map(item => (
                <div key={item.id} className="nq-item" style={{ cursor: 'default' }}>
                  <div className="nq-item-row">
                    <button type="button" className="nq-link-btn" style={{ textAlign: 'left', color: 'var(--color-text-primary)', fontSize: '0.83rem' }} onClick={() => handleRunStored(item)}>
                      {item.name}
                    </button>
                    <button className="nq-icon-btn is-danger" onClick={() => setSaved(prev => prev.filter(q => q.id !== item.id))} aria-label={`Delete ${item.name}`} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="nq-item-meta">
                    <span>{item.created_at}</span>
                    <span>{item.conditions ? 'Builder' : 'JSON'}</span>
                  </div>
                  <div className="nq-path" style={{ marginTop: '0.3rem' }}>{formatValue(item.query)}</div>
                </div>
              ))
            )}

            {libraryTab === 'history' && (
              history.length === 0 ? (
                <div className="nq-empty-list">
                  <History size={20} style={{ opacity: 0.5 }} />
                  <div style={{ marginTop: '0.4rem' }}>Queries you run appear here.</div>
                </div>
              ) : (
                <>
                  <div className="nq-library-note" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Click to run again.</span>
                    <button className="nq-link-btn" onClick={() => setHistory([])}>Clear</button>
                  </div>
                  {history.map(item => (
                    <button key={item.id} type="button" className="nq-item" onClick={() => handleRunStored(item)}>
                      <div className="nq-item-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 500, overflowWrap: 'anywhere' }}>{item.name}</div>
                      <div className="nq-item-meta">
                        <span>{item.timestamp}</span>
                        <span>{item.total_matches} {item.total_matches === 1 ? 'match' : 'matches'}</span>
                        <span>{item.execution_time_ms.toFixed(1)} ms</span>
                      </div>
                    </button>
                  ))}
                </>
              )
            )}
          </div>
        </aside>

        <div className="nq-main">
          {/* Builder */}
          <section
            className="card"
            aria-label="Query builder"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (validation.isValid && !executing) handleRun();
              }
            }}
          >
            <div className="card-header">
              <h3 className="card-title">Build a query</h3>
              <div className="nq-segmented" role="group" aria-label="Editor">
                <button aria-pressed={queryMode === 'visual'} onClick={() => setQueryMode('visual')}>Builder</button>
                <button aria-pressed={queryMode === 'raw'} onClick={() => setQueryMode('raw')}><Braces size={13} style={{ verticalAlign: '-2px' }} /> JSON</button>
              </div>
            </div>

            {queryMode === 'visual' ? (
              <>
                <div className="nq-logic">
                  <span>Match reports where</span>
                  <div className="nq-segmented" role="group" aria-label="Match logic">
                    {MATCH_OPTIONS.map(o => (
                      <button key={o.id} aria-pressed={matchType === o.id} onClick={() => { setMatchType(o.id); setActivePresetId(null); }}>{o.label}</button>
                    ))}
                  </div>
                  <span>of these conditions hold</span>
                </div>

                <datalist id="nq-field-paths">
                  {fieldSuggestions.map(p => <option key={p} value={p} />)}
                </datalist>

                <div className="nq-conditions">
                  {conditions.map((cond, idx) => {
                    const type = KNOWN_FIELD_TYPE_MAP[cond.field] || cond.value_type || 'string';
                    const opDef = FIELD_TYPE_OPERATORS[type] || FIELD_TYPE_OPERATORS.string;
                    const info = schemaByPath[cond.field];
                    const inArray = [...ARRAY_PREFIXES].reverse().find(p => cond.field.startsWith(`${p}.`));
                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && <div className="nq-joiner"><span>{JOINER[matchType]}</span></div>}
                        <div className="nq-cond">
                          <span className="nq-cond-index">{idx + 1}</span>
                          <input
                            type="text"
                            list="nq-field-paths"
                            aria-label={`Field for condition ${idx + 1}`}
                            placeholder="Field path, e.g. findings.severity"
                            value={cond.field}
                            onChange={e => handleUpdateCondition(idx, { field: e.target.value })}
                            className="form-control nq-cond-field"
                            spellCheck={false}
                          />
                          <select
                            aria-label={`Operator for condition ${idx + 1}`}
                            value={cond.operator}
                            onChange={e => handleUpdateCondition(idx, { operator: e.target.value })}
                            className="form-control"
                          >
                            {opDef.allowedOperators.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                          </select>
                          {cond.operator === 'is_true' || cond.operator === 'is_false' ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>No value needed</span>
                          ) : cond.operator === 'exists' ? (
                            <select
                              aria-label={`Value for condition ${idx + 1}`}
                              value={String(cond.value !== false && cond.value !== 'false')}
                              onChange={e => handleUpdateCondition(idx, { value: e.target.value === 'true' })}
                              className="form-control"
                            >
                              <option value="true">is present</option>
                              <option value="false">is missing</option>
                            </select>
                          ) : (
                            <input
                              aria-label={`Value for condition ${idx + 1}`}
                              type={type === 'number' || cond.operator === 'array_size' ? 'number' : 'text'}
                              placeholder={opDef.placeholder}
                              value={cond.value ?? ''}
                              onChange={e => handleUpdateCondition(idx, { value: e.target.value })}
                              className="form-control"
                            />
                          )}
                          <button
                            className="nq-icon-btn is-danger"
                            onClick={() => handleRemoveCondition(idx)}
                            disabled={conditions.length === 1}
                            style={conditions.length === 1 ? { visibility: 'hidden' } : undefined}
                            aria-label={`Remove condition ${idx + 1}`}
                            title="Remove condition"
                          >
                            <Trash2 size={14} />
                          </button>
                          {cond.field.trim() && (
                            <div className="nq-cond-hint">
                              <span className={`nq-type ${info?.is_variable_schema || cond.field.startsWith('dynamic_attributes.') ? 'is-variable' : ''}`}>{type}</span>
                              {inArray && <span>inside <span className="nq-path">{inArray.split('.').map(part => `${part}[]`).join('.')}</span></span>}
                              {info ? <span>present in {info.occurrence_count} of {info.total_documents} reports</span>
                                : schemaState === 'ready' && <span>not found in your reports yet</span>}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <textarea
                  className="nq-json-editor"
                  aria-label="MongoDB filter as JSON"
                  value={rawQueryText}
                  onChange={e => { setRawQueryText(e.target.value); setActivePresetId(null); }}
                  spellCheck={false}
                  rows={10}
                />
                <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  A read-only find() filter. Write operators and server-side JavaScript are rejected before they reach the database.
                </p>
              </>
            )}

            {runError && (
              <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                <XCircle size={18} style={{ flexShrink: 0 }} />
                <span>{runError}</span>
              </div>
            )}

            <div className="nq-builder-footer">
              <div className="nq-footer-group">
                {queryMode === 'visual' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAddCondition()}>
                    <Plus size={14} /> Add condition
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  <RotateCcw size={14} /> Reset
                </button>
                {validation.isValid && compat && compatState === 'idle' && compat.status !== 'COMPATIBLE' ? (
                  // Valid JSON can still be rejected by DocumentDB; say so next to the Run button
                  <a href="#nq-filter" className={`nq-validity ${compat.status === 'INCOMPATIBLE' ? 'is-bad' : 'is-warn'}`}>
                    <ShieldAlert size={14} />
                    {compatTitle} · details
                  </a>
                ) : (
                  <span className={`nq-validity ${validation.isValid ? 'is-ok' : 'is-bad'}`}>
                    {validation.isValid ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {validation.message}
                  </span>
                )}
              </div>
              <div className="nq-footer-group">
                {saving ? (
                  <form className="nq-save-form" onSubmit={e => { e.preventDefault(); confirmSave(); }}>
                    <input
                      autoFocus
                      className="form-control"
                      aria-label="Name for the saved query"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && setSaving(false)}
                    />
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={!saveName.trim()}>Save</button>
                    <button type="button" className="nq-icon-btn" onClick={() => setSaving(false)} aria-label="Cancel saving"><X size={14} /></button>
                  </form>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={startSave} disabled={!validation.isValid}>
                    <Bookmark size={14} /> Save
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => handleRun()} disabled={executing || !validation.isValid} title="Ctrl + Enter">
                  {executing ? <RefreshCw size={15} className="spin" /> : <Play size={15} />}
                  {executing ? 'Running…' : 'Run query'}
                  {!executing && <span className="nq-kbd">Ctrl ↵</span>}
                </button>
              </div>
            </div>
          </section>

          {/* Generated filter + analysis */}
          <section className="card" aria-label="Generated filter" id="nq-filter" style={{ scrollMarginTop: '7rem' }}>
            <div className="card-header">
              <h3 className="card-title">DocumentDB filter</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyText('filter', `db.inspection_reports.find(${filterText})`)}
              >
                {copied === 'filter' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'filter' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="nq-filter-grid">
              <pre className="nq-code" aria-label="Filter sent to the database">
                <span className="t-call">db.inspection_reports.find</span><span className="t-punc">(</span>{'\n'}
                {queryMode === 'raw' && !parsedRaw ? rawQueryText : highlightJson(filterText)}
                {'\n'}<span className="t-punc">)</span>
              </pre>

              <div className="nq-facts">
                <div className="nq-fact-row">
                  <span className={`nq-chip ${elemFields.length ? 'is-primary' : ''}`}>
                    {elemFields.length ? `$elemMatch on ${elemFields.join(', ')}` : 'Dot notation'}
                  </span>
                  <span className="nq-chip">{leafPaths.length} {leafPaths.length === 1 ? 'field' : 'fields'}</span>
                  {depth > 0 && <span className="nq-chip">Depth {depth}</span>}
                </div>

                {compat && compatState !== 'checking' ? (
                  <div className={`nq-compat ${compatTone}`} role="status">
                    <div className="nq-compat-title">
                      {compat.status === 'COMPATIBLE' ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                      {compatTitle}
                    </div>
                    {(compat.issues.length > 0 || compat.behavioral_differences.length > 0) && (
                      <ul>
                        {compat.issues.slice(0, 3).map((issue, i) => <li key={`i${i}`}>{issue.message}</li>)}
                        {compat.behavioral_differences.slice(0, 2).map((b, i) => <li key={`b${i}`}>{b.feature}: {b.documentdb_behavior}</li>)}
                      </ul>
                    )}
                    {compat.alternative_query && compat.status !== 'COMPATIBLE' && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.55rem' }} onClick={() => applyRewrite(compat.alternative_query!)}>
                        Use the compatible rewrite
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="nq-compat" role="status" style={{ color: 'var(--color-text-muted)' }}>
                    {compatState === 'checking' ? (
                      <span className="nq-compat-title" style={{ fontWeight: 500 }}><RefreshCw size={14} className="spin" /> Checking DocumentDB compatibility…</span>
                    ) : compatState === 'error' ? (
                      'The compatibility check is unavailable right now.'
                    ) : (
                      'Fix the filter to check DocumentDB compatibility.'
                    )}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>How it matches</div>
                  {explanation.map((line, i) => <p key={i} className="nq-explain" style={{ marginTop: i ? '0.35rem' : 0 }}>{line}</p>)}
                </div>

                <div>
                  <button className="btn btn-ghost btn-sm" onClick={handleExplain} disabled={explaining || !activeFilter} style={{ paddingLeft: 0, color: 'var(--color-primary)' }}>
                    {explaining ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                    {explaining ? 'Asking Gemini…' : 'Explain with Gemini and suggest indexes'}
                  </button>
                  {aiError && <p style={{ fontSize: '0.78rem', color: 'var(--color-danger)', margin: '0.25rem 0 0' }}>{aiError}</p>}
                </div>
              </div>
            </div>

            {aiExplanation && (
              <div className="nq-ai" style={{ marginTop: '1.1rem' }}>
                {aiExplanation.explanation}
                {aiExplanation.index_recommendations.length > 0 && (
                  <div style={{ marginTop: '0.6rem', whiteSpace: 'normal' }}>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.78rem' }}>Suggested indexes</strong>
                    {aiExplanation.index_recommendations.map((rec, i) => (
                      <div key={rec} className="nq-index-rec">
                        <code>{rec}</code>
                        <button className="nq-icon-btn" onClick={() => copyText(`idx${i}`, rec)} aria-label="Copy index command" title="Copy">
                          {copied === `idx${i}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Results */}
          <section className="card" aria-label="Query results" aria-busy={executing}>
            <div className="card-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <h3 className="card-title">
                  {hasRun ? `${matchCount} matching ${matchCount === 1 ? 'report' : 'reports'}` : 'Results'}
                </h3>
                {hasRun && (
                  <div className="nq-results-meta" style={{ marginTop: '0.2rem' }}>
                    <span>{execMs.toFixed(2)} ms on {engineLabel}</span>
                    {atLimit && <span>· showing the first {lastRun?.limit}; raise the limit to see more</span>}
                  </div>
                )}
              </div>
              <label className="nq-results-meta" style={{ gap: '0.4rem' }}>
                Show up to
                <select
                  className="form-control"
                  value={limit}
                  onChange={e => {
                    const next = Number(e.target.value);
                    setLimit(next);
                    if (hasRun && validation.isValid) handleRun(next);
                  }}
                  style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                >
                  {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            </div>

            {rawResponse && rawResponse.warnings.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>{rawResponse.warnings.map((w, i) => <div key={i}>{w}</div>)}</div>
              </div>
            )}

            {matches.length > 0 ? (
              <div className="nq-results-list">
                {matches.map(report => {
                  const isExpanded = !!expanded[report.id];
                  const isJson = !!jsonView[report.id];
                  const findings = report.findings ?? [];
                  const flagged = findings.map(f => findingMatches(f));
                  const matchTotal = flagged.filter(Boolean).length;
                  const ordered = findings.map((f, i) => ({ f, i, hit: flagged[i] }));
                  const collapsed = [...ordered.filter(o => o.hit), ...ordered.filter(o => !o.hit)];
                  const visible = isExpanded ? ordered : collapsed.slice(0, Math.max(3, matchTotal));
                  const values = matchedValues(report);

                  return (
                    <article key={report.id} className="nq-result">
                      <div className="nq-result-top">
                        <div className="nq-result-badges">
                          <code style={{ fontWeight: 700 }}>{report.id}</code>
                          <StatusBadge status={report.status} />
                          <SeverityBadge severity={report.overall_severity} />
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{report.category}</span>
                        </div>
                        <div className="nq-footer-group" style={{ gap: '0.25rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => copyText(report.id, JSON.stringify(report, null, 2))}>
                            {copied === report.id ? <Check size={14} /> : <Copy size={14} />}
                            {copied === report.id ? 'Copied' : 'Copy JSON'}
                          </button>
                          <button className="btn btn-ghost btn-sm" aria-pressed={isJson} onClick={() => setJsonView(prev => ({ ...prev, [report.id]: !prev[report.id] }))}>
                            <FileJson size={14} /> {isJson ? 'Summary' : 'Document'}
                          </button>
                        </div>
                      </div>

                      <Link to={`/reports/${report.id}`} className="nq-result-title">{report.title}</Link>
                      <div className="nq-result-sub">
                        {[report.location, report.inspector_name && `Inspector ${report.inspector_name}`, report.inspection_date].filter(Boolean).join(' · ')}
                      </div>

                      {isJson ? (
                        <div style={{ marginTop: '0.8rem' }}><JsonViewer data={report} /></div>
                      ) : (
                        <>
                          {values.length > 0 && (
                            <div className="nq-matched">
                              <span>Matched values</span>
                              {values.map(v => (
                                <code key={v.field}>{v.field.replace(/^dynamic_attributes\./, '')} = {v.values.slice(0, 3).map(formatValue).join(', ')}</code>
                              ))}
                            </div>
                          )}

                          {findings.length > 0 && (
                            <div className="nq-findings">
                              {visible.map(({ f, i, hit }) => (
                                <div key={i} className={`nq-finding ${hit ? 'is-match' : ''}`}>
                                  <div className="nq-finding-head">
                                    <SeverityBadge severity={f.severity} />
                                    <strong style={{ color: 'var(--color-text-primary)' }}>{f.category}</strong>
                                    <span className="nq-finding-desc">{f.description}</span>
                                    {hit && <span className="nq-match-tag">Matches</span>}
                                  </div>
                                  {f.issues && f.issues.length > 0 && (
                                    <ul className="nq-issues">
                                      {f.issues.map((iss, j) => {
                                        const issueHit = hit && issueMatches(iss);
                                        return (
                                          <li key={j} className={issueHit ? 'is-match' : undefined}>
                                            <span className="nq-issue-status">{iss.status}</span>
                                            <span>{iss.title}</span>
                                            {iss.code_reference && <span style={{ color: 'var(--color-text-muted)' }}>· {iss.code_reference}</span>}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="nq-matched" style={{ justifyContent: 'space-between' }}>
                            <span>
                              <Layers size={12} style={{ verticalAlign: '-2px' }} /> {findings.length} {findings.length === 1 ? 'finding' : 'findings'}
                              {matchTotal > 0 && <> · <span className="text-gold" style={{ fontWeight: 600 }}>{matchTotal} matched</span></>}
                              {report.dynamic_attributes && Object.keys(report.dynamic_attributes).length > 0 && (
                                <> · telemetry: <span className="nq-path">{Object.keys(report.dynamic_attributes).join(', ')}</span></>
                              )}
                            </span>
                            {findings.length > visible.length || isExpanded ? (
                              <button className="nq-link-btn" onClick={() => setExpanded(prev => ({ ...prev, [report.id]: !prev[report.id] }))}>
                                {isExpanded ? <>Show fewer <ChevronUp size={13} style={{ verticalAlign: '-2px' }} /></> : <>Show all {findings.length} findings <ChevronDown size={13} style={{ verticalAlign: '-2px' }} /></>}
                              </button>
                            ) : null}
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : hasRun ? (
              <div className="nq-state">
                <SearchCode size={30} style={{ color: 'var(--color-text-muted)' }} />
                <h3>No reports match</h3>
                <p>
                  The filter ran against your {schema?.total_documents ?? ''} {schema?.total_documents === 1 ? 'report' : 'reports'} in {execMs.toFixed(2)} ms and found nothing.
                  Check the values against the Fields list, or start from an example.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setLibraryTab('fields')}><FolderTree size={14} /> Browse fields</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setLibraryTab('examples')}><Layers size={14} /> Try an example</button>
                </div>
              </div>
            ) : (
              <div className="nq-state">
                <SearchCode size={30} style={{ color: 'var(--color-text-muted)' }} />
                <h3>Run a query to see matching reports</h3>
                <p>Pick an example on the left or build your own. Matching findings and issues are highlighted so you can see why each report was returned.</p>
                <div className="nq-learn">
                  {EDUCATIONAL_DOCUMENTDB_POINTS.map(pt => (
                    <div key={pt.title} className="nq-learn-item">
                      <strong>{pt.title}</strong>
                      <p>{pt.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {toast && <div className="nq-toast" role="status"><Check size={15} /> {toast}</div>}
    </div>
  );
};
