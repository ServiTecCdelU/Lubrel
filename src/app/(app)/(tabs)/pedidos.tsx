// Pedidos: lista con estado (como la tabla de Pedidos del panel, en versión celular).
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { EstadoPedidoInsignia } from '@/components/estado-pedido';
import { columnaAncha, columnaLectura, useEsAncha } from '@/components/marco-app';
import { BannerRegistro } from '@/components/registro';
import { Aviso, Boton, Cargando, Icono, T, Vacio } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, precio } from '@/lib/format';
import { usePedidos } from '@/lib/queries';
import { colors, tarjetaBase } from '@/theme';

export default function MisPedidos() {
  const { slug, accent, visitante, conSesion } = useComercioActivo();
  const pedidos = usePedidos(slug!, !visitante);
  // En tablet apaisada y PC, dos columnas de pedidos.
  const columnas = useEsAncha() ? 2 : 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Pedidos" subtitulo="Tus pedidos y su estado" color={accent} />
      {visitante ? (
        <View style={[columnaLectura, { padding: 16, gap: 12 }]}>
          <BannerRegistro conSesion={conSesion} accent={accent} />
          <T v="chico" style={{ textAlign: 'center', paddingTop: 12 }}>Cuando te registres vas a ver acá tus pedidos y su estado.</T>
        </View>
      ) : pedidos.isLoading ? (
        <Cargando />
      ) : pedidos.error ? (
        <View style={[columnaLectura, { padding: 16 }]}><Aviso texto={pedidos.error.message} /></View>
      ) : (
        <FlatList
          key={columnas}
          data={pedidos.data}
          keyExtractor={(p) => p.id}
          numColumns={columnas}
          columnWrapperStyle={columnas > 1 ? { gap: 8 } : undefined}
          contentContainerStyle={[columnas > 1 ? columnaAncha : columnaLectura, { padding: 16, gap: 8 }]}
          refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
          ListEmptyComponent={
            <Vacio
              icono="clipboard-text-outline"
              titulo="Todavía no hiciste pedidos"
              detalle="Cuando envíes el primero lo vas a seguir desde acá: recibido, preparando, en reparto y entregado."
              accion={<Boton variante="suave" color={accent} chico icono="package-variant-closed" onPress={() => router.navigate('/catalogo')}>Ver productos</Boton>}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/pedidos/[id]', params: { id: item.id } })}
              style={({ pressed }) => [tarjetaBase, { flex: 1, maxWidth: columnas > 1 ? '50%' : undefined, padding: 14, gap: 8, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <T v="fuerte" style={{ fontSize: 14 }}>
                  {item.numero ? `Pedido N° ${item.numero}` : 'Pedido'}
                </T>
                <EstadoPedidoInsignia estado={item.estado} retenido={item.retenido} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="chico">
                  {fechaCorta(item.fecha)} · {item.cantidadProductos} productos{item.desdeApp ? '' : ' · por tu vendedor'}
                </T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <T v="numero" style={{ fontSize: 15 }}>{precio(item.total)}</T>
                  <Icono name="chevron-right" color={colors.muted} size={18} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
