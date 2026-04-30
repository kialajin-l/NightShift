/**
 * 模式模板导出
 */
import { vuePatterns } from './vue-patterns.js';
import { fastapiPatterns } from './fastapi-patterns.js';
import { testPatterns } from './test-patterns.js';
/**
 * 所有预定义模式模板
 */
export const PATTERN_TEMPLATES = [
    ...vuePatterns,
    ...fastapiPatterns,
    ...testPatterns
];
/**
 * 按类别获取模板
 */
export function getTemplatesByCategory(category) {
    return PATTERN_TEMPLATES.filter(template => template.category === category);
}
/**
 * 按文件模式获取模板
 */
export function getTemplatesByFilePattern(filePattern) {
    return PATTERN_TEMPLATES.filter(template => template.filePattern === filePattern ||
        template.filePattern.includes(filePattern));
}
/**
 * 获取支持特定语言的模板
 */
export function getTemplatesByLanguage(language) {
    const languagePatterns = {
        'vue': ['**/*.vue'],
        'typescript': ['**/*.ts', '**/*.tsx'],
        'javascript': ['**/*.js', '**/*.jsx'],
        'python': ['**/*.py']
    };
    const patterns = languagePatterns[language] || [];
    return PATTERN_TEMPLATES.filter(template => patterns.some(pattern => template.filePattern.includes(pattern.replace('**/', ''))));
}
