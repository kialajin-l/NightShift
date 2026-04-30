// NightShift 集成服务钩子

import { useState, useEffect, useCallback } from 'react';
import { IntegrationService } from '@/lib/integration-service';
import type { Message } from '@/types';

/**
 * 集成服务钩子
 */
export function useIntegrationService() {
  const [integrationService, setIntegrationService] = useState<IntegrationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化集成服务
   */
  const initialize = useCallback(async (config?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const service = new IntegrationService(config);
      await service.initialize();
      
      setIntegrationService(service);
      setIsInitialized(true);
      
      return service;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 设置当前会话
   */
  const setCurrentSession = useCallback((sessionId: string) => {
    if (integrationService) {
      integrationService.setCurrentSession(sessionId);
    }
  }, [integrationService]);

  /**
   * 处理用户消息
   */
  const processUserMessage = useCallback(async (message: Message) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.processUserMessage(message);
  }, [integrationService, isInitialized]);

  /**
   * 处理 AI 响应消息
   */
  const processAIResponse = useCallback(async (message: Message, originalMessage: Message) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.processAIResponse(message, originalMessage);
  }, [integrationService, isInitialized]);

  /**
   * 获取集成状态
   */
  const getIntegrationStatus = useCallback(() => {
    if (!integrationService) {
      return {
        memorySystem: false,
        ruleForge: false,
        scheduler: false,
        isInitialized: false
      };
    }
    
    return integrationService.getIntegrationStatus();
  }, [integrationService]);

  /**
   * 获取记忆统计信息
   */
  const getMemoryStats = useCallback(async () => {
    if (!integrationService || !isInitialized) {
      return null;
    }
    
    return await integrationService.getMemoryStats();
  }, [integrationService, isInitialized]);

  /**
   * 分解任务需求
   */
  const decomposeTask = useCallback(async (requirement: string) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.decomposeTask(requirement);
  }, [integrationService, isInitialized]);

  /**
   * 调度任务执行
   */
  const scheduleTasks = useCallback(async (dag: any) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.scheduleTasks(dag);
  }, [integrationService, isInitialized]);

  /**
   * 获取任务状态
   */
  const getTaskStatus = useCallback(async (taskId: string) => {
    if (!integrationService || !isInitialized) {
      return null;
    }
    
    return await integrationService.getTaskStatus(taskId);
  }, [integrationService, isInitialized]);

  /**
   * 获取所有任务状态
   */
  const getAllTaskStatus = useCallback(async () => {
    if (!integrationService || !isInitialized) {
      return [];
    }
    
    return await integrationService.getAllTaskStatus();
  }, [integrationService, isInitialized]);

  /**
   * 获取调度器统计信息
   */
  const getSchedulerStats = useCallback(async () => {
    if (!integrationService || !isInitialized) {
      return null;
    }
    
    return await integrationService.getSchedulerStats();
  }, [integrationService, isInitialized]);

  /**
   * 提取规则模式
   */
  const extractRules = useCallback(async (sessionData: any) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.extractRules(sessionData);
  }, [integrationService, isInitialized]);

  /**
   * 批量提取规则
   */
  const extractRulesBatch = useCallback(async (sessionsData: any[]) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.extractRulesBatch(sessionsData);
  }, [integrationService, isInitialized]);

  /**
   * 生成 YAML 规则文件
   */
  const generateYAMLRules = useCallback(async (patterns: any[]) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.generateYAMLRules(patterns);
  }, [integrationService, isInitialized]);

  /**
   * 注入规则到代码
   */
  const injectRulesToCode = useCallback(async (code: string, patterns: any[]) => {
    if (!integrationService || !isInitialized) {
      throw new Error('集成服务未初始化');
    }
    
    return await integrationService.injectRulesToCode(code, patterns);
  }, [integrationService, isInitialized]);

  /**
   * 获取规则统计信息
   */
  const getRuleStats = useCallback(async (patterns: any[]) => {
    if (!integrationService || !isInitialized) {
      return null;
    }
    
    return await integrationService.getRuleStats(patterns);
  }, [integrationService, isInitialized]);

  /**
   * 重置集成服务
   */
  const reset = useCallback(async () => {
    if (integrationService) {
      await integrationService.reset();
      setIntegrationService(null);
      setIsInitialized(false);
    }
  }, [integrationService]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (integrationService) {
        integrationService.reset().catch(console.error);
      }
    };
  }, [integrationService]);

  return {
    // 状态
    integrationService,
    isInitialized,
    isLoading,
    error,
    
    // 方法
    initialize,
    setCurrentSession,
    processUserMessage,
    processAIResponse,
    getIntegrationStatus,
    getMemoryStats,
    decomposeTask,
    scheduleTasks,
    getTaskStatus,
    getAllTaskStatus,
    getSchedulerStats,
    extractRules,
    extractRulesBatch,
    generateYAMLRules,
    injectRulesToCode,
    getRuleStats,
    reset
  };
}