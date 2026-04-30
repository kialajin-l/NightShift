/**
 * YAML 格式化器使用示例
 */

import { RuleYamlFormatter } from '../src/formatter/yaml-formatter.js';
import { Pattern } from '../src/types/rep-rule.js';

/**
 * 演示 YAML 格式化器的使用
 */
async function demonstrateYamlFormatter() {
  console.log('🧪 RuleForge YAML 格式化器演示\n');

  // 创建示例模式
  const samplePattern: Pattern = {
    id: 'vue-props-validation-advanced',
    category: 'code_style',
    trigger: {
      keywords: ['props', 'validation', 'required', 'type', 'default'],
      filePattern: '**/*.vue',
      frequency: 8,
    },
    solution: {
      description: 'Vue 3 组件 props 验证最佳实践。确保所有 props 都有明确的类型定义、验证规则和默认值。',
      codeExample: {
        before: `export default {
  props: ['title', 'count', 'disabled']
}`,
        after: `export default {
  props: {
    title: {
      type: String,
      required: true,
      validator: (value) => value.length > 0
    },
    count: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
}`,
        language: 'javascript',
      },
    },
    confidence: 0.92,
    applicableScenes: 5,
    evidence: [
      '使用数组形式定义 props 缺少类型安全',
      '缺少 required 标记导致运行时错误',
      '缺少默认值增加代码复杂度',
      '缺少验证器无法保证数据质量',
    ],
    sessions: [
      {
        type: 'error_occurred',
        file: 'src/components/UserProfile.vue',
        content: 'props: [\'username\', \'age\', \'email\']',
        message: 'Props 验证错误: username 为 undefined',
        timestamp: '2024-01-15T14:30:00Z',
        codeSnippet: 'props: [\'username\', \'age\', \'email\']',
      },
      {
        type: 'file_saved',
        file: 'src/components/UserProfile.vue',
        content: `props: {
  username: {
    type: String,
    required: true,
    validator: (value) => value.length >= 3
  },
  age: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 150
  },
  email: {
    type: String,
    required: true,
    validator: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)
  }
}`,
        message: '修复 props 验证规则',
        timestamp: '2024-01-15T14:35:00Z',
        changes: ['fix', 'validation', 'types'],
        codeSnippet: `props: {
  username: {
    type: String,
    required: true,
    validator: (value) => value.length >= 3
  },
  age: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 150
  },
  email: {
    type: String,
    required: true,
    validator: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)
  }
}`,
      },
    ],
    explanation: 'Vue 3 推荐使用对象形式定义 props，提供完整的类型验证、必填标记和默认值设置，提高代码健壮性。',
    language: 'javascript',
  };

  console.log('1. 使用默认配置生成 YAML\n');
  
  try {
    const defaultFormatter = new RuleYamlFormatter();
    const yaml1 = await defaultFormatter.toYAML(samplePattern);
    
    console.log('✅ 默认配置生成成功');
    console.log('YAML 长度:', yaml1.length, '字符');
    console.log('包含关键字段:', 
      yaml1.includes('meta:') && yaml1.includes('rule:') && yaml1.includes('compatibility:')
    );
    
    // 显示部分 YAML 内容
    const lines = yaml1.split('\n').slice(0, 15);
    console.log('\n前15行预览:');
    console.log(lines.join('\n'));
    console.log('...\n');

  } catch (error) {
    console.error('❌ 默认配置生成失败:', error);
  }

  console.log('2. 使用自定义配置生成 YAML\n');
  
  try {
    const customFormatter = new RuleYamlFormatter({
      minConfidence: 0.8,
      enableRedaction: true,
      codeExampleMaxLines: 10,
      includeTimestamps: true,
    });
    
    const yaml2 = await customFormatter.toYAML(samplePattern);
    
    console.log('✅ 自定义配置生成成功');
    console.log('YAML 长度:', yaml2.length, '字符');
    console.log('包含时间戳:', yaml2.includes('created_at:'));
    
  } catch (error) {
    console.error('❌ 自定义配置生成失败:', error);
  }

  console.log('3. 测试敏感信息脱敏\n');
  
  try {
    const patternWithSensitiveInfo: Pattern = {
      ...samplePattern,
      id: 'sensitive-info-test',
      solution: {
        ...samplePattern.solution,
        description: `包含敏感信息的示例:
API 密钥: sk-abcdefghijklmnopqrstuvwxyz123456
GitHub Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz
文件路径: C:\\Users\\john\\project\\src\\config.js
邮箱: john.doe@example.com
数据库连接: postgresql://user:password@localhost:5432/db`,
      },
    };
    
    const formatter = new RuleYamlFormatter({ enableRedaction: true });
    const yaml3 = await formatter.toYAML(patternWithSensitiveInfo);
    
    console.log('✅ 敏感信息脱敏成功');
    console.log('原始包含敏感信息: true');
    console.log('脱敏后包含占位符:', 
      yaml3.includes('{api_key}') && 
      yaml3.includes('{github_token}') && 
      yaml3.includes('{user_path}') && 
      yaml3.includes('{email}')
    );
    
  } catch (error) {
    console.error('❌ 敏感信息脱敏失败:', error);
  }

  console.log('4. 测试错误处理\n');
  
  try {
    const invalidPattern: Pattern = {
      ...samplePattern,
      id: '', // 无效 ID
      trigger: {
        ...samplePattern.trigger,
        keywords: [], // 空关键词
      },
      confidence: 0.5, // 低置信度
    };
    
    const strictFormatter = new RuleYamlFormatter({ minConfidence: 0.9 });
    await strictFormatter.toYAML(invalidPattern);
    
    console.log('❌ 错误处理测试失败 - 应该抛出异常');
    
  } catch (error) {
    console.log('✅ 错误处理正常 - 正确抛出异常');
    console.log('错误信息:', (error as Error).message);
  }

  console.log('\n🎉 YAML 格式化器演示完成！');
  console.log('\n📊 功能总结:');
  console.log('   ✅ REP v0.1 Schema 验证');
  console.log('   ✅ 敏感信息自动脱敏');
  console.log('   ✅ 代码示例智能生成');
  console.log('   ✅ YAML 格式化与转义');
  console.log('   ✅ 自定义验证器支持');
  console.log('   ✅ 完整的错误处理');
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateYamlFormatter().catch(console.error);
}