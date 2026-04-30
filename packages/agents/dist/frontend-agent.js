"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendAgent = void 0;
const base_agent_1 = require("./base-agent");
/**
 * 前端 Agent - 负责生成前端组件和界面
 */
class FrontendAgent extends base_agent_1.BaseAgent {
    constructor() {
        // 创建模拟的skillManager和modelRouter
        const mockSkillManager = {
            registerSkill: () => { },
            unregisterSkill: () => { },
            findSkills: () => [],
            getSkill: () => null,
            composeSkills: () => ({
                id: 'composite',
                name: 'composite',
                skills: [],
                execute: async () => ({ success: true, result: {}, metadata: { executionTime: 0 } })
            })
        };
        const mockModelRouter = {
            route: () => 'ollama/qwen-coder:7b',
            getModelInfo: () => ({
                name: 'ollama/qwen-coder:7b',
                provider: 'ollama',
                capabilities: [],
                costPerToken: 0,
                maxTokens: 4000,
                supportedLanguages: []
            }),
            trackPerformance: () => { }
        };
        super('frontend-agent', '前端 Agent', '前端 Agent', 'ollama/qwen-coder:7b', mockSkillManager, mockModelRouter);
    }
    /**
     * 加载默认技能
     */
    async loadDefaultSkills() {
        // 暂时使用空数组，避免复杂的Skill类型定义
        this.skills = [];
    }
    /**
     * 验证任务是否适合此 Agent
     */
    validateTask(task) {
        const errors = [];
        const warnings = [];
        if (!task.id) {
            errors.push('任务必须包含ID');
        }
        if (!task.name) {
            errors.push('任务必须包含名称');
        }
        if (!task.description) {
            errors.push('任务必须包含描述');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 选择适合任务的技能
     */
    selectSkills(task) {
        // 暂时返回空数组，避免复杂的Skill类型定义
        return [];
    }
    /**
     * 执行任务的核心逻辑
     */
    async executeWithContext(context) {
        const { task } = context;
        // 模拟前端开发逻辑
        const result = {
            success: true,
            output: {
                success: true,
                generatedCode: '// 模拟生成的前端代码',
                documentation: '模拟生成的文档',
                testCases: ['模拟测试用例'],
                executionTime: 100,
                model: this.model
            },
            context: context,
            metrics: {
                totalTime: 100,
                skillExecutionCount: 0,
                tokensUsed: 0,
                qualityScore: 85,
                errorCount: 0
            }
        };
        return result;
    }
    /**
     * 生成前端代码
     */
    generateFrontendCode(task) {
        const files = [];
        // 根据任务类型生成不同的文件
        if (task.name.includes('登录')) {
            files.push({
                path: 'src/components/LoginForm.vue',
                content: this.generateLoginForm(),
                language: 'vue'
            });
        }
        if (task.name.includes('注册')) {
            files.push({
                path: 'src/components/RegisterForm.vue',
                content: this.generateRegisterForm(),
                language: 'vue'
            });
        }
        // 默认生成基础组件
        if (files.length === 0) {
            files.push({
                path: 'src/components/BaseComponent.vue',
                content: this.generateBaseComponent(),
                language: 'vue'
            });
        }
        return files;
    }
    /**
     * 生成登录表单组件
     */
    generateLoginForm() {
        return `<!-- 登录表单组件 -->
<template>
  <div class="login-form">
    <h2>用户登录</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>邮箱</label>
        <input v-model="form.email" type="email" required />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input v-model="form.password" type="password" required />
      </div>
      <div class="form-group">
        <label>
          <input v-model="form.rememberMe" type="checkbox" />
          记住我
        </label>
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    // 调用登录 API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (!response.ok) throw new Error('登录失败')
    
    const result = await response.json()
    console.log('登录成功:', result)
  } catch (error) {
    console.error('登录错误:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>`;
    }
    /**
     * 生成注册表单组件
     */
    generateRegisterForm() {
        return `<!-- 注册表单组件 -->
<template>
  <div class="register-form">
    <h2>用户注册</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>用户名</label>
        <input v-model="form.username" required />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input v-model="form.email" type="email" required />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input v-model="form.password" type="password" required />
      </div>
      <div class="form-group">
        <label>确认密码</label>
        <input v-model="form.confirmPassword" type="password" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (!response.ok) throw new Error('注册失败')
    
    const result = await response.json()
    console.log('注册成功:', result)
  } catch (error) {
    console.error('注册错误:', error)
  } finally {
    loading.value = false
  }
}
</script>`;
    }
    /**
     * 生成基础组件
     */
    generateBaseComponent() {
        return `<!-- 基础组件模板 -->
<template>
  <div class="base-component">
    <h3>{{ title }}</h3>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '组件标题'
  }
})
</script>

<style scoped>
.base-component {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
}
</style>`;
    }
    /**
     * 获取 Agent 信息
     */
    getStatus() {
        return {
            isReady: true,
            isBusy: false,
            completedTasks: 0,
            successRate: 0,
            averageExecutionTime: 0
        };
    }
}
exports.FrontendAgent = FrontendAgent;
//# sourceMappingURL=frontend-agent.js.map