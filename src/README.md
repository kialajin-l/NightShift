# NightShift/src 目录

## 功能说明
此目录包含从 CodePilot 复制的核心功能模块，按照清洁室开发原则进行集成。

## 目录结构
```
src/
├── providers/          # 服务提供商模块
├── services/          # 核心服务
├── utils/             # 工具函数
├── components/        # UI 组件
└── types/            # 类型定义
```

## 集成原则
- ✅ 保持 CodePilot 原仓库独立（仅参考）
- ✅ 未来可逐步替换为独立实现（清洁室重写）
- ⚠️ 注意 BUSL-1.1 许可证限制（仅限个人/学术使用）

## 已集成模块
- [ ] providers/chat-provider.ts（聊天界面）
- [ ] services/model-service.ts（多服务商）
- [ ] utils/usage-tracker.ts（用量统计）
- [ ] package.json 配置（VSCode 插件配置）