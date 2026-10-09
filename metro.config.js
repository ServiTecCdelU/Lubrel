// Metro con el plugin de Sentry: genera los source maps que se suben en el build de EAS
// (si hay SENTRY_AUTH_TOKEN) para que los errores lleguen con el código legible.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
