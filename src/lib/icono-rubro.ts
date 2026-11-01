// Ícono que reemplaza la foto de los productos que no tienen: sale del rubro y, si el rubro es
// genérico (Almacén, Sin categoría…), del nombre del producto. Cada distribuidora nombra sus rubros
// a su manera, así que se busca por palabras y no por el nombre exacto.
import type { IconName } from '@/components/ui';

const REGLAS: [RegExp, IconName][] = [
  [/\b(FIAMBRE|SALAME|JAMON|MORTADELA|BONDIOLA|LONGANIZA|CHORIZO|SALCHICH|FETEADO|PALETA|LOMITO|MORCILLA)/, 'sausage'],
  [/\b(POLLO|PECHUGA|SUPREMA|NUGGET|FORMITAS)/, 'food-drumstick'],
  [/\b(HAMBURGUES|MILANESA|CARNE|MENUDO|MATAMBRE)/, 'food-steak'],
  [/\b(PESCADO|MERLUZA|ATUN|CALAMAR)/, 'fish'],
  [/\b(HELADO)/, 'ice-cream'],
  [/\b(QUESO|SARDO|CREMOSO|HOLANDA|MUZZ?ARELLA|RICOTA|REGGIANITO|PROVOLETA|CREMETTE|CASANCREM)/, 'cheese'],
  [/\b(YOGU?R|POSTRE|FLAN)/, 'cup'],
  [/\b(LACTEO|LECHE|MANTECA|CREMA DE LECHE|UNTABLE)/, 'cow'],
  [/\b(HUEVO)/, 'egg'],
  [/\b(TAPAS?|PASCUALINA|EMPANADA)\b/, 'food-croissant'],
  [/\b(PASTAS?|FIDEO|RAVIOL|ÑOQUI|SORRENTINO)/, 'pasta'],
  [/\b(CONGELAD)/, 'snowflake'],
  [/\b(CERVEZA)/, 'glass-mug-variant'],
  [/\b(VINO|ESPUMANTE|SIDRA|FERNET|APERITIVO|WHISKY|VODKA)/, 'glass-wine'],
  [/\b(BEBIDA|GASEOSA|AGUA|JUGO|SODA|ENERGIZANTE)/, 'bottle-soda-classic'],
  [/\b(GOLOSINA|ALFAJOR|CHOCOLATE|CARAMELO|CHICLE|BOMBON|CHUP|PASTILLA|GOMITA|GOMA|DULCE)/, 'candy'],
  [/\b(GALLETIT|GALLETA|BIZCOCH)/, 'cookie'],
  [/\b(PAN\b|PANIFICAD|SNACK|PAPAS FRITAS|PUFFITO|CHIZITO|PALITOS|MANI\b|BUDIN|MAGDALENA|TOSTADA)/, 'baguette'],
  [/\b(CEREAL|AVENA|GRANOLA|ARROZ|LEGUMBRE|LENTEJA|POROTO)/, 'grain'],
  [/\b(CONDIMENTO|ESPECIA|SAL|PIMIENTA|ORÉGANO|OREGANO)\b/, 'shaker-outline'],
  [/\b(LIMPIEZA|DETERGENTE|LAVANDINA|DESODORANTE DE AMBIENTE|AROMATIZ|SUAVIZANTE|JABON EN POLVO|LIMPIADOR|CLORO)/, 'spray-bottle'],
  [/\b(PERFUMERIA|SHAMPOO|ACONDICIONADOR|CREMA|JABON|DESODORANTE|PAÑAL|TOALLITA|HIGIENE)/, 'lotion-outline'],
  [/\b(MEDICAMENTO|FARMACIA|IBUPROFENO|PARACETAMOL)/, 'pill'],
  [/\b(BAZAR|VASO|PLATO|CUBIERTO|OLLA|SARTEN|DESCARTABLE|HERMETICO|TOALLA|ACOLCHADO|FILM)/, 'silverware-fork-knife'],
  [/\b(FERRETERIA|HERRAMIENTA|ALICATE|DESTORNILLADOR|PINZA|LLAVE|TORNILLO|CINTA|MARTILLO|HIDROLAVADORA)/, 'hammer-wrench'],
  [/\b(PILAS?)\b/, 'battery'],
  [/\b(ILUMINACION|LAMPARA|FOCO|LINTERNA|LED|VELA)/, 'lightbulb-outline'],
  [/\b(LIBRERIA|CUADERNO|LAPIZ|BIROME|LAPICERA|RESMA|MARCADOR)/, 'pencil'],
  [/\b(NAVIDAD|NAVIDEÑ|ARBOLITO|GUIRNALDA)/, 'pine-tree'],
  [/\b(JUGUETE|INFLABLE)/, 'toy-brick'],
  [/\b(BALANCEADO|ALIMENTO PARA|PERRO|GATO|MASCOTA)/, 'paw'],
  [/\b(BOLSAS?)\b/, 'shopping'],
  [/\b(FRESCOS?|FRIO|REFRIGERAD)/, 'fridge-outline'],
  [/\b(ALMACEN|COMESTIBLE|ACEITE|HARINA|AZUCAR|YERBA|CAFE|TE|MERMELADA|CONSERVA|SALSA|PURE|ACEITUNAS?)\b/, 'basket'],
];

/** Rubros que no dicen qué es el producto: primero se mira el nombre. */
const GENERICOS = /^(ALMACEN|FRESCOS?|POLIRUBROS?|LICITACION|VARIOS|OTROS|SIN CATEGOR[IÍ]A|LOGISTICA)?$/;

function buscar(texto: string): IconName | null {
  for (const [re, icono] of REGLAS) if (re.test(texto)) return icono;
  return null;
}

export function iconoRubro(rubro?: string | null, nombre?: string | null): IconName {
  const r = (rubro ?? '').trim().toUpperCase();
  const n = (nombre ?? '').trim().toUpperCase();
  if (GENERICOS.test(r)) return buscar(n) ?? buscar(r) ?? 'package-variant-closed';
  return buscar(r) ?? buscar(n) ?? 'package-variant-closed';
}
