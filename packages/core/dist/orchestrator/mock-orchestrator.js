/**
 * NightShift 模拟协调器
 * 用于端到端集成测试的模拟实现
 */
/**
 * 模拟端到端协调器
 */
export class MockNightShiftOrchestrator {
    constructor() {
        console.log('🎭 模拟协调器初始化完成');
    }
    /**
     * 执行完整工作流（模拟实现）
     */
    async executeWorkflow(userInput) {
        console.log('🚀 开始执行模拟工作流');
        console.log(`用户输入: "${userInput}"`);
        console.log('');
        const startTime = Date.now();
        // 模拟工作流执行
        await this.simulateWorkflowSteps();
        const executionTime = Date.now() - startTime;
        // 返回模拟结果
        return this.generateMockResult(userInput, executionTime);
    }
    /**
     * 模拟工作流步骤
     */
    async simulateWorkflowSteps() {
        const steps = [
            { name: '任务分解', duration: 1000 },
            { name: '规则加载', duration: 800 },
            { name: '前端Agent执行', duration: 1500 },
            { name: '后端Agent执行', duration: 1200 },
            { name: '进度更新', duration: 600 },
            { name: '规则提取', duration: 700 }
        ];
        for (const step of steps) {
            console.log(`   ✅ ${step.name}...`);
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }
    }
    /**
     * 生成模拟结果
     */
    generateMockResult(userInput, executionTime) {
        // 根据用户输入生成不同的任务
        const tasks = this.generateMockTasks(userInput);
        return {
            success: true,
            tasks,
            generatedFiles: this.generateMockFiles(tasks),
            extractedRules: this.generateMockRules(),
            totalTime: executionTime,
            errors: []
        };
    }
    /**
     * 生成模拟任务
     */
    generateMockTasks(userInput) {
        if (userInput.includes('登录页')) {
            return [
                {
                    id: 'task-1',
                    name: '登录组件生成',
                    description: '创建包含邮箱、密码、记住我功能的Vue登录组件',
                    agent: 'frontend',
                    priority: 'high',
                    estimatedTime: 10
                },
                {
                    id: 'task-2',
                    name: '用户认证API',
                    description: '实现用户登录、注册、验证的FastAPI接口',
                    agent: 'backend',
                    priority: 'high',
                    estimatedTime: 15
                },
                {
                    id: 'task-3',
                    name: '记住我功能',
                    description: '实现记住登录状态的本地存储逻辑',
                    agent: 'frontend',
                    priority: 'medium',
                    estimatedTime: 8
                }
            ];
        }
        // 默认任务
        return [
            {
                id: 'task-1',
                name: '前端组件生成',
                description: '根据需求生成前端组件',
                agent: 'frontend',
                priority: 'medium',
                estimatedTime: 12
            },
            {
                id: 'task-2',
                name: '后端API实现',
                description: '实现相应的后端API接口',
                agent: 'backend',
                priority: 'medium',
                estimatedTime: 15
            }
        ];
    }
    /**
     * 生成模拟文件
     */
    generateMockFiles(tasks) {
        const files = [];
        for (const task of tasks) {
            if (task.agent === 'frontend') {
                files.push({
                    type: 'frontend',
                    name: `${task.name}.vue`,
                    content: this.generateVueComponent(task.name, task.description),
                    path: `src/components/${task.name}.vue`
                });
            }
            else if (task.agent === 'backend') {
                files.push({
                    type: 'backend',
                    name: `${task.name}.py`,
                    content: this.generatePythonAPI(task.name, task.description),
                    path: `src/api/${task.name}.py`
                });
            }
        }
        return files;
    }
    /**
     * 生成Vue组件内容
     */
    generateVueComponent(name, description) {
        return `<!-- ${description} -->
<template>
  <div class="${name.toLowerCase().replace(/\s+/g, '-')}">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">邮箱地址</label>
        <input 
          id="email"
          type="email" 
          v-model="form.email"
          required
          placeholder="请输入邮箱地址"
        />
      </div>
      
      <div class="form-group">
        <label for="password">密码</label>
        <input 
          id="password"
          type="password" 
          v-model="form.password"
          required
          placeholder="请输入密码"
        />
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.rememberMe" />
          记住我
        </label>
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const form = reactive<LoginForm>({
  email: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // 调用登录API
    console.log('登录请求:', form)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('登录成功')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.${name.toLowerCase().replace(/\s+/g, '-')} {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>`;
    }
    /**
     * 生成Python API内容
     */
    generatePythonAPI(name, description) {
        return `"""
${description}
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# 数据模型
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user_id: Optional[int] = None

# 模拟用户数据
fake_users_db = {
    "user@example.com": {
        "password": "hashed_password_123",
        "user_id": 1,
        "full_name": "示例用户"
    }
}

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    用户登录接口
    """
    
    # 验证用户是否存在
    user = fake_users_db.get(login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 验证密码（这里应该使用密码哈希验证）
    if login_data.password != "password123":  # 简化验证
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 生成令牌（简化实现）
    token = f"mock_jwt_token_{user['user_id']}"
    
    return LoginResponse(
        success=True,
        message="登录成功",
        token=token,
        user_id=user['user_id']
    )

@router.post("/register")
async def register():
    """
    用户注册接口
    """
    return {"message": "注册功能待实现"}

@router.get("/user/{user_id}")
async def get_user_info(user_id: int):
    """
    获取用户信息
    """
    return {
        "user_id": user_id,
        "email": "user@example.com",
        "full_name": "示例用户"
    }`;
    }
    /**
     * 生成模拟规则
     */
    generateMockRules() {
        return [
            {
                id: 'rule-1',
                category: 'vue_props_validation',
                description: 'Vue组件props类型验证规则',
                confidence: 0.85,
                pattern: {
                    trigger: 'props定义',
                    solution: '添加类型验证和默认值'
                }
            },
            {
                id: 'rule-2',
                category: 'fastapi_auth',
                description: 'FastAPI认证中间件模式',
                confidence: 0.92,
                pattern: {
                    trigger: '用户认证需求',
                    solution: '使用JWT令牌和依赖注入'
                }
            }
        ];
    }
    /**
     * 获取工作流状态
     */
    getWorkflowStatus() {
        return {
            isRunning: false,
            completedTasks: 3,
            totalTasks: 3,
            progress: 100
        };
    }
    /**
     * 停止工作流
     */
    async stopWorkflow() {
        console.log('🛑 模拟工作流已停止');
    }
}
export default MockNightShiftOrchestrator;
//# sourceMappingURL=mock-orchestrator.js.map