import type { ToolConfig } from '@itsjust/core';

const toolConfig = {
  id: 'yaml-to-json-converter',
  name: 'YAML to JSON Converter',
  description:
    'Convert YAML to JSON and vice versa with live bidirectional conversion, error highlighting, and format options.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: false,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    accentSubtle: 'rgba(139, 92, 246, 0.12)',
    brand: 'YAML to JSON Converter',
    icon: '🔁',
  },
  shortcuts: [
    {
      title: 'YAML to JSON Converter',
      shortcuts: [
        { keys: 'D', label: 'Mode', description: 'toggle conversion direction' },
        { keys: 'S', label: 'Sample', description: 'load the sample document' },
        { keys: 'Y', label: 'Copy output', description: 'copy the conversion output' },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
