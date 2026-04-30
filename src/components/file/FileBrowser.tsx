// 文件浏览器组件 - 集成 CodePilot 文件操作功能

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, File, ChevronRight, ChevronDown, Plus, Upload, Trash2, Edit } from 'lucide-react';
import { DirectoryInfo, FileInfo } from '@/types';

interface FileBrowserProps {
  initialPath?: string;
  onFileSelect?: (file: FileInfo) => void;
  onFileEdit?: (file: FileInfo) => void;
}

export function FileBrowser({ initialPath = '/', onFileSelect, onFileEdit }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [directoryInfo, setDirectoryInfo] = useState<DirectoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // 加载目录内容
  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}&action=list`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setDirectoryInfo(result.data);
          setCurrentPath(path);
        } else {
          setError(result.error || '加载目录失败');
        }
      } else {
        setError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('加载目录失败:', error);
      setError('网络错误，无法加载目录');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  // 切换目录展开状态
  const toggleDirectory = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  // 导航到目录
  const navigateToDirectory = (dirPath: string) => {
    loadDirectory(dirPath);
  };

  // 创建新文件
  const createNewFile = async (fileName: string) => {
    try {
      const filePath = `${currentPath}/${fileName}`;
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: '// 新文件内容\n',
          action: 'write'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新加载当前目录
          loadDirectory(currentPath);
        } else {
          setError(result.error || '创建文件失败');
        }
      }
    } catch (error) {
      console.error('创建文件失败:', error);
      setError('创建文件失败');
    }
  };

  // 删除文件或目录
  const deletePath = async (path: string) => {
    if (!confirm(`确定要删除 ${path} 吗？`)) return;

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新加载当前目录
          loadDirectory(currentPath);
        } else {
          setError(result.error || '删除失败');
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
      setError('删除失败');
    }
  };

  // 渲染文件树
  const renderFileTree = (files: FileInfo[], level = 0) => {
    return files.map((file) => (
      <div key={file.path} className="w-full">
        <div 
          className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
          onClick={() => {
            if (file.type === 'directory') {
              toggleDirectory(file.path);
            } else {
              onFileSelect?.(file);
            }
          }}
        >
          {file.type === 'directory' ? (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDirectory(file.path);
                }}
                className="p-1 hover:bg-background rounded"
              >
                {expandedDirs.has(file.path) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              <Folder size={16} className="text-blue-500" />
              <span className="flex-1 truncate">{file.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToDirectory(file.path);
                  }}
                >
                  打开
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePath(file.path);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-6" /> {/* 占位对齐 */}
              <File size={16} className="text-gray-500" />
              <span className="flex-1 truncate">{file.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileEdit?.(file);
                  }}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePath(file.path);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </>
          )}
        </div>
        
        {/* 递归渲染子目录 */}
        {file.type === 'directory' && expandedDirs.has(file.path) && (
          <div className="border-l border-accent ml-3">
            {renderFileTree([
              {
                name: 'example.txt',
                path: `${file.path}/example.txt`,
                type: 'file',
                size: 1024,
                modifiedAt: new Date()
              }
            ], level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col border rounded-lg bg-background">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">文件浏览器</h3>
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {currentPath}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => createNewFile(`new-file-${Date.now()}.txt`)}
          >
            <Plus size={14} className="mr-1" />
            新建文件
          </Button>
          <Button variant="outline" size="sm">
            <Upload size={14} className="mr-1" />
            上传
          </Button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : directoryInfo ? (
          <div className="space-y-1">
            {/* 上级目录导航 */}
            {currentPath !== '/' && (
              <div 
                className="flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer"
                onClick={() => {
                  const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
                  navigateToDirectory(parentPath);
                }}
              >
                <ChevronRight size={14} className="rotate-180" />
                <Folder size={16} className="text-blue-500" />
                <span className="text-muted-foreground">..</span>
              </div>
            )}
            
            {/* 目录内容 */}
            {renderFileTree([
              ...(directoryInfo.directories || []),
              ...(directoryInfo.files || [])
            ])}
          </div>
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            无法加载目录内容
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="p-2 border-t text-xs text-muted-foreground">
        {directoryInfo && (
          <>
            目录: {directoryInfo.directories?.length || 0} 个, 
            文件: {directoryInfo.files?.length || 0} 个
          </>
        )}
      </div>
    </div>
  );
}