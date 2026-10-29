// Campo "Localidad" cuando la distribuidora habilitó ciudades: se elige de la lista (con
// buscador) o con el GPS del celular, nunca escrita a mano.
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, T } from '@/components/ui';
import { ciudadMasCercana, gpsDisponible, obtenerUbicacion } from '@/lib/ubicacion';
import type { CiudadApp } from '@/lib/tipos';
import { colors, fonts, radius, tint } from '@/theme';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CampoCiudad({
  valor,
  ciudades,
  accent,
  onElegir,
}: {
  valor: string;
  ciudades: CiudadApp[];
  accent: string;
  /** Con GPS también vienen las coordenadas, para la ficha. */
  onElegir: (ciudad: string, ubicacion?: { lat: number; lng: number }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [ubicando, setUbicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conGps = gpsDisponible();

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return q ? ciudades.filter((c) => normalizar(c.ciudad).includes(q)) : ciudades;
  }, [ciudades, busqueda]);

  const elegir = (ciudad: string, ubicacion?: { lat: number; lng: number }) => {
    onElegir(ciudad, ubicacion);
    setAbierto(false);
    setBusqueda('');
  };

  const usarGps = async () => {
    setError(null);
    setUbicando(true);
    const r = await obtenerUbicacion();
    setUbicando(false);
    if (!r.ok) return setError(r.error);
    const cerca = ciudadMasCercana(ciudades, r.lat, r.lng);
    if (!cerca) return setError('Tu ubicación no está en ninguna de las localidades donde entrega la distribuidora.');
    elegir(cerca.ciudad, { lat: r.lat, lng: r.lng });
  };

  return (
    <View style={{ gap: 6 }}>
      <T v="etiqueta">Localidad</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={valor ? `Localidad: ${valor}. Cambiar` : 'Elegir localidad'}
          onPress={() => setAbierto(true)}
          style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? colors.lineSoft : colors.card })}
        >
          <T numberOfLines={1} style={{ flex: 1, fontSize: 15, color: valor ? colors.ink : colors.muted }}>{valor || 'Elegí tu localidad'}</T>
          <Icono name="chevron-down" size={20} color={colors.muted} />
        </Pressable>
        {conGps && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación"
            onPress={usarGps}
            disabled={ubicando}
            style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), opacity: pressed || ubicando ? 0.7 : 1, alignItems: 'center', justifyContent: 'center' })}
          >
            <Icono name={ubicando ? 'crosshairs' : 'crosshairs-gps'} size={22} color={accent} />
          </Pressable>
        )}
      </View>
      {error && <Aviso texto={error} />}

      <Modal visible={abierto} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setAbierto(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
          <Pressable accessibilityLabel="Cerrar" onPress={() => setAbierto(false)} style={{ flex: 1 }} />
          <View style={[anchoHoja, { height: '80%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
              <T v="h1" style={{ flex: 1, fontSize: 20 }}>Tu localidad</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setAbierto(false)} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icono name="close" size={20} color={colors.inkSoft} />
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: 16, gap: 8 }}>
              <View style={{ height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                <Icono name="magnify" size={20} color={accent} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar localidad"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Buscar localidad"
                  autoCorrect={false}
                  style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.ink }}
                />
              </View>
              {conGps && (
                <Boton variante="suave" color={accent} chico icono="crosshairs-gps" onPress={usarGps} cargando={ubicando}>
                  Usar mi ubicación
                </Boton>
              )}
            </View>
            <FlatList
              data={visibles}
              keyExtractor={(c) => `${c.provincia}|${c.ciudad}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, gap: 6 }}
              ListEmptyComponent={<T v="chico">La distribuidora no entrega en una localidad con ese nombre.</T>}
              renderItem={({ item }) => {
                const activa = item.ciudad === valor;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={() => elegir(item.ciudad)}
                    style={({ pressed }) => ({ padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: activa ? accent : colors.line, backgroundColor: activa ? tint(accent, 0.06) : pressed ? colors.lineSoft : colors.card, flexDirection: 'row', alignItems: 'center', gap: 8 })}
                  >
                    <Icono name="map-marker-outline" size={18} color={accent} />
                    <T v="fuerte" style={{ flex: 1, fontSize: 14 }}>{item.ciudad}</T>
                    {activa && <Icono name="check" size={18} color={accent} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
