// Cliente de /api/app/v1 del SaaS. Sobre de respuesta: { data } o { error }.
import { env } from '@/lib/env';
import { reportarError } from '@/lib/monitoreo';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 20_000;

export async function api<T>(
  path: string,
  // auth: true exige sesión; 'opcional' la manda si hay (lecturas que ve un visitante).
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; auth?: boolean | 'opcional' } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (opts.auth !== 'opcional') throw new ApiError(401, 'Tu sesión venció. Volvé a ingresar.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/api/app/v1${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'Sin conexión. Revisá tu internet y probá de nuevo.');
  } finally {
    clearTimeout(timer);
  }

  let json: { data?: T; error?: string; [k: string]: unknown } = {};
  try {
    json = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }
  if (!res.ok) {
    const { error, ...extra } = json;
    const fallo = new ApiError(res.status, error || 'Algo salió mal. Probá de nuevo.', extra);
    // Un 5xx es un problema del servidor que hay que ver, aunque la pantalla lo maneje.
    if (res.status >= 500) reportarError(fallo, { path, method: opts.method ?? 'GET' });
    // Token que el servidor ya no acepta (cuenta borrada, refresh fallido): cerrar la sesión
    // local, así la app vuelve a "Ingresar" en vez de mostrar un error en cada pantalla.
    if (res.status === 401 && headers.Authorization) void supabase.auth.signOut({ scope: 'local' });
    throw fallo;
  }
  return json.data as T;
}
