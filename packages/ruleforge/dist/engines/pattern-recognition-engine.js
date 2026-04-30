// NightShift RuleForge 模式识别引擎
/**
 * 模式识别引擎
 */
export class PatternRecognitionEngine {
    config;
    detectedPatterns = new Map();
    constructor(config) {
        this.config = {
            minConfidence: 0.7,
            minFrequency: 2,
            maxPatterns: 100,
            enableMachineLearning: false,
            languageSpecific: true,
            ...config
        };
    }
    /**
     * 分析对话，识别模式
     */
    async analyzeConversation(log) {
        const patterns = [];
        // 提取代码块和错误信息
        const codeBlocks = this.extractCodeBlocks(log);
        const errors = this.extractErrors(log);
        // 检测代码风格
        const codeStylePatterns = this.detectCodeStyle(codeBlocks);
        patterns.push(...codeStylePatterns);
        // 检测架构模式
        const architecturePatterns = this.detectArchitecture(codeBlocks);
        patterns.push(...architecturePatterns);
        // 检测最佳实践
        const bestPracticePatterns = this.detectBestPractices(codeBlocks);
        patterns.push(...bestPracticePatterns);
        // 检测错误模式
        const errorPatterns = this.detectErrorPatterns(errors);
        patterns.push(...errorPatterns);
        // 更新模式库
        this.updatePatternLibrary(patterns);
        // 过滤和排序结果
        return this.filterAndSortPatterns(patterns);
    }
    /**
     * 检测代码风格
     */
    detectCodeStyle(codeBlocks) {
        const patterns = [];
        // 检测命名规范
        const namingPatterns = this.detectNamingConventions(codeBlocks);
        patterns.push(...namingPatterns);
        // 检测缩进风格
        const indentationPatterns = this.detectIndentationStyles(codeBlocks);
        patterns.push(...indentationPatterns);
        // 检测注释风格
        const commentPatterns = this.detectCommentStyles(codeBlocks);
        patterns.push(...commentPatterns);
        // 检测导入风格
        const importPatterns = this.detectImportStyles(codeBlocks);
        patterns.push(...importPatterns);
        return patterns;
    }
    /**
     * 检测命名规范
     */
    detectNamingConventions(codeBlocks) {
        const patterns = [];
        const variableNaming = {};
        const functionNaming = {};
        const classNaming = {};
        codeBlocks.forEach(block => {
            const code = block.code;
            // 分析变量命名
            const variableMatches = code.matchAll(/(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
            for (const match of variableMatches) {
                const name = match[2];
                const style = this.analyzeNamingStyle(name);
                variableNaming[style] = (variableNaming[style] || 0) + 1;
            }
            // 分析函数命名
            const functionMatches = code.matchAll(/(function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g);
            for (const match of functionMatches) {
                const name = match[2];
                const style = this.analyzeNamingStyle(name);
                functionNaming[style] = (functionNaming[style] || 0) + 1;
            }
            // 分析类命名
            const classMatches = code.matchAll(/class\s+([A-Z][a-zA-Z0-9_$]*)/g);
            for (const match of classMatches) {
                const name = match[1];
                const style = this.analyzeNamingStyle(name);
                classNaming[style] = (classNaming[style] || 0) + 1;
            }
        });
        // 创建命名模式
        if (Object.keys(variableNaming).length > 0) {
            const dominantStyle = this.findDominantStyle(variableNaming);
            patterns.push({
                id: `naming-variable-${Date.now()}`,
                type: 'code-style',
                description: `变量命名规范: ${dominantStyle}`,
                examples: [{
                        context: '变量声明',
                        code: `const ${dominantStyle === 'camelCase' ? 'userName' : dominantStyle === 'PascalCase' ? 'UserName' : 'user_name'} = '';`,
                        explanation: `使用${dominantStyle}命名变量`,
                        source: 'auto-detected'
                    }],
                confidence: this.calculateConfidence(variableNaming, dominantStyle),
                frequency: variableNaming[dominantStyle] || 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                style: { naming: dominantStyle }
            });
        }
        return patterns;
    }
    /**
     * 分析命名风格
     */
    analyzeNamingStyle(name) {
        if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
            return 'camelCase';
        }
        else if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
            return 'PascalCase';
        }
        else if (name.includes('_')) {
            return 'snake_case';
        }
        else if (name.includes('-')) {
            return 'kebab-case';
        }
        return 'unknown';
    }
    /**
     * 检测缩进风格
     */
    detectIndentationStyles(codeBlocks) {
        const patterns = [];
        const indentationStats = {};
        codeBlocks.forEach(block => {
            const lines = block.code.split('\n');
            for (const line of lines) {
                if (line.startsWith(' ')) {
                    // 计算空格数量
                    const spaceCount = line.match(/^ */)?.[0].length || 0;
                    if (spaceCount > 0) {
                        const style = spaceCount === 2 ? '2-spaces' :
                            spaceCount === 4 ? '4-spaces' : 'other-spaces';
                        indentationStats[style] = (indentationStats[style] || 0) + 1;
                    }
                }
                else if (line.startsWith('\t')) {
                    indentationStats['tabs'] = (indentationStats['tabs'] || 0) + 1;
                }
            }
        });
        if (Object.keys(indentationStats).length > 0) {
            const dominantStyle = this.findDominantStyle(indentationStats);
            patterns.push({
                id: `indentation-${Date.now()}`,
                type: 'code-style',
                description: `缩进风格: ${dominantStyle}`,
                examples: [{
                        context: '代码缩进',
                        code: dominantStyle === '2-spaces' ? '  const x = 1;' :
                            dominantStyle === '4-spaces' ? '    const x = 1;' :
                                '\tconst x = 1;',
                        explanation: `使用${dominantStyle}进行缩进`,
                        source: 'auto-detected'
                    }],
                confidence: this.calculateConfidence(indentationStats, dominantStyle),
                frequency: indentationStats[dominantStyle] || 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                style: { indentation: dominantStyle }
            });
        }
        return patterns;
    }
    /**
     * 检测注释风格
     */
    detectCommentStyles(codeBlocks) {
        const patterns = [];
        const commentStats = {};
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测单行注释
            const singleLineComments = (code.match(/\/\/.*$/gm) || []).length;
            if (singleLineComments > 0) {
                commentStats['single-line'] = (commentStats['single-line'] || 0) + singleLineComments;
            }
            // 检测多行注释
            const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || []).length;
            if (multiLineComments > 0) {
                commentStats['multi-line'] = (commentStats['multi-line'] || 0) + multiLineComments;
            }
            // 检测 JSDoc 注释
            const jsdocComments = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
            if (jsdocComments > 0) {
                commentStats['jsdoc'] = (commentStats['jsdoc'] || 0) + jsdocComments;
            }
        });
        if (Object.keys(commentStats).length > 0) {
            const dominantStyle = this.findDominantStyle(commentStats);
            patterns.push({
                id: `comment-${Date.now()}`,
                type: 'code-style',
                description: `注释风格: ${dominantStyle}`,
                examples: [{
                        context: '代码注释',
                        code: dominantStyle === 'single-line' ? '// 这是单行注释' :
                            dominantStyle === 'multi-line' ? '/* 这是多行注释 */' :
                                '/** 这是JSDoc注释 */',
                        explanation: `使用${dominantStyle}注释风格`,
                        source: 'auto-detected'
                    }],
                confidence: this.calculateConfidence(commentStats, dominantStyle),
                frequency: commentStats[dominantStyle] || 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                style: { comments: dominantStyle }
            });
        }
        return patterns;
    }
    /**
     * 检测导入风格
     */
    detectImportStyles(codeBlocks) {
        const patterns = [];
        const importStats = {};
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测 ES6 import
            const es6Imports = (code.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || []).length;
            if (es6Imports > 0) {
                importStats['es6-import'] = (importStats['es6-import'] || 0) + es6Imports;
            }
            // 检测 CommonJS require
            const requireImports = (code.match(/const\s+.*?=\s+require\(['"][^'"]+['"]\)/g) || []).length;
            if (requireImports > 0) {
                importStats['commonjs-require'] = (importStats['commonjs-require'] || 0) + requireImports;
            }
            // 检测命名导入 vs 默认导入
            const namedImports = (code.match(/import\s+\{.*?\}\s+from/g) || []).length;
            const defaultImports = (code.match(/import\s+[^{]\s+from/g) || []).length;
            if (namedImports > 0) {
                importStats['named-import'] = (importStats['named-import'] || 0) + namedImports;
            }
            if (defaultImports > 0) {
                importStats['default-import'] = (importStats['default-import'] || 0) + defaultImports;
            }
        });
        if (Object.keys(importStats).length > 0) {
            const dominantStyle = this.findDominantStyle(importStats);
            patterns.push({
                id: `import-${Date.now()}`,
                type: 'code-style',
                description: `导入风格: ${dominantStyle}`,
                examples: [{
                        context: '模块导入',
                        code: dominantStyle === 'es6-import' ? 'import React from \'react\';' :
                            dominantStyle === 'commonjs-require' ? 'const React = require(\'react\');' :
                                'import { useState } from \'react\';',
                        explanation: `使用${dominantStyle}导入风格`,
                        source: 'auto-detected'
                    }],
                confidence: this.calculateConfidence(importStats, dominantStyle),
                frequency: importStats[dominantStyle] || 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                style: { imports: dominantStyle }
            });
        }
        return patterns;
    }
    /**
     * 检测架构模式
     */
    detectArchitecture(codeBlocks) {
        const patterns = [];
        // 检测组件化模式
        const componentPatterns = this.detectComponentPatterns(codeBlocks);
        patterns.push(...componentPatterns);
        // 检测状态管理模式
        const statePatterns = this.detectStatePatterns(codeBlocks);
        patterns.push(...statePatterns);
        return patterns;
    }
    /**
     * 检测组件化模式
     */
    detectComponentPatterns(codeBlocks) {
        const patterns = [];
        let componentCount = 0;
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测 React 组件
            if (code.includes('React.Component') || code.includes('function Component') ||
                code.includes('const Component') || code.includes('class Component')) {
                componentCount++;
            }
            // 检测 Vue 组件
            if (code.includes('export default') && (code.includes('template') || code.includes('setup'))) {
                componentCount++;
            }
        });
        if (componentCount > 0) {
            patterns.push({
                id: `architecture-component-${Date.now()}`,
                type: 'architecture',
                description: '组件化架构模式',
                examples: [{
                        context: '前端组件',
                        code: 'function MyComponent() { return <div>Hello</div>; }',
                        explanation: '使用函数式组件模式',
                        source: 'auto-detected'
                    }],
                confidence: Math.min(1, componentCount / 10),
                frequency: componentCount,
                firstSeen: new Date(),
                lastSeen: new Date(),
                architecture: {
                    pattern: 'component-based',
                    components: ['React Component', 'Vue Component'],
                    relationships: ['composition', 'inheritance']
                }
            });
        }
        return patterns;
    }
    /**
     * 检测状态管理模式
     */
    detectStatePatterns(codeBlocks) {
        const patterns = [];
        let stateCount = 0;
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测状态管理库
            if (code.includes('useState') || code.includes('useReducer') ||
                code.includes('redux') || code.includes('mobx') || code.includes('pinia')) {
                stateCount++;
            }
        });
        if (stateCount > 0) {
            patterns.push({
                id: `architecture-state-${Date.now()}`,
                type: 'architecture',
                description: '状态管理模式',
                examples: [{
                        context: '状态管理',
                        code: 'const [state, setState] = useState(initialState);',
                        explanation: '使用 React Hooks 状态管理',
                        source: 'auto-detected'
                    }],
                confidence: Math.min(1, stateCount / 5),
                frequency: stateCount,
                firstSeen: new Date(),
                lastSeen: new Date(),
                architecture: {
                    pattern: 'state-management',
                    components: ['useState', 'Redux', 'MobX'],
                    relationships: ['state-updates', 'side-effects']
                }
            });
        }
        return patterns;
    }
    /**
     * 检测最佳实践
     */
    detectBestPractices(codeBlocks) {
        const patterns = [];
        // 检测错误处理模式
        const errorHandlingPatterns = this.detectErrorHandling(codeBlocks);
        patterns.push(...errorHandlingPatterns);
        // 检测性能优化模式
        const performancePatterns = this.detectPerformanceOptimizations(codeBlocks);
        patterns.push(...performancePatterns);
        return patterns;
    }
    /**
     * 检测错误处理模式
     */
    detectErrorHandling(codeBlocks) {
        const patterns = [];
        let errorHandlingCount = 0;
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测 try-catch
            if (code.includes('try') && code.includes('catch')) {
                errorHandlingCount++;
            }
            // 检测 Promise.catch
            if (code.includes('.catch(')) {
                errorHandlingCount++;
            }
            // 检测错误边界
            if (code.includes('ErrorBoundary')) {
                errorHandlingCount += 2;
            }
        });
        if (errorHandlingCount > 0) {
            patterns.push({
                id: `best-practice-error-handling-${Date.now()}`,
                type: 'best-practice',
                description: '错误处理最佳实践',
                examples: [{
                        context: '异步错误处理',
                        code: 'fetch(url).then().catch(error => console.error(error));',
                        explanation: '使用 Promise.catch 处理异步错误',
                        source: 'auto-detected'
                    }],
                confidence: Math.min(1, errorHandlingCount / 3),
                frequency: errorHandlingCount,
                firstSeen: new Date(),
                lastSeen: new Date(),
                practice: {
                    category: 'error-handling',
                    benefits: ['提高应用稳定性', '更好的用户体验', '便于调试'],
                    implementation: '使用 try-catch 或 Promise.catch 包装可能出错的代码'
                }
            });
        }
        return patterns;
    }
    /**
     * 检测性能优化模式
     */
    detectPerformanceOptimizations(codeBlocks) {
        const patterns = [];
        let optimizationCount = 0;
        codeBlocks.forEach(block => {
            const code = block.code;
            // 检测 React.memo
            if (code.includes('React.memo')) {
                optimizationCount++;
            }
            // 检测 useMemo/useCallback
            if (code.includes('useMemo') || code.includes('useCallback')) {
                optimizationCount++;
            }
            // 检测懒加载
            if (code.includes('lazy') || code.includes('Suspense')) {
                optimizationCount += 2;
            }
        });
        if (optimizationCount > 0) {
            patterns.push({
                id: `best-practice-performance-${Date.now()}`,
                type: 'best-practice',
                description: '性能优化最佳实践',
                examples: [{
                        context: 'React 性能优化',
                        code: 'const MemoizedComponent = React.memo(Component);',
                        explanation: '使用 React.memo 避免不必要的重渲染',
                        source: 'auto-detected'
                    }],
                confidence: Math.min(1, optimizationCount / 2),
                frequency: optimizationCount,
                firstSeen: new Date(),
                lastSeen: new Date(),
                practice: {
                    category: 'performance',
                    benefits: ['提升应用性能', '减少内存使用', '改善用户体验'],
                    implementation: '使用 memoization、懒加载等技术优化性能'
                }
            });
        }
        return patterns;
    }
    /**
     * 检测错误模式
     */
    detectErrorPatterns(errors) {
        const patterns = [];
        const errorGroups = {};
        // 按错误类型分组
        errors.forEach(error => {
            if (!errorGroups[error.type]) {
                errorGroups[error.type] = [];
            }
            errorGroups[error.type].push(error);
        });
        // 为每个错误类型创建模式
        Object.entries(errorGroups).forEach(([type, errorList]) => {
            if (errorList.length >= this.config.minFrequency) {
                patterns.push({
                    id: `error-pattern-${type}-${Date.now()}`,
                    type: 'error-pattern',
                    description: `常见错误模式: ${type}`,
                    examples: errorList.slice(0, 3).map(error => ({
                        context: error.context || '未知上下文',
                        code: error.message,
                        explanation: error.solution || '暂无解决方案',
                        source: 'auto-detected'
                    })),
                    confidence: this.calculateConfidenceForErrors(errorList),
                    frequency: errorList.length,
                    firstSeen: new Date(),
                    lastSeen: new Date(),
                    error: {
                        type,
                        causes: this.extractCommonCauses(errorList),
                        solutions: this.extractCommonSolutions(errorList),
                        prevention: this.generatePreventionTips(type)
                    }
                });
            }
        });
        return patterns;
    }
    /**
     * 提取代码块
     */
    extractCodeBlocks(log) {
        const codeBlocks = [];
        if (log.messages && Array.isArray(log.messages)) {
            log.messages.forEach((message) => {
                if (message.metadata?.codeBlocks) {
                    codeBlocks.push(...message.metadata.codeBlocks);
                }
            });
        }
        return codeBlocks;
    }
    /**
     * 提取错误信息
     */
    extractErrors(log) {
        const errors = [];
        if (log.messages && Array.isArray(log.messages)) {
            log.messages.forEach((message) => {
                if (message.metadata?.errors) {
                    errors.push(...message.metadata.errors);
                }
            });
        }
        return errors;
    }
    /**
     * 查找主导风格
     */
    findDominantStyle(stats) {
        let dominantStyle = '';
        let maxCount = 0;
        Object.entries(stats).forEach(([style, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantStyle = style;
            }
        });
        return dominantStyle;
    }
    /**
     * 计算置信度
     */
    calculateConfidence(stats, dominantStyle) {
        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const dominantCount = stats[dominantStyle] || 0;
        if (total === 0)
            return 0;
        return Math.min(1, dominantCount / total);
    }
    /**
     * 计算错误模式的置信度
     */
    calculateConfidenceForErrors(errors) {
        const totalErrors = errors.length;
        const severityWeights = {
            low: 0.3,
            medium: 0.6,
            high: 0.8,
            critical: 1.0
        };
        const weightedSum = errors.reduce((sum, error) => {
            return sum + (severityWeights[error.severity] || 0.5);
        }, 0);
        return Math.min(1, weightedSum / totalErrors);
    }
    /**
     * 提取常见原因
     */
    extractCommonCauses(errors) {
        const causes = [];
        // 简单的错误原因分析
        errors.forEach(error => {
            if (error.message.includes('undefined')) {
                causes.push('变量未定义');
            }
            else if (error.message.includes('null')) {
                causes.push('空值引用');
            }
            else if (error.message.includes('syntax')) {
                causes.push('语法错误');
            }
            else if (error.message.includes('type')) {
                causes.push('类型错误');
            }
        });
        return [...new Set(causes)];
    }
    /**
     * 提取常见解决方案
     */
    extractCommonSolutions(errors) {
        const solutions = [];
        errors.forEach(error => {
            if (error.solution) {
                solutions.push(error.solution);
            }
        });
        return [...new Set(solutions)];
    }
    /**
     * 生成预防建议
     */
    generatePreventionTips(errorType) {
        const tips = {
            'TypeError': [
                '使用 TypeScript 进行类型检查',
                '添加空值检查',
                '使用可选链操作符 (?.)'
            ],
            'ReferenceError': [
                '确保变量在使用前已声明',
                '检查变量作用域',
                '使用严格模式'
            ],
            'SyntaxError': [
                '使用代码格式化工具',
                '启用 ESLint 检查',
                '仔细检查括号和引号匹配'
            ]
        };
        return tips[errorType] || ['添加适当的错误处理', '进行充分的测试'];
    }
    /**
     * 更新模式库
     */
    updatePatternLibrary(patterns) {
        patterns.forEach(pattern => {
            const existingPattern = this.detectedPatterns.get(pattern.id);
            if (existingPattern) {
                // 更新现有模式
                existingPattern.frequency += pattern.frequency;
                existingPattern.lastSeen = new Date();
                existingPattern.confidence = Math.max(existingPattern.confidence, pattern.confidence);
                // 合并示例
                pattern.examples.forEach(example => {
                    if (!existingPattern.examples.some(ex => ex.code === example.code)) {
                        existingPattern.examples.push(example);
                    }
                });
            }
            else {
                // 添加新模式
                this.detectedPatterns.set(pattern.id, pattern);
            }
        });
        // 清理旧模式
        this.cleanupPatternLibrary();
    }
    /**
     * 清理模式库
     */
    cleanupPatternLibrary() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        for (const [id, pattern] of this.detectedPatterns.entries()) {
            if (pattern.lastSeen < thirtyDaysAgo && pattern.frequency < this.config.minFrequency) {
                this.detectedPatterns.delete(id);
            }
        }
    }
    /**
     * 过滤和排序模式
     */
    filterAndSortPatterns(patterns) {
        return patterns
            .filter(pattern => pattern.confidence >= this.config.minConfidence &&
            pattern.frequency >= this.config.minFrequency)
            .sort((a, b) => {
            // 按置信度降序，频率降序排序
            if (b.confidence !== a.confidence) {
                return b.confidence - a.confidence;
            }
            return b.frequency - a.frequency;
        })
            .slice(0, this.config.maxPatterns);
    }
    /**
     * 获取所有检测到的模式
     */
    getAllPatterns() {
        return Array.from(this.detectedPatterns.values());
    }
    /**
     * 根据类型获取模式
     */
    getPatternsByType(type) {
        return this.getAllPatterns().filter(pattern => pattern.type === type);
    }
    /**
     * 根据置信度获取模式
     */
    getPatternsByConfidence(minConfidence) {
        return this.getAllPatterns().filter(pattern => pattern.confidence >= minConfidence);
    }
    /**
     * 重置模式库
     */
    resetPatternLibrary() {
        this.detectedPatterns.clear();
    }
    /**
     * 导出模式库
     */
    exportPatternLibrary() {
        return Object.fromEntries(this.detectedPatterns);
    }
    /**
     * 导入模式库
     */
    importPatternLibrary(library) {
        this.detectedPatterns = new Map(Object.entries(library));
    }
}
