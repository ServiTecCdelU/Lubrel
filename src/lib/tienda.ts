// La ficha de la app en Google Play: para actualizar y para calificarla.
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Linking } from 'react-native';

/** Qué app es (una fila en app_versiones del SaaS y el origen de las opiniones): app.json → extra.appId. */
export const APP_ID: string | undefined = Constants.expoConfig?.extra?.appId;

export async function abrirTienda(urlTienda?: string | null) {
  const id = Application.applicationId;
  // Primero la app de Play Store; si no abre, el link web.
  const intentos = [id ? `market://details?id=${id}` : null, urlTienda, id ? `https://play.google.com/store/apps/details?id=${id}` : null];
  for (const url of intentos) {
    if (!url) continue;
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // probar el siguiente
    }
  }
}
