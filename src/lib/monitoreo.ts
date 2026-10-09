// Reporte de errores y caídas (Sentry). Sin EXPO_PUBLIC_SENTRY_DSN queda apagado: la app
// funciona igual y no manda nada. Se importa primero que todo en src/app/_layout.tsx.
// Qué se manda: el error, la pantalla, la versión y el id de la actualización OTA. Como
// usuario se identifica solo el id de Auth (no nombre, mail ni teléfono).
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import * as Updates from 'expo-updates';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Rutas de expo-router: se registra el contenedor de navegación en el layout raíz. */
export const navegacionSentry = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn,
  enabled: !!dsn && !__DEV__,
  environment: __DEV__ ? 'desarrollo' : 'produccion',
  // Sin datos personales por defecto (IP, cookies): el id de usuario se setea aparte.
  sendDefaultPii: false,
  // Trazas de navegación y de red en una de cada cinco sesiones: alcanza para ver lentitud.
  tracesSampleRate: 0.2,
  integrations: [navegacionSentry],
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

const scope = Sentry.getGlobalScope();
scope.setTag('ota.updateId', Updates.updateId ?? 'embebida');
scope.setTag('ota.channel', Updates.channel ?? 'ninguno');

/** Usuario de la sesión (solo el id de Auth) para agrupar errores por cuenta. */
export function monitorearUsuario(id: string | null): void {
  Sentry.setUser(id ? { id } : null);
}

/** Distribuidora activa: así se ve si un error pasa solo con un tenant. */
export function monitorearDistribuidora(slug: string | null): void {
  Sentry.setTag('distribuidora', slug ?? 'ninguna');
}

/** Error manejado que igual conviene saber (p. ej. la API devolvió 5xx). */
export function reportarError(error: unknown, extra?: Record<string, unknown>): void {
  Sentry.captureException(error, extra ? { extra } : undefined);
}

export const envolverApp = Sentry.wrap;
