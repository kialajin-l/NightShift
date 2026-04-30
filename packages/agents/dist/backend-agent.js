"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendAgent = void 0;
const base_agent_1 = require("./base-agent");
/**
 * 后端 Agent - 负责生成 API 接口和业务逻辑
 */
class BackendAgent extends base_agent_1.BaseAgent {
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
        super('backend-agent', '后端 Agent', 'FastAPI/Express 开发专家', 'ollama/qwen-coder:7b', mockSkillManager, mockModelRouter);
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
        // 模拟后端开发逻辑
        const result = {
            success: true,
            output: {
                success: true,
                generatedCode: '// 模拟生成的后端代码',
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
     * 生成后端代码
     */
    generateBackendCode(task) {
        const files = [];
        if (task.name.includes('登录') || task.name.includes('认证')) {
            files.push({
                path: 'src/api/auth.py',
                content: this.generateAuthAPI(),
                language: 'python'
            });
        }
        if (task.name.includes('用户') || task.name.includes('CRUD')) {
            files.push({
                path: 'src/api/users.py',
                content: this.generateUserAPI(),
                language: 'python'
            });
        }
        if (files.length === 0) {
            files.push({
                path: 'src/api/main.py',
                content: this.generateBaseAPI(),
                language: 'python'
            });
        }
        return files;
    }
    /**
     * 生成认证 API
     */
    generateAuthAPI() {
        return `from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt

router = APIRouter()

# JWT 配置
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login")
async def login(login_data: LoginRequest):
    # 验证用户身份（这里应该连接数据库）
    user = await authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer")

@router.post("/register")
async def register(user_data: dict):
    # 用户注册逻辑
    user = await create_user(user_data)
    return {"message": "用户注册成功", "user_id": user.id}

async def authenticate_user(email: str, password: str):
    # 这里应该连接数据库验证用户
    # 暂时返回模拟数据
    if email == "test@example.com" and password == "password":
        return {"id": 1, "email": email, "name": "Test User"}
    return None

async def create_user(user_data: dict):
    # 创建用户逻辑
    return {"id": 1, "email": user_data.get("email"), "name": user_data.get("name")}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt`;
    }
    /**
     * 生成用户 API
     */
    generateUserAPI() {
        return `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class User(BaseModel):
    id: int
    name: str
    email: str
    created_at: str

class UserCreate(BaseModel):
    name: str
    email: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

# 模拟用户数据
users_db = [
    {"id": 1, "name": "张三", "email": "zhangsan@example.com", "created_at": "2024-01-01"},
    {"id": 2, "name": "李四", "email": "lisi@example.com", "created_at": "2024-01-02"}
]

@router.get("/", response_model=List[User])
async def get_users(skip: int = 0, limit: int = 100):
    return users_db[skip:skip + limit]

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@router.post("/", response_model=User)
async def create_user(user: UserCreate):
    new_user = {
        "id": len(users_db) + 1,
        "name": user.name,
        "email": user.email,
        "created_at": "2024-01-01"
    }
    users_db.append(new_user)
    return new_user

@router.put("/{user_id}", response_model=User)
async def update_user(user_id: int, user_update: UserUpdate):
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user_update.name is not None:
        user["name"] = user_update.name
    if user_update.email is not None:
        user["email"] = user_update.email
    
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int):
    global users_db
    users_db = [u for u in users_db if u["id"] != user_id]
    return {"message": "用户删除成功"}`;
    }
    /**
     * 生成基础 API
     */
    generateBaseAPI() {
        return `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NightShift API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NightShift API 服务运行中"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`;
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
exports.BackendAgent = BackendAgent;
//# sourceMappingURL=backend-agent.js.map