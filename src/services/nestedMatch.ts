import { QueryCondition } from '../types';

/**
 * Client-side mirror of the query operators, used only to show *why* a returned document matched
 * (which finding, issue or telemetry value satisfied the filter). The database decides what matches.
 */

/** Every value at a dotted path, stepping into arrays the way MongoDB/DocumentDB dot notation does. */
export const valuesAtPath = (node: unknown, path: string): unknown[] => {
  const walk = (current: unknown, keys: string[]): unknown[] => {
    if (Array.isArray(current)) return current.flatMap(item => walk(item, keys));
    if (keys.length === 0) return current === undefined ? [] : [current];
    if (current === null || typeof current !== 'object') return [];
    return walk((current as Record<string, unknown>)[keys[0]], keys.slice(1));
  };
  return walk(node, path.split('.').filter(Boolean));
};

const listOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : String(value ?? '').split(',').map(s => s.trim()).filter(Boolean);

const asRegex = (pattern: string): RegExp | null => {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
};

const compare = (actual: unknown, target: unknown): number | null => {
  const a = Number(actual);
  const b = Number(target);
  if (actual !== '' && target !== '' && !Number.isNaN(a) && !Number.isNaN(b)) return a - b;
  if (typeof actual === 'string' && typeof target === 'string') return actual.localeCompare(target);
  return null;
};

const valueMatches = (cond: QueryCondition, actual: unknown): boolean => {
  const target = cond.value_type === 'number' && cond.value !== '' ? Number(cond.value) : cond.value;
  const text = String(actual);
  switch (cond.operator) {
    case 'equals': return String(actual) === String(target);
    case 'not_equals': return String(actual) !== String(target);
    case 'greater_than': { const c = compare(actual, target); return c !== null && c > 0; }
    case 'greater_than_or_equal': { const c = compare(actual, target); return c !== null && c >= 0; }
    case 'less_than': { const c = compare(actual, target); return c !== null && c < 0; }
    case 'less_than_or_equal': { const c = compare(actual, target); return c !== null && c <= 0; }
    case 'contains': return asRegex(String(target))?.test(text) ?? text.toLowerCase().includes(String(target).toLowerCase());
    case 'starts_with': return asRegex(`^${String(target)}`)?.test(text) ?? false;
    case 'ends_with': return asRegex(`${String(target)}$`)?.test(text) ?? false;
    case 'in': return listOf(target).includes(text);
    case 'not_in': return !listOf(target).includes(text);
    case 'is_true': return actual === true;
    case 'is_false': return actual === false;
    default: return false;
  }
};

/** Whether `node` satisfies `cond`, with `relativePath` measured from `node`. Null when the operator cannot be checked per element. */
export const conditionMatches = (node: unknown, relativePath: string, cond: QueryCondition): boolean | null => {
  if (cond.operator === 'array_size') return null;
  const values = valuesAtPath(node, relativePath);
  if (cond.operator === 'exists') return (values.length > 0) === (cond.value !== false && cond.value !== 'false');
  return values.some(v => valueMatches(cond, v));
};

/** Combines per-condition results with the builder's AND / OR / NOT logic. */
export const combine = (results: (boolean | null)[], matchType: string): boolean => {
  const checked = results.filter((r): r is boolean => r !== null);
  if (checked.length === 0) return false;
  if (matchType === 'or') return checked.some(Boolean);
  if (matchType === 'not') return false;
  return checked.every(Boolean);
};

/** Conditions whose field sits under `prefix.` with the prefix stripped, e.g. findings.issues.status -> issues.status. */
export const conditionsUnder = (conditions: QueryCondition[], prefix: string) =>
  conditions
    .filter(c => c.field.startsWith(`${prefix}.`))
    .map(c => ({ cond: c, relative: c.field.slice(prefix.length + 1) }));

/** Every dotted field path a filter touches, including the fields inside $elemMatch. */
export const filterPaths = (node: unknown, prefix = ''): string[] => {
  if (Array.isArray(node)) return node.flatMap(item => filterPaths(item, prefix));
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => {
    if (key.startsWith('$')) return filterPaths(value, prefix);
    const path = prefix ? `${prefix}.${key}` : key;
    return [path, ...filterPaths(value, path)];
  });
};
