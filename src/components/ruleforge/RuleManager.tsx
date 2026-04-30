// RuleForge 规则管理界面

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, BarChart3, Filter, Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react';

interface Rule {
  id: string;
  category: 'code_style' | 'error_fix' | 'test_pattern' | 'api_design';
  trigger: {
    keywords: string[];
    filePattern: string;
    frequency: number;
  };
  solution: {
    description: string;
    codeExample?: {
      before: string;
      after: string;
      language: string;
    };
  };
  confidence: number;
  applicableScenes: number;
  evidence: string[];
}

interface RuleStats {
  totalSessions: number;
  totalRules: number;
  rulesByCategory: {
    code_style: number;
    error_fix: number;
    test_pattern: number;
    api_design: number;
  };
  averageConfidence: number;
  highConfidenceRules: number;
}

export function RuleManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<RuleStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [showCodeExamples, setShowCodeExamples] = useState(false);

  // 加载规则数据
  useEffect(() => {
    loadRules();
    loadStats();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ruleforge/extract?action=high-confidence');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRules(result.data || []);
        }
      }
    } catch (error) {
      console.error('加载规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ruleforge/extract?action=stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 提取所有会话的规则
  const extractAllRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ruleforge/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch' })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新加载规则
          await loadRules();
          await loadStats();
        }
      }
    } catch (error) {
      console.error('批量提取规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤规则
  const filteredRules = rules.filter(rule => {
    if (filterCategory !== 'all' && rule.category !== filterCategory) {
      return false;
    }
    if (rule.confidence < minConfidence) {
      return false;
    }
    return true;
  });

  // 获取类别显示名称
  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      'code_style': '代码风格',
      'error_fix': '错误修复',
      'test_pattern': '测试模式',
      'api_design': 'API设计'
    };
    return names[category] || category;
  };

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'code_style': 'bg-blue-100 text-blue-800 border-blue-200',
      'error_fix': 'bg-red-100 text-red-800 border-red-200',
      'test_pattern': 'bg-green-100 text-green-800 border-green-200',
      'api_design': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 导出规则
  const exportRules = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalRules: rules.length,
      rules: rules
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nightshift-rules-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 清空规则
  const clearRules = () => {
    setRules([]);
    setStats(null);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">RuleForge 规则管理器</h1>
            <p className="text-sm text-muted-foreground">智能代码模式识别与管理</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={extractAllRules}
              disabled={isLoading}
            >
              <Wand2 size={16} className="mr-2" />
              {isLoading ? '提取中...' : '批量提取'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportRules}>
              <Download size={16} className="mr-2" />
              导出规则
            </Button>
            <Button variant="outline" size="sm" onClick={clearRules}>
              <Trash2 size={16} className="mr-2" />
              清空
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="mt-4 grid grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
              <div className="text-sm text-blue-600">总会话数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalRules}</div>
              <div className="text-sm text-green-600">总规则数</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600">平均置信度</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.highConfidenceRules}</div>
              <div className="text-sm text-orange-600">高置信度</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(stats.rulesByCategory).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600">类别总数</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="text-sm font-medium">筛选条件:</span>
          </div>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">所有类别</option>
            <option value="code_style">代码风格</option>
            <option value="error_fix">错误修复</option>
            <option value="test_pattern">测试模式</option>
            <option value="api_design">API设计</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm">最小置信度:</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm w-12">{(minConfidence * 100).toFixed(0)}%</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCodeExamples(!showCodeExamples)}
          >
            {showCodeExamples ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showCodeExamples ? '隐藏代码' : '显示代码'}</span>
          </Button>

          <div className="text-sm text-muted-foreground">
            显示 {filteredRules.length} / {rules.length} 个规则
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载规则中...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <Wand2 size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无规则</h3>
            <p className="text-muted-foreground mb-4">
              {rules.length === 0 
                ? '点击"批量提取"按钮从会话中提取规则' 
                : '当前筛选条件下没有匹配的规则'}
            </p>
            {rules.length === 0 && (
              <Button onClick={extractAllRules}>
                <Wand2 size={16} className="mr-2" />
                开始提取规则
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(rule.category)}>
                        {getCategoryDisplayName(rule.category)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        置信度: {(rule.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="font-medium">{rule.solution.description}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">触发关键词:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rule.trigger.keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">文件模式:</span>
                    <div className="mt-1 text-muted-foreground">{rule.trigger.filePattern}</div>
                  </div>
                </div>

                {showCodeExamples && rule.solution.codeExample && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-sm mb-2">修改前:</div>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {rule.solution.codeExample.before}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-2">修改后:</div>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {rule.solution.codeExample.after}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {rule.evidence.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">证据:</span>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      {rule.evidence.slice(0, 3).map((evidence, index) => (
                        <li key={index}>• {evidence}</li>
                      ))}
                      {rule.evidence.length > 3 && (
                        <li>... 还有 {rule.evidence.length - 3} 个证据</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}