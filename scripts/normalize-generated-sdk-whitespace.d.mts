export interface NormalizeGeneratedSdkWhitespaceOptions {
  extensions?: Set<string>;
  root?: string;
}

export function normalizeGeneratedSdkWhitespace(
  options?: NormalizeGeneratedSdkWhitespaceOptions,
): Promise<string[]>;
