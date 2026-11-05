// Producto del catálogo en dos vistas: fila (lista) y tarjeta (cuadrícula). A la derecha
// o abajo, "+" chico para agregar; ya en el carrito, el selector de cantidad tipeable.
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { BotonAgregar, DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { BrilloOferta, InsigniaOferta } from '@/components/efecto-oferta';
import { FotoProducto } from '@/components/foto-producto';
import { Icono, Insignia, T } from '@/components/ui';
import { pesoAprox, precio, presentacion } from '@/lib/format';
import type { ProductoApp } from '@/lib/tipos';
import { colors, tarjetaBase, tint } from '@/theme';

interface Props {
  producto: ProductoApp;
  cantidad: number;
  accent: string;
  onCambiar: (producto: ProductoApp, cantidad: number) => void;
  /** Sin onFavorito no se muestra el corazón (p. ej. en los carruseles del inicio). */
  favorito?: boolean;
  onFavorito?: (producto: ProductoApp) => void;
  /** Tocar el nombre o el precio abre la hoja del producto. */
  onAbrir?: (producto: ProductoApp) => void;
}

function Corazon({ producto, favorito, accent, onFavorito }: { producto: ProductoApp; favorito: boolean; accent: string; onFavorito: (p: ProductoApp) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: favorito }}
      accessibilityLabel={favorito ? `Quitar ${producto.nombre} de favoritos` : `Agregar ${producto.nombre} a favoritos`}
      onPress={() => onFavorito(producto)}
      hitSlop={8}
      style={({ pressed }) => ({ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Icono name={favorito ? 'heart' : 'heart-outline'} size={20} color={favorito ? accent : colors.muted} />
    </Pressable>
  );
}

const enOferta = (p: ProductoApp) => p.precioOferta !== null && !p.sinStock;

function Precio({ producto, accent }: { producto: ProductoApp; accent: string }) {
  if (producto.precioOferta === null) return <T v="numero" style={{ fontSize: 15 }}>{precio(producto.precio)}</T>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <T v="numero" style={{ fontSize: 15, color: accent }}>{precio(producto.precioOferta)}</T>
      <T v="chico" style={{ fontSize: 12, textDecorationLine: 'line-through' }}>{precio(producto.precio)}</T>
      <InsigniaOferta texto={producto.descuentoPct ? `−${producto.descuentoPct}%` : 'Oferta'} color={accent} />
    </View>
  );
}

/** En lugar de agregar: el producto se ve pero no se puede pedir. */
export function InsigniaSinStock() {
  return <Insignia texto="Sin stock" bg={colors.errorSoft} fg={colors.errorInk} borde={colors.errorLine} />;
}

function Controles({ producto, cantidad, accent, onCambiar }: Pick<Props, 'producto' | 'cantidad' | 'accent' | 'onCambiar'>) {
  if (producto.sinStock) return <InsigniaSinStock />;
  if (cantidad <= 0) return <BotonAgregar color={accent} etiqueta={`Agregar ${producto.nombre}`} onPress={() => onCambiar(producto, 1)} />;
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <SelectorCantidad cantidad={cantidad} color={accent} nombre={producto.nombre} onCambiar={(n) => onCambiar(producto, n)} />
      <DetalleCantidad cantidad={cantidad} unidadesPorBulto={producto.unidadesPorBulto} seDivideEn={producto.seDivideEn} />
    </View>
  );
}

/** Ya en el carrito: fondo suave y borde del color de marca atenuado (con varios agregados la
 *  lista no tiene que parecer "toda seleccionada"). */
const estiloEnCarrito = (cantidad: number, accent: string) =>
  cantidad > 0 ? { backgroundColor: tint(accent, 0.06), borderColor: tint(accent, 0.4) } : { borderColor: colors.line };

/** Por kilo: cuánto pesa más o menos una pieza (el total lo da la balanza al salir). */
function PesoAprox({ producto }: { producto: ProductoApp }) {
  const texto = pesoAprox(producto.pesoAproxKg);
  if (!texto) return null;
  return <T v="chico" style={{ fontSize: 12, color: colors.amberInk }} numberOfLines={1}>{texto} · se pesa al salir</T>;
}

const subtitulo = (p: ProductoApp) => `${presentacion(p.unidadesPorBulto, p.seDivideEn)}${p.codigo ? ` · Cód. ${p.codigo}` : ''}`;

const abrible = (onAbrir: Props['onAbrir'], producto: ProductoApp) =>
  onAbrir
    ? ({ accessibilityRole: 'button' as const, accessibilityLabel: `Ver ${producto.nombre}`, onPress: () => onAbrir(producto) })
    : {};

export const ProductoFila = memo(function ProductoFila(props: Props) {
  const { producto, cantidad, accent, favorito, onFavorito, onAbrir } = props;
  return (
    <View style={[tarjetaBase, { flexGrow: 1, padding: 8, flexDirection: 'row', gap: 10, alignItems: 'center' }, estiloEnCarrito(cantidad, accent)]}>
      <View style={producto.sinStock ? { opacity: 0.5 } : undefined}>
        <FotoProducto nombre={producto.nombre} imagenUrl={producto.imageUrl} miniUrl={producto.imagenMiniUrl} rubro={producto.rubro} size={72} />
        {enOferta(producto) && <BrilloOferta />}
      </View>
      {/* El corazón va al lado y no adentro del Pressable: un botón dentro de otro rompe en web. */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
        <Pressable {...abrible(onAbrir, producto)} style={{ flex: 1, gap: 2 }}>
          <T v="fuerte" numberOfLines={2} style={{ fontSize: 14 }}>{producto.nombre}</T>
          <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>{subtitulo(producto)}</T>
          <PesoAprox producto={producto} />
          <Precio producto={producto} accent={accent} />
        </Pressable>
        {onFavorito && <Corazon producto={producto} favorito={!!favorito} accent={accent} onFavorito={onFavorito} />}
      </View>
      <Controles producto={producto} cantidad={cantidad} accent={accent} onCambiar={props.onCambiar} />
    </View>
  );
});

export const ProductoTarjeta = memo(function ProductoTarjeta(props: Props) {
  const { producto, cantidad, accent, favorito, onFavorito, onAbrir } = props;
  return (
    <View style={[tarjetaBase, { flex: 1, padding: 6, gap: 6 }, estiloEnCarrito(cantidad, accent)]}>
      <View>
        <View style={[{ width: '100%' }, producto.sinStock ? { opacity: 0.5 } : null]}>
          <FotoProducto nombre={producto.nombre} imagenUrl={producto.imageUrl} miniUrl={producto.imagenMiniUrl} rubro={producto.rubro} llenar />
          {enOferta(producto) && <BrilloOferta />}
        </View>
        {onFavorito && (
          <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 14 }}>
            <Corazon producto={producto} favorito={!!favorito} accent={accent} onFavorito={onFavorito} />
          </View>
        )}
      </View>
      <Pressable {...abrible(onAbrir, producto)} style={{ gap: 6 }}>
        <T v="fuerte" numberOfLines={2} style={{ fontSize: 13, minHeight: 34 }}>{producto.nombre}</T>
        <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>{subtitulo(producto)}</T>
        <PesoAprox producto={producto} />
        <Precio producto={producto} accent={accent} />
      </Pressable>
      <View style={{ alignItems: cantidad > 0 ? 'center' : 'flex-end', marginTop: 'auto', paddingTop: 4 }}>
        <Controles producto={producto} cantidad={cantidad} accent={accent} onCambiar={props.onCambiar} />
      </View>
    </View>
  );
});
