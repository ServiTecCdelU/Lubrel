// Ubicación del comercio por GPS, para elegir su localidad sin escribirla. expo-location
// entra recién en el binario siguiente (AAB 30): en una instalación vieja que reciba esta
// versión por actualización automática el módulo nativo no está, y el botón no se muestra.
import { requireOptionalNativeModule } from 'expo';
import type { CiudadApp } from '@/lib/tipos';

export const gpsDisponible = (): boolean => requireOptionalNativeModule('ExpoLocation') !== null;

export type ResultadoUbicacion = { ok: true; lat: number; lng: number } | { ok: false; error: string };

export async function obtenerUbicacion(): Promise<ResultadoUbicacion> {
  // require diferido: importarlo arriba rompería la app en un binario sin el módulo.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location') as typeof import('expo-location');
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (permiso.status !== 'granted') return { ok: false, error: 'Sin permiso de ubicación. Elegí tu localidad de la lista.' };
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { ok: true, lat: p.coords.latitude, lng: p.coords.longitude };
  } catch {
    return { ok: false, error: 'No pudimos obtener tu ubicación. Revisá que el GPS esté prendido.' };
  }
}

/** Km entre dos puntos (haversine). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** La localidad habilitada más cercana, si queda a menos de `maxKm` (si no, está fuera de la zona de entrega). */
export function ciudadMasCercana(ciudades: CiudadApp[], lat: number, lng: number, maxKm = 15): CiudadApp | null {
  let mejor: CiudadApp | null = null;
  let menor = Infinity;
  for (const c of ciudades) {
    if (c.lat == null || c.lon == null) continue;
    const d = distanciaKm(lat, lng, c.lat, c.lon);
    if (d < menor) {
      menor = d;
      mejor = c;
    }
  }
  return menor <= maxKm ? mejor : null;
}
