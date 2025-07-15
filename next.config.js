// next.config.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { i18n } = require('./next-i18next.config');

module.exports = {
  images: {
    domains: ['i.ytimg.com'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  i18n, // Adiciona suporte a internacionalização
};
