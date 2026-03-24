module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '6.0.6', // Choose your preferred MongoDB version
      skipMD5: true,
    },
    autoStart: false,
    instance: {},
  },
};