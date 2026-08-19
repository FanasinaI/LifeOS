module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // Lets drizzle-kit's generated drizzle/migrations.js `import` .sql files as inlined strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
