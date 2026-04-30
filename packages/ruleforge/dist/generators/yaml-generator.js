// NightShift RuleForge YAML 生成器
/**
 * YAML 生成器
 */
export class YAMLGenerator {
    config;
    constructor(config) {
        this.config = {
            includeMetadata: true,
            includeExamples: true,
            includeTags: true,
            formatOutput: true,
            maxExamples: 3,
            defaultAuthor: 'RuleForge',
            defaultVersion: '1.0.0',
            ...config
        };
    }
    /**
     * 从模式生成规则 YAML
     */
    generateRuleYAML(pattern) {
        const ruleId = this.generateRuleId(pattern);
        const ruleName = this.generateRuleName(pattern);
        const ruleDescription = this.generateRuleDescription(pattern);
        const rulePattern = this.generateRulePattern(pattern);
        const ruleReplacement = this.generateRuleReplacement(pattern);
        const ruleExamples = this.generateRuleExamples(pattern);
        const ruleTags = this.generateRuleTags(pattern);
        const ruleYAML = {
            rule: {
                id: ruleId,
                name: ruleName,
                description: ruleDescription,
                type: pattern.type,
                pattern: rulePattern,
                examples: ruleExamples,
                confidence: pattern.confidence,
                source: 'auto-detected',
                tags: ruleTags,
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: this.config.defaultVersion,
                    author: this.config.defaultAuthor
                }
            }
        };
        // 添加替换规则（如果适用）
        if (ruleReplacement) {
            ruleYAML.rule.replacement = ruleReplacement;
        }
        return ruleYAML;
    }
    /**
     * 生成规则 ID
     */
    generateRuleId(pattern) {
        const timestamp = Date.now().toString(36);
        const typePrefix = pattern.type.split('-')[0];
        const nameSlug = pattern.description
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return `${typePrefix}-${nameSlug}-${timestamp}`;
    }
    /**
     * 生成规则名称
     */
    generateRuleName(pattern) {
        return pattern.description.replace(/[:：].*$/, '').trim();
    }
    /**
     * 生成规则描述
     */
    generateRuleDescription(pattern) {
        return pattern.description;
    }
    /**
     * 生成规则模式
     */
    generateRulePattern(pattern) {
        switch (pattern.type) {
            case 'code-style':
                return this.generateCodeStylePattern(pattern);
            case 'architecture':
                return this.generateArchitecturePattern(pattern);
            case 'best-practice':
                return this.generateBestPracticePattern(pattern);
            case 'error-pattern':
                return this.generateErrorPattern(pattern);
            default:
                return '.*';
        }
    }
    /**
     * 生成代码风格模式
     */
    generateCodeStylePattern(pattern) {
        if (pattern.description.includes('命名规范')) {
            if (pattern.description.includes('camelCase')) {
                return '(snake_case|kebab-case)';
            }
            else if (pattern.description.includes('PascalCase')) {
                return '(snake_case|kebab-case|camelCase)';
            }
            else if (pattern.description.includes('snake_case')) {
                return '(camelCase|PascalCase|kebab-case)';
            }
        }
        else if (pattern.description.includes('缩进风格')) {
            if (pattern.description.includes('2-spaces')) {
                return '^ {3,}'; // 匹配3个或更多空格的缩进
            }
            else if (pattern.description.includes('4-spaces')) {
                return '^ {1,2}|^\\t'; // 匹配1-2个空格或制表符
            }
            else if (pattern.description.includes('tabs')) {
                return '^ +'; // 匹配空格缩进
            }
        }
        return '.*';
    }
    /**
     * 生成架构模式
     */
    generateArchitecturePattern(pattern) {
        if (pattern.description.includes('组件化')) {
            return '(class\s+\w+|function\s+\w+\s*\()';
        }
        else if (pattern.description.includes('状态管理')) {
            return '(useState|useReducer|redux|mobx|pinia)';
        }
        return '.*';
    }
    /**
     * 生成最佳实践模式
     */
    generateBestPracticePattern(pattern) {
        if (pattern.description.includes('错误处理')) {
            return '(try\s*\{|catch\s*\()';
        }
        else if (pattern.description.includes('性能优化')) {
            return '(React\.memo|useMemo|useCallback|lazy|Suspense)';
        }
        return '.*';
    }
    /**
     * 生成错误模式
     */
    generateErrorPattern(pattern) {
        const errorType = pattern.description.replace(/常见错误模式:?\s*/, '');
        switch (errorType) {
            case 'TypeError':
                return '(undefined|null|is not a function)';
            case 'ReferenceError':
                return '(is not defined|未定义)';
            case 'SyntaxError':
                return '(Unexpected token|语法错误)';
            default:
                return '.*';
        }
    }
    /**
     * 生成规则替换
     */
    generateRuleReplacement(pattern) {
        if (pattern.type === 'code-style') {
            if (pattern.description.includes('camelCase')) {
                return 'camelCase';
            }
            else if (pattern.description.includes('PascalCase')) {
                return 'PascalCase';
            }
            else if (pattern.description.includes('2-spaces')) {
                return '  '; // 2个空格
            }
            else if (pattern.description.includes('4-spaces')) {
                return '    '; // 4个空格
            }
        }
        return undefined;
    }
    /**
     * 生成规则示例
     */
    generateRuleExamples(pattern) {
        const examples = [];
        pattern.examples.slice(0, this.config.maxExamples).forEach(example => {
            examples.push({
                before: this.generateExampleBefore(example, pattern),
                after: this.generateExampleAfter(example, pattern),
                explanation: example.explanation
            });
        });
        // 如果没有示例，生成默认示例
        if (examples.length === 0) {
            examples.push(this.generateDefaultExample(pattern));
        }
        return examples;
    }
    /**
     * 生成示例的 "before" 部分
     */
    generateExampleBefore(example, pattern) {
        if (example.code) {
            return example.code;
        }
        // 根据模式类型生成默认的 "before" 示例
        switch (pattern.type) {
            case 'code-style':
                if (pattern.description.includes('camelCase')) {
                    return 'user_name = "John"';
                }
                else if (pattern.description.includes('缩进')) {
                    return 'function test(){\nconsole.log("hello");\n}';
                }
                break;
            case 'architecture':
                if (pattern.description.includes('组件化')) {
                    return '// 没有使用组件化';
                }
                break;
            case 'best-practice':
                if (pattern.description.includes('错误处理')) {
                    return 'fetch(url).then(data => console.log(data));';
                }
                break;
            case 'error-pattern':
                return 'console.log(undefinedVariable);';
        }
        return '示例代码';
    }
    /**
     * 生成示例的 "after" 部分
     */
    generateExampleAfter(example, pattern) {
        // 根据模式类型生成默认的 "after" 示例
        switch (pattern.type) {
            case 'code-style':
                if (pattern.description.includes('camelCase')) {
                    return 'userName = "John"';
                }
                else if (pattern.description.includes('缩进')) {
                    return 'function test() {\n  console.log("hello");\n}';
                }
                break;
            case 'architecture':
                if (pattern.description.includes('组件化')) {
                    return 'function UserCard({ user }) {\n  return <div>{user.name}</div>;\n}';
                }
                break;
            case 'best-practice':
                if (pattern.description.includes('错误处理')) {
                    return 'fetch(url)\n  .then(data => console.log(data))\n  .catch(error => console.error(error));';
                }
                break;
            case 'error-pattern':
                return 'const user = {};\nconsole.log(user?.name);';
        }
        return '优化后的代码';
    }
    /**
     * 生成默认示例
     */
    generateDefaultExample(pattern) {
        return {
            before: this.generateExampleBefore({}, pattern),
            after: this.generateExampleAfter({}, pattern),
            explanation: `自动生成的 ${pattern.type} 示例`
        };
    }
    /**
     * 生成规则标签
     */
    generateRuleTags(pattern) {
        const tags = [pattern.type];
        // 根据描述添加相关标签
        if (pattern.description.includes('命名')) {
            tags.push('naming', 'code-style');
        }
        else if (pattern.description.includes('缩进')) {
            tags.push('indentation', 'formatting');
        }
        else if (pattern.description.includes('组件')) {
            tags.push('component', 'architecture');
        }
        else if (pattern.description.includes('状态')) {
            tags.push('state', 'react', 'vue');
        }
        else if (pattern.description.includes('错误')) {
            tags.push('error-handling', 'best-practice');
        }
        else if (pattern.description.includes('性能')) {
            tags.push('performance', 'optimization');
        }
        // 添加语言标签（如果可以从示例中推断）
        if (pattern.examples.some(ex => ex.code?.includes('React'))) {
            tags.push('react', 'javascript');
        }
        else if (pattern.examples.some(ex => ex.code?.includes('Vue'))) {
            tags.push('vue', 'javascript');
        }
        else if (pattern.examples.some(ex => ex.code?.includes('TypeScript'))) {
            tags.push('typescript');
        }
        return [...new Set(tags)];
    }
    /**
     * 批量生成规则
     */
    generateRulesYAML(patterns) {
        return patterns.map(pattern => this.generateRuleYAML(pattern));
    }
    /**
     * 验证 YAML 格式
     */
    validateRuleYAML(yaml) {
        const errors = [];
        const warnings = [];
        // 验证必填字段
        if (!yaml.rule.id) {
            errors.push('规则 ID 不能为空');
        }
        if (!yaml.rule.name) {
            errors.push('规则名称不能为空');
        }
        if (!yaml.rule.description) {
            errors.push('规则描述不能为空');
        }
        if (!yaml.rule.type) {
            errors.push('规则类型不能为空');
        }
        if (!yaml.rule.pattern) {
            errors.push('规则模式不能为空');
        }
        // 验证置信度范围
        if (yaml.rule.confidence < 0 || yaml.rule.confidence > 1) {
            errors.push('置信度必须在 0 到 1 之间');
        }
        // 验证示例数量
        if (yaml.rule.examples.length === 0) {
            warnings.push('建议提供至少一个示例');
        }
        // 验证标签
        if (yaml.rule.tags.length === 0) {
            warnings.push('建议添加相关标签');
        }
        // 验证元数据
        if (!yaml.rule.metadata.createdAt) {
            warnings.push('创建时间不能为空');
        }
        if (!yaml.rule.metadata.version) {
            warnings.push('版本号不能为空');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 序列化为 YAML 字符串
     */
    serializeToYAML(rule) {
        const yamlLines = [];
        yamlLines.push('rule:');
        yamlLines.push(`  id: "${rule.rule.id}"`);
        yamlLines.push(`  name: "${this.escapeYAMLString(rule.rule.name)}"`);
        yamlLines.push(`  description: "${this.escapeYAMLString(rule.rule.description)}"`);
        yamlLines.push(`  type: "${rule.rule.type}"`);
        // 处理模式（可能是字符串或正则表达式）
        if (typeof rule.rule.pattern === 'string') {
            yamlLines.push(`  pattern: "${this.escapeYAMLString(rule.rule.pattern)}"`);
        }
        else {
            yamlLines.push(`  pattern: ${rule.rule.pattern.toString()}`);
        }
        // 处理替换规则
        if (rule.rule.replacement) {
            yamlLines.push(`  replacement: "${this.escapeYAMLString(rule.rule.replacement)}"`);
        }
        // 处理示例
        if (this.config.includeExamples && rule.rule.examples.length > 0) {
            yamlLines.push('  examples:');
            rule.rule.examples.forEach((example, index) => {
                yamlLines.push(`    - before: |`);
                example.before.split('\n').forEach(line => {
                    yamlLines.push(`        ${line}`);
                });
                yamlLines.push(`      after: |`);
                example.after.split('\n').forEach(line => {
                    yamlLines.push(`        ${line}`);
                });
                yamlLines.push(`      explanation: "${this.escapeYAMLString(example.explanation)}"`);
                if (index < rule.rule.examples.length - 1) {
                    yamlLines.push(''); // 示例之间的空行
                }
            });
        }
        yamlLines.push(`  confidence: ${rule.rule.confidence}`);
        yamlLines.push(`  source: "${rule.rule.source}"`);
        // 处理标签
        if (this.config.includeTags && rule.rule.tags.length > 0) {
            yamlLines.push('  tags:');
            rule.rule.tags.forEach(tag => {
                yamlLines.push(`    - "${tag}"`);
            });
        }
        // 处理元数据
        if (this.config.includeMetadata) {
            yamlLines.push('  metadata:');
            yamlLines.push(`    createdAt: "${rule.rule.metadata.createdAt.toISOString()}"`);
            yamlLines.push(`    updatedAt: "${rule.rule.metadata.updatedAt.toISOString()}"`);
            yamlLines.push(`    version: "${rule.rule.metadata.version}"`);
            yamlLines.push(`    author: "${rule.rule.metadata.author}"`);
        }
        return yamlLines.join('\n');
    }
    /**
     * 从 YAML 反序列化
     */
    deserializeFromYAML(yamlString) {
        // 简化的 YAML 解析（实际项目中应该使用 yaml 库）
        const lines = yamlString.split('\n');
        const rule = {};
        let currentKey = '';
        let currentValue = '';
        let inExamples = false;
        let currentExample = null;
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('rule:')) {
                // 开始规则定义
                return;
            }
            if (trimmed.startsWith('examples:')) {
                inExamples = true;
                rule.examples = [];
                return;
            }
            if (inExamples) {
                // 处理示例解析（简化版）
                if (trimmed.startsWith('- before: |')) {
                    currentExample = { before: '', after: '', explanation: '' };
                    currentKey = 'before';
                }
                else if (trimmed.startsWith('after: |')) {
                    currentKey = 'after';
                }
                else if (trimmed.startsWith('explanation:')) {
                    currentKey = 'explanation';
                    currentValue = trimmed.replace('explanation:', '').trim().replace(/^"|"$/g, '');
                    currentExample.explanation = currentValue;
                }
                else if (trimmed === '') {
                    if (currentExample && currentExample.before) {
                        rule.examples.push(currentExample);
                        currentExample = null;
                    }
                }
                else if (currentKey === 'before' && currentExample) {
                    currentExample.before += line.replace(/^\s+/, '') + '\n';
                }
                else if (currentKey === 'after' && currentExample) {
                    currentExample.after += line.replace(/^\s+/, '') + '\n';
                }
                return;
            }
            // 解析键值对
            const match = trimmed.match(/^(\w+):\s*(.*)$/);
            if (match) {
                if (currentKey && currentValue) {
                    rule[currentKey] = this.parseYAMLValue(currentValue);
                }
                currentKey = match[1];
                currentValue = match[2];
            }
            else if (currentKey) {
                currentValue += '\n' + line;
            }
        });
        // 处理最后一个值
        if (currentKey && currentValue) {
            rule[currentKey] = this.parseYAMLValue(currentValue);
        }
        // 处理最后一个示例
        if (inExamples && currentExample && currentExample.before) {
            rule.examples.push(currentExample);
        }
        return { rule };
    }
    /**
     * 解析 YAML 值
     */
    parseYAMLValue(value) {
        const trimmed = value.trim();
        // 字符串值
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }
        // 数字值
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            return parseFloat(trimmed);
        }
        // 布尔值
        if (trimmed === 'true')
            return true;
        if (trimmed === 'false')
            return false;
        // 数组值（简化处理）
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            return trimmed.slice(1, -1).split(',').map(item => item.trim().replace(/^"|"$/g, ''));
        }
        return value;
    }
    /**
     * 转义 YAML 字符串
     */
    escapeYAMLString(str) {
        return str
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
    }
    /**
     * 批量序列化规则为 YAML 字符串
     */
    serializeRulesToYAML(rules) {
        return rules.map(rule => this.serializeToYAML(rule)).join('\n---\n\n');
    }
    /**
     * 批量从 YAML 字符串反序列化规则
     */
    deserializeRulesFromYAML(yamlString) {
        const ruleStrings = yamlString.split('\n---\n');
        return ruleStrings
            .filter(str => str.trim())
            .map(str => this.deserializeFromYAML(str));
    }
}
