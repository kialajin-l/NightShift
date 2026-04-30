/**
 * 基础功能测试 - 使用原生 Node.js 测试运行器
 */

export default function (assert) {
  console.log('🧪 运行基础功能测试...');
  
  // 测试 1: 基本断言
  assert.equal(1 + 1, 2, '基本数学运算');
  
  // 测试 2: 类型检查
  assert.ok(typeof 'hello' === 'string', '字符串类型检查');
  
  // 测试 3: 数组操作
  const arr = [1, 2, 3];
  assert.equal(arr.length, 3, '数组长度检查');
  
  // 测试 4: 对象操作
  const obj = { name: 'test', value: 42 };
  assert.equal(obj.name, 'test', '对象属性检查');
  
  // 测试 5: 错误抛出
  assert.throws(() => {
    throw new Error('测试错误');
  }, '错误抛出检查');
  
  // 测试 6: 异步操作模拟
  const promise = Promise.resolve('success');
  assert.ok(promise instanceof Promise, 'Promise 检查');
  
  console.log('✅ 基础功能测试通过');
}