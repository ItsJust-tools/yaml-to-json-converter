import { describe, it, expect } from 'vitest';
import {
  yamlToJson,
  jsonToYaml,
  convertFor,
  countKeys,
  measureDepth,
  summaryText,
} from '@/tool/convert';
import {
  deserializeState,
  serializeState,
  withHistory,
  roundTrips,
  yamlToJsonConverterTool,
} from '@/tool/tool-definition';
import { DEFAULT_STATE, MAX_HISTORY, type ToolState } from '@/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('yamlToJson', () => {
  it('converts nested maps and lists to JSON', () => {
    const input = `name: my-app
servers:
  - host: web1
    port: 80
  - host: web2
    port: 443
nested:
  deep:
    value: 42`;
    const result = yamlToJson(input, false);
    expect(result.ok).toBe(true);
    const parsed = JSON.parse(result.output) as Record<string, unknown>;
    expect(parsed.name).toBe('my-app');
    expect(parsed.servers).toEqual([
      { host: 'web1', port: 80 },
      { host: 'web2', port: 443 },
    ]);
    const nested = parsed.nested as { deep: { value: number } };
    expect(nested.deep.value).toBe(42);
  });

  it('supports scalar types and null values', () => {
    const result = yamlToJson('a: 1\nb: true\nc: "text"\nd: null\ne: 1.5', false);
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.output)).toEqual({ a: 1, b: true, c: 'text', d: null, e: 1.5 });
  });

  it('returns an error with line number for invalid YAML', () => {
    const result = yamlToJson('a: 1\n  bad: indent\nb: [', false);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toBeTruthy();
    expect(typeof result.error?.line).toBe('number');
    expect(result.output).toBe('');
  });

  it('joins multi-document YAML into a JSON array', () => {
    const result = yamlToJson('---\na: 1\n---\nb: 2\n---\nc: 3', false);
    expect(result.ok).toBe(true);
    expect(result.documents).toBe(3);
    expect(JSON.parse(result.output)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('returns empty output for empty input', () => {
    const result = yamlToJson('   \n', false);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('');
    expect(result.stats).toBeUndefined();
  });

  it('sorts keys alphabetically when requested', () => {
    const result = yamlToJson('zeta: 1\nalpha: 2\nmid: 3', true);
    expect(result.ok).toBe(true);
    expect(Object.keys(JSON.parse(result.output))).toEqual(['alpha', 'mid', 'zeta']);
  });

  it('preserves insertion order by default', () => {
    const result = yamlToJson('zeta: 1\nalpha: 2\nmid: 3', false);
    expect(result.ok).toBe(true);
    expect(Object.keys(JSON.parse(result.output))).toEqual(['zeta', 'alpha', 'mid']);
  });

  it('produces indentation-controlled output', () => {
    const result = yamlToJson('a:\n  b: 1', false, 4);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('    "b": 1');
  });

  it('reports stats with size, key count and depth', () => {
    const result = yamlToJson('a:\n  b:\n    c: 1\nlist:\n  - 1\n  - 2', false);
    expect(result.ok).toBe(true);
    expect(result.stats?.inputSize).toBeGreaterThan(0);
    expect(result.stats?.outputSize).toBeGreaterThan(0);
    expect(result.stats?.keyCount).toBe(4);
    expect(result.stats?.depth).toBe(3);
  });
});

describe('jsonToYaml', () => {
  it('converts JSON to YAML with 2-space indentation', () => {
    const result = jsonToYaml('{"name":"my-app","servers":[{"host":"web1"}]}', false, 2);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('name: my-app');
    expect(result.output).toContain('servers:');
    expect(result.output).toContain('host: web1');
  });

  it('supports 4-space indentation', () => {
    const result = jsonToYaml('{"a":{"b":1}}', false, 4);
    expect(result.ok).toBe(true);
    expect(result.output).toMatch(/^a:\n    b: 1/);
  });

  it('returns a clear error for invalid JSON', () => {
    const result = jsonToYaml('{"a": 1,,}', false, 2);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toBeTruthy();
  });

  it('returns a line number pointing at invalid JSON', () => {
    const result = jsonToYaml('{\n  "a": 1\n  "b": broken\n}', false, 2);
    expect(result.ok).toBe(false);
    expect(typeof result.error?.line).toBe('number');
  });

  it('sorts keys alphabetically when requested', () => {
    const result = jsonToYaml('{"zeta":1,"alpha":2}', true, 2);
    expect(result.ok).toBe(true);
    expect(result.output.indexOf('alpha:')).toBeLessThan(result.output.indexOf('zeta:'));
  });

  it('returns empty output for empty input', () => {
    const result = jsonToYaml('', false, 2);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('');
  });

  it('round-trips YAML through JSON and back', () => {
    const original = 'a: 1\nnested:\n  list:\n    - x\n    - y';
    const toJson = yamlToJson(original, false);
    expect(toJson.ok).toBe(true);
    const backToYaml = jsonToYaml(toJson.output, false, 2);
    expect(backToYaml.ok).toBe(true);
    const reparsed = yamlToJson(backToYaml.output, false);
    expect(reparsed.ok).toBe(true);
    expect(JSON.parse(reparsed.output)).toEqual(JSON.parse(toJson.output));
  });
});

describe('convertFor and helpers', () => {
  it('converts in the active direction', () => {
    expect(convertFor(state({ input: 'a: 1' })).ok).toBe(true);
    expect(convertFor(state({ direction: 'json-to-yaml', input: '{"a":1}' })).ok).toBe(true);
  });

  it('summarizes empty input', () => {
    expect(summaryText(state())).toBe('YAML → JSON: paste input to convert');
  });

  it('summarizes conversion results and errors', () => {
    expect(summaryText(state({ input: 'a: 1' }))).toBe('YAML → JSON: 1 keys');
    expect(summaryText(state({ input: 'a: 1\n---\nb: 2' }))).toBe(
      'YAML → JSON: 2 keys (2 documents)'
    );
    expect(summaryText(state({ input: 'a: [\nb: 1' }))).toContain('YAML → JSON:');
  });

  it('counts keys across nested arrays and objects', () => {
    expect(countKeys({ a: 1, b: { c: 2 }, d: [1, { e: 3 }] })).toBe(5);
    expect(countKeys([])).toBe(0);
  });

  it('measures nesting depth', () => {
    expect(measureDepth({ a: { b: { c: 1 } } })).toBe(3);
    expect(measureDepth([1, [2, [3]]])).toBe(3);
    expect(measureDepth('scalar')).toBe(0);
  });
});

describe('serialize and deserialize', () => {
  it('round-trips full tool state', () => {
    const full = state({
      input: 'a: 1',
      direction: 'json-to-yaml',
      indent: 4,
      sortKeys: true,
      history: [{ text: 'converted', createdAt: '2026-11-21T10:00:00.000Z' }],
    });
    expect(roundTrips(full)).toBe(true);
  });

  it('repairs invalid payloads with defaults', () => {
    const repaired = deserializeState({ input: 42, direction: 'sideways', indent: 'x' });
    expect(repaired.success).toBe(true);
    if (repaired.success) {
      expect(repaired.data.input).toBe(DEFAULT_STATE.input);
      expect(repaired.data.direction).toBe(DEFAULT_STATE.direction);
      expect(repaired.data.indent).toBe(2);
      expect(repaired.data.sortKeys).toBe(false);
    }
  });

  it('rejects non-object payloads', () => {
    expect(deserializeState('nope').success).toBe(false);
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
  });

  it('clamps history to MAX_HISTORY and validates entries', () => {
    let current = state();
    for (let i = 0; i < MAX_HISTORY + 3; i++) {
      current = withHistory(current, `entry-${i}`, new Date(2026, 10, 22, 12, 0, i));
    }
    expect(current.history).toHaveLength(MAX_HISTORY);
    expect(current.history[0]?.text).toBe(`entry-${MAX_HISTORY + 2}`);
    const repaired = deserializeState({
      history: [{ text: 'ok', createdAt: 'x' }, { nope: true }, 'junk'],
    });
    expect(repaired.success).toBe(true);
    if (repaired.success) {
      expect(repaired.data.history).toHaveLength(1);
    }
  });

  it('serializes into compact JSON', () => {
    const text = serializeState(state({ input: 'a: 1', sortKeys: true }));
    expect(JSON.parse(text)).toMatchObject({
      input: 'a: 1',
      sortKeys: true,
      direction: 'yaml-to-json',
      indent: 2,
    });
  });

  it('exposes the tool definition with exporters', () => {
    expect(yamlToJsonConverterTool.id).toBe('yaml-to-json-converter');
    expect(yamlToJsonConverterTool.name).toBe('YAML to JSON Converter');
    expect(yamlToJsonConverterTool.serialize).toBeTypeOf('function');
    expect(yamlToJsonConverterTool.deserialize).toBeTypeOf('function');
    expect(yamlToJsonConverterTool.exporters?.length).toBe(4);
  });
});
