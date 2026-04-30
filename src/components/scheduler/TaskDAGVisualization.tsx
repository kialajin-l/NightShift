// NightShift 任务依赖图可视化组件

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, 
  Play, Pause, CheckCircle, AlertCircle, Circle, GitBranch
} from 'lucide-react';

interface TaskNode {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  dependencies: string[];
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  actualTime?: number;
  position?: { x: number; y: number };
}

interface TaskEdge {
  from: string;
  to: string;
  type: 'hard' | 'soft';
}

interface TaskDAG {
  nodes: TaskNode[];
  edges: TaskEdge[];
  criticalPath: string[];
}

interface TaskDAGVisualizationProps {
  dag: TaskDAG;
  onTaskSelect: (task: TaskNode) => void;
  onTaskStart: (taskId: string) => void;
  onTaskStop: (taskId: string) => void;
  onTaskRetry: (taskId: string) => void;
}

export function TaskDAGVisualization({
  dag,
  onTaskSelect,
  onTaskStart,
  onTaskStop,
  onTaskRetry
}: TaskDAGVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'hierarchical' | 'force-directed'>('hierarchical');

  // 计算节点位置
  useEffect(() => {
    if (!dag.nodes.length) return;
    
    const positions = calculateNodePositions(dag.nodes, dag.edges, layout);
    const updatedNodes = dag.nodes.map(node => ({
      ...node,
      position: positions[node.id]
    }));
    
    // 更新 DAG 中的节点位置
    dag.nodes = updatedNodes;
    
    // 重新渲染
    drawDAG();
  }, [dag, layout]);

  // 绘制 DAG
  const drawDAG = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 应用缩放和平移
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 绘制边
    dag.edges.forEach(edge => {
      const fromNode = dag.nodes.find(n => n.id === edge.from);
      const toNode = dag.nodes.find(n => n.id === edge.to);
      
      if (fromNode?.position && toNode?.position) {
        drawEdge(ctx, fromNode.position, toNode.position, edge, dag.criticalPath.includes(edge.from));
      }
    });

    // 绘制节点
    dag.nodes.forEach(node => {
      if (node.position) {
        drawNode(ctx, node.position, node, selectedNode === node.id);
      }
    });

    ctx.restore();
  };

  // 绘制边
  const drawEdge = (
    ctx: CanvasRenderingContext2D, 
    from: { x: number; y: number }, 
    to: { x: number; y: number },
    edge: TaskEdge,
    isCritical: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    
    // 设置边样式
    ctx.strokeStyle = isCritical ? '#ef4444' : (edge.type === 'hard' ? '#3b82f6' : '#94a3b8');
    ctx.lineWidth = isCritical ? 3 : (edge.type === 'hard' ? 2 : 1);
    ctx.setLineDash(edge.type === 'soft' ? [5, 5] : []);
    
    ctx.stroke();
    
    // 绘制箭头
    drawArrow(ctx, from, to, isCritical ? '#ef4444' : (edge.type === 'hard' ? '#3b82f6' : '#94a3b8'));
  };

  // 绘制箭头
  const drawArrow = (
    ctx: CanvasRenderingContext2D, 
    from: { x: number; y: number }, 
    to: { x: number; y: number },
    color: string
  ) => {
    const headlen = 10;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headlen * Math.cos(angle - Math.PI / 6),
      to.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headlen * Math.cos(angle + Math.PI / 6),
      to.y - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    
    ctx.fillStyle = color;
    ctx.fill();
  };

  // 绘制节点
  const drawNode = (
    ctx: CanvasRenderingContext2D, 
    position: { x: number; y: number }, 
    node: TaskNode,
    isSelected: boolean
  ) => {
    const radius = 30;
    
    // 节点背景
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    
    // 设置节点颜色
    let fillColor = '#f3f4f6';
    let strokeColor = '#d1d5db';
    
    switch (node.status) {
      case 'running':
        fillColor = '#dbeafe';
        strokeColor = '#3b82f6';
        break;
      case 'completed':
        fillColor = '#dcfce7';
        strokeColor = '#22c55e';
        break;
      case 'failed':
        fillColor = '#fef2f2';
        strokeColor = '#ef4444';
        break;
      case 'pending':
        fillColor = '#fef3c7';
        strokeColor = '#f59e0b';
        break;
    }
    
    if (isSelected) {
      strokeColor = '#8b5cf6';
      ctx.lineWidth = 3;
    }
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.fill();
    ctx.stroke();
    
    // 绘制进度环
    if (node.status === 'running' && node.progress > 0) {
      ctx.beginPath();
      ctx.arc(position.x, position.y, radius - 2, -Math.PI / 2, -Math.PI / 2 + (node.progress / 100) * 2 * Math.PI);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // 绘制状态图标
    const icon = getStatusIcon(node.status);
    ctx.fillStyle = getStatusColor(node.status);
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, position.x, position.y - 5);
    
    // 绘制任务名称（缩写）
    const shortName = node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name;
    ctx.fillStyle = '#374151';
    ctx.font = '10px Arial';
    ctx.fillText(shortName, position.x, position.y + 15);
    
    // 绘制优先级标记
    if (node.priority === 'high') {
      ctx.beginPath();
      ctx.arc(position.x + 20, position.y - 20, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      'pending': '⏳',
      'running': '▶️',
      'completed': '✅',
      'failed': '❌'
    };
    return icons[status] || '⭕';
  };

  // 获取状态颜色
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending': '#f59e0b',
      'running': '#3b82f6',
      'completed': '#22c55e',
      'failed': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // 计算节点位置（层次布局）
  const calculateNodePositions = (
    nodes: TaskNode[], 
    edges: TaskEdge[], 
    layoutType: string
  ): Record<string, { x: number; y: number }> => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    if (layoutType === 'hierarchical') {
      // 简单的层次布局
      const levels: Record<number, string[]> = {};
      
      // 计算每个节点的层级
      nodes.forEach(node => {
        const level = calculateNodeLevel(node.id, edges, nodes);
        if (!levels[level]) levels[level] = [];
        levels[level].push(node.id);
      });
      
      // 为每个层级的节点分配位置
      Object.keys(levels).forEach(levelStr => {
        const level = parseInt(levelStr);
        const levelNodes = levels[level];
        
        levelNodes.forEach((nodeId, index) => {
          const x = 100 + index * 120;
          const y = 100 + level * 120;
          positions[nodeId] = { x, y };
        });
      });
    } else {
      // 力导向布局（简化版）
      nodes.forEach((node, index) => {
        const angle = (index / nodes.length) * 2 * Math.PI;
        const radius = 200;
        const x = 400 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);
        positions[node.id] = { x, y };
      });
    }
    
    return positions;
  };

  // 计算节点层级
  const calculateNodeLevel = (nodeId: string, edges: TaskEdge[], nodes: TaskNode[]): number => {
    const incomingEdges = edges.filter(edge => edge.to === nodeId);
    
    if (incomingEdges.length === 0) {
      return 0; // 根节点
    }
    
    const maxParentLevel = Math.max(
      ...incomingEdges.map(edge => calculateNodeLevel(edge.from, edges, nodes))
    );
    
    return maxParentLevel + 1;
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    
    drawDAG();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    setZoom(newZoom);
    drawDAG();
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // 检查是否点击了节点
    const clickedNode = dag.nodes.find(node => {
      if (!node.position) return false;
      const distance = Math.sqrt(
        Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      return distance <= 30;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      onTaskSelect(clickedNode);
    } else {
      setSelectedNode(null);
    }
  };

  // 控制函数
  const zoomIn = () => {
    const newZoom = Math.min(3, zoom * 1.2);
    setZoom(newZoom);
    drawDAG();
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.5, zoom * 0.8);
    setZoom(newZoom);
    drawDAG();
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    drawDAG();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleLayout = () => {
    setLayout(layout === 'hierarchical' ? 'force-directed' : 'hierarchical');
  };

  // 渲染统计信息
  const renderStats = () => {
    const stats = {
      total: dag.nodes.length,
      completed: dag.nodes.filter(n => n.status === 'completed').length,
      running: dag.nodes.filter(n => n.status === 'running').length,
      pending: dag.nodes.filter(n => n.status === 'pending').length,
      failed: dag.nodes.filter(n => n.status === 'failed').length,
      criticalPath: dag.criticalPath.length
    };

    return (
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h4 className="font-semibold mb-2">任务统计</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>总任务数: {stats.total}</div>
          <div>已完成: {stats.completed}</div>
          <div>运行中: {stats.running}</div>
          <div>待处理: {stats.pending}</div>
          <div>失败: {stats.failed}</div>
          <div>关键路径: {stats.criticalPath}</div>
        </div>
      </div>
    );
  };

  // 渲染图例
  const renderLegend = () => (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h4 className="font-semibold mb-2">图例</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
          <span>待处理</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
          <span>运行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
          <span>失败</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-red-500"></div>
          <span>关键路径</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-blue-500"></div>
          <span>硬依赖</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-gray-400 border-dashed"></div>
          <span>软依赖</span>
        </div>
      </div>
    </div>
  );

  if (dag.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">暂无任务依赖图</h3>
          <p className="text-gray-500">任务分解后，依赖图将显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full relative bg-gray-50 rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* 控制栏 */}
      <div className="absolute top-4 right-4 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg z-10">
        <Button size="sm" variant="outline" onClick={zoomIn} title="放大">
          <ZoomIn size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={zoomOut} title="缩小">
          <ZoomOut size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={resetView} title="重置视图">
          <RotateCcw size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={toggleLayout} title="切换布局">
          {layout === 'hierarchical' ? '力导向' : '层次'}
        </Button>
        <Button size="sm" variant="outline" onClick={toggleFullscreen} title="全屏">
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      {/* 画布容器 */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      >
        <canvas 
          ref={canvasRef}
          className="cursor-move"
        />
      </div>

      {/* 统计信息和图例 */}
      {renderStats()}
      {renderLegend()}

      {/* 选中的节点信息 */}
      {selectedNode && (
        <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm">
          <h4 className="font-semibold mb-2">节点信息</h4>
          {(() => {
            const node = dag.nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            return (
              <div className="space-y-2 text-sm">
                <div><strong>名称:</strong> {node.name}</div>
                <div><strong>状态:</strong> {node.status}</div>
                <div><strong>进度:</strong> {node.progress}%</div>
                <div><strong>优先级:</strong> {node.priority}</div>
                <div><strong>Agent:</strong> {node.assignedAgent}</div>
                {node.estimatedTime && (
                  <div><strong>预计时间:</strong> {node.estimatedTime}分钟</div>
                )}
                <div className="flex gap-2 mt-2">
                  {node.status === 'pending' && (
                    <Button size="sm" onClick={() => onTaskStart(node.id)}>
                      <Play size={14} />
                      开始
                    </Button>
                  )}
                  {node.status === 'running' && (
                    <Button size="sm" variant="outline" onClick={() => onTaskStop(node.id)}>
                      <Pause size={14} />
                      停止
                    </Button>
                  )}
                  {node.status === 'failed' && (
                    <Button size="sm" variant="outline" onClick={() => onTaskRetry(node.id)}>
                      <RotateCcw size={14} />
                      重试
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}