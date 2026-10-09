// Escáner de código de barras: el comercio apunta la cámara a la góndola y ve el producto,
// su precio (con la lista del cliente), si está en oferta, y lo agrega al carrito con cantidad.
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { FotoProducto } from '@/components/foto-producto';
import { Aviso, Boton, Cargando, FichaProducto, Icono, Insignia, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { vibrarExito } from '@/lib/haptica';
import { usePermisoCamara } from '@/hooks/use-permiso-camara';
import { api, ApiError } from '@/lib/api';
import { precio, presentacion } from '@/lib/format';
import type { ProductoApp } from '@/lib/tipos';
import { useCarrito, useCarritoStore } from '@/state/carrito';
import { colors, radius } from '@/theme';

type Estado =
  | { tipo: 'escaneando' }
  | { tipo: 'buscando'; codigo: string }
  | { tipo: 'resultado'; codigo: string; productos: ProductoApp[] }
  | { tipo: 'error'; codigo: string; mensaje: string };

const TIPOS = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] as const;

export default function Escanear() {
  const { slug, accent } = useComercioActivo();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { permiso, habilitar: habilitarCamara } = usePermisoCamara();
  const [estado, setEstado] = useState<Estado>({ tipo: 'escaneando' });
  const [elegido, setElegido] = useState<ProductoApp | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [linterna, setLinterna] = useState(false);
  const [agregado, setAgregado] = useState<string | null>(null);
  // La cámara dispara el mismo código muchas veces por segundo: se procesa uno a la vez.
  const ocupado = useRef(false);

  const carrito = useCarrito(slug);
  const setCantidadCarrito = useCarritoStore((s) => s.setCantidad);
  const lineas = Object.keys(carrito).length;

  const elegir = (p: ProductoApp) => {
    setElegido(p);
    setCantidad(carrito[p.id]?.cantidad || 1);
  };

  const onEscaneo = async ({ data }: BarcodeScanningResult) => {
    if (ocupado.current || !slug) return;
    ocupado.current = true;
    const codigo = data.trim();
    vibrarExito();
    setAgregado(null);
    setEstado({ tipo: 'buscando', codigo });
    try {
      const r = await qc.fetchQuery({
        queryKey: ['escanear', slug, codigo],
        queryFn: () => api<{ codigo: string; productos: ProductoApp[] }>(`/comercios/${slug}/escanear?codigo=${encodeURIComponent(codigo)}`, { auth: 'opcional' }),
        staleTime: 60_000,
      });
      setEstado({ tipo: 'resultado', codigo, productos: r.productos });
      if (r.productos.length === 1) elegir(r.productos[0]);
      else setElegido(null);
    } catch (e) {
      setEstado({ tipo: 'error', codigo, mensaje: e instanceof ApiError ? e.message : 'No se pudo buscar el código' });
    }
  };

  const escanearOtro = () => {
    setEstado({ tipo: 'escaneando' });
    setElegido(null);
    ocupado.current = false;
  };

  const agregar = () => {
    if (!elegido || !slug) return;
    setCantidadCarrito(
      slug,
      {
        productId: elegido.id,
        nombre: elegido.nombre,
        rubro: elegido.rubro,
        precioReferencia: elegido.precioOferta ?? elegido.precio,
        unidadesPorBulto: elegido.unidadesPorBulto,
        seDivideEn: elegido.seDivideEn,
        imageUrl: elegido.imageUrl,
      },
      cantidad,
    );
    setAgregado(`${elegido.nombre} · ${cantidad} en el carrito`);
    escanearOtro();
  };

  if (!permiso) return <Cargando />;

  if (!permiso.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: insets.top + 24, gap: 16, justifyContent: 'center', width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="barcode-scan" color={colors.white} size={28} />
        </View>
        <T v="h1">Escanear productos</T>
        <T v="chico" style={{ fontSize: 14 }}>
          Necesitamos la cámara para leer el código de barras de los productos y agregarlos a tu pedido.
        </T>
        {permiso.canAskAgain ? (
          <Boton color={accent} icono="camera" onPress={habilitarCamara}>Permitir cámara</Boton>
        ) : (
          <>
            <Aviso tono="info" texto="El permiso de cámara está desactivado. Tocá el botón y activá Cámara en Permisos." />
            <Boton color={accent} icono="cog-outline" onPress={habilitarCamara}>Habilitar permisos de cámara</Boton>
          </>
        )}
        <Boton variante="borde" onPress={() => router.back()}>Volver</Boton>
      </View>
    );
  }

  const mostrandoPanel = estado.tipo !== 'escaneando';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={linterna}
        barcodeScannerSettings={{ barcodeTypes: [...TIPOS] }}
        onBarcodeScanned={estado.tipo === 'escaneando' ? onEscaneo : undefined}
      />

      {/* Barra superior */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => router.back()} style={styles.botonRedondo}>
          <Icono name="close" color={colors.white} />
        </Pressable>
        <T v="fuerte" style={{ color: colors.white }}>Escaneá el código de barras</T>
        <Pressable accessibilityRole="button" accessibilityLabel={linterna ? 'Apagar linterna' : 'Prender linterna'} onPress={() => setLinterna(!linterna)} style={styles.botonRedondo}>
          <Icono name={linterna ? 'flashlight-off' : 'flashlight'} color={colors.white} />
        </Pressable>
      </View>

      {/* Marco guía */}
      {!mostrandoPanel && (
        <View pointerEvents="none" style={{ position: 'absolute', top: '32%', left: '10%', right: '10%', height: 150, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.white, opacity: 0.9 }} />
      )}

      {/* Panel inferior */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxWidth: 560, marginHorizontal: 'auto', backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: insets.bottom + 16, gap: 12, maxHeight: '70%' }}>
        {estado.tipo === 'escaneando' && (
          <>
            {agregado ? <Aviso tono="ok" texto={`Agregado: ${agregado}`} /> : <T v="chico" style={{ textAlign: 'center' }}>Apuntá la cámara al código de barras del producto.</T>}
            <Boton variante={lineas ? 'solido' : 'borde'} color={accent} icono="cart-outline" onPress={() => router.navigate('/pedido')}>
              {lineas ? `Ver carrito (${lineas})` : 'Ver carrito'}
            </Boton>
          </>
        )}

        {estado.tipo === 'buscando' && (
          <View style={{ paddingVertical: 12, gap: 8, alignItems: 'center' }}>
            <Cargando />
            <T v="chico">Buscando {estado.codigo}…</T>
          </View>
        )}

        {estado.tipo === 'error' && (
          <>
            <Aviso texto={estado.mensaje} />
            <Boton color={accent} icono="barcode-scan" onPress={escanearOtro}>Escanear de nuevo</Boton>
          </>
        )}

        {estado.tipo === 'resultado' && estado.productos.length === 0 && (
          <>
            <Aviso tono="info" texto={`No encontramos el código ${estado.codigo} en el catálogo de la distribuidora.`} />
            <Boton color={accent} icono="barcode-scan" onPress={escanearOtro}>Escanear otro</Boton>
            <Boton variante="borde" icono="magnify" onPress={() => router.navigate('/catalogo')}>Buscar por nombre</Boton>
          </>
        )}

        {estado.tipo === 'resultado' && estado.productos.length > 1 && !elegido && (
          <>
            <T v="fuerte">Este código corresponde a {estado.productos.length} productos. Elegí uno:</T>
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 8 }}>
              {estado.productos.map((p) => (
                <Pressable key={p.id} accessibilityRole="button" onPress={() => elegir(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line }}>
                  <FichaProducto imagenUrl={p.imageUrl} size={40} />
                  <T style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>{p.nombre}</T>
                  <T v="numero" style={{ fontSize: 15 }}>{precio(p.precioOferta ?? p.precio)}</T>
                </Pressable>
              ))}
            </ScrollView>
            <Boton variante="borde" onPress={escanearOtro}>Escanear otro</Boton>
          </>
        )}

        {estado.tipo === 'resultado' && elegido && (
          <>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <FotoProducto nombre={elegido.nombre} imagenUrl={elegido.imageUrl} size={72} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="fuerte" numberOfLines={2}>{elegido.nombre}</T>
                <T v="chico" style={{ fontSize: 12 }}>
                  {presentacion(elegido.unidadesPorBulto, elegido.seDivideEn)}
                  {elegido.codigo ? ` · Cód. ${elegido.codigo}` : ''}
                </T>
              </View>
            </View>

            {elegido.precioOferta !== null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Insignia texto={`Oferta −${elegido.descuentoPct}%`} bg={accent} fg={colors.white} />
                <T v="numero" style={{ fontSize: 22, color: accent }}>{precio(elegido.precioOferta)}</T>
                <T v="chico" style={{ textDecorationLine: 'line-through' }}>{precio(elegido.precio)}</T>
              </View>
            ) : (
              <T v="numero" style={{ fontSize: 22 }}>{precio(elegido.precio)}</T>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <T v="fuerte" style={{ fontSize: 14 }}>Cantidad</T>
                <T v="chico" style={{ fontSize: 12 }}>
                  Subtotal {precio((elegido.precioOferta ?? elegido.precio) * cantidad)}
                </T>
              </View>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <SelectorCantidad cantidad={cantidad} color={accent} nombre={elegido.nombre} onCambiar={(n) => setCantidad(Math.max(1, n))} />
                <DetalleCantidad cantidad={cantidad} unidadesPorBulto={elegido.unidadesPorBulto} seDivideEn={elegido.seDivideEn} />
              </View>
            </View>

            {carrito[elegido.id] ? (
              <T v="chico" style={{ fontSize: 12 }}>Ya tenés {carrito[elegido.id].cantidad} en el carrito; se reemplaza por esta cantidad.</T>
            ) : null}

            <Boton color={accent} icono="cart-plus" onPress={agregar}>
              {carrito[elegido.id] ? 'Actualizar carrito' : 'Agregar al carrito'}
            </Boton>
            <Boton variante="borde" icono="barcode-scan" onPress={escanearOtro}>Escanear otro</Boton>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
