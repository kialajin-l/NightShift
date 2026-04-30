// Mock @larksuiteoapi/node-sdk — 飞书 SDK，构建时不需要
class Client {
  constructor() {}
  request() { return Promise.resolve({}); }
}
module.exports = { Client };
module.exports.default = module.exports;
