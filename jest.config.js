module.exports = {
  transform: { '\\.ts$': ['ts-jest'] },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transformIgnorePatterns: ['/node_modules/'],
};
