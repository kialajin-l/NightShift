/**
 * 文件锁管理器
 * 防止多 Agent 同时修改同一文件，支持锁超时自动释放
 */
/**
 * 文件锁管理器实现
 */
export class DistributedFileLockManager {
    locks = new Map();
    cleanupInterval = null;
    config;
    constructor(config) {
        this.config = config;
        this.startCleanupTask();
    }
    /**
     * 获取文件锁
     */
    async acquireLock(filePath, owner, timeout) {
        const normalizedPath = this.normalizePath(filePath);
        const lockTimeout = timeout || this.config.defaultTimeout;
        const now = Date.now();
        const expiresAt = now + lockTimeout;
        // 检查文件是否已被锁定
        const existingLock = this.locks.get(normalizedPath);
        if (existingLock) {
            // 检查锁是否已过期
            if (now > existingLock.expiresAt) {
                // 锁已过期，清理并重新获取
                this.releaseLock(normalizedPath, existingLock.owner);
            }
            else {
                // 文件已被锁定，检查是否为同一所有者
                if (existingLock.owner === owner) {
                    // 同一所有者，续约锁
                    return this.renewLock(normalizedPath, owner, lockTimeout);
                }
                else {
                    // 不同所有者，抛出错误
                    throw new Error(`文件 ${normalizedPath} 已被 ${existingLock.owner} 锁定`);
                }
            }
        }
        // 创建新锁
        const lockInfo = {
            owner,
            acquiredAt: now,
            timeout: lockTimeout,
            expiresAt,
            timeoutId: this.createTimeout(normalizedPath, lockTimeout),
            renewCount: 0
        };
        this.locks.set(normalizedPath, lockInfo);
        console.log(`文件锁已获取: ${normalizedPath} -> ${owner}, 超时: ${lockTimeout}ms`);
        return {
            owner: lockInfo.owner,
            acquiredAt: lockInfo.acquiredAt,
            timeout: lockInfo.timeout,
            expiresAt: lockInfo.expiresAt
        };
    }
    /**
     * 释放文件锁
     */
    async releaseLock(filePath, owner) {
        const normalizedPath = this.normalizePath(filePath);
        const lock = this.locks.get(normalizedPath);
        if (!lock) {
            console.log(`文件锁不存在: ${normalizedPath}`);
            return false;
        }
        // 检查锁所有者
        if (lock.owner !== owner) {
            throw new Error(`无法释放文件锁: 锁所有者 ${lock.owner} 与请求者 ${owner} 不匹配`);
        }
        // 清理超时计时器
        clearTimeout(lock.timeoutId);
        // 移除锁
        this.locks.delete(normalizedPath);
        console.log(`文件锁已释放: ${normalizedPath} -> ${owner}`);
        return true;
    }
    /**
     * 检查文件是否被锁定
     */
    isLocked(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        const lock = this.locks.get(normalizedPath);
        if (!lock) {
            return false;
        }
        // 检查锁是否已过期
        if (Date.now() > lock.expiresAt) {
            this.releaseLock(normalizedPath, lock.owner);
            return false;
        }
        return true;
    }
    /**
     * 获取文件锁信息
     */
    getLockInfo(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        const lock = this.locks.get(normalizedPath);
        if (!lock) {
            return null;
        }
        // 检查锁是否已过期
        if (Date.now() > lock.expiresAt) {
            this.releaseLock(normalizedPath, lock.owner);
            return null;
        }
        return {
            owner: lock.owner,
            acquiredAt: lock.acquiredAt,
            timeout: lock.timeout,
            expiresAt: lock.expiresAt
        };
    }
    /**
     * 清理过期锁
     */
    cleanupExpiredLocks() {
        const now = Date.now();
        const expiredLocks = [];
        // 收集过期锁
        for (const [filePath, lock] of this.locks.entries()) {
            if (now > lock.expiresAt) {
                expiredLocks.push(filePath);
            }
        }
        // 清理过期锁
        for (const filePath of expiredLocks) {
            const lock = this.locks.get(filePath);
            console.log(`自动清理过期文件锁: ${filePath} -> ${lock.owner}`);
            clearTimeout(lock.timeoutId);
            this.locks.delete(filePath);
        }
        if (expiredLocks.length > 0) {
            console.log(`清理了 ${expiredLocks.length} 个过期文件锁`);
        }
    }
    /**
     * 续约文件锁
     */
    renewLock(filePath, owner, timeout) {
        const normalizedPath = this.normalizePath(filePath);
        const lock = this.locks.get(normalizedPath);
        if (!lock) {
            throw new Error(`文件锁不存在: ${normalizedPath}`);
        }
        if (lock.owner !== owner) {
            throw new Error(`无法续约文件锁: 锁所有者 ${lock.owner} 与请求者 ${owner} 不匹配`);
        }
        // 清理旧计时器
        clearTimeout(lock.timeoutId);
        // 更新锁信息
        const now = Date.now();
        lock.expiresAt = now + timeout;
        lock.timeoutId = this.createTimeout(normalizedPath, timeout);
        lock.renewCount++;
        console.log(`文件锁已续约: ${normalizedPath} -> ${owner}, 续约次数: ${lock.renewCount}`);
        return {
            owner: lock.owner,
            acquiredAt: lock.acquiredAt,
            timeout: lock.timeout,
            expiresAt: lock.expiresAt
        };
    }
    /**
     * 创建超时计时器
     */
    createTimeout(filePath, timeout) {
        return setTimeout(() => {
            const lock = this.locks.get(filePath);
            if (lock) {
                console.log(`文件锁超时自动释放: ${filePath} -> ${lock.owner}`);
                this.releaseLock(filePath, lock.owner);
            }
        }, timeout);
    }
    /**
     * 启动清理任务
     */
    startCleanupTask() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks();
        }, this.config.cleanupInterval);
        // 确保进程退出时清理定时器
        process.on('exit', () => {
            this.shutdown();
        });
        process.on('SIGINT', () => {
            this.shutdown();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            this.shutdown();
            process.exit(0);
        });
    }
    /**
     * 关闭文件锁管理器
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // 清理所有活跃锁
        for (const [filePath, lock] of this.locks.entries()) {
            clearTimeout(lock.timeoutId);
        }
        this.locks.clear();
        console.log('文件锁管理器已关闭');
    }
    /**
     * 规范化文件路径
     */
    normalizePath(filePath) {
        // 统一路径分隔符
        let normalized = filePath.replace(/\\/g, '/');
        // 移除开头的 ./ 或 .\
        normalized = normalized.replace(/^\.\//, '');
        // 解析相对路径（简化版）
        if (normalized.startsWith('../')) {
            // 这里可以添加更复杂的相对路径解析
            // 目前只做简单处理
            normalized = normalized.replace(/^\.\.\//, '');
        }
        return normalized;
    }
    /**
     * 获取所有活跃锁
     */
    getAllActiveLocks() {
        const activeLocks = new Map();
        for (const [filePath, lock] of this.locks.entries()) {
            if (Date.now() <= lock.expiresAt) {
                activeLocks.set(filePath, {
                    owner: lock.owner,
                    acquiredAt: lock.acquiredAt,
                    timeout: lock.timeout,
                    expiresAt: lock.expiresAt
                });
            }
        }
        return activeLocks;
    }
    /**
     * 获取锁统计信息
     */
    getLockStats() {
        const now = Date.now();
        let activeLocks = 0;
        let expiredLocks = 0;
        let totalLockTime = 0;
        for (const lock of this.locks.values()) {
            if (now <= lock.expiresAt) {
                activeLocks++;
                totalLockTime += (now - lock.acquiredAt);
            }
            else {
                expiredLocks++;
            }
        }
        const averageLockTime = activeLocks > 0 ? totalLockTime / activeLocks : 0;
        return {
            totalLocks: this.locks.size,
            activeLocks,
            expiredLocks,
            averageLockTime
        };
    }
    /**
     * 强制释放所有锁（管理员操作）
     */
    forceReleaseAllLocks() {
        const lockCount = this.locks.size;
        for (const [filePath, lock] of this.locks.entries()) {
            clearTimeout(lock.timeoutId);
            console.log(`强制释放文件锁: ${filePath} -> ${lock.owner}`);
        }
        this.locks.clear();
        console.log(`强制释放了 ${lockCount} 个文件锁`);
    }
    /**
     * 强制释放特定所有者的锁
     */
    forceReleaseLocksByOwner(owner) {
        const locksToRelease = [];
        for (const [filePath, lock] of this.locks.entries()) {
            if (lock.owner === owner) {
                locksToRelease.push(filePath);
            }
        }
        for (const filePath of locksToRelease) {
            const lock = this.locks.get(filePath);
            clearTimeout(lock.timeoutId);
            this.locks.delete(filePath);
            console.log(`强制释放文件锁: ${filePath} -> ${owner}`);
        }
        console.log(`强制释放了 ${locksToRelease.length} 个属于 ${owner} 的文件锁`);
        return locksToRelease.length;
    }
    /**
     * 检查锁健康状况
     */
    checkLockHealth() {
        const issues = [];
        const recommendations = [];
        const now = Date.now();
        // 检查过期锁
        const expiredLocks = Array.from(this.locks.entries())
            .filter(([_, lock]) => now > lock.expiresAt);
        if (expiredLocks.length > 0) {
            issues.push(`发现 ${expiredLocks.length} 个过期锁未清理`);
            recommendations.push('运行 cleanupExpiredLocks() 清理过期锁');
        }
        // 检查锁续约次数
        const highRenewLocks = Array.from(this.locks.values())
            .filter(lock => lock.renewCount > 10);
        if (highRenewLocks.length > 0) {
            issues.push(`发现 ${highRenewLocks.length} 个锁续约次数过高`);
            recommendations.push('考虑增加锁超时时间或优化锁使用模式');
        }
        // 检查锁数量
        if (this.locks.size > 100) {
            issues.push('活跃锁数量过多，可能影响性能');
            recommendations.push('考虑优化锁粒度或减少并发文件操作');
        }
        return {
            isHealthy: issues.length === 0,
            issues,
            recommendations
        };
    }
    /**
     * 导出锁状态（用于调试）
     */
    exportLockState() {
        const state = {
            timestamp: Date.now(),
            totalLocks: this.locks.size,
            locks: {}
        };
        for (const [filePath, lock] of this.locks.entries()) {
            state.locks[filePath] = {
                owner: lock.owner,
                acquiredAt: lock.acquiredAt,
                expiresAt: lock.expiresAt,
                timeout: lock.timeout,
                renewCount: lock.renewCount,
                remainingTime: Math.max(0, lock.expiresAt - Date.now())
            };
        }
        return state;
    }
    /**
     * 导入锁状态（用于恢复）
     */
    importLockState(state) {
        if (!state || typeof state !== 'object') {
            throw new Error('无效的锁状态数据');
        }
        // 清理现有锁
        this.forceReleaseAllLocks();
        // 导入新锁
        if (state.locks && typeof state.locks === 'object') {
            const now = Date.now();
            for (const [filePath, lockData] of Object.entries(state.locks)) {
                const data = lockData;
                // 只导入未过期的锁
                if (data.expiresAt > now) {
                    const timeout = data.expiresAt - now;
                    const lockItem = {
                        owner: data.owner,
                        acquiredAt: data.acquiredAt,
                        timeout: data.timeout,
                        expiresAt: data.expiresAt,
                        timeoutId: this.createTimeout(filePath, timeout),
                        renewCount: data.renewCount || 0
                    };
                    this.locks.set(filePath, lockItem);
                }
            }
        }
        console.log(`从状态导入 ${Object.keys(state.locks || {}).length} 个锁`);
    }
}
//# sourceMappingURL=file-lock-manager.js.map