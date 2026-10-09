// Hoja de un producto: foto grande, presentación, precio por unidad de venta y por unidad
// suelta, cuándo lo pidió por última vez, favorito y la cantidad en el carrito. Se abre al
// tocar el producto en el catálogo o en los carruseles del inicio.
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotonAgregar, DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { FotoProducto } from '@/components/foto-producto';
import { anchoHoja } from '@/components/marco-app';
import { Boton, Icono, Insignia, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { tamanoLote, unidadDeVenta } from '@/lib/cantidad';
import { fechaCorta, precio, presentacion } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { nombreRubro } from '@/lib/rubros';
import type { PedidoResumen, ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { colors, fonts, radius, tint } from '@/theme';

interface Props {
  /** null: cerrada. */
  producto: ProductoApp | null;
  slug: string;
  accent: string;
  onCerrar: () => void;
  favorito?: boolean;
  onFavorito?: (producto: ProductoApp) => void;
}

/** Último pedido (no cancelado) que llevó el producto; la lista viene del más nuevo al más viejo. */
function ultimoPedidoCon(productId: string, pedidos: PedidoResumen[] | undefined): { fecha: string; cantidad: number } | null {
  for (const pedido of pedidos ?? []) {
    if (pedido.estado === 'cancelado') continue;
    const linea = pedido.items.find((it) => it.productId === productId);
    if (linea) return { fecha: pedido.fecha, cantidad: linea.cantidad };
  }
  return null;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={{ flex: 1, minWidth: 120, gap: 2, padding: 10, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.lineSoft }}>
      <T v="etiqueta">{etiqueta}</T>
      <T v="fuerte" style={{ fontSize: 14 }} numberOfLines={1}>{valor}</T>
    </View>
  );
}

export function HojaProducto({ producto: p, slug, accent, onCerrar, favorito, onFavorito }: Props) {
  const insets = useSafeAreaInsets();
  const { visitante } = useComercioActivo();
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const pedidos = usePedidos(slug, !visitante);

  if (!p) return null;

  const ultimaVez = ultimoPedidoCon(p.id, pedidos.data);

  const cantidad = carrito[p.id]?.cantidad ?? 0;
  const cambiar = (n: number) =>
    setCantidad(slug, { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl }, n);

  const lote = tamanoLote(p.unidadesPorBulto, p.seDivideEn);
  const final = p.precioOferta ?? p.precio;
  const unidad = unidadDeVenta(p.unidadesPorBulto, p.seDivideEn, 1);
  const rubro = p.rubro ? nombreRubro(p.rubro) : '';

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCerrar} style={{ flex: 1 }} />
        <View style={[anchoHoja, { maxHeight: '88%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12 }]}>
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 8 }}>
            {rubro ? <Insignia texto={rubro} bg={tint(accent, 0.1)} fg={accent} /> : null}
            <View style={{ flex: 1 }} />
            {onFavorito && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !!favorito }}
                accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onPress={() => onFavorito(p)}
                hitSlop={8}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: favorito ? tint(accent, 0.12) : colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icono name={favorito ? 'heart' : 'heart-outline'} size={20} color={favorito ? accent : colors.inkSoft} />
              </Pressable>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="close" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <FotoProducto nombre={p.nombre} imagenUrl={p.imageUrl} size={96} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h2" style={{ fontSize: 18, lineHeight: 24 }}>{p.nombre}</T>
                {p.codigo ? <T v="chico">Cód. {p.codigo}</T> : null}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              {p.precioOferta !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <T v="numero" style={{ fontSize: 26, color: accent }}>{precio(p.precioOferta)}</T>
                  <T v="chico" style={{ fontSize: 14, textDecorationLine: 'line-through' }}>{precio(p.precio)}</T>
                  <Insignia texto={`Oferta −${p.descuentoPct}%`} bg={accent} fg={colors.white} />
                </View>
              ) : (
                <T v="numero" style={{ fontSize: 26 }}>{precio(p.precio)}</T>
              )}
              <T v="chico">
                por {unidad}
                {lote > 1 ? ` · ${precio(final / lote)} la unidad` : ''}
              </T>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Dato etiqueta="Presentación" valor={presentacion(p.unidadesPorBulto, p.seDivideEn)} />
              {lote > 1 && <Dato etiqueta="Unidades por bulto" valor={lote.toLocaleString('es-AR')} />}
              {ultimaVez && <Dato etiqueta="Última vez" valor={`${ultimaVez.cantidad} el ${fechaCorta(ultimaVez.fecha)}`} />}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
              <View style={{ flex: 1 }}>
                <T v="fuerte" style={{ fontSize: 14 }}>{cantidad > 0 ? 'En tu carrito' : 'Cantidad'}</T>
                {cantidad > 0 ? (
                  <T v="chico" style={{ fontSize: 12 }}>Subtotal {precio(final * cantidad)}</T>
                ) : (
                  <T v="chico" style={{ fontSize: 12 }}>Se suma de a {unidad === 'unidad' ? 'una unidad' : `un ${unidad}`}</T>
                )}
              </View>
              {cantidad > 0 ? (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <SelectorCantidad cantidad={cantidad} color={accent} nombre={p.nombre} onCambiar={cambiar} />
                  <DetalleCantidad cantidad={cantidad} unidadesPorBulto={p.unidadesPorBulto} seDivideEn={p.seDivideEn} />
                </View>
              ) : (
                <BotonAgregar color={accent} etiqueta={`Agregar ${p.nombre}`} onPress={() => cambiar(1)} />
              )}
            </View>

            {cantidad > 0 ? (
              <Boton color={accent} icono="check" onPress={onCerrar}>Listo</Boton>
            ) : (
              <Boton color={accent} icono="cart-plus" onPress={() => cambiar(1)}>Agregar al carrito</Boton>
            )}
            <T style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' }}>
              El precio final lo confirma la distribuidora al enviar el pedido.
            </T>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
