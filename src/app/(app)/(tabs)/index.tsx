// Inicio: saludo con buscador, ofertas, rubros con ícono, último pedido (con "Repetir")
// y accesos compactos. Al visitante (entró por el QR, sin registrarse) le suma el
// banner "Registrarme".
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { CarruselProductos } from '@/components/carrusel-productos';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { OfertasInicio } from '@/components/ofertas-inicio';
import { BannerRegistro } from '@/components/registro';
import { columnaAncha, useEsAncha } from '@/components/marco-app';
import { GrillaRubros, SelectorRubros } from '@/components/rubros';
import { Boton, Icono, T, Tarjeta, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useSecciones } from '@/hooks/use-secciones';
import { fechaCorta, precio } from '@/lib/format';
import { useCuenta, useDestacados, useMasElegidos, usePedidos, useRubros } from '@/lib/queries';
import { rubrosVisibles } from '@/lib/rubros';
import type { PedidoResumen } from '@/lib/tipos';
import { useCarritoStore } from '@/state/carrito';
import { colors, fonts, radius, tarjetaBase, tint } from '@/theme';

const irACatalogo = (params: Record<string, string>) => router.navigate({ pathname: '/catalogo', params });

function saludo(): string {
  const h = new Date().getHours();
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

/** Parece un campo de texto pero abre Productos con el teclado listo. El botón de escanear va
 *  adentro, a la derecha, igual que en el buscador de Productos. */
function BuscadorInicio({ accent, escanear }: { accent: string; escanear: boolean }) {
  return (
    <View style={[tarjetaBase, { height: 50, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingRight: 7, overflow: 'hidden' }]}>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Buscar productos"
        onPress={() => irACatalogo({ buscar: String(Date.now()) })}
        style={({ pressed }) => ({ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 8, backgroundColor: pressed ? colors.lineSoft : undefined })}
      >
        <Icono name="magnify" color={accent} size={22} />
        <T style={{ flex: 1, color: colors.muted, fontSize: 15 }} numberOfLines={1}>Buscá por nombre, marca o código</T>
      </Pressable>
      {escanear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear código de barras"
          onPress={() => router.push('/escanear')}
          hitSlop={4}
          style={({ pressed }) => ({ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: accent, opacity: pressed ? 0.85 : 1, alignItems: 'center', justifyContent: 'center' })}
        >
          <Icono name="barcode-scan" color={colors.white} size={20} />
        </Pressable>
      )}
    </View>
  );
}

function Seccion({ titulo, accion, onAccion }: { titulo: string; accion?: string; onAccion?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
      <T v="h2">{titulo}</T>
      {accion && onAccion ? (
        <Pressable accessibilityRole="button" onPress={onAccion} hitSlop={8}>
          <T style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.tealInk }}>{accion}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Sin onRepetir (sección apagada) no muestra el botón. */
function UltimoPedido({ pedido, accent, onRepetir }: { pedido: PedidoResumen; accent: string; onRepetir?: () => void }) {
  return (
    <Tarjeta style={{ gap: 12 }}>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: pedido.id } })} style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T v="etiqueta">Último pedido · {fechaCorta(pedido.fecha)}</T>
          <EstadoPedidoInsignia estado={pedido.estado} retenido={pedido.retenido} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T v="fuerte">{pedido.cantidadProductos} {pedido.cantidadProductos === 1 ? 'producto' : 'productos'}</T>
          <T v="numero">{precio(pedido.total)}</T>
        </View>
      </Pressable>
      {onRepetir && <Boton variante="suave" color={accent} icono="repeat" chico onPress={onRepetir}>Repetir este pedido</Boton>}
    </Tarjeta>
  );
}

/** Acceso rápido: tarjeta con ícono arriba (en fila, celular) o ícono al costado (enLinea, columna lateral). */
function Acceso({ icono, titulo, accent, enLinea, onPress }: { icono: IconName; titulo: string; accent: string; enLinea?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [tarjetaBase, { flex: enLinea ? undefined : 1, padding: 14, gap: enLinea ? 12 : 10, flexDirection: enLinea ? 'row' : 'column', alignItems: enLinea ? 'center' : undefined, backgroundColor: pressed ? colors.lineSoft : colors.card }]}
    >
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} color={accent} />
      </View>
      <T v="fuerte" style={{ fontSize: 14 }}>{titulo}</T>
    </Pressable>
  );
}

/** Último pedido y accesos: abajo en el celular (accesos en fila), a la derecha en pantallas anchas. */
function Laterales({ ultimo, accent, onRepetir, escanear, fila }: { ultimo?: PedidoResumen; accent: string; onRepetir?: () => void; escanear: boolean; fila?: boolean }) {
  return (
    <>
      {ultimo && <UltimoPedido pedido={ultimo} accent={accent} onRepetir={onRepetir} />}
      {!fila && <Seccion titulo="Accesos rápidos" />}
      <View style={{ flexDirection: fila ? 'row' : 'column', gap: 10 }}>
        {escanear && <Acceso icono="barcode-scan" titulo="Escanear productos" accent={accent} enLinea={!fila} onPress={() => router.push('/escanear')} />}
        <Acceso icono="clipboard-list-outline" titulo="Mis pedidos" accent={accent} enLinea={!fila} onPress={() => router.navigate('/pedidos')} />
        {!fila && <Acceso icono="cart-outline" titulo="Ver carrito" accent={accent} enLinea onPress={() => router.navigate('/pedido')} />}
      </View>
    </>
  );
}

export default function Inicio() {
  const { comercio, slug, accent, visitante, conSesion } = useComercioActivo();
  const secciones = useSecciones();
  const cuenta = useCuenta(slug!, !visitante);
  const pedidos = usePedidos(slug!, !visitante);
  const masElegidos = useMasElegidos(slug!);
  const destacados = useDestacados(slug!);
  const rubrosQuery = useRubros(slug!);
  const rubros = useMemo(() => rubrosVisibles(rubrosQuery.data ?? []), [rubrosQuery.data]);
  const [verRubros, setVerRubros] = useState(false);
  const ancha = useEsAncha();
  const setCantidad = useCarritoStore((s) => s.setCantidad);

  const ultimo = pedidos.data?.[0];
  const nombre = cuenta.data?.cliente.nombre?.split(' ')[0];

  const repetirUltimo = () => {
    if (!ultimo || !slug) return;
    for (const it of ultimo.items) {
      if (!it.productId || it.cantidad <= 0) continue;
      // El precio lo pone /cotizar al abrir el carrito; acá solo qué y cuánto.
      setCantidad(slug, { productId: it.productId, nombre: it.nombre, rubro: '', precioReferencia: 0, unidadesPorBulto: null, seDivideEn: null }, it.cantidad);
    }
    router.navigate('/pedido');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo={comercio?.nombre ?? ''} subtitulo={cuenta.data?.cliente.nombre} color={accent} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={cuenta.isRefetching || pedidos.isRefetching}
            onRefresh={() => {
              cuenta.refetch();
              pedidos.refetch();
              rubrosQuery.refetch();
              masElegidos.refetch();
              destacados.refetch();
            }}
          />
        }
      >
        <View style={{ backgroundColor: tint(accent, 0.07), paddingTop: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: tint(accent, 0.18) }}>
          <View style={[columnaAncha, { paddingHorizontal: 16, gap: 14 }]}>
            <View style={{ gap: 2 }}>
              <T v="chico" style={{ color: colors.tealInk, fontFamily: fonts.bodyMedium }}>{nombre ? `${saludo()}, ${nombre}` : saludo()}</T>
              <T v="titulo" style={{ fontSize: 24, lineHeight: 30 }}>¿Qué vas a pedir hoy?</T>
            </View>
            <BuscadorInicio accent={accent} escanear={secciones.escanear} />
          </View>
        </View>

        {/* Celular: todo en una columna. Tablet apaisada y PC: arriba ofertas a la izquierda y
            último pedido + accesos a la derecha; abajo carruseles y rubros a todo el ancho
            (mismo margen derecho que "Accesos rápidos"). */}
        <View style={[columnaAncha, { padding: 16, gap: ancha ? 20 : 12 }]}>
          <View style={{ gap: ancha ? 20 : 12, flexDirection: ancha ? 'row' : 'column', alignItems: ancha ? 'flex-start' : 'stretch' }}>
            <View style={{ gap: 12, flex: ancha ? 1 : undefined, minWidth: 0 }}>
              {visitante && <BannerRegistro conSesion={conSesion} accent={accent} />}
              {secciones.ofertas && <OfertasInicio slug={slug!} accent={accent} conLateral={ancha} />}
            </View>

            {ancha && (
              <View style={{ width: 340, gap: 12, marginTop: 8 }}>
                <Laterales ultimo={ultimo} accent={accent} onRepetir={secciones.repetirPedido ? repetirUltimo : undefined} escanear={secciones.escanear} />
              </View>
            )}
          </View>

          {secciones.masElegidos && (
            <CarruselProductos titulo="Los más elegidos" icono="fire" slug={slug!} accent={accent} productos={masElegidos.data} cargando={masElegidos.isLoading} />
          )}

          {secciones.destacados && (
            <CarruselProductos titulo="Destacados de la semana" icono="star-outline" slug={slug!} accent={accent} productos={destacados.data} cargando={destacados.isLoading} />
          )}

          {rubros.length > 0 && (
            <View style={{ gap: 12 }}>
              <Seccion titulo="Rubros" accion="Ver todos" onAccion={() => setVerRubros(true)} />
              <GrillaRubros
                rubros={rubros}
                color={accent}
                cantidad={ancha ? 15 : 7}
                columnas={ancha ? 8 : 4}
                onElegir={(r) => irACatalogo({ rubro: r })}
                onVerTodos={() => setVerRubros(true)}
              />
            </View>
          )}

          {!ancha && <Laterales ultimo={ultimo} accent={accent} onRepetir={secciones.repetirPedido ? repetirUltimo : undefined} escanear={secciones.escanear} fila />}
        </View>
      </ScrollView>

      <SelectorRubros visible={verRubros} rubros={rubros} activo="" color={accent} onElegir={(r) => irACatalogo({ rubro: r })} onCerrar={() => setVerRubros(false)} />
    </View>
  );
}
