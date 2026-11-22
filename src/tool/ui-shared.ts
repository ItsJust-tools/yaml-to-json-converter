import { DIRECTIONS, type ToolState } from './types';

export { DIRECTIONS };

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return typeof v.input === 'string' && typeof v.direction === 'string';
}
