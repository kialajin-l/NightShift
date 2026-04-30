// Mock @lobehub/ui — 只提供项目实际用到的 Center 组件
const React = require('react');
function Center({ children, style, ...rest }) {
  return React.createElement('div', { style, ...rest }, children);
}
module.exports = { Center };
module.exports.default = module.exports;
