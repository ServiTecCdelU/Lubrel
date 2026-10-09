// Parseo de un QR escaneado en la app:
// - https://…/app/<slug>, https://…/a/<slug> o servitecpedidos://a/<slug> SIN token → QR de la distribuidora.
// - con ?inv= → invitación de cliente (el slug viene en el link del SaaS: /a/<slug>?inv=…).
// - un código pelado corto ("lubrel") → la distribuidora con ese slug (lo dicta el vendedor).
import { tokenDeInvitacion } from './invitacion';

const SLUG = /^[a-z0-9-]{1,60}$/;

export type QrEscaneado =
  | { tipo: 'distribuidora'; slug: string }
  | { tipo: 'invitacion'; token: string; slug: string | null };

function slugDelLink(texto: string): string | null {
  const slug = (texto.match(/\/(?:a|app)\/([^/?#]+)(?:[/?#]|$)/i) ?? texto.match(/[?&]slug=([^&#]+)/))?.[1]?.toLowerCase();
  return slug && SLUG.test(slug) ? slug : null;
}

/** Código corto que dicta el vendedor ("LUBREL", "demo"): el slug pelado, sin link. Hasta 15
 *  caracteres; de 16 en adelante es un token de invitación (ver tokenDeInvitacion). */
const CODIGO = /^[a-z0-9-]{2,15}$/;

export function codigoDistribuidora(texto: string): string | null {
  const limpio = texto.trim().toLowerCase();
  return CODIGO.test(limpio) ? limpio : null;
}

export function parseQrDistribuidora(texto: string): QrEscaneado | null {
  const limpio = texto.trim();
  const slug = slugDelLink(limpio);

  if (!/[?&]inv=/.test(limpio) && slug) return { tipo: 'distribuidora', slug };

  const token = tokenDeInvitacion(limpio);
  if (token) return { tipo: 'invitacion', token, slug };

  const codigo = codigoDistribuidora(limpio);
  if (codigo) return { tipo: 'distribuidora', slug: codigo };

  return null;
}
