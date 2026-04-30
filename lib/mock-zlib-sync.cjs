// Mock zlib-sync — discord.js 的可选依赖，构建时不需要
module.exports = class ZlibSync {
  constructor() {}
  processSync(data) { return data; }
  decompress(data) { return data; }
};
module.exports.default = module.exports;
