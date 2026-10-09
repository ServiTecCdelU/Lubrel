// Respuesta táctil corta para acciones del pedido. En web no hace nada y si el celular no
// la soporta tampoco falla: nunca interrumpe la acción que la disparó.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const puede = Platform.OS !== 'web';

/** Agregar un producto al carrito. */
export function vibrarAgregado(): void {
  if (puede) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Sumar o restar una unidad. */
export function vibrarSeleccion(): void {
  if (puede) Haptics.selectionAsync().catch(() => {});
}

/** Un código leído por la cámara, un pedido enviado. */
export function vibrarExito(): void {
  if (puede) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
