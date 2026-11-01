// Config dinámica: app.json sigue siendo la base (EAS sube su versionCode y lo leen los
// scripts). Acá solo lo que depende de archivos que pueden no estar.
//
// google-services.json (Firebase): sin él Android no entrega notificaciones push. Lo baja
// el dueño de la consola de Firebase; mientras no esté, el build sale igual, sin push.
/* global __dirname */
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  if (!fs.existsSync(path.join(__dirname, 'google-services.json'))) return config;
  return { ...config, android: { ...config.android, googleServicesFile: './google-services.json' } };
};
