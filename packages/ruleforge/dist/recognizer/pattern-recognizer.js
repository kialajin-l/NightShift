import { PATTERN_TEMPLATES } from './templates/index.js';
/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    minConfidence: 0.7,
    minFrequency: 2,
    maxPatterns: 10,
    excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
};
/**
 * 默认置信度权重
 */
const DEFAULT_WEIGHTS = {
    keywordScore: 0.4,
    fileScore: 0.2,
    conditionScore: 0.3,
    evidenceScore: 0.1
};
/**
 * 通用关键词（需要排除）
 */
const COMMON_KEYWORDS = new Set([
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
    'class', 'import', 'export', 'from', 'def', 'return', 'print', 'console',
    'this', 'new', 'async', 'await', 'try', 'catch', 'finally'
]);
/**
 * 上下文权重映射
 */
const CONTEXT_WEIGHTS = {
    'error_fixed': 2.0,
    'error_occurred': 1.5,
    'file_saved': 1.0,
    'test_run': 1.2,
    'terminal_command': 0.8,
    'debug_start': 0.9,
    'extension_change': 0.7
};
/**
 * 模式识别器 - 从开发会话中识别代码模式
 */
export class PatternRecognizer {
    config;
    weights;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.weights = DEFAULT_WEIGHTS;
    }
    /**
     * 主入口：从解析后的会话中识别候选模式
     */
    async recognize(session) {
        const startTime = Date.now();
        // 过滤排除的文件事件
        const filteredEvents = this.filterEvents(session.events);
        // 阶段1：关键词频率分析
        const keywordStats = this.analyzeKeywords(filteredEvents, {
            minFrequency: this.config.minFrequency,
            excludeCommon: true,
            weightByContext: true
        });
        // 阶段2：文件类型聚类
        const clusters = this.clusterEvents(filteredEvents);
        // 阶段3：模式匹配与置信度计算
        const candidatePatterns = this.matchTemplates(clusters, keywordStats);
        // 按置信度排序并限制数量
        const sortedPatterns = candidatePatterns
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.config.maxPatterns);
        const processingTime = Date.now() - startTime;
        return {
            patterns: sortedPatterns,
            stats: {
                totalEvents: session.events.length,
                totalKeywords: keywordStats.size,
                clusters: clusters.length,
                processingTime
            }
        };
    }
    /**
     * 过滤排除的文件事件
     */
    filterEvents(events) {
        return events.filter(event => {
            if (!event.file)
                return true;
            // 检查是否在排除模式中
            return !this.config.excludePatterns.some(pattern => {
                const normalizedPattern = PatternRecognizer.normalizePath(pattern);
                const normalizedFile = PatternRecognizer.normalizePath(event.file);
                return this.matchFilePattern(normalizedPattern, normalizedFile);
            });
        });
    }
    /**
     * 阶段1：关键词频率分析
     */
    analyzeKeywords(events, config) {
        const keywordStats = new Map();
        for (const event of events) {
            if (!event.content)
                continue;
            const keywords = PatternRecognizer.extractKeywords(event.content, event.file ? this.getLanguageFromFile(event.file) : 'unknown');
            for (const keyword of keywords) {
                // 排除通用关键词
                if (config.excludeCommon && COMMON_KEYWORDS.has(keyword)) {
                    continue;
                }
                const existing = keywordStats.get(keyword);
                const contextWeight = config.weightByContext ?
                    (CONTEXT_WEIGHTS[event.type] || 1.0) : 1.0;
                if (existing) {
                    existing.count += 1;
                    existing.weightedScore += contextWeight;
                    if (!existing.contexts.includes(event.type)) {
                        existing.contexts.push(event.type);
                    }
                }
                else {
                    keywordStats.set(keyword, {
                        keyword,
                        count: 1,
                        contexts: [event.type],
                        weightedScore: contextWeight
                    });
                }
            }
        }
        // 过滤低频关键词
        for (const [keyword, stats] of keywordStats) {
            if (stats.count < config.minFrequency) {
                keywordStats.delete(keyword);
            }
        }
        return keywordStats;
    }
    /**
     * 阶段2：文件类型聚类
     */
    clusterEvents(events) {
        const clusters = [];
        const clusterConfig = {
            patterns: [
                { pattern: '**/*.vue', category: 'vue-component' },
                { pattern: '**/*.tsx', category: 'react-component' },
                { pattern: '**/*.ts', category: 'typescript' },
                { pattern: '**/api/*.py', category: 'fastapi-api' },
                { pattern: '**/models/*.py', category: 'fastapi-models' },
                { pattern: '**/*.test.*', category: 'test-files' },
                { pattern: '**/*.spec.*', category: 'test-files' }
            ]
        };
        // 按模式分类事件
        for (const patternConfig of clusterConfig.patterns) {
            const clusterEvents = events.filter(event => event.file && this.matchFilePattern(patternConfig.pattern, event.file));
            if (clusterEvents.length > 0) {
                const keywordStats = this.analyzeKeywords(clusterEvents, {
                    minFrequency: 1,
                    excludeCommon: true,
                    weightByContext: true
                });
                clusters.push({
                    category: patternConfig.category,
                    pattern: patternConfig.pattern,
                    events: clusterEvents,
                    keywordStats
                });
            }
        }
        // 添加未分类的事件到其他类别
        const classifiedFiles = new Set(clusters.flatMap(cluster => cluster.events.map(e => e.file).filter(Boolean)));
        const unclassifiedEvents = events.filter(event => event.file && !classifiedFiles.has(event.file));
        if (unclassifiedEvents.length > 0) {
            const keywordStats = this.analyzeKeywords(unclassifiedEvents, {
                minFrequency: 1,
                excludeCommon: true,
                weightByContext: true
            });
            clusters.push({
                category: 'other',
                pattern: '**/*',
                events: unclassifiedEvents,
                keywordStats
            });
        }
        return clusters;
    }
    /**
     * 阶段3：模式匹配与置信度计算
     */
    matchTemplates(clusters, globalKeywordStats) {
        const candidatePatterns = [];
        const allTemplates = [...PATTERN_TEMPLATES, ...(this.config.customTemplates || [])];
        for (const cluster of clusters) {
            for (const template of allTemplates) {
                // 检查文件模式是否匹配
                if (!this.matchFilePattern(template.filePattern, cluster.pattern)) {
                    continue;
                }
                // 计算置信度
                const confidence = this.calculateConfidence(template, cluster.events, cluster.keywordStats);
                // 检查是否达到最小置信度
                if (confidence >= Math.max(template.minConfidence, this.config.minConfidence)) {
                    const pattern = this.createCandidatePattern(template, cluster, confidence);
                    candidatePatterns.push(pattern);
                }
            }
        }
        return candidatePatterns;
    }
    /**
     * 计算模式置信度
     */
    calculateConfidence(template, events, keywordStats) {
        // 因子1：关键词匹配度 (0-0.4)
        const keywordScore = this.calculateKeywordScore(template.keywords, keywordStats);
        // 因子2：文件模式匹配 (0-0.2)
        const fileScore = this.calculateFileScore(template.filePattern, events);
        // 因子3：条件满足度 (0-0.3)
        const conditionScore = template.condition(events) ? this.weights.conditionScore : 0;
        // 因子4：证据强度 (0-0.1)
        const evidenceScore = Math.min(events.length / 5, 1) * this.weights.evidenceScore;
        return keywordScore + fileScore + conditionScore + evidenceScore;
    }
    /**
     * 计算关键词匹配得分
     */
    calculateKeywordScore(templateKeywords, keywordStats) {
        let matchedCount = 0;
        let totalWeight = 0;
        for (const keyword of templateKeywords) {
            const stats = keywordStats.get(keyword);
            if (stats) {
                matchedCount++;
                totalWeight += stats.weightedScore;
            }
        }
        const keywordRatio = matchedCount / templateKeywords.length;
        const weightRatio = totalWeight / (templateKeywords.length * 2); // 最大权重为2
        return (keywordRatio * 0.6 + weightRatio * 0.4) * this.weights.keywordScore;
    }
    /**
     * 计算文件模式匹配得分
     */
    calculateFileScore(filePattern, events) {
        const matchingEvents = events.filter(event => event.file && this.matchFilePattern(filePattern, event.file));
        const score = Math.min(matchingEvents.length / 3, 1);
        return score * this.weights.fileScore;
    }
    /**
     * 创建候选模式
     */
    createCandidatePattern(template, cluster, confidence) {
        const keywordFrequency = template.keywords.reduce((sum, keyword) => {
            const stats = cluster.keywordStats.get(keyword);
            return sum + (stats?.count || 0);
        }, 0);
        return {
            id: this.generatePatternId(template.category, template.keywords),
            category: template.category,
            trigger: {
                keywords: template.keywords,
                filePattern: template.filePattern,
                frequency: keywordFrequency
            },
            solution: template.solution,
            confidence,
            applicableScenes: cluster.events.length,
            evidence: cluster.events.map(e => `${e.type}:${e.file || 'unknown'}`)
        };
    }
    /**
     * 生成模式ID
     */
    generatePatternId(category, keywords) {
        const baseName = `${category}-${keywords.slice(0, 2).join('-')}`;
        const normalized = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const timestamp = Date.now().toString(36);
        return `${normalized}-${timestamp.slice(-4)}`;
    }
    /**
     * 匹配文件模式（简化版 glob 匹配）
     */
    matchFilePattern(pattern, filePath) {
        const normalizedPattern = PatternRecognizer.normalizePath(pattern);
        const normalizedFile = PatternRecognizer.normalizePath(filePath);
        if (normalizedPattern === '**/*')
            return true;
        // 简单的通配符匹配
        if (normalizedPattern.includes('**/')) {
            const suffix = normalizedPattern.replace('**/', '');
            return normalizedFile.endsWith(suffix);
        }
        return normalizedFile.includes(normalizedPattern);
    }
    /**
     * 从文件路径获取语言
     */
    getLanguageFromFile(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
            'vue': 'vue',
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python'
        };
        return languageMap[ext || ''] || 'unknown';
    }
    /**
     * 静态工具方法：提取关键词
     */
    static extractKeywords(code, language) {
        // 简单的关键词提取逻辑
        const keywords = [];
        // 移除注释和字符串
        let cleanCode = code
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // 移除注释
            .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, ''); // 移除字符串
        // 提取标识符（函数名、变量名、类名等）
        const identifierRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
        const matches = cleanCode.match(identifierRegex) || [];
        // 过滤掉太短的标识符和数字
        keywords.push(...matches.filter(word => word.length >= 3 &&
            !/^\d+$/.test(word) &&
            !COMMON_KEYWORDS.has(word)));
        return [...new Set(keywords)]; // 去重
    }
    /**
     * 静态工具方法：规范化路径
     */
    static normalizePath(path) {
        return path
            .replace(/\\/g, '/') // 统一分隔符
            .toLowerCase()
            .replace(/^\/|\/$/g, ''); // 移除首尾斜杠
    }
}
