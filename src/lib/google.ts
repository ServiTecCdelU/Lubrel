// Ingreso con Google vía Supabase. En Android, con EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, aparece la
// ventanita del sistema para elegir la cuenta (@react-native-google-signin) y el id token se canjea
// con signInWithIdToken, sin salir de la app. Sin la variable, en web o si la librería falla, se usa
// el camino de siempre (PKCE): en el celular abre el navegador del sistema y vuelve por
// servitecpedidos://auth/callback; en web redirige la página completa y vuelve a /auth/callback,
// que canjea el código (ver src/app/auth/callback.tsx).
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export const RUTA_CALLBACK = 'auth/callback';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export async function canjearCodigoDeUrl(url: string): Promise<void> {
  const params = new URL(url).searchParams;
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error(error);
  const code = params.get('code');
  if (!code) throw new Error('Google no devolvió el código de ingreso.');
  const { error: e } = await supabase.auth.exchangeCodeForSession(code);
  if (e) throw e;
}

type ResultadoNativo = 'ok' | 'cancelado' | 'no-disponible';

/** Selector de cuentas de Android. 'no-disponible' = seguir por el navegador. */
async function ingresarNativo(): Promise<ResultadoNativo> {
  if (Platform.OS !== 'android' || !WEB_CLIENT_ID) return 'no-disponible';
  let lib: typeof import('@react-native-google-signin/google-signin');
  try {
    // Se carga recién acá: en web (y en un build sin el módulo nativo) no existe.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    lib = require('@react-native-google-signin/google-signin');
  } catch {
    return 'no-disponible';
  }
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = lib;
  try {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sin esto, después de cerrar sesión entra directo con la última cuenta en vez de preguntar.
    await GoogleSignin.signOut().catch(() => {});
    const r = await GoogleSignin.signIn();
    if (isCancelledResponse(r)) return 'cancelado';
    const token = r.data.idToken;
    if (!token) return 'no-disponible';
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
    if (error) throw error;
    return 'ok';
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) return 'cancelado';
      // Sin Play Services o con el cliente de Android mal configurado: por el navegador.
      return 'no-disponible';
    }
    throw e;
  }
}

/** Devuelve false si la persona cerró la ventana de Google sin ingresar. */
export async function ingresarConGoogle(): Promise<boolean> {
  const nativo = await ingresarNativo();
  if (nativo === 'ok') return true;
  if (nativo === 'cancelado') return false;

  const redirectTo = Linking.createURL(RUTA_CALLBACK);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) throw error;
  if (Platform.OS === 'web') return true;

  const r = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (r.type !== 'success') return false;
  await canjearCodigoDeUrl(r.url);
  return true;
}
