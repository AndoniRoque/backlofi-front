module.exports = {
  webpack: (config) => {
    config.cache = false; // Desactiva la caché para evitar serialización innecesaria
    return config;
  },
};
