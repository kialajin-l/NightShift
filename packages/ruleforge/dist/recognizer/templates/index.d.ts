/**
 * 模式模板导出
 */
import { PatternTemplate } from '../../types/pattern.js';
/**
 * 所有预定义模式模板
 */
export declare const PATTERN_TEMPLATES: PatternTemplate[];
/**
 * 按类别获取模板
 */
export declare function getTemplatesByCategory(category: PatternTemplate['category']): PatternTemplate[];
/**
 * 按文件模式获取模板
 */
export declare function getTemplatesByFilePattern(filePattern: string): PatternTemplate[];
/**
 * 获取支持特定语言的模板
 */
export declare function getTemplatesByLanguage(language: string): PatternTemplate[];
