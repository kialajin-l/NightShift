/**
 * 文件锁管理器
 * 防止多 Agent 同时修改同一文件，支持锁超时自动释放
 */
import { FileLockManager, FileLockInfo, CommunicationConfig } from './types/level1-protocol.js';
/**
 * 文件锁管理器实现
 */
export declare class DistributedFileLockManager implements FileLockManager {
    private locks;
    private cleanupInterval;
    private config;
    constructor(config: CommunicationConfig['fileLock']);
    /**
     * 获取文件锁
     */
    acquireLock(filePath: string, owner: string, timeout?: number): Promise<FileLockInfo>;
    /**
     * 释放文件锁
     */
    releaseLock(filePath: string, owner: string): Promise<boolean>;
    /**
     * 检查文件是否被锁定
     */
    isLocked(filePath: string): boolean;
    /**
     * 获取文件锁信息
     */
    getLockInfo(filePath: string): FileLockInfo | null;
    /**
     * 清理过期锁
     */
    cleanupExpiredLocks(): void;
    /**
     * 续约文件锁
     */
    private renewLock;
    /**
     * 创建超时计时器
     */
    private createTimeout;
    /**
     * 启动清理任务
     */
    private startCleanupTask;
    /**
     * 关闭文件锁管理器
     */
    shutdown(): void;
    /**
     * 规范化文件路径
     */
    private normalizePath;
    /**
     * 获取所有活跃锁
     */
    getAllActiveLocks(): Map<string, FileLockInfo>;
    /**
     * 获取锁统计信息
     */
    getLockStats(): {
        totalLocks: number;
        activeLocks: number;
        expiredLocks: number;
        averageLockTime: number;
    };
    /**
     * 强制释放所有锁（管理员操作）
     */
    forceReleaseAllLocks(): void;
    /**
     * 强制释放特定所有者的锁
     */
    forceReleaseLocksByOwner(owner: string): number;
    /**
     * 检查锁健康状况
     */
    checkLockHealth(): {
        isHealthy: boolean;
        issues: string[];
        recommendations: string[];
    };
    /**
     * 导出锁状态（用于调试）
     */
    exportLockState(): any;
    /**
     * 导入锁状态（用于恢复）
     */
    importLockState(state: any): void;
}
//# sourceMappingURL=file-lock-manager.d.ts.map