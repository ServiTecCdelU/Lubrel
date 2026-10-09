// Productos: catálogo paginado con búsqueda (nombre, código o código de barras),
// accesos Ofertas / Más pedidos / Rubros (hoja con todos), favoritos (corazón, guardados en el
// dispositivo), vista lista o cuadrícula (se recuerda)
// y cantidades tipeables. Desde el inicio llega con ?q=, ?rubro=, ?ofertas=1, ?mas=1 o ?buscar=.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { HojaProducto } from '@/components/detalle-producto';
import { anchoHoja, useAnchoApp } from '@/components/marco-app';
import { ProductoFila, ProductoTarjeta } from '@/components/producto-fila';
import { iconoDeRubro, SelectorRubros } from '@/components/rubros';
import { Aviso, Boton, Cargando, Icono, T, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useDebounce } from '@/hooks/use-debounce';
import { precio } from '@/lib/format';
import { useCatalogo, useRubros } from '@/lib/queries';
import { nombreRubro, rubrosVisibles } from '@/lib/rubros';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { useFavoritos, useFavoritosStore } from '@/state/favoritos';
import { usePreferencias } from '@/state/preferencias';
import { colors, fonts, radius } from '@/theme';

const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
const miles = (n: number) => n.toLocaleString('es-AR');

const PAD = 16;
const GAP = 8;
const ANCHO_TARJETA = 180;
const ANCHO_FILA = 360;

/** Columnas del catálogo según el ancho: el celular queda como siempre (1 en lista, 2 en cuadrícula). */
function columnasPara(ancho: number, grilla: boolean): number {
  const util = ancho - PAD * 2;
  if (grilla) return Math.max(2, Math.min(8, Math.floor((util + GAP) / (ANCHO_TARJETA + GAP))));
  return Math.max(1, Math.min(4, Math.floor((util + GAP) / (ANCHO_FILA + GAP))));
}

function BarraBusqueda({
  valor,
  onCambiar,
  accent,
  enfoque,
}: {
  valor: string;
  onCambiar: (t: string) => void;
  accent: string;
  /** Cambia cada vez que el inicio pide abrir el teclado. */
  enfoque: string;
}) {
  const ref = useRef<TextInput>(null);
  const [enfocado, setEnfocado] = useState(false);
  useEffect(() => {
    if (enfoque) ref.current?.focus();
  }, [enfoque]);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: radius.md, borderWidth: enfocado ? 2 : 1, borderColor: enfocado ? accent : colors.line, backgroundColor: colors.card, paddingLeft: enfocado ? 13 : 14, paddingRight: 6 }}>
      <Icono name="magnify" color={enfocado ? accent : colors.muted} size={20} />
      <TextInput
        ref={ref}
        accessibilityLabel="Buscar producto"
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder="Buscá por nombre, marca o código"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.ink, outlineStyle: 'none' } as object}
      />
      {valor ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => onCambiar('')} hitSlop={10}>
          <Icono name="close-circle" color={colors.muted} size={18} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escanear código de barras"
        onPress={() => router.push('/escanear')}
        style={({ pressed }) => ({ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: accent, opacity: pressed ? 0.85 : 1, alignItems: 'center', justifyContent: 'center' })}
      >
        <Icono name="barcode-scan" color={colors.white} size={20} />
      </Pressable>
    </View>
  );
}

/** Acceso rápido del catálogo: ocupa un tercio del ancho; activo = color de la marca. */
function Atajo({ icono, texto, activo, accent, onPress, onQuitar }: { icono: IconName; texto: string; activo: boolean; accent: string; onPress: () => void; onQuitar?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 44,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: activo ? accent : colors.line,
        backgroundColor: activo ? accent : pressed ? colors.lineSoft : colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 8,
      })}
    >
      <Icono name={icono} size={18} color={activo ? colors.white : accent} />
      <T numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: activo ? colors.white : colors.ink }}>{texto}</T>
      {onQuitar ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${texto}`} onPress={onQuitar} hitSlop={10}>
          <Icono name="close-circle" size={16} color={colors.white} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function Atajos({
  rubro,
  soloOfertas,
  masPedidos,
  accent,
  onOfertas,
  onMasPedidos,
  onVerRubros,
  onQuitarRubro,
}: {
  rubro: string;
  soloOfertas: boolean;
  masPedidos: boolean;
  accent: string;
  onOfertas: () => void;
  onMasPedidos: () => void;
  onVerRubros: () => void;
  onQuitarRubro: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
      <Atajo icono="tag-outline" texto="Ofertas" activo={soloOfertas} accent={accent} onPress={onOfertas} />
      <Atajo icono="fire" texto="Más pedidos" activo={masPedidos} accent={accent} onPress={onMasPedidos} />
      <Atajo
        icono={rubro ? iconoDeRubro(rubro) : 'view-grid-outline'}
        texto={rubro ? nombreRubro(rubro) : 'Rubros'}
        activo={!!rubro}
        accent={accent}
        onPress={onVerRubros}
        onQuitar={rubro ? onQuitarRubro : undefined}
      />
    </View>
  );
}

function Resumen({ total, q, rubro, soloOfertas, masPedidos, soloFavoritos, onLimpiar }: { total?: number; q: string; rubro: string; soloOfertas: boolean; masPedidos: boolean; soloFavoritos: boolean; onLimpiar: () => void }) {
  if (total === undefined) return null;
  const filtrado = !!(q || rubro || soloOfertas || masPedidos || soloFavoritos);
  const partes = [soloFavoritos ? 'favoritos' : '', masPedidos ? 'más pedidos' : '', q ? `para “${q}”` : '', rubro ? `en ${nombreRubro(rubro)}` : '', soloOfertas ? 'en oferta' : ''].filter(Boolean).join(' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 }}>
      <T v="chico" style={{ flex: 1 }} numberOfLines={1}>
        <T v="chico" style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{miles(total)}</T>
        {` ${total === 1 ? 'producto' : 'productos'}${partes ? ` ${partes}` : ''}`}
      </T>
      {filtrado && (
        <Pressable accessibilityRole="button" onPress={onLimpiar} hitSlop={8}>
          <T v="chico" style={{ fontFamily: fonts.bodySemi, color: colors.tealInk }}>Limpiar</T>
        </Pressable>
      )}
    </View>
  );
}

function SinResultados({ q, accent, soloFavoritos, onLimpiar }: { q: string; accent: string; soloFavoritos: boolean; onLimpiar: () => void }) {
  if (soloFavoritos && !q) {
    return (
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 32 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="heart-outline" size={30} color={colors.muted} />
        </View>
        <T v="h2" style={{ textAlign: 'center' }}>Todavía no tenés favoritos</T>
        <T v="chico" style={{ textAlign: 'center' }}>Tocá el corazón de los productos que pedís siempre y los vas a encontrar acá.</T>
        <Boton variante="suave" color={accent} chico onPress={onLimpiar}>Ver todos los productos</Boton>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="magnify" size={30} color={colors.muted} />
      </View>
      <T v="h2" style={{ textAlign: 'center' }}>{q ? `No encontramos “${q}”` : 'No hay productos acá'}</T>
      <T v="chico" style={{ textAlign: 'center' }}>Probá con otra palabra, la marca o el código. También podés sacar los filtros.</T>
      <Boton variante="suave" color={accent} chico onPress={onLimpiar}>Ver todos los productos</Boton>
    </View>
  );
}

/** `total` null: alguna línea no tiene precio de referencia (vino de "repetir pedido"); se muestra solo la cantidad. */
function CarritoFlotante({ cantidad, total, accent }: { cantidad: number; total: number | null; accent: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver carrito"
      onPress={() => router.navigate('/pedido')}
      style={[anchoHoja, { position: 'absolute', left: 16, right: 16, bottom: 12, marginHorizontal: 'auto', width: undefined, height: 52, borderRadius: radius.md, backgroundColor: accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, elevation: 4, shadowColor: colors.ink, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icono name="cart-outline" color={colors.white} size={20} />
        <T v="fuerte" style={{ color: colors.white }}>
          {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
        </T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <T v="fuerte" style={{ color: colors.white }}>{total === null ? 'Ver carrito' : precio(total)}</T>
        <Icono name="chevron-right" color={colors.white} size={20} />
      </View>
    </Pressable>
  );
}

/** Filtros que llegan por parámetro (desde el inicio): se aplican cada vez que cambian. */
function useFiltrosDeRuta() {
  const params = useLocalSearchParams<{ rubro?: string; ofertas?: string; mas?: string; q?: string; buscar?: string }>();
  const desdeRuta = { rubro: texto(params.rubro), ofertas: params.ofertas === '1', mas: params.mas === '1', q: texto(params.q), buscar: texto(params.buscar) };
  const [rubro, setRubro] = useState(desdeRuta.rubro);
  const [soloOfertas, setSoloOfertas] = useState(desdeRuta.ofertas);
  const [masPedidos, setMasPedidos] = useState(desdeRuta.mas);
  const [busqueda, setBusqueda] = useState(desdeRuta.q);
  // Ajuste durante el render, no en un efecto: https://react.dev/learn/you-might-not-need-an-effect
  const clave = `${desdeRuta.rubro}|${desdeRuta.ofertas}|${desdeRuta.mas}|${desdeRuta.q}|${desdeRuta.buscar}`;
  const [ultimaClave, setUltimaClave] = useState(clave);
  if (clave !== ultimaClave) {
    setUltimaClave(clave);
    setRubro(desdeRuta.rubro);
    setSoloOfertas(desdeRuta.ofertas);
    setMasPedidos(desdeRuta.mas);
    setBusqueda(desdeRuta.q);
  }
  return { rubro, setRubro, soloOfertas, setSoloOfertas, masPedidos, setMasPedidos, busqueda, setBusqueda, enfoque: desdeRuta.buscar };
}

export default function Catalogo() {
  const { comercio, slug, accent } = useComercioActivo();
  const { rubro, setRubro, soloOfertas, setSoloOfertas, masPedidos, setMasPedidos, busqueda, setBusqueda, enfoque } = useFiltrosDeRuta();
  const [verRubros, setVerRubros] = useState(false);
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [abierto, setAbierto] = useState<ProductoApp | null>(null);
  const q = useDebounce(busqueda.trim(), 350);
  const favoritos = useFavoritos(slug);
  const alternarFavorito = useFavoritosStore((s) => s.alternar);
  const favoritosSet = useMemo(() => new Set(favoritos), [favoritos]);

  const catalogo = useCatalogo(slug!, q, rubro, soloOfertas, masPedidos, soloFavoritos ? favoritos : undefined);
  const rubrosQuery = useRubros(slug!);
  const rubros = useMemo(() => rubrosVisibles(rubrosQuery.data ?? []), [rubrosQuery.data]);
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const { vista, setVista } = usePreferencias();
  const grilla = vista === 'cuadricula';
  // Ancho real de la pantalla (sin el menú lateral en tablet/PC); antes de medir, el de la ventana.
  const anchoVentana = useAnchoApp();
  const [anchoMedido, setAnchoMedido] = useState(0);
  const ancho = anchoMedido || anchoVentana;
  const columnas = columnasPara(ancho, grilla);
  // Ancho fijo por columna: así la última fila incompleta no se estira.
  const anchoItem = columnas > 1 ? (ancho - PAD * 2 - GAP * (columnas - 1)) / columnas : undefined;

  const productos = useMemo(() => catalogo.data?.pages.flatMap((p) => p.items) ?? [], [catalogo.data]);
  const total = catalogo.data?.pages[0]?.total;
  const lineas = Object.values(carrito);
  const estimado = lineas.every((i) => i.precioReferencia > 0) ? lineas.reduce((acc, i) => acc + i.precioReferencia * i.cantidad, 0) : null;

  const limpiar = () => {
    setBusqueda('');
    setRubro('');
    setSoloOfertas(false);
    setMasPedidos(false);
    setSoloFavoritos(false);
  };

  const onFavorito = useCallback((p: ProductoApp) => alternarFavorito(slug!, p.id), [alternarFavorito, slug]);

  const cambiar = useCallback(
    (p: ProductoApp, cantidad: number) =>
      setCantidad(
        slug!,
        { productId: p.id, nombre: p.nombre, rubro: p.rubro, precioReferencia: p.precioOferta ?? p.precio, unidadesPorBulto: p.unidadesPorBulto, seDivideEn: p.seDivideEn, imageUrl: p.imageUrl },
        cantidad,
      ),
    [setCantidad, slug],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={(e) => setAnchoMedido(Math.round(e.nativeEvent.layout.width))}>
      <BarraSuperior titulo="Productos" subtitulo={comercio?.nombre} color={accent} />
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line, paddingTop: 12, paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
          <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} accent={accent} enfoque={enfoque} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: soloFavoritos }}
            accessibilityLabel={soloFavoritos ? 'Ver todos los productos' : 'Ver mis favoritos'}
            onPress={() => setSoloFavoritos(!soloFavoritos)}
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: soloFavoritos ? accent : colors.line, backgroundColor: soloFavoritos ? accent : pressed ? colors.lineSoft : colors.card, alignItems: 'center', justifyContent: 'center' })}
          >
            <Icono name={soloFavoritos ? 'heart' : 'heart-outline'} color={soloFavoritos ? colors.white : accent} size={22} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={grilla ? 'Ver en lista' : 'Ver en cuadrícula'}
            onPress={() => setVista(grilla ? 'lista' : 'cuadricula')}
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.lineSoft : colors.card, alignItems: 'center', justifyContent: 'center' })}
          >
            <Icono name={grilla ? 'view-list-outline' : 'view-grid-outline'} color={accent} size={22} />
          </Pressable>
        </View>
        <Atajos
          rubro={rubro}
          soloOfertas={soloOfertas}
          masPedidos={masPedidos}
          accent={accent}
          onOfertas={() => setSoloOfertas(!soloOfertas)}
          onMasPedidos={() => setMasPedidos(!masPedidos)}
          onVerRubros={() => setVerRubros(true)}
          onQuitarRubro={() => setRubro('')}
        />
      </View>
      <Resumen total={total} q={q} rubro={rubro} soloOfertas={soloOfertas} masPedidos={masPedidos} soloFavoritos={soloFavoritos} onLimpiar={limpiar} />

      {catalogo.isLoading ? (
        <Cargando />
      ) : catalogo.error ? (
        <View style={{ padding: 16 }}>
          <Aviso texto={catalogo.error.message} accion={<Boton variante="borde" chico onPress={() => catalogo.refetch()}>Reintentar</Boton>} />
        </View>
      ) : (
        <FlatList
          // numColumns no puede cambiar en caliente: la key fuerza a rearmar la lista.
          key={`${vista}-${columnas}`}
          data={productos}
          keyExtractor={(p) => p.id}
          numColumns={columnas}
          columnWrapperStyle={columnas > 1 ? { gap: GAP } : undefined}
          contentContainerStyle={{ padding: PAD, paddingTop: 8, gap: GAP, paddingBottom: lineas.length ? 100 : 24 }}
          renderItem={({ item }) => (
            <View style={anchoItem ? { width: anchoItem } : undefined}>
              {grilla ? (
                <ProductoTarjeta producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} favorito={favoritosSet.has(item.id)} onFavorito={onFavorito} onAbrir={setAbierto} />
              ) : (
                <ProductoFila producto={item} cantidad={carrito[item.id]?.cantidad ?? 0} accent={accent} onCambiar={cambiar} favorito={favoritosSet.has(item.id)} onFavorito={onFavorito} onAbrir={setAbierto} />
              )}
            </View>
          )}
          onEndReached={() => catalogo.hasNextPage && !catalogo.isFetchingNextPage && catalogo.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={catalogo.isFetchingNextPage ? <Cargando /> : null}
          ListEmptyComponent={<SinResultados q={q} accent={accent} soloFavoritos={soloFavoritos} onLimpiar={limpiar} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {lineas.length > 0 && <CarritoFlotante cantidad={lineas.length} total={estimado} accent={accent} />}

      <SelectorRubros visible={verRubros} rubros={rubros} activo={rubro} color={accent} onElegir={setRubro} onCerrar={() => setVerRubros(false)} />
      <HojaProducto producto={abierto} slug={slug!} accent={accent} favorito={abierto ? favoritosSet.has(abierto.id) : false} onFavorito={onFavorito} onCerrar={() => setAbierto(null)} />
    </View>
  );
}
