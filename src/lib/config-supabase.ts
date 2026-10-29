// A qué proyecto de Supabase se conecta la app (solo para el login: los datos van por la API).
// Lo decide el servidor (GET /api/app/v1/config), así una mudanza de la base no necesita una
// versión nueva de la app. Reglas puras, sin red ni almacenamiento (tests al lado).

export interface ConfigSupabase {
  url: string;
  key: string;
}

/** Clave del almacenamiento del celular donde queda la última configuración del servidor. */
export const CLAVE_CONFIG = 'config_supabase';

export function configValida(x: unknown): x is ConfigSupabase {
  if (!x || typeof x !== 'object') return false;
  const { url, key } = x as Record<string, unknown>;
  return typeof url === 'string' && /^https:\/\/[^\s/]+\/?$/.test(url) && typeof key === 'string' && key.length >= 20;
}

/** La guardada (última que mandó el servidor) si es válida; si no, la que vino con el build. */
export function elegirConfig(guardada: unknown, build: ConfigSupabase): ConfigSupabase {
  return configValida(guardada) ? { url: guardada.url, key: guardada.key } : build;
}

/** Lee lo guardado en el celular (JSON); null si no hay o está roto. */
export function leerGuardada(texto: string | null): unknown {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Respuesta de /api/app/v1/config ({ data: { supabaseUrl, supabaseKey } }) → config, o null. */
export function configDeRespuesta(json: unknown): ConfigSupabase | null {
  const data = (json as { data?: { supabaseUrl?: unknown; supabaseKey?: unknown } } | null)?.data;
  const config = { url: data?.supabaseUrl, key: data?.supabaseKey };
  return configValida(config) ? config : null;
}

/** ¿El servidor manda a otro proyecto que el que está usando la app? */
export const cambioDeProyecto = (actual: ConfigSupabase, remota: ConfigSupabase): boolean =>
  actual.url.replace(/\/$/, '') !== remota.url.replace(/\/$/, '') || actual.key !== remota.key;
