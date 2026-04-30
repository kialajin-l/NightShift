/**
 * 模式模板导出
 */

import { PatternTemplate } from '../../types/pattern.js';
import { vuePatterns } from './vue-patterns.js';
import { fastapiPatterns } from './fastapi-patterns.js';
import { testPatterns } from './test-patterns.js';

/**
 * 所有预定义模式模板
 */
export const PATTERN_TEMPLATES: PatternTemplate[] = [
  ...vuePatterns,
  ...fastapiPatterns,
  ...testPatterns
];

/**
 * 按类别获取模板
 */
export function getTemplatesByCategory(category: PatternTemplate['category']): PatternTemplate[] {
  return PATTERN_TEMPLATES.filter(template => template.category === category);
}

/**
 * 按文件模式获取模板
 */
export function getTemplatesByFilePattern(filePattern: string): PatternTemplate[] {
  return PATTERN_TEMPLATES.filter(template => 
    template.filePattern === filePattern || 
    template.filePattern.includes(filePattern)
  );
}

/**
 * 获取支持特定语言的模板
 */
export function getTemplatesByLanguage(language: string): PatternTemplate[] {
  const languagePatterns: Record<string, string[]> = {
    'vue': ['**/*.vue'],
    'typescript': ['**/*.ts', '**/*.tsx'],
    'javascript': ['**/*.js', '**/*.jsx'],
    'python': ['**/*.py']
  };
  
  const patterns = languagePatterns[language] || [];
  return PATTERN_TEMPLATES.filter(template => 
    patterns.some(pattern => template.filePattern.includes(pattern.replace('**/', '')))
  );
}