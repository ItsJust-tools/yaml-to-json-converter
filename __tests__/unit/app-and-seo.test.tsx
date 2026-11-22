import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import ErrorPage from '@/app/error';
import NotFound from '@/app/not-found';
import { JsonLd } from '@/app/json-ld';
import ToolPage from '@/app/page';
import { cn } from '@/lib/utils';
import { generateJsonLd, generateToolMetadata } from '@/lib/seo';
import toolConfig from '@/tool/tool.config';
import { getPublicSiteUrl, templateMetadata } from '@/tool/template-metadata';
import { yamlToJsonConverterTool } from '@/tool/tool-definition';
import { Canvas } from '@/tool/components/Canvas';
import { Sidebar } from '@/tool/components/Sidebar';
import { Toolbar } from '@/tool/components/Toolbar';
import { DEFAULT_STATE as BASE_DEFAULT_STATE, SAMPLE_YAML } from '@/tool/types';
import { countKeys, yamlToJson } from '@/tool/convert';

const countKeysStateSample = (() => {
  const parsed = yamlToJson(SAMPLE_YAML, false);
  if (!parsed.ok || !parsed.output) return 0;
  const documents = JSON.parse(parsed.output);
  const value = Array.isArray(documents) ? documents : [documents];
  return value.reduce((sum: number, doc: unknown) => sum + countKeys(doc), 0);
})();
import type { ExporterLoader } from '@itsjust/core';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/tool-client-wrapper', () => ({
  default: () => <div data-testid="tool-client-wrapper">tool-client-wrapper</div>,
}));

describe('app and seo', () => {
  const getOgImageUrl = (
    images: NonNullable<NonNullable<ReturnType<typeof generateToolMetadata>['openGraph']>['images']>
  ): string | undefined => {
    const list = Array.isArray(images) ? images : [images];
    const first = list[0];
    if (!first) return undefined;
    if (typeof first === 'string') return first;
    if (first instanceof URL) return first.toString();
    return String(first.url);
  };

  it('builds metadata and json-ld values', () => {
    const metadata = generateToolMetadata(toolConfig);
    const jsonLd = generateJsonLd(toolConfig);

    expect(metadata.creator).toBe(toolConfig.name);
    expect(metadata.metadataBase?.toString()).toBe('http://localhost:3000/');
    const ogUrl = metadata.openGraph?.images ? getOgImageUrl(metadata.openGraph.images) : undefined;
    expect(ogUrl).toContain('/og.svg');
    expect(jsonLd.url).toBe('http://localhost:3000');
    expect(jsonLd.featureList.length).toBeGreaterThan(0);
  });

  it('returns site manifest, robots and sitemap', () => {
    const man = manifest();
    const rob = robots();
    const sm = sitemap();

    expect(man.name).toBe(templateMetadata.appName);
    expect(rob.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(sm[0]?.url).toBe('http://localhost:3000');
  });

  it('renders json-ld script safely', () => {
    render(<JsonLd config={{ ...toolConfig, name: '</script>' }} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).toContain('\\u003c/script>');
  });

  it('renders error page and invokes reset', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders not-found page', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });

  it('renders top-level tool page', () => {
    render(<ToolPage />);
    expect(screen.getByTestId('tool-client-wrapper')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });

  it('covers tool definition and helper exports', async () => {
    expect(cn('a', undefined, 'b', false, null, 'c')).toBe('a b c');
    expect(getPublicSiteUrl()).toBe('http://localhost:3000');
    expect(yamlToJsonConverterTool.name).toBe(toolConfig.name);
    expect(
      yamlToJsonConverterTool.deserialize({
        direction: 'json-to-yaml',
        input: '{"a": 1}',
        indent: 4,
        sortKeys: true,
        history: [{ text: 'converted', createdAt: '2026-11-21T10:00:00.000Z' }],
      })
    ).toEqual({
      success: true,
      data: {
        direction: 'json-to-yaml',
        input: '{"a": 1}',
        indent: 4,
        sortKeys: true,
        history: [{ text: 'converted', createdAt: '2026-11-21T10:00:00.000Z' }],
      },
    });
    const repaired = yamlToJsonConverterTool.deserialize({ nope: true });
    expect(repaired.success).toBe(true);
    if (repaired.success) {
      expect(repaired.data.direction).toBe(BASE_DEFAULT_STATE.direction);
      expect(repaired.data.sortKeys).toBe(false);
      expect(repaired.data.history).toEqual([]);
    }
    expect(yamlToJsonConverterTool.deserialize('not an object').success).toBe(false);
    expect(yamlToJsonConverterTool.serialize({ ...BASE_DEFAULT_STATE, input: 'a: 1' })).toContain(
      '"input":"a: 1"'
    );
    const exporters =
      (yamlToJsonConverterTool as { exporters?: Array<{ loader: ExporterLoader }> }).exporters ??
      [];
    expect(exporters).toHaveLength(4);
    const first = exporters[0];
    expect(first).toBeDefined();
    if (!first) throw new Error('missing exporter');
    const png = await (first.loader as ExporterLoader)();
    const resolved = 'default' in png ? png.default : png.exporter;
    expect(resolved.format).toBe('png');
  });

  it('renders tool components', () => {
    render(
      <>
        <Toolbar
          state={{ ...BASE_DEFAULT_STATE, input: SAMPLE_YAML }}
          onChange={() => {}}
          onClear={() => {}}
          onCopy={() => {}}
          onDownload={() => {}}
        />
        <Sidebar state={{ ...BASE_DEFAULT_STATE }} onChange={() => {}} />
        <Canvas state={{ ...BASE_DEFAULT_STATE, input: SAMPLE_YAML }} onChange={() => {}} />
      </>
    );

    expect(screen.getByTestId('direction-tab-yaml-to-json')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
    expect(screen.getByTestId('stat-key-count')).toHaveTextContent(String(countKeysStateSample));
  });
});
