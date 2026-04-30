// Mock antd-style — @lobehub/icons 的 IconAvatar 用了 useThemeMode
function useThemeMode() {
  return { isDarkMode: false, themeMode: 'light' };
}
function createStaticStyles() { return function() { return {}; }; }
function createThemeProvider() { return function() { return null; }; }
module.exports = { useThemeMode, createStaticStyles, createThemeProvider };
module.exports.default = module.exports;
