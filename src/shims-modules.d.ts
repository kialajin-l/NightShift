// 为未安装的依赖提供类型声明

declare module 'shiki' {
  export type BundledTheme = string;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react';
  const styles: Record<string, Record<string, CSSProperties>>;
  export const oneDark: typeof styles;
  export const oneLight: typeof styles;
  export const vscDarkPlus: typeof styles;
  export const nord: typeof styles;
  export const solarizedDarkAtom: typeof styles;
  export const solarizedlight: typeof styles;
  export const nightOwl: typeof styles;
  export const dracula: typeof styles;
  export const gruvboxDark: typeof styles;
  export const gruvboxLight: typeof styles;
  export const ghcolors: typeof styles;
  export const synthwave84: typeof styles;
  export const materialDark: typeof styles;
  export const materialOceanic: typeof styles;
  export const duotoneSea: typeof styles;
  export const coldarkDark: typeof styles;
  export const coldarkCold: typeof styles;
  export const materialLight: typeof styles;
  export const duotoneLight: typeof styles;
  export const vs: typeof styles;
  export const coy: typeof styles;
  export const prism: typeof styles;
  export const duotoneEarth: typeof styles;
  export const duotoneForest: typeof styles;
  export const twilight: typeof styles;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs' {
  import type { CSSProperties } from 'react';
  const styles: Record<string, Record<string, CSSProperties>>;
  export const github: typeof styles;
  export const githubDark: typeof styles;
  export const monokai: typeof styles;
  export const monokaiSublime: typeof styles;
  export const atomOneDark: typeof styles;
  export const atomOneLight: typeof styles;
  export const vs2015: typeof styles;
  export const xt256: typeof styles;
  export const docco: typeof styles;
  export const ascetic: typeof styles;
  export const far: typeof styles;
  export const idea: typeof styles;
  export const magula: typeof styles;
  export const sunburst: typeof styles;
  export const zenburn: typeof styles;
  export const pojoaque: typeof styles;
  export const atelierCaveDark: typeof styles;
  export const atelierCaveLight: typeof styles;
  export const atelierDuneDark: typeof styles;
  export const atelierDuneLight: typeof styles;
  export const atelierEstuaryDark: typeof styles;
  export const atelierEstuaryLight: typeof styles;
  export const atelierForestDark: typeof styles;
  export const atelierForestLight: typeof styles;
  export const atelierHeathDark: typeof styles;
  export const atelierHeathLight: typeof styles;
  export const atelierLakesideDark: typeof styles;
  export const atelierLakesideLight: typeof styles;
  export const atelierPlateauDark: typeof styles;
  export const atelierPlateauLight: typeof styles;
  export const atelierSavannaDark: typeof styles;
  export const atelierSavannaLight: typeof styles;
  export const atelierSeasideDark: typeof styles;
  export const atelierSeasideLight: typeof styles;
  export const atelierSulphurpoolDark: typeof styles;
  export const atelierSulphurpoolLight: typeof styles;
  export const colorBrewer: typeof styles;
  export const kimbieDark: typeof styles;
  export const kimbieLight: typeof styles;
  export const obsidian: typeof styles;
  export const paraisoDark: typeof styles;
  export const paraisoLight: typeof styles;
  export const railscasts: typeof styles;
  export const rainbow: typeof styles;
  export const schoolBook: typeof styles;
  export const hopscotch: typeof styles;
  export const irBlack: typeof styles;
  export const a11yDark: typeof styles;
  export const a11yLight: typeof styles;
  export const qtcreatorDark: typeof styles;
  export const qtcreatorLight: typeof styles;
  // 额外导出（别名映射）
  export const nord: typeof styles;
  export const solarizedDark: typeof styles;
  export const solarizedLight: typeof styles;
  export const nightOwl: typeof styles;
  export const dracula: typeof styles;
  export const gruvboxDark: typeof styles;
  export const gruvboxLight: typeof styles;
  export const vs: typeof styles;
  export const lightfair: typeof styles;
  export const xcode: typeof styles;
  export const darcula: typeof styles;
}
