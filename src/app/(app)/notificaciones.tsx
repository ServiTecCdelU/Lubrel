// Historial de avisos: cambios de los pedidos y novedades de la distribuidora (mensajes,
// productos nuevos, ofertas). Al abrirla se marcan como vistas (la campanita queda sin número).
// Si llega con ?producto=<id> (tocaron el push de un producto) abre ese producto de una.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { HojaProducto } from '@/components/detalle-producto';
import { columnaLectura } from '@/components/marco-app';
import { Aviso, Cargando, Icono, T, Vacio, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaHora } from '@/lib/format';
import { useNotificaciones, useProductoPorId } from '@/lib/queries';
import type { NotificacionApp } from '@/lib/tipos';
import { useNotificacionesVistas } from '@/state/notificaciones';
import { colors, radius, tarjetaBase, tint } from '@/theme';

const ICONO: Record<NotificacionApp['tipo'], IconName> = {
  pedido: 'truck-delivery-outline',
  novedad: 'bullhorn-outline',
  producto: 'new-box',
  oferta: 'tag-outline',
  cuenta: 'account-check-outline',
};

/** "Hace 5 min", "Hace 3 h", "Ayer"; más viejo, la fecha. */
function hace(iso: string): string {
  const min = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 1) return 'Recién';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  if (h < 48) return 'Ayer';
  return fechaHora(iso);
}

export default function Notificaciones() {
  const { producto } = useLocalSearchParams<{ producto?: string }>();
  const { slug, accent, comercio } = useComercioActivo();
  const notificaciones = useNotificaciones(slug);
  const marcarVistas = useNotificacionesVistas((s) => s.marcarVistas);
  const [productoId, setProductoId] = useState<string | null>(producto ?? null);
  const abierto = useProductoPorId(slug, productoId);

  // Vistas al abrir y cada vez que llegan avisos nuevos con la pantalla abierta.
  const total = notificaciones.data?.items.length ?? 0;
  useEffect(() => {
    if (slug) marcarVistas(slug);
  }, [slug, total, marcarVistas]);

  const volver = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
      style={{ width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icono name="arrow-left" size={18} />
    </Pressable>
  );

  const tocar = (n: NotificacionApp) => {
    if (n.tipo === 'pedido' && n.data.pedidoId) router.push({ pathname: '/pedidos/[id]', params: { id: n.data.pedidoId } });
    else if (n.data.productoId) setProductoId(n.data.productoId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Notificaciones" subtitulo={comercio?.nombre} color={accent} izquierda={volver} campanita={false} />
      {notificaciones.isLoading ? (
        <Cargando />
      ) : notificaciones.error ? (
        <View style={[columnaLectura, { padding: 16 }]}>
          <Aviso texto={notificaciones.error.message} />
        </View>
      ) : (
        <FlatList
          data={notificaciones.data?.items ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[columnaLectura, { padding: 16, gap: 10, flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={notificaciones.isRefetching} onRefresh={() => notificaciones.refetch()} colors={[accent]} />}
          ListEmptyComponent={
            <Vacio icono="bell-outline" titulo="Todavía no tenés notificaciones" detalle="Acá vas a ver cómo avanzan tus pedidos y las novedades de la distribuidora." />
          }
          renderItem={({ item: n }) => {
            const tocable = (n.tipo === 'pedido' && !!n.data.pedidoId) || !!n.data.productoId;
            return (
              <Pressable
                accessibilityRole={tocable ? 'button' : undefined}
                disabled={!tocable}
                onPress={() => tocar(n)}
                style={[tarjetaBase, { padding: 12, gap: 10 }]}
              >
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: tint(accent, 0.1), alignItems: 'center', justifyContent: 'center' }}>
                    <Icono name={ICONO[n.tipo] ?? 'bell-outline'} size={20} color={accent} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="fuerte" style={{ fontSize: 15 }}>{n.titulo}</T>
                    {n.cuerpo ? <T style={{ fontSize: 14, lineHeight: 20 }}>{n.cuerpo}</T> : null}
                    <T v="chico" style={{ fontSize: 12 }}>{hace(n.createdAt)}</T>
                  </View>
                  {tocable && <Icono name="chevron-right" size={20} color={colors.muted} />}
                </View>
                {n.imagenUrl ? (
                  <Image
                    source={{ uri: n.imagenUrl }}
                    style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.lineSoft }}
                    contentFit="cover"
                    cachePolicy="disk"
                    accessibilityLabel={n.titulo}
                  />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
      {slug && (
        <HojaProducto producto={abierto.data ?? null} slug={slug} accent={accent} onCerrar={() => setProductoId(null)} />
      )}
    </View>
  );
}
