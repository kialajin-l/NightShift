/**
 * NightShift 模型路由配置系统
 * 支持配置化路由规则和模型管理
 */
import { RouterConfig, ModelConfig, RoutingRule } from '../types/model-router.js';
/**
 * 默认模型配置
 */
export declare const DEFAULT_MODELS: ModelConfig[];
/**
 * 默认路由规则配置
 */
export declare const DEFAULT_RULES: RoutingRule[];
/**
 * 默认路由配置
 */
export declare const DEFAULT_ROUTER_CONFIG: RouterConfig;
/**
 * 配置验证器
 */
export declare class RouterConfigValidator {
    /**
     * 验证路由配置
     */
    static validate(config: RouterConfig): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 验证模型配置
     */
    private static validateModelConfig;
    /**
     * 验证路由规则
     */
    private static validateRoutingRule;
}
/**
 * 配置加载器
 */
export declare class RouterConfigLoader {
    /**
     * 从文件加载配置
     */
    static loadFromFile(filePath: string): Promise<RouterConfig>;
    /**
     * 从环境变量加载配置
     */
    static loadFromEnv(): RouterConfig;
    /**
     * 合并多个配置源
     */
    static mergeConfigs(...configs: Partial<RouterConfig>[]): RouterConfig;
}
/**
 * 配置管理器
 */
export declare class RouterConfigManager {
    private config;
    private configFile?;
    constructor(initialConfig?: RouterConfig);
    /**
     * 获取当前配置
     */
    getConfig(): RouterConfig;
    /**
     * 更新配置
     */
    updateConfig(updates: Partial<RouterConfig>): void;
    /**
     * 重新加载配置
     */
    reloadConfig(): Promise<void>;
    /**
     * 设置配置文件路径
     */
    setConfigFile(filePath: string): void;
    /**
     * 导出配置为JSON
     */
    exportConfig(): string;
    /**
     * 导入配置
     */
    importConfig(configJson: string): void;
}
//# sourceMappingURL=router-config.d.ts.map