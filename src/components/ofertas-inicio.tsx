// Carrusel de ofertas vigentes (cargadas en el panel → "App de pedidos").
// Si entra una sola por vez (celular): se desliza con el dedo, avanza sola y tiene puntitos.
// Si entran más (tablet, PC): tandas de 2 o 3 que se reparten el ancho, con flechas ‹ › para
// pasar de tanda (como "Los más elegidos"). La imagen se muestra entera (sirve la foto vertical
// del producto o un banner apaisado) sobre fondo blanco.
// Las ofertas nunca tienen que desaparecer: se dibujan siempre todas (ScrollView, no FlatList, que
// virtualiza y en Android recorta tarjetas al moverse sola) y, mientras no se midió el ancho real,
// se usa el calculado desde la ventana para no dejar el bloque vacío.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useAnchoApp } from '@/components/marco-app';
import { BrilloOferta, InsigniaOferta } from '@/components/efecto-oferta';
import { anchoInicio, calcularTanda, FlechasTanda, porTandaPara } from '@/components/tandas';
import { Boton, Icono, Insignia, T } from '@/components/ui';
import { precio } from '@/lib/format';
import { useOfertas } from '@/lib/queries';
import type { OfertaApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { colors, radius, tarjetaBase, tint } from '@/theme';

const GAP = 12;
const ALTO = 188;
const AUTOPLAY_MS = 4500;
/** Ancho mínimo de una oferta (imagen + título, precio y "Agregar"). */
const TANDA = { anchoMin: 300, gap: GAP, minimo: 1, maximo: 3 };

/** conLateral: en pantallas anchas comparte fila con la columna derecha (último pedido y accesos). */
export function OfertasInicio({ slug, accent, conLateral = false }: { slug: string; accent: string; conLateral?: boolean }) {
  const ofertas = useOfertas(slug);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const anchoCalculado = anchoInicio(useAnchoApp(), conLateral);
  const porTanda = porTandaPara(anchoCalculado, TANDA);
  const enTandas = porTanda > 1;
  const [tanda, setTanda] = useState(0);
  // Una por vez: la tarjeta ocupa todo el ancho del carrusel (que se desliza). Hasta medirlo
  // se usa el calculado, así se ve desde el primer momento.
  const [anchoMedido, setAnchoMedido] = useState(0);
  const anchoCont = anchoMedido || anchoCalculado;
  const paso = anchoCont + GAP;
  const medir = (e: LayoutChangeEvent) => setAnchoMedido(Math.round(e.nativeEvent.layout.width));

  const lista = useRef<ScrollView>(null);
  const [elegida, setActual] = useState(0);
  const tocando = useRef(false);
  const items = ofertas.data ?? [];
  const total = items.length;
  // Si cambió la lista, que la oferta elegida siga existiendo.
  const actual = total > 0 ? Math.min(elegida, total - 1) : 0;

  // Si cambia el ancho (girar la tablet, achicar la ventana), volver a centrar la oferta actual.
  useEffect(() => {
    if (enTandas) return;
    lista.current?.scrollTo({ x: actual * paso, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el ancho o el modo
  }, [paso, enTandas]);

  // Avance automático; se pausa mientras el usuario desliza.
  useEffect(() => {
    if (total < 2 || enTandas) return;
    const id = setInterval(() => {
      if (tocando.current) return;
      setActual((i) => {
        const siguiente = (Math.min(i, total - 1) + 1) % total;
        lista.current?.scrollTo({ x: siguiente * paso, animated: true });
        return siguiente;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [total, paso, enTandas]);

  const alSoltar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      tocando.current = false;
      setActual(Math.max(0, Math.min(total - 1, Math.round(e.nativeEvent.contentOffset.x / paso))));
    },
    [paso, total],
  );

  if (total === 0) return null;

  const agregar = (o: OfertaApp) => {
    const p = o.producto;
    if (!p || p.sinStock) return;
    const enCarrito = carrito[p.id]?.cantidad ?? 0;
    setCantidad(
      slug,
      { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl, imagenMiniUrl: p.imagenMiniUrl },
      enCarrito + 1,
    );
  };

  const enCarrito = (o: OfertaApp) => (o.producto ? carrito[o.producto.id]?.cantidad ?? 0 : 0);
  const { totalTandas, actual: tandaActual } = calcularTanda(total, porTanda, tanda);
  const visibles = items.slice(tandaActual * porTanda, (tandaActual + 1) * porTanda);
  // La última tanda puede venir incompleta: huecos vacíos para que las tarjetas no se estiren.
  const huecos = porTanda - visibles.length;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <T v="h2" style={{ flex: 1 }}>Ofertas</T>
        <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/catalogo', params: { ofertas: '1' } })} hitSlop={8}>
          <T style={{ color: accent, fontSize: 14 }}>Ver todas</T>
        </Pressable>
        {enTandas && <FlechasTanda titulo="Ofertas" actual={tandaActual} totalTandas={totalTandas} accent={accent} onCambiar={setTanda} />}
      </View>

      {enTandas ? (
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {visibles.map((o) => (
            <TarjetaOferta key={o.id} oferta={o} accent={accent} enCarrito={enCarrito(o)} onAgregar={() => agregar(o)} />
          ))}
          {Array.from({ length: huecos }, (_, k) => (
            <View key={`hueco-${k}`} style={{ flex: 1, minWidth: 0 }} />
          ))}
        </View>
      ) : (
        <View onLayout={medir} style={{ minHeight: ALTO }}>
          <ScrollView
            ref={lista}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={paso}
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={{ gap: GAP }}
            onScrollBeginDrag={() => (tocando.current = true)}
            onScrollEndDrag={alSoltar}
            onMomentumScrollEnd={alSoltar}
          >
            {items.map((o) => (
              <TarjetaOferta key={o.id} oferta={o} ancho={anchoCont} accent={accent} enCarrito={enCarrito(o)} onAgregar={() => agregar(o)} />
            ))}
          </ScrollView>
        </View>
      )}

      {total > 1 && !enTandas && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityLabel={`Oferta ${actual + 1} de ${total}`}>
          {items.map((o, i) => (
            <View key={o.id} style={{ width: i === actual ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === actual ? accent : colors.line }} />
          ))}
        </View>
      )}
    </View>
  );
}

function TarjetaOferta({
  oferta: o,
  ancho,
  accent,
  enCarrito,
  onAgregar,
}: {
  oferta: OfertaApp;
  /** Ancho fijo (carrusel que se desliza); sin ancho se reparte el lugar con flex (tandas). */
  ancho?: number;
  accent: string;
  enCarrito: number;
  onAgregar: () => void;
}) {
  const p = o.producto;
  return (
    <View style={[tarjetaBase, ancho ? { width: ancho } : { flex: 1, minWidth: 0 }, { height: ALTO, flexDirection: 'row', overflow: 'hidden', borderWidth: 2, borderColor: tint(accent, 0.5) }]}>
      <View style={{ width: '40%', backgroundColor: colors.white, borderRightWidth: 1, borderRightColor: colors.lineSoft }}>
        {o.imagenUrl ? (
          <Image source={{ uri: o.imagenUrl }} style={{ flex: 1, margin: 8 }} contentFit="contain" transition={150} accessibilityLabel={o.titulo} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(accent, 0.08) }}>
            <Icono name="tag-outline" size={34} color={accent} />
          </View>
        )}
        <BrilloOferta />
        <View style={{ position: 'absolute', top: 8, left: 8 }}>
          <InsigniaOferta texto={o.descuentoPct ? `−${o.descuentoPct}%` : 'Oferta'} color={accent} grande />
        </View>
      </View>

      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}>
          <T v="fuerte" numberOfLines={2}>{o.titulo}</T>
          {p ? (
            <T v="chico" numberOfLines={2} style={{ fontSize: 12 }}>{p.nombre}</T>
          ) : o.descripcion ? (
            <T v="chico" numberOfLines={4}>{o.descripcion}</T>
          ) : null}
        </View>

        {p && (
          <View style={{ gap: 8 }}>
            <View>
              {p.precioOferta !== null && (
                <T v="chico" style={{ fontSize: 12, textDecorationLine: 'line-through' }}>{precio(p.precio)}</T>
              )}
              <T v="numero" style={{ fontSize: 19, color: p.precioOferta !== null ? accent : colors.ink }}>
                {precio(p.precioOferta ?? p.precio)}
              </T>
            </View>
            {p.sinStock ? (
              <Insignia texto="Sin stock" bg={colors.errorSoft} fg={colors.errorInk} borde={colors.errorLine} />
            ) : (
              <Boton chico color={accent} icono={enCarrito ? 'check' : 'cart-plus'} onPress={onAgregar} style={{ borderRadius: radius.md }}>
                {enCarrito ? `${enCarrito} en carrito` : 'Agregar'}
              </Boton>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
