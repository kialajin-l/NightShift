// Mock antd — antd-style 的 peerDep，项目不直接使用 antd 组件
const React = require('react');

// 返回空 token 对象，让 antd-style 的 cssVar 生成不报错
const emptyToken = {};

module.exports = {
  Button: React.forwardRef((p, r) => React.createElement('button', { ...p, ref: r })),
  ConfigProvider: ({ children }) => children,
  theme: {
    useToken: () => ({ token: emptyToken, theme: {} }),
    getDesignToken: () => emptyToken,
  },
};
module.exports.default = module.exports;
