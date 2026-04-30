/**
 * RuleForge 模式识别引擎
 * 负责分析会话日志，识别重复模式，生成规则候选
 */
export class PatternRecognizer {
    sessionLogs = [];
    minOccurrences = 3; // 最小出现次数
    minConfidence = 0.7; // 最小置信度
    /**
     * 添加会话日志
     */
    addSessionLog(log) {
        this.sessionLogs.push(log);
    }
    /**
     * 批量添加会话日志
     */
    addSessionLogs(logs) {
        this.sessionLogs.push(...logs);
    }
    /**
     * 识别模式
     */
    recognizePatterns() {
        if (this.sessionLogs.length === 0) {
            return {
                patterns: [],
                candidates: [],
                confidence: 0,
                totalSessions: 0
            };
        }
        // 1. 关键词频率统计
        const keywordPatterns = this.analyzeKeywords();
        // 2. 文件类型聚类
        const filePatterns = this.analyzeFileTypes();
        // 3. 错误模式识别
        const errorPatterns = this.analyzeErrors();
        // 4. 代码结构模式
        const structurePatterns = this.analyzeCodeStructure();
        // 5. 合并所有模式
        const allPatterns = [...keywordPatterns, ...filePatterns, ...errorPatterns, ...structurePatterns];
        // 6. 生成规则候选
        const candidates = this.generateRuleCandidates(allPatterns);
        // 7. 计算总体置信度
        const confidence = this.calculateOverallConfidence(candidates);
        return {
            patterns: allPatterns,
            candidates,
            confidence,
            totalSessions: this.sessionLogs.length
        };
    }
    /**
     * 分析关键词频率
     */
    analyzeKeywords() {
        const keywordFrequency = new Map();
        const keywordContexts = new Map();
        for (const log of this.sessionLogs) {
            const keywords = this.extractKeywords(log.userInput + ' ' + log.aiResponse);
            for (const keyword of keywords) {
                keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
                if (!keywordContexts.has(keyword)) {
                    keywordContexts.set(keyword, []);
                }
                keywordContexts.get(keyword).push(log.userInput.substring(0, 100));
            }
        }
        const patterns = [];
        for (const [keyword, frequency] of keywordFrequency) {
            if (frequency >= this.minOccurrences) {
                const confidence = Math.min(frequency / this.sessionLogs.length, 1);
                patterns.push({
                    type: 'keyword',
                    pattern: keyword,
                    frequency,
                    confidence,
                    contexts: keywordContexts.get(keyword) || [],
                    metadata: {
                        keyword: keyword,
                        avgFrequency: frequency / this.sessionLogs.length
                    }
                });
            }
        }
        return patterns;
    }
    /**
     * 分析文件类型
     */
    analyzeFileTypes() {
        const fileTypeFrequency = new Map();
        const fileTypeExamples = new Map();
        for (const log of this.sessionLogs) {
            if (log.generatedFiles && log.generatedFiles.length > 0) {
                for (const file of log.generatedFiles) {
                    const fileType = this.getFileType(file.path);
                    fileTypeFrequency.set(fileType, (fileTypeFrequency.get(fileType) || 0) + 1);
                    if (!fileTypeExamples.has(fileType)) {
                        fileTypeExamples.set(fileType, []);
                    }
                    fileTypeExamples.get(fileType).push(file.path);
                }
            }
        }
        const patterns = [];
        for (const [fileType, frequency] of fileTypeFrequency) {
            if (frequency >= this.minOccurrences) {
                const confidence = Math.min(frequency / this.sessionLogs.length, 0.8);
                patterns.push({
                    type: 'file_type',
                    pattern: `生成${fileType}文件`,
                    frequency,
                    confidence,
                    contexts: fileTypeExamples.get(fileType) || [],
                    metadata: {
                        fileType: fileType,
                        exampleFiles: fileTypeExamples.get(fileType) || []
                    }
                });
            }
        }
        return patterns;
    }
    /**
     * 分析错误模式
     */
    analyzeErrors() {
        const errorPatterns = [];
        const errorFrequency = new Map();
        const errorContexts = new Map();
        for (const log of this.sessionLogs) {
            if (log.errors && log.errors.length > 0) {
                for (const error of log.errors) {
                    const errorType = this.classifyError(error);
                    errorFrequency.set(errorType, (errorFrequency.get(errorType) || 0) + 1);
                    if (!errorContexts.has(errorType)) {
                        errorContexts.set(errorType, []);
                    }
                    errorContexts.get(errorType).push(error);
                }
            }
        }
        for (const [errorType, frequency] of errorFrequency) {
            if (frequency >= this.minOccurrences) {
                const confidence = Math.min(frequency / this.sessionLogs.length, 0.9);
                errorPatterns.push({
                    type: 'error',
                    pattern: errorType,
                    frequency,
                    confidence,
                    contexts: errorContexts.get(errorType) || [],
                    metadata: {
                        errorType: errorType,
                        solutions: this.generateErrorSolutions(errorType)
                    }
                });
            }
        }
        return errorPatterns;
    }
    /**
     * 分析代码结构
     */
    analyzeCodeStructure() {
        const structurePatterns = [];
        const structureFrequency = new Map();
        const structureExamples = new Map();
        for (const log of this.sessionLogs) {
            if (log.generatedFiles && log.generatedFiles.length > 0) {
                for (const file of log.generatedFiles) {
                    const structure = this.analyzeFileStructure(file.content);
                    if (structure) {
                        structureFrequency.set(structure, (structureFrequency.get(structure) || 0) + 1);
                        if (!structureExamples.has(structure)) {
                            structureExamples.set(structure, []);
                        }
                        structureExamples.get(structure).push(file.path);
                    }
                }
            }
        }
        for (const [structure, frequency] of structureFrequency) {
            if (frequency >= this.minOccurrences) {
                const confidence = Math.min(frequency / this.sessionLogs.length, 0.7);
                structurePatterns.push({
                    type: 'structure',
                    pattern: structure,
                    frequency,
                    confidence,
                    contexts: structureExamples.get(structure) || [],
                    metadata: {
                        structureType: structure,
                        exampleFiles: structureExamples.get(structure) || []
                    }
                });
            }
        }
        return structurePatterns;
    }
    /**
     * 生成规则候选
     */
    generateRuleCandidates(patterns) {
        const candidates = [];
        for (const pattern of patterns) {
            if (pattern.confidence >= this.minConfidence) {
                const candidate = this.createRuleCandidate(pattern);
                candidates.push(candidate);
            }
        }
        // 按置信度排序
        return candidates.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * 创建规则候选
     */
    createRuleCandidate(pattern) {
        const baseRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.generateRuleName(pattern),
            description: this.generateRuleDescription(pattern),
            pattern: pattern.pattern,
            confidence: pattern.confidence,
            frequency: pattern.frequency,
            type: pattern.type,
            metadata: pattern.metadata
        };
        // 根据模式类型生成特定规则内容
        switch (pattern.type) {
            case 'keyword':
                return {
                    ...baseRule,
                    trigger: {
                        type: 'keyword_match',
                        keywords: [pattern.metadata.keyword]
                    },
                    condition: {
                        type: 'frequency_threshold',
                        threshold: this.minOccurrences
                    },
                    suggestion: {
                        type: 'template_suggestion',
                        template: this.generateKeywordTemplate(pattern.metadata.keyword)
                    }
                };
            case 'file_type':
                return {
                    ...baseRule,
                    trigger: {
                        type: 'file_type_match',
                        fileTypes: [pattern.metadata.fileType]
                    },
                    condition: {
                        type: 'project_structure',
                        requiredFiles: pattern.metadata.exampleFiles.slice(0, 3)
                    },
                    suggestion: {
                        type: 'file_template',
                        template: this.generateFileTemplate(pattern.metadata.fileType)
                    }
                };
            case 'error':
                return {
                    ...baseRule,
                    trigger: {
                        type: 'error_match',
                        errorTypes: [pattern.metadata.errorType]
                    },
                    condition: {
                        type: 'error_context',
                        context: pattern.contexts[0] || ''
                    },
                    suggestion: {
                        type: 'error_fix',
                        solutions: pattern.metadata.solutions
                    }
                };
            case 'structure':
                return {
                    ...baseRule,
                    trigger: {
                        type: 'code_structure_match',
                        structure: pattern.metadata.structureType
                    },
                    condition: {
                        type: 'code_pattern',
                        pattern: pattern.pattern
                    },
                    suggestion: {
                        type: 'structure_template',
                        template: this.generateStructureTemplate(pattern.metadata.structureType)
                    }
                };
            default:
                return baseRule;
        }
    }
    /**
     * 提取关键词
     */
    extractKeywords(text) {
        const keywords = [
            '登录', '注册', '表单', '验证', 'API', '组件', '样式', '路由',
            '数据库', '用户', '密码', '邮箱', '按钮', '输入框', '表格',
            '列表', '详情', '编辑', '删除', '搜索', '分页', '上传', '下载'
        ];
        const foundKeywords = [];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        }
        return foundKeywords;
    }
    /**
     * 获取文件类型
     */
    getFileType(path) {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        const typeMap = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript React',
            'js': 'JavaScript',
            'jsx': 'JavaScript React',
            'vue': 'Vue',
            'py': 'Python',
            'java': 'Java',
            'go': 'Go',
            'rs': 'Rust',
            'css': 'CSS',
            'scss': 'SCSS',
            'html': 'HTML',
            'json': 'JSON',
            'yaml': 'YAML',
            'yml': 'YAML'
        };
        return typeMap[ext] || '其他';
    }
    /**
     * 分类错误
     */
    classifyError(error) {
        if (error.includes('语法错误') || error.includes('SyntaxError')) {
            return '语法错误';
        }
        else if (error.includes('类型错误') || error.includes('TypeError')) {
            return '类型错误';
        }
        else if (error.includes('引用错误') || error.includes('ReferenceError')) {
            return '引用错误';
        }
        else if (error.includes('网络错误') || error.includes('NetworkError')) {
            return '网络错误';
        }
        else if (error.includes('权限错误') || error.includes('PermissionError')) {
            return '权限错误';
        }
        else {
            return '其他错误';
        }
    }
    /**
     * 分析文件结构
     */
    analyzeFileStructure(content) {
        if (content.includes('interface') && content.includes('export')) {
            return 'TypeScript接口定义';
        }
        else if (content.includes('function') && content.includes('export')) {
            return '函数导出模式';
        }
        else if (content.includes('class') && content.includes('export')) {
            return '类导出模式';
        }
        else if (content.includes('const') && content.includes('=')) {
            return '常量定义模式';
        }
        else if (content.includes('import') && content.includes('from')) {
            return '导入模式';
        }
        return null;
    }
    /**
     * 生成错误解决方案
     */
    generateErrorSolutions(errorType) {
        const solutions = {
            '语法错误': ['检查括号匹配', '验证分号使用', '确认关键字拼写'],
            '类型错误': ['添加类型注解', '使用类型断言', '检查接口定义'],
            '引用错误': ['检查导入语句', '确认变量作用域', '验证模块导出'],
            '网络错误': ['检查API端点', '验证网络连接', '添加错误处理'],
            '权限错误': ['检查文件权限', '验证API密钥', '确认访问权限']
        };
        return solutions[errorType] || ['检查代码逻辑', '查看错误详情', '搜索解决方案'];
    }
    /**
     * 生成规则名称
     */
    generateRuleName(pattern) {
        switch (pattern.type) {
            case 'keyword':
                return `${pattern.metadata.keyword}相关规则`;
            case 'file_type':
                return `${pattern.metadata.fileType}文件生成规则`;
            case 'error':
                return `${pattern.metadata.errorType}处理规则`;
            case 'structure':
                return `${pattern.metadata.structureType}代码结构规则`;
            default:
                return '通用规则';
        }
    }
    /**
     * 生成规则描述
     */
    generateRuleDescription(pattern) {
        switch (pattern.type) {
            case 'keyword':
                return `当用户提到"${pattern.metadata.keyword}"时，自动应用相关代码模板`;
            case 'file_type':
                return `生成${pattern.metadata.fileType}文件的标准模板和最佳实践`;
            case 'error':
                return `处理${pattern.metadata.errorType}的自动修复方案`;
            case 'structure':
                return `遵循${pattern.metadata.structureType}的代码组织规范`;
            default:
                return '通用代码生成规则';
        }
    }
    /**
     * 生成关键词模板
     */
    generateKeywordTemplate(keyword) {
        const templates = {
            '登录': '实现用户登录功能的完整代码模板',
            '注册': '用户注册功能的标准化实现',
            '表单': '表单验证和提交的最佳实践',
            'API': 'RESTful API 接口的标准定义'
        };
        return templates[keyword] || `处理"${keyword}"相关功能的代码模板`;
    }
    /**
     * 生成文件模板
     */
    generateFileTemplate(fileType) {
        return `${fileType}文件的标准模板和最佳实践`;
    }
    /**
     * 生成结构模板
     */
    generateStructureTemplate(structureType) {
        return `遵循${structureType}的代码组织规范`;
    }
    /**
     * 计算总体置信度
     */
    calculateOverallConfidence(candidates) {
        if (candidates.length === 0)
            return 0;
        const totalConfidence = candidates.reduce((sum, candidate) => sum + candidate.confidence, 0);
        return totalConfidence / candidates.length;
    }
    /**
     * 清空会话日志
     */
    clearSessionLogs() {
        this.sessionLogs = [];
    }
    /**
     * 获取会话日志数量
     */
    getSessionCount() {
        return this.sessionLogs.length;
    }
    /**
     * 设置最小出现次数
     */
    setMinOccurrences(count) {
        this.minOccurrences = count;
    }
    /**
     * 设置最小置信度
     */
    setMinConfidence(confidence) {
        this.minConfidence = confidence;
    }
}
//# sourceMappingURL=pattern-recognizer.js.map