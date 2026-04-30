import * as yaml from 'yaml';
/**
 * RuleForge YAML 生成器
 * 负责将规则候选转换为符合 REP v0.1 标准的 YAML 文件
 */
export class YAMLGenerator {
    config;
    constructor(config) {
        this.config = {
            autoSanitize: true,
            includeExamples: true,
            maxExampleLines: 15,
            validateSchema: true,
            ...config
        };
    }
    /**
     * 生成单个规则的 YAML
     */
    generateRuleYAML(candidate) {
        const repRule = this.convertToREPRule(candidate);
        if (this.config.validateSchema) {
            this.validateREPSchema(repRule);
        }
        const yamlContent = yaml.stringify(repRule, {
            indent: 2,
            aliasDuplicateObjects: false,
            lineWidth: 100
        });
        return this.formatYAML(yamlContent);
    }
    /**
     * 批量生成规则 YAML
     */
    generateRulesYAML(candidates) {
        const result = {};
        for (const candidate of candidates) {
            if (candidate.confidence >= 0.7) { // 只生成高置信度规则
                const yamlContent = this.generateRuleYAML(candidate);
                const filename = this.generateFilename(candidate);
                result[filename] = yamlContent;
            }
        }
        return result;
    }
    /**
     * 转换为 REP v0.1 规则格式
     */
    convertToREPRule(candidate) {
        const now = new Date().toISOString().split('T')[0];
        return {
            meta: {
                id: candidate.id,
                name: candidate.name,
                version: '1.0.0',
                description: candidate.description,
                author: 'RuleForge Auto-Generated',
                created: now,
                updated: now
            },
            rule: {
                trigger: {
                    type: this.mapTriggerType(candidate.trigger?.type || 'keyword_match'),
                    pattern: candidate.pattern,
                    context: candidate.trigger?.type === 'error_match' ? candidate.contexts[0] : undefined
                },
                condition: {
                    type: this.mapConditionType(candidate.condition?.type || 'frequency_threshold'),
                    threshold: candidate.condition?.threshold || candidate.frequency,
                    files: candidate.condition?.type === 'project_structure' ?
                        (candidate.condition.requiredFiles || []) : undefined
                },
                suggestion: {
                    type: this.mapSuggestionType(candidate.suggestion?.type || 'template_suggestion'),
                    template: candidate.suggestion?.template || this.generateDefaultTemplate(candidate),
                    code: this.generateCodeExample(candidate),
                    description: this.generateSuggestionDescription(candidate)
                }
            },
            compatibility: {
                languages: this.detectLanguages(candidate),
                frameworks: this.detectFrameworks(candidate),
                tools: this.detectTools(candidate)
            }
        };
    }
    /**
     * 映射触发器类型
     */
    mapTriggerType(type) {
        const mapping = {
            'keyword_match': 'keyword',
            'file_type_match': 'file_type',
            'error_match': 'error',
            'code_structure_match': 'code_structure'
        };
        return mapping[type] || type;
    }
    /**
     * 映射条件类型
     */
    mapConditionType(type) {
        const mapping = {
            'frequency_threshold': 'frequency',
            'project_structure': 'project_structure',
            'error_context': 'error_context',
            'code_pattern': 'code_pattern'
        };
        return mapping[type] || type;
    }
    /**
     * 映射建议类型
     */
    mapSuggestionType(type) {
        const mapping = {
            'template_suggestion': 'template',
            'file_template': 'file_template',
            'error_fix': 'error_fix',
            'structure_template': 'structure_template'
        };
        return mapping[type] || type;
    }
    /**
     * 生成默认模板
     */
    generateDefaultTemplate(candidate) {
        switch (candidate.type) {
            case 'keyword':
                return `处理"${candidate.pattern}"相关功能的代码模板`;
            case 'file_type':
                return `生成${candidate.pattern}文件的标准模板`;
            case 'error':
                return `修复${candidate.pattern}的解决方案`;
            case 'structure':
                return `遵循${candidate.pattern}的代码结构`;
            default:
                return '通用代码生成模板';
        }
    }
    /**
     * 生成代码示例
     */
    generateCodeExample(candidate) {
        if (!this.config.includeExamples)
            return undefined;
        const example = this.createCodeExample(candidate);
        if (this.config.autoSanitize) {
            return this.sanitizeCode(example);
        }
        return example;
    }
    /**
     * 创建代码示例
     */
    createCodeExample(candidate) {
        switch (candidate.type) {
            case 'keyword':
                return this.createKeywordExample(candidate);
            case 'file_type':
                return this.createFileTypeExample(candidate);
            case 'error':
                return this.createErrorExample(candidate);
            case 'structure':
                return this.createStructureExample(candidate);
            default:
                return '// 代码示例待完善';
        }
    }
    /**
     * 创建关键词示例
     */
    createKeywordExample(candidate) {
        const keyword = candidate.metadata.keyword;
        switch (keyword) {
            case '登录':
                return `// 登录功能示例
import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 登录逻辑
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">登录</button>
    </form>
  );
}`;
            case '注册':
                return `// 注册功能示例
export async function registerUser(userData) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) throw new Error('注册失败');
    return await response.json();
  } catch (error) {
    console.error('注册错误:', error);
    throw error;
  }
}`;
            default:
                return `// ${keyword} 相关功能示例
// 这里可以添加具体的代码实现`;
        }
    }
    /**
     * 创建文件类型示例
     */
    createFileTypeExample(candidate) {
        const fileType = candidate.metadata.fileType;
        switch (fileType) {
            case 'TypeScript':
                return `// TypeScript 接口定义示例
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}`;
            case 'Vue':
                return `<!-- Vue 组件示例 -->
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <button @click="editUser">编辑</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit']);

function editUser() {
  emit('edit', props.user);
}
</script>`;
            default:
                return `// ${fileType} 文件示例
// 这里可以添加具体的文件内容`;
        }
    }
    /**
     * 创建错误示例
     */
    createErrorExample(candidate) {
        const errorType = candidate.metadata.errorType;
        switch (errorType) {
            case '语法错误':
                return `// 语法错误修复示例
// 错误代码:
// function test() {
//   console.log('hello world'
// }

// 正确代码:
function test() {
  console.log('hello world');
}`;
            case '类型错误':
                return `// 类型错误修复示例
// 错误代码:
// const user = { name: 'John' };
// console.log(user.age.toString());

// 正确代码:
interface User {
  name: string;
  age?: number;
}

const user: User = { name: 'John' };
console.log(user.age?.toString() || '');`;
            default:
                return `// ${errorType} 修复示例
// 这里可以添加具体的修复代码`;
        }
    }
    /**
     * 创建结构示例
     */
    createStructureExample(candidate) {
        const structureType = candidate.metadata.structureType;
        switch (structureType) {
            case 'TypeScript接口定义':
                return `// TypeScript 接口定义结构
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Entity {
  name: string;
  email: string;
  role: string;
}`;
            case '函数导出模式':
                return `// 函数导出结构
export function helperFunction(param: string): number {
  return param.length;
}

export const utilityFunction = (data: any) => {
  return JSON.stringify(data);
};

export default mainFunction;`;
            default:
                return `// ${structureType} 结构示例
// 这里可以展示具体的代码结构`;
        }
    }
    /**
     * 生成建议描述
     */
    generateSuggestionDescription(candidate) {
        switch (candidate.type) {
            case 'keyword':
                return `当检测到关键词"${candidate.pattern}"时，自动应用相关代码模板`;
            case 'file_type':
                return `生成${candidate.pattern}文件时，使用标准化的模板和最佳实践`;
            case 'error':
                return `遇到${candidate.pattern}时，自动应用修复方案`;
            case 'structure':
                return `代码结构符合${candidate.pattern}规范时，保持一致性`;
            default:
                return candidate.description;
        }
    }
    /**
     * 检测支持的语言
     */
    detectLanguages(candidate) {
        const languages = new Set();
        // 根据上下文推断支持的语言
        if (candidate.contexts.some(ctx => ctx.includes('.ts') || ctx.includes('.tsx'))) {
            languages.add('typescript');
        }
        if (candidate.contexts.some(ctx => ctx.includes('.js') || ctx.includes('.jsx'))) {
            languages.add('javascript');
        }
        if (candidate.contexts.some(ctx => ctx.includes('.vue'))) {
            languages.add('vue');
        }
        if (candidate.contexts.some(ctx => ctx.includes('.py'))) {
            languages.add('python');
        }
        // 默认包含通用语言
        if (languages.size === 0) {
            languages.add('typescript');
            languages.add('javascript');
        }
        return Array.from(languages);
    }
    /**
     * 检测支持的框架
     */
    detectFrameworks(candidate) {
        const frameworks = new Set();
        // 根据上下文推断支持的框架
        if (candidate.contexts.some(ctx => ctx.includes('react') || ctx.includes('useState'))) {
            frameworks.add('react');
        }
        if (candidate.contexts.some(ctx => ctx.includes('vue') || ctx.includes('defineProps'))) {
            frameworks.add('vue');
        }
        if (candidate.contexts.some(ctx => ctx.includes('next') || ctx.includes('Next'))) {
            frameworks.add('nextjs');
        }
        if (candidate.contexts.some(ctx => ctx.includes('express') || ctx.includes('Express'))) {
            frameworks.add('express');
        }
        return Array.from(frameworks);
    }
    /**
     * 检测支持的工具
     */
    detectTools(candidate) {
        return ['vscode', 'webstorm', 'nightshift'];
    }
    /**
     * 清理代码
     */
    sanitizeCode(code) {
        // 移除敏感信息
        let sanitized = code
            .replace(/apiKey: \s*['"][^'"]+['"]/g, "apiKey: 'YOUR_API_KEY'")
            .replace(/password: \s*['"][^'"]+['"]/g, "password: 'YOUR_PASSWORD'")
            .replace(/token: \s*['"][^'"]+['"]/g, "token: 'YOUR_TOKEN'")
            .replace(/localhost/g, '{project_name}')
            .replace(/127\.0\.0\.1/g, '{project_name}');
        // 限制代码行数
        const lines = sanitized.split('\n');
        if (lines.length > this.config.maxExampleLines) {
            sanitized = lines.slice(0, this.config.maxExampleLines).join('\n') + '\n// ...';
        }
        return sanitized;
    }
    /**
     * 验证 REP Schema
     */
    validateREPSchema(rule) {
        const errors = [];
        // 验证 meta 字段
        if (!rule.meta.id)
            errors.push('meta.id 不能为空');
        if (!rule.meta.name)
            errors.push('meta.name 不能为空');
        if (!rule.meta.version)
            errors.push('meta.version 不能为空');
        // 验证 rule 字段
        if (!rule.rule.trigger.type)
            errors.push('rule.trigger.type 不能为空');
        if (!rule.rule.trigger.pattern)
            errors.push('rule.trigger.pattern 不能为空');
        if (!rule.rule.suggestion.template)
            errors.push('rule.suggestion.template 不能为空');
        if (!rule.rule.suggestion.description)
            errors.push('rule.suggestion.description 不能为空');
        // 验证 compatibility 字段
        if (!rule.compatibility.languages || rule.compatibility.languages.length === 0) {
            errors.push('compatibility.languages 不能为空');
        }
        if (errors.length > 0) {
            throw new Error(`REP Schema 验证失败: ${errors.join(', ')}`);
        }
    }
    /**
     * 格式化 YAML
     */
    formatYAML(yamlContent) {
        // 添加文件头注释
        const header = `# RuleForge 自动生成的规则文件
# 符合 REP v0.1 标准
# 生成时间: ${new Date().toISOString()}
# 置信度: ${this.config.includeExamples ? '高' : '中'}

`;
        return header + yamlContent;
    }
    /**
     * 生成文件名
     */
    generateFilename(candidate) {
        const safeName = candidate.name
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
            .toLowerCase();
        return `${safeName}.rule.yaml`;
    }
    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=yaml-generator.js.map