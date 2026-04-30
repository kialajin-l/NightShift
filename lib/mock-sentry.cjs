// Mock @sentry/node — 错误监控 SDK，构建时不需要
module.exports = {
  init() {},
  captureException() { return 'mock-id'; },
  captureMessage() { return 'mock-id'; },
  withScope() {},
  setContext() {},
  setTag() {},
  setUser() {},
  flush() { return Promise.resolve(true); },
  close() { return Promise.resolve(); },
  Handlers: { requestHandler() { return (req, res, next) => next(); } },
};
module.exports.default = module.exports;
