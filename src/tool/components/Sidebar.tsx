'use client';

import React from 'react';
import { DIRECTIONS, type ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="converter-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Conversion modes</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {DIRECTIONS.map((direction) => (
            <li key={direction.value} className="flex justify-between gap-2">
              <span>{direction.label}</span>
              <span className="text-gray-500 dark:text-gray-400">{direction.hint}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Currently active:{' '}
          <button
            type="button"
            data-testid="sidebar-direction"
            onClick={() =>
              onChange({
                ...state,
                direction: state.direction === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json',
              })
            }
            className="underline"
          >
            {state.direction === 'yaml-to-json' ? 'YAML → JSON' : 'JSON → YAML'}
          </button>{' '}
          (click to switch)
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved conversions</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>D</kbd> — toggle conversion direction
          </li>
          <li>
            <kbd>S</kbd> — load the sample document
          </li>
          <li>
            <kbd>Y</kbd> — copy conversion output
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Multi-document YAML</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          YAML inputs separated by <code>---</code> are converted together; the JSON output is an
          array with one element per document.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current input and options;
          open it to restore this conversion.
        </p>
      </div>
    </div>
  );
};
