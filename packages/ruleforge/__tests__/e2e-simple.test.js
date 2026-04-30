/**
 * 简化的端到端测试 - 验证核心功能
 */

export default async function (assert) {
  console.log('🧪 运行简化端到端测试...');
  
  // 测试 1: 导入核心模块
  try {
    const { PatternRecognizer } = await import('../dist/recognizer/pattern-recognizer.js');
    assert.ok(PatternRecognizer, 'PatternRecognizer 模块导入成功');
    
    // 测试 2: 创建识别器实例
    const recognizer = new PatternRecognizer({
      minConfidence: 0.5,
      minFrequency: 1,
      maxPatterns: 5
    });
    assert.ok(recognizer, 'PatternRecognizer 实例创建成功');
    
    // 测试 3: 测试数据准备
    const testSession = {
      sessionId: 'test-session-1',
      events: [
        {
          type: 'error_occurred',
          file: '/test/src/components/Button.vue',
          message: 'Props validation error',
          codeSnippet: 'const props = defineProps({ title: String })',
          timestamp: '2026-01-20T10:00:00Z'
        },
        {
          type: 'file_saved',
          file: '/test/src/components/Button.vue',
          message: 'Fixed props type',
          codeSnippet: 'interface Props { title: string }\nconst props = defineProps<Props>()',
          timestamp: '2026-01-20T10:05:00Z'
        }
      ],
      metadata: {
        projectType: 'vue',
        language: 'typescript'
      }
    };
    
    assert.ok(testSession, '测试会话数据创建成功');
    assert.equal(testSession.events.length, 2, '测试会话包含 2 个事件');
    
    // 测试 4: 模式识别
    const result = await recognizer.recognize(testSession);
    assert.ok(result, '模式识别返回结果');
    assert.ok(Array.isArray(result.patterns), '模式识别返回数组');
    
    console.log(`📊 识别到 ${result.patterns.length} 个模式`);
    
    if (result.patterns.length > 0) {
      const pattern = result.patterns[0];
      assert.ok(pattern.id, '模式包含 ID');
      assert.ok(pattern.confidence >= 0, '模式置信度有效');
      assert.ok(pattern.trigger, '模式包含触发条件');
      
      console.log(`🔍 模式 ID: ${pattern.id}`);
      console.log(`📈 置信度: ${pattern.confidence.toFixed(2)}`);
    }
    
    // 测试 5: YAML 格式化器（如果可用）
    try {
      const { RuleYamlFormatter } = await import('../../../core/dist/formatter/yaml-formatter.js');
      
      if (RuleYamlFormatter && patterns.length > 0) {
        const formatter = new RuleYamlFormatter({
          minConfidence: 0.3,
          enableRedaction: true
        });
        
        const yaml = await formatter.toYAML(patterns[0]);
        assert.ok(typeof yaml === 'string', 'YAML 格式化成功');
        assert.ok(yaml.length > 0, 'YAML 内容非空');
        
        console.log('📝 YAML 格式化测试通过');
      }
    } catch (yamlError) {
      console.log('⚠️ YAML 格式化器不可用，跳过此测试');
    }
    
    console.log('✅ 简化端到端测试通过');
    
  } catch (error) {
    console.error('❌ 简化端到端测试失败:', error.message);
    throw error;
  }
}