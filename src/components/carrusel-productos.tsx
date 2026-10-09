// Carrusel de productos (usado por "Los más elegidos" y "Destacados de la semana" en el inicio):
// tarjetas del catálogo, con el selector de cantidad de siempre.
// Siempre por tandas (no se desliza): entran tantas tarjetas como permita el ancho, de 2 a 7
// (2 en celular). Se pasa de tanda con las flechas del título. Las tarjetas se reparten el ancho.
import { useState } from 'react';
import { View } from 'react-native';
import { HojaProducto } from '@/components/detalle-producto';
import { useAnchoApp } from '@/components/marco-app';
import { ProductoTarjeta } from '@/components/producto-fila';
import { anchoInicio, calcularTanda, FlechasTanda, porTandaPara } from '@/components/tandas';
import { Cargando, Icono, T, type IconName } from '@/components/ui';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';

const GAP = 10;
/** Ancho mínimo de una tarjeta para que el selector [−] [cantidad] [+] entre sin salirse. */
const TANDA = { anchoMin: 160, gap: GAP, minimo: 2, maximo: 7 };

export function CarruselProductos({
  titulo,
  icono,
  slug,
  accent,
  productos,
  cargando,
}: {
  titulo: string;
  icono: IconName;
  slug: string;
  accent: string;
  productos: ProductoApp[] | undefined;
  cargando: boolean;
}) {
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const [tanda, setTanda] = useState(0);
  const [abierto, setAbierto] = useState<ProductoApp | null>(null);
  const porTanda = porTandaPara(anchoInicio(useAnchoApp()), TANDA);

  if (!cargando && (!productos || productos.length === 0)) return null;

  const cambiar = (p: ProductoApp, cantidad: number) =>
    setCantidad(slug, { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl }, cantidad);

  const lista = productos ?? [];
  const { totalTandas, actual } = calcularTanda(lista.length, porTanda, tanda);
  const tandaActual = lista.slice(actual * porTanda, (actual + 1) * porTanda);
  // La última tanda puede venir incompleta: huecos vacíos para que las tarjetas no se estiren.
  const huecos = porTanda - tandaActual.length;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icono name={icono} size={18} color={accent} />
        <T v="h2" style={{ flex: 1 }}>{titulo}</T>
        <FlechasTanda titulo={titulo} actual={actual} totalTandas={totalTandas} accent={accent} onCambiar={setTanda} />
      </View>

      {cargando ? (
        <Cargando />
      ) : (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {tandaActual.map((p) => (
            <View key={p.id} style={{ flex: 1, minWidth: 0 }}>
              <ProductoTarjeta producto={p} cantidad={carrito[p.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} onAbrir={setAbierto} />
            </View>
          ))}
          {Array.from({ length: huecos }, (_, k) => (
            <View key={`hueco-${k}`} style={{ flex: 1, minWidth: 0 }} />
          ))}
        </View>
      )}
      <HojaProducto producto={abierto} slug={slug} accent={accent} onCerrar={() => setAbierto(null)} />
    </View>
  );
}
