import type { DeserializeResult, ExporterLoader, Tool } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  VALID_DIRECTIONS,
  type ConvertDirection,
  type HistoryEntry,
  type IndentStyle,
  type ToolState,
} from './types';
import { historyText, summaryText } from './convert';

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    direction: state.direction,
    input: state.input,
    indent: state.indent,
    sortKeys: state.sortKeys,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

function validIndent(value: unknown): IndentStyle {
  return value === 4 ? 4 : 2;
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected YAML to JSON converter state object',
    };
  }
  const v = data as Record<string, unknown>;
  const direction: ConvertDirection = VALID_DIRECTIONS.includes(v.direction as ConvertDirection)
    ? (v.direction as ConvertDirection)
    : DEFAULT_STATE.direction;
  const state: ToolState = {
    direction,
    input: stringOr(v.input, DEFAULT_STATE.input),
    indent: validIndent(v.indent),
    sortKeys: v.sortKeys === true,
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, text: string, now = new Date()): ToolState {
  const entry: HistoryEntry = { text, createdAt: now.toISOString() };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export const yamlToJsonConverterTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: (() => import('./exporters/png')) as ExporterLoader },
    { format: 'jpeg', loader: (() => import('./exporters/jpeg')) as ExporterLoader },
    { format: 'webp', loader: (() => import('./exporters/webp')) as ExporterLoader },
    { format: 'pdf', loader: (() => import('./exporters/pdf')) as ExporterLoader },
  ],
};

export { historyText, summaryText };
