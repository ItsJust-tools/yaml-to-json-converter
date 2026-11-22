export type ConvertDirection = 'yaml-to-json' | 'json-to-yaml';

export type IndentStyle = 2 | 4;

export interface HistoryEntry {
  /** Short human readable description of the saved conversion. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** Current conversion direction. */
  direction: ConvertDirection;
  /** Input text (YAML in yaml-to-json mode, JSON in json-to-yaml mode). */
  input: string;
  /** Output indentation for reverse mode (JSON -> YAML). */
  indent: IndentStyle;
  /** Sort keys alphabetically instead of preserving insertion order. */
  sortKeys: boolean;
  /** Saved conversion history, newest first. */
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  direction: 'yaml-to-json',
  input: '',
  indent: 2,
  sortKeys: false,
  history: [],
};

export const MAX_HISTORY = 20;
export const MAX_INPUT_LENGTH = 100_000;

export const DIRECTIONS: { value: ConvertDirection; label: string; hint: string }[] = [
  { value: 'yaml-to-json', label: 'YAML → JSON', hint: 'paste YAML, get JSON' },
  { value: 'json-to-yaml', label: 'JSON → YAML', hint: 'paste JSON, get YAML' },
];

export const VALID_DIRECTIONS: ConvertDirection[] = ['yaml-to-json', 'json-to-yaml'];

export const SAMPLE_YAML = `# Sample configuration
name: my-app
version: 1.2.0
enabled: true
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
servers:
  - host: web1.example.com
    port: 80
  - host: web2.example.com
    port: 443
tags:
  - frontend
  - api
nested:
  deep:
    deeper:
      value: 42`;

export const SAMPLE_JSON = `{
  "name": "my-app",
  "version": "1.2.0",
  "enabled": true,
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  },
  "servers": [
    { "host": "web1.example.com", "port": 80 },
    { "host": "web2.example.com", "port": 443 }
  ],
  "tags": ["frontend", "api"],
  "nested": {
    "deep": {
      "deeper": {
        "value": 42
      }
    }
  }
}`;
