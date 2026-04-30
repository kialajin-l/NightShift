/**
 * FastAPI 相关模式模板
 */
export const fastapiPatterns = [
    {
        id: 'fastapi-crud-pattern',
        category: 'api_design',
        keywords: ['@router', 'def create_', 'def get_', 'def update_', 'def delete_', 'Session', 'Depends'],
        filePattern: '**/api/*.py',
        condition: (events) => {
            // 检查 CRUD 操作模式
            const createEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('def create_'));
            const getEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('def get_'));
            const updateEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('def update_'));
            const deleteEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('def delete_'));
            return (createEvents.length >= 2 && getEvents.length >= 2) ||
                (updateEvents.length >= 1 && deleteEvents.length >= 1);
        },
        minConfidence: 0.8,
        solution: {
            description: 'FastAPI CRUD 操作模式',
            codeExample: {
                before: `# 非标准 CRUD
@app.post("/item")
def add_item():
    # ...

@app.get("/item")
def fetch_item():
    # ...`,
                after: `# 标准 CRUD 模式
@router.post("/", response_model=Item)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    # ...

@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int, db: Session = Depends(get_db)):
    # ...`,
                language: 'python'
            }
        }
    },
    {
        id: 'fastapi-pydantic-validation',
        category: 'error_fix',
        keywords: ['BaseModel', 'Field', 'validator', 'Config', 'response_model'],
        filePattern: '**/models/*.py',
        condition: (events) => {
            // 检查数据验证相关错误和修复
            const validationErrors = events.filter(e => e.type === 'error_occurred' &&
                (e.message?.includes('validation') || e.message?.includes('pydantic')));
            const modelEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('BaseModel'));
            return validationErrors.length >= 1 && modelEvents.length >= 2;
        },
        minConfidence: 0.7,
        solution: {
            description: 'FastAPI Pydantic 数据验证模式',
            codeExample: {
                before: `# 简单的数据类
class Item:
    name: str
    price: float`,
                after: `# 使用 Pydantic 验证
from pydantic import BaseModel, Field

class Item(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Example Item",
                "price": 9.99
            }
        }`,
                language: 'python'
            }
        }
    },
    {
        id: 'fastapi-dependency-injection',
        category: 'code_style',
        keywords: ['Depends', 'get_db', 'get_current_user', 'BackgroundTasks'],
        filePattern: '**/*.py',
        condition: (events) => {
            // 检查依赖注入使用模式
            const dependsEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('Depends'));
            const dependencyEvents = events.filter(e => e.type === 'file_saved' &&
                e.content?.includes('def get_'));
            return dependsEvents.length >= 3 && dependencyEvents.length >= 2;
        },
        minConfidence: 0.75,
        solution: {
            description: 'FastAPI 依赖注入模式',
            codeExample: {
                before: `# 硬编码依赖
def get_items():
    db = connect_to_database()
    # ...`,
                after: `# 使用依赖注入
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/items")
def get_items(db: Session = Depends(get_db)):
    # ...`,
                language: 'python'
            }
        }
    }
];
