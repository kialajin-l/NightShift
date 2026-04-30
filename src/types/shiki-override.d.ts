// Override shiki module resolution - shiki's exports map lacks types condition
declare module "shiki" {
  export type BundledLanguage = string;
  export type BundledTheme = string;
  export type BuiltinLanguage = string;
  export type BuiltinTheme = string;
  export interface ThemedToken {
    content: string;
    color?: string;
    bgColor?: string;
    fontStyle?: number;
    htmlStyle?: Record<string, string>;
  }
  export interface Highlighter<L extends string = string, T extends string = string> {
    codeToHtml(code: string, options?: { lang?: L; theme?: T }): string;
    codeToTokens(code: string, options?: { lang?: L; theme?: T }): { tokens: ThemedToken[][]; fg: string; bg: string };
    getLoadedLanguages(): string[];
    getLoadedThemes(): string[];
  }
  export function createHighlighter(options: { themes: string[]; langs: string[] }): Promise<Highlighter>;
  export const bundledLanguages: Record<string, any>;
  export const bundledThemes: Record<string, any>;
  export const bundledLanguagesInfo: any[];
  export const bundledThemesInfo: any[];
  export function codeToHtml(code: string, options?: any): string | Promise<string>;
  export function codeToTokens(code: string, options?: any): any;
}

declare module "@shikijs/types" {
  export interface ThemedToken {
    content: string;
    color?: string;
    bgColor?: string;
    fontStyle?: number;
    htmlStyle?: Record<string, string>;
  }
}

// Override streamdown plugin types
declare module "@streamdown/cjk" {
  export const cjk: any;
}
declare module "@streamdown/code" {
  export const code: any;
}
declare module "@streamdown/math" {
  export const math: any;
}
declare module "@streamdown/mermaid" {
  export const mermaid: any;
}
declare module "streamdown" {
  export const Streamdown: any;
}
