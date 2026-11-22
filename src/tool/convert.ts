import { loadAll as loadAllYaml, dump as dumpYaml, YAMLException, type Mark } from 'js-yaml';
import { DIRECTIONS, type ToolState } from './types';

export interface ConversionError {
  message: string;
  /** 1-based line number pointing at the syntax problem, when known. */
  line?: number;
}

export interface ConversionStats {
  inputSize: number;
  outputSize: number;
  keyCount: number;
  depth: number;
}

export interface ConversionResult {
  ok: boolean;
  output: string;
  error?: ConversionError;
  stats?: ConversionStats;
  /** Number of YAML documents found (multi-document inputs). */
  documents: number;
}

function positionLine(mark?: Mark): number | undefined {
  return typeof mark?.line === 'number' ? mark.line + 1 : undefined;
}

function describeYamlError(error: unknown): ConversionError {
  if (error instanceof YAMLException) {
    return {
      message: error.reason?.trim() || error.message.split('\n')[0] || 'Invalid YAML',
      line: positionLine(error.mark),
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { message };
}

function describeJsonError(error: unknown): ConversionError {
  if (error instanceof SyntaxError) {
    const match = /position (\d+)/.exec(error.message);
    if (match) {
      const position = Number(match[1]);
      const line = error.message.slice(0, position).split('\n').length;
      return { message: error.message, line };
    }
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

export function countKeys(value: unknown): number {
  let count = 0;
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node !== null && typeof node === 'object') {
      for (const [, nested] of Object.entries(node as Record<string, unknown>)) {
        count += 1;
        walk(nested);
      }
    }
  };
  walk(value);
  return count;
}

export function measureDepth(value: unknown): number {
  const walk = (node: unknown): number => {
    if (Array.isArray(node)) {
      return node.length === 0 ? 1 : 1 + Math.max(...node.map(walk));
    }
    if (node !== null && typeof node === 'object') {
      const entries = Object.values(node as Record<string, unknown>);
      return entries.length === 0 ? 1 : 1 + Math.max(...entries.map(walk));
    }
    return 0;
  };
  return walk(value);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort((a, b) =>
      a.localeCompare(b)
    )) {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function stringifyJson(value: unknown, indent: number): string {
  return `${JSON.stringify(value, null, indent)}\n`;
}

/** Convert YAML -> JSON. Multi-document inputs become a JSON array. */
export function yamlToJson(input: string, sortKeys: boolean, indent = 2): ConversionResult {
  if (!input.trim()) {
    return { ok: true, output: '', documents: 0, stats: undefined };
  }
  try {
    const documents = loadAllYaml(input) as unknown[];
    const payload =
      documents.length > 1 ? documents : sortKeys ? sortValue(documents[0]) : documents[0];
    const output = stringifyJson(payload, indent);
    const value = documents.length > 1 ? documents : documents[0];
    return {
      ok: true,
      output,
      documents: documents.length,
      stats: statsFor(input, output, value),
    };
  } catch (error) {
    return {
      ok: false,
      output: '',
      documents: 0,
      error: describeYamlError(error),
    };
  }
}

/** Convert JSON -> YAML. */
export function jsonToYaml(input: string, sortKeys: boolean, indent: number): ConversionResult {
  if (!input.trim()) {
    return { ok: true, output: '', documents: 0, stats: undefined };
  }
  try {
    const parsed: unknown = JSON.parse(input);
    const value = sortKeys ? sortValue(parsed) : parsed;
    const output = dumpYaml(value, { indent, lineWidth: 80 });
    return {
      ok: true,
      output,
      documents: 1,
      stats: statsFor(input, output, parsed),
    };
  } catch (error) {
    return {
      ok: false,
      output: '',
      documents: 0,
      error: describeJsonError(error),
    };
  }
}

function statsFor(input: string, output: string, value: unknown): ConversionStats {
  return {
    inputSize: new TextEncoder().encode(input).length,
    outputSize: new TextEncoder().encode(output).length,
    keyCount: countKeys(value),
    depth: measureDepth(value),
  };
}

/** Run the conversion for the current tool state. */
export function convertFor(state: ToolState): ConversionResult {
  const indent = Number(state.indent);
  return state.direction === 'yaml-to-json'
    ? yamlToJson(state.input, state.sortKeys, indent)
    : jsonToYaml(state.input, state.sortKeys, indent);
}

/** Human-readable one-line status, used by the status bar and copy actions. */
export function summaryText(state: ToolState): string {
  const label = DIRECTIONS.find((d) => d.value === state.direction)?.label ?? state.direction;
  if (!state.input.trim()) {
    return `${label}: paste input to convert`;
  }
  const result = convertFor(state);
  if (!result.ok) {
    return `${label}: ${result.error?.message ?? 'invalid input'}`;
  }
  const docs = result.documents > 1 ? ` (${result.documents} documents)` : '';
  return `${label}: ${result.stats?.keyCount ?? 0} keys${docs}`;
}

/** Build a history entry text for the current state. */
export function historyText(state: ToolState): string {
  return summaryText(state);
}

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.input === 'string' &&
    typeof v.direction === 'string' &&
    (v.indent === undefined || typeof v.indent === 'number')
  );
}

export { dumpYaml };
