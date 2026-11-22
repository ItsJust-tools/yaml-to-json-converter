# YAML to JSON Converter

Convert YAML to JSON and back with live, bidirectional conversion while you type. Paste YAML and see the JSON output update on every keystroke — flip to reverse mode to paste JSON and get YAML instead.

## Features

- Live bidirectional conversion: YAML → JSON and JSON → YAML, updating on every keystroke
- YAML syntax error reporting with the line number and a human-readable message, plus inline error highlighting around the problem line
- Reverse-mode indentation choice: 2 or 4 spaces for the YAML output
- Key sorting: alphabetize keys in the output or preserve insertion order
- Copy the output to the clipboard and download the result as `.json` or `.yaml`
- Sample YAML and JSON presets that load an example document instantly
- Conversion stats: input size, output size, key count and maximum nesting depth
- Multi-document support: YAML inputs separated by `---` convert into a single JSON array with one element per document
- Shareable state via URL, `.itsjust.json` import/export and image/PDF export
- 100% client-side — no data ever leaves your browser

## Keyboard shortcuts

| Key | Action                      |
| --- | --------------------------- |
| `D` | Toggle conversion direction |
| `S` | Load the sample document    |
| `Y` | Copy conversion output      |

## Development

```bash
npm ci
npm run dev
```

Run the test suite (unit tests with coverage thresholds):

```bash
CI=true npm test -- --coverage
```

Build for production:

```bash
npm run build
```
