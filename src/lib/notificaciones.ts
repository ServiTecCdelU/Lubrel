// Notificaciones push (Expo): avisos de cambio de estado de los pedidos. El token del
// celular se guarda en el servidor (PUT /dispositivo) y se borra al cerrar sesión, para
// que el celular no siga recibiendo avisos de una cuenta que ya no usa.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/** Mismo id que usa el servidor al enviar (services/app-push-service.ts). */
const CANAL_PEDIDOS = 'pedidos';

let tokenRegistrado: string | null = null;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Datos que viajan en la notificación de un pedido. */
export interface DatosPushPedido {
  tipo: 'pedido';
  pedidoId: string;
  slug: string;
}

export function datosPedido(data: unknown): DatosPushPedido | null {
  const d = data as Partial<DatosPushPedido> | null | undefined;
  return d?.tipo === 'pedido' && typeof d.pedidoId === 'string' && typeof d.slug === 'string'
    ? { tipo: 'pedido', pedidoId: d.pedidoId, slug: d.slug }
    : null;
}

/** La distribuidora vinculó la cuenta con la ficha de siempre: cambian precios, vendedor y saldo. */
export interface DatosPushCuenta {
  tipo: 'cuenta';
  slug: string;
}

export function datosCuenta(data: unknown): DatosPushCuenta | null {
  const d = data as Partial<DatosPushCuenta> | null | undefined;
  return d?.tipo === 'cuenta' && typeof d.slug === 'string' ? { tipo: 'cuenta', slug: d.slug } : null;
}

/**
 * Pide permiso (si hace falta) y guarda el token en el servidor. Sin permiso, en web, en
 * emulador o sin conexión no hace nada: la app funciona igual sin avisos.
 */
export async function registrarDispositivo(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  // En Android 13+ el canal tiene que existir antes de pedir permiso y token.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_PEDIDOS, {
      name: 'Estado de tus pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const actual = await Notifications.getPermissionsAsync();
  const permiso = actual.granted ? actual : await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/dispositivo', { method: 'PUT', body: { token, plataforma: Platform.OS } });
  tokenRegistrado = token;
}

/**
 * Elimina la cuenta en el servidor (borra también sus celulares) y cierra la sesión en
 * este dispositivo. Si el servidor falla, la sesión sigue abierta y el error se propaga.
 */
export async function eliminarCuenta(): Promise<void> {
  await api('/me', { method: 'DELETE' });
  tokenRegistrado = null;
  // El usuario ya no existe en Auth: solo se limpia la sesión local.
  await supabase.auth.signOut({ scope: 'local' });
}

/** Cierra la sesión borrando antes el token de este celular (si falla, cierra igual). */
export async function cerrarSesion(): Promise<void> {
  if (tokenRegistrado) {
    try {
      await api('/dispositivo', { method: 'DELETE', body: { token: tokenRegistrado } });
    } catch {
      // Sin conexión: el servidor lo reasigna si el celular entra con otra cuenta.
    }
    tokenRegistrado = null;
  }
  await supabase.auth.signOut();
}
