import { PatternTemplate } from '../../types/pattern.js';

/**
 * Vue.js 相关模式模板
 */
export const vuePatterns: PatternTemplate[] = [
  {
    id: 'vue-props-validation',
    category: 'error_fix',
    keywords: ['defineProps', 'PropType', 'withDefaults', 'interface Props', 'type Props'],
    filePattern: '**/*.vue',
    condition: (events) => {
      // 检查是否有 props 相关的错误修复
      const errorEvents = events.filter(e => 
        e.type === 'error_occurred' && 
        e.message?.includes('props')
      );
      
      const fixEvents = events.filter(e => 
        e.type === 'file_saved' && 
        e.content?.includes('defineProps')
      );
      
      return errorEvents.length >= 1 && fixEvents.length >= 2;
    },
    minConfidence: 0.7,
    solution: {
      description: 'Vue 3 组件 props 类型验证模式',
      codeExample: {
        before: `// 问题代码
const props = defineProps({
  title: String
})`,
        after: `// 解决方案
import type { PropType } from 'vue'

const props = defineProps({
  title: {
    type: String as PropType<string>,
    required: true
  }
})`,
        language: 'vue'
      }
    }
  },
  {
    id: 'vue-composition-setup',
    category: 'code_style',
    keywords: ['<script setup>', 'ref', 'reactive', 'computed', 'watch'],
    filePattern: '**/*.vue',
    condition: (events) => {
      // 检查是否有多个文件使用组合式 API
      const setupFiles = events.filter(e => 
        e.type === 'file_saved' && 
        e.content?.includes('<script setup>')
      );
      
      const compositionEvents = events.filter(e => 
        e.type === 'file_saved' && 
        (e.content?.includes('ref(') || e.content?.includes('reactive('))
      );
      
      return setupFiles.length >= 3 && compositionEvents.length >= 5;
    },
    minConfidence: 0.8,
    solution: {
      description: 'Vue 3 组合式 API 使用模式',
      codeExample: {
        before: `// 选项式 API
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}`,
        after: `// 组合式 API
<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
</script>`,
        language: 'vue'
      }
    }
  },
  {
    id: 'vue-router-navigation',
    category: 'api_design',
    keywords: ['router.push', 'router.replace', 'useRouter', 'useRoute'],
    filePattern: '**/*.vue',
    condition: (events) => {
      // 检查路由导航相关事件
      const routerEvents = events.filter(e => 
        e.type === 'file_saved' && 
        (e.content?.includes('router.push') || e.content?.includes('useRouter'))
      );
      
      return routerEvents.length >= 2;
    },
    minConfidence: 0.6,
    solution: {
      description: 'Vue Router 导航模式',
      codeExample: {
        before: `// 硬编码导航
window.location.href = '/home'`,
        after: `// 使用 Vue Router
import { useRouter } from 'vue-router'

const router = useRouter()
router.push('/home')`,
        language: 'vue'
      }
    }
  }
];