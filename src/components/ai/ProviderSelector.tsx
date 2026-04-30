// AI 提供商选择器组件 - 集成 CodePilot AI 提供商功能

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Check, Zap, Cpu, Globe } from 'lucide-react';
import { AIProviderConfig } from '@/types';

interface ProviderSelectorProps {
  selectedProvider?: string;
  selectedModel?: string;
  onProviderChange?: (providerId: string, model: string) => void;
  className?: string;
}

export function ProviderSelector({ 
  selectedProvider = 'ollama-local', 
  selectedModel = 'qwen-coder:7b',
  onProviderChange,
  className 
}: ProviderSelectorProps) {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 加载提供商和模型列表
  useEffect(() => {
    loadProvidersAndModels();
  }, []);

  const loadProvidersAndModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 加载提供商列表
      const providersResponse = await fetch('/api/providers');
      if (providersResponse.ok) {
        const providersResult = await providersResponse.json();
        if (providersResult.success) {
          setProviders(providersResult.data || []);
        }
      }

      // 加载模型列表
      const modelsResponse = await fetch('/api/providers?action=models');
      if (modelsResponse.ok) {
        const modelsResult = await modelsResponse.json();
        if (modelsResult.success) {
          setModels(modelsResult.data || []);
        }
      }
    } catch (error) {
      console.error('加载提供商失败:', error);
      setError('加载 AI 提供商失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理提供商变更
  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      const newModel = provider.models[0];
      onProviderChange?.(providerId, newModel);
    }
  };

  // 处理模型变更
  const handleModelChange = (model: string) => {
    onProviderChange?.(selectedProvider, model);
  };

  // 设置默认提供商
  const setDefaultProvider = async (providerId: string) => {
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-default',
          providerId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新加载提供商列表
          loadProvidersAndModels();
        }
      }
    } catch (error) {
      console.error('设置默认提供商失败:', error);
    }
  };

  // 获取提供商图标
  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'ollama':
        return <Cpu size={16} className="text-green-500" />;
      case 'openrouter':
        return <Globe size={16} className="text-blue-500" />;
      case 'openai':
        return <Zap size={16} className="text-purple-500" />;
      default:
        return <Zap size={16} className="text-gray-500" />;
    }
  };

  // 获取提供商状态
  const getProviderStatus = (provider: AIProviderConfig) => {
    if (!provider.isActive) {
      return { label: '未激活', variant: 'secondary' as const };
    }
    if (provider.isDefault) {
      return { label: '默认', variant: 'default' as const };
    }
    return { label: '可用', variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 p-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">加载提供商...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 ${className}`}>
        <span className="text-sm text-destructive">{error}</span>
        <Button variant="outline" size="sm" onClick={loadProvidersAndModels}>
          重试
        </Button>
      </div>
    );
  }

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const providerModels = currentProvider?.models || [];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 提供商选择 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">AI 提供商</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={14} className="mr-1" />
            设置
          </Button>
        </div>
        
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {currentProvider ? (
                <div className="flex items-center gap-2">
                  {getProviderIcon(currentProvider.type)}
                  <span>{currentProvider.name}</span>
                </div>
              ) : (
                '选择提供商'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => {
              const status = getProviderStatus(provider);
              return (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider.type)}
                      <span>{provider.name}</span>
                    </div>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* 模型选择 */}
      {providerModels.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">模型</label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              {providerModels.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 提供商设置面板 */}
      {showSettings && (
        <div className="p-3 border rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-3">提供商设置</h4>
          <div className="space-y-2">
            {providers.map(provider => (
              <div key={provider.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.type)}
                  <span className="text-sm">{provider.name}</span>
                  {provider.isDefault && (
                    <Badge variant="default" className="text-xs">
                      <Check size={12} className="mr-1" />
                      默认
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!provider.isDefault && provider.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultProvider(provider.id)}
                    >
                      设为默认
                    </Button>
                  )}
                  <Badge variant={provider.isActive ? 'default' : 'secondary'} className="text-xs">
                    {provider.isActive ? '已激活' : '未激活'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            <p>💡 提示：本地模型（Ollama）响应更快，云端模型功能更强</p>
          </div>
        </div>
      )}

      {/* 提供商状态摘要 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          已配置 {providers.filter(p => p.isActive).length}/{providers.length} 个提供商
        </span>
        <span>
          可用 {models.length} 个模型
        </span>
      </div>
    </div>
  );
}