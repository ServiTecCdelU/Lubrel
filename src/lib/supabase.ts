// Cliente de Supabase SOLO para Auth (login por OTP). Los datos van siempre por la
// API del SaaS (/api/app/v1): la app nunca lee tablas directo.
// Setup según https://docs.expo.dev/guides/using-supabase (SDK 57).
//
// A qué proyecto se conecta lo decide el servidor (ver config-supabase.ts): al abrir se usa la
// última configuración recibida (o la del build) y en segundo plano se pregunta de nuevo. Si
// cambió (mudanza de la base), se guarda y la app se reinicia con la nueva.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';
import { almacen } from '@/lib/almacen';
import {
  CLAVE_CONFIG,
  cambioDeProyecto,
  configDeRespuesta,
  elegirConfig,
  leerGuardada,
  type ConfigSupabase,
} from '@/lib/config-supabase';
import { env } from '@/lib/env';

const BUILD: ConfigSupabase = { url: env.supabaseUrl, key: env.supabaseKey };
const TIMEOUT_CONFIG_MS = 8_000;

let cliente: SupabaseClient | null = null;
let configActual: ConfigSupabase = BUILD;

const crear = (config: ConfigSupabase) =>
  createClient(config.url, config.key, {
    auth: {
      storage: almacen,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });

/** Crea el cliente con la última configuración guardada. Va antes de montar la sesión. */
export async function iniciarSupabase(): Promise<void> {
  let guardada: unknown = null;
  try {
    guardada = leerGuardada(await almacen.getItem(CLAVE_CONFIG));
  } catch {
    // sin almacenamiento: la del build
  }
  configActual = elegirConfig(guardada, BUILD);
  cliente = crear(configActual);
  void revisarConfigRemota();
}

/**
 * Pregunta al servidor a qué proyecto conectarse. Si es otro, lo guarda y reinicia la app
 * (la sesión del proyecto viejo no sirve en el nuevo: el usuario vuelve a ingresar).
 * Sin red o con una respuesta rara, no hace nada: sigue con la que tiene.
 */
export async function revisarConfigRemota(): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_CONFIG_MS);
  try {
    const res = await fetch(`${env.apiUrl}/api/app/v1/config`, { signal: controller.signal });
    if (!res.ok) return;
    const remota = configDeRespuesta(await res.json());
    if (!remota || !cambioDeProyecto(configActual, remota)) return;
    await almacen.setItem(CLAVE_CONFIG, JSON.stringify(remota));
    // Solo se reinicia si quedó guardada: si no, cada apertura volvería a reiniciar.
    if (leerGuardada(await almacen.getItem(CLAVE_CONFIG)) === null) return;
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    } else {
      // Desarrollo (sin expo-updates): se cambia el cliente en caliente.
      configActual = remota;
      cliente = crear(remota);
    }
  } catch {
    // sin red o timeout: se reintenta en la próxima apertura
  } finally {
    clearTimeout(timer);
  }
}

// Todo el resto de la app usa `supabase` como siempre; por debajo apunta al cliente vigente.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_destino, prop) {
    if (!cliente) cliente = crear(configActual);
    const valor = Reflect.get(cliente, prop);
    return typeof valor === 'function' ? valor.bind(cliente) : valor;
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
