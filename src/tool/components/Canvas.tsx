'use client';

import React from 'react';
import { convertFor } from '../convert';
import {
  DIRECTIONS,
  MAX_INPUT_LENGTH,
  SAMPLE_JSON,
  SAMPLE_YAML,
  VALID_DIRECTIONS,
  type ConvertDirection,
  type ToolState,
} from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const SAMPLES: Record<ConvertDirection, string> = {
  'yaml-to-json': SAMPLE_YAML,
  'json-to-yaml': SAMPLE_JSON,
};

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const result = convertFor(state);
  const isYamlToJson = state.direction === 'yaml-to-json';
  const errorLine = result.ok ? undefined : result.error?.line;
  const inputLines = state.input.split('\n');

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="converter-canvas">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Conversion direction"
        data-testid="direction-tabs"
      >
        {DIRECTIONS.map((direction) => (
          <button
            key={direction.value}
            type="button"
            role="tab"
            aria-selected={state.direction === direction.value}
            data-testid={`direction-tab-${direction.value}`}
            title={direction.hint}
            onClick={() => {
              const value: ConvertDirection = VALID_DIRECTIONS.includes(direction.value)
                ? direction.value
                : 'yaml-to-json';
              update({ direction: value });
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              state.direction === direction.value
                ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {direction.label}
          </button>
        ))}
        <button
          type="button"
          data-testid="btn-load-sample"
          onClick={() => update({ input: SAMPLES[state.direction] })}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
        >
          Load sample
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {isYamlToJson ? 'YAML input' : 'JSON input'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {state.input.length} / {MAX_INPUT_LENGTH} chars
            </span>
          </div>
          <textarea
            rows={14}
            value={state.input}
            onChange={(e) => update({ input: e.target.value.slice(0, MAX_INPUT_LENGTH) })}
            data-testid="input-text"
            spellCheck={false}
            placeholder={isYamlToJson ? 'Paste YAML here…' : 'Paste JSON here…'}
            className={inputClass}
          />
          {!result.ok && errorLine ? (
            <p
              role="alert"
              data-testid="error-line-marker"
              className="mt-1 text-xs text-rose-700 dark:text-rose-300"
            >
              Problem near line {errorLine}
            </p>
          ) : null}
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {isYamlToJson ? 'JSON output' : 'YAML output'}
          </span>
          <pre
            data-testid="output-text"
            aria-live="polite"
            className="mt-1 min-h-[21rem] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-100"
          >
            {result.ok ? result.output || '—' : ''}
          </pre>
          {!result.ok && result.error ? (
            <p
              role="alert"
              data-testid="error-message"
              className="mt-1 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {result.error.line ? `Line ${result.error.line}: ` : ''}
              {result.error.message}
            </p>
          ) : null}
        </div>
      </div>

      {!result.ok && errorLine ? (
        <div
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 font-mono text-xs dark:border-rose-900 dark:bg-rose-950/30"
          data-testid="error-highlight"
          aria-hidden="true"
        >
          {inputLines.slice(Math.max(0, errorLine - 3), errorLine + 2).map((line, index) => {
            const lineNumber = Math.max(0, errorLine - 3) + index + 1;
            const isErrorLine = lineNumber === errorLine;
            return (
              <div
                key={`${lineNumber}-${line}`}
                className={
                  isErrorLine
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                    : 'text-gray-500 dark:text-gray-400'
                }
              >
                <span className="mr-3 inline-block w-8 select-none text-right opacity-60">
                  {lineNumber}
                </span>
                {line || ' '}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Format options">
        <button
          type="button"
          data-testid="toggle-sort-keys"
          aria-pressed={state.sortKeys}
          onClick={() => update({ sortKeys: !state.sortKeys })}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
        >
          {state.sortKeys ? '✓ ' : ''}Sort keys alphabetically
        </button>
        {!isYamlToJson ? (
          <span
            className="flex items-center gap-1"
            role="group"
            aria-label="YAML indentation"
            data-testid="indent-group"
          >
            <button
              type="button"
              data-testid="indent-2"
              aria-pressed={state.indent === 2}
              onClick={() => update({ indent: 2 })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                state.indent === 2
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              2 spaces
            </button>
            <button
              type="button"
              data-testid="indent-4"
              aria-pressed={state.indent === 4}
              onClick={() => update({ indent: 4 })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                state.indent === 4
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              4 spaces
            </button>
          </span>
        ) : null}
      </div>

      {result.ok && result.stats ? (
        <div
          className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4 dark:border-gray-800 dark:bg-gray-900/50"
          data-testid="stats-panel"
        >
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Input size
            </span>
            <span className="font-mono text-sm font-bold" data-testid="stat-input-size">
              {result.stats.inputSize} B
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Output size
            </span>
            <span className="font-mono text-sm font-bold" data-testid="stat-output-size">
              {result.stats.outputSize} B
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Keys
            </span>
            <span className="font-mono text-sm font-bold" data-testid="stat-key-count">
              {result.stats.keyCount}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Max depth
            </span>
            <span className="font-mono text-sm font-bold" data-testid="stat-depth">
              {result.stats.depth}
            </span>
          </div>
          {result.documents > 1 ? (
            <div className="col-span-2 sm:col-span-4">
              <span className="block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Documents
              </span>
              <span className="font-mono text-sm font-bold" data-testid="stat-documents">
                {result.documents} (converted to a JSON array)
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {result.ok && result.output ? (
          <button
            type="button"
            data-testid="btn-save-history"
            onClick={() => onSaveHistory?.(result.output)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Save to history
          </button>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved conversions yet.
          </p>
        ) : (
          <ul className="space-y-1 text-xs" data-testid="history-list">
            {state.history.map((entry) => (
              <li
                key={`${entry.createdAt}-${entry.text.length}`}
                className="font-mono text-gray-700 dark:text-gray-300"
              >
                {entry.text.split('\n')[0]?.slice(0, 80) ?? ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
