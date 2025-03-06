module.exports = {
  webpack: (config: { cache: boolean }) => {
    config.cache = false; // Desactiva la caché para evitar serialización innecesaria
    return config;
  },
};
