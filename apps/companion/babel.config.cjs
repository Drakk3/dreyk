module.exports = function companionBabelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
