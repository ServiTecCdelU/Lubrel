// Hoja "Datos de tu comercio": nombre del negocio, dirección, localidad y teléfono.
// Se abre al confirmar el pedido si a la ficha le falta alguno (la distribuidora los
// necesita para entregar) y desde Cuenta para corregirlos. Van a la ficha del cliente.
// Si la distribuidora habilitó ciudades, la localidad se elige de esa lista (o por GPS).
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { anchoHoja } from '@/components/marco-app';
import { CampoCiudad } from '@/components/selector-ciudad';
import { Aviso, Boton, Cargando, Icono, T } from '@/components/ui';
import { errorDatosComercio } from '@/lib/datos-comercio';
import { useCiudades, useGuardarDatosComercio } from '@/lib/queries';
import type { DatosComercio } from '@/lib/tipos';
import { colors, fonts, radius, tint } from '@/theme';

const VACIOS: DatosComercio = { negocio: '', direccion: '', localidad: '', telefono: '' };

export function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T v="etiqueta">{etiqueta}</T>
      <TextInput
        {...props}
        accessibilityLabel={etiqueta}
        placeholderTextColor={colors.muted}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        style={{ height: 48, borderRadius: radius.md, borderWidth: enfocado ? 2 : 1, borderColor: enfocado ? colors.tealInk : colors.line, paddingHorizontal: enfocado ? 13 : 14, fontSize: 15, fontFamily: fonts.body, color: colors.ink, backgroundColor: colors.card }}
      />
    </View>
  );
}

export function HojaDatosComercio({
  visible,
  slug,
  inicial,
  accent,
  titulo = 'Datos de tu comercio',
  detalle = 'La distribuidora los necesita para entregarte el pedido. Los pedimos una sola vez.',
  textoBoton = 'Guardar',
  onCerrar,
  onGuardado,
}: {
  visible: boolean;
  slug: string;
  inicial?: Partial<DatosComercio>;
  accent: string;
  titulo?: string;
  detalle?: string;
  textoBoton?: string;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const insets = useSafeAreaInsets();
  const guardar = useGuardarDatosComercio(slug);
  const ciudadesQuery = useCiudades(slug, visible);
  const ciudades = ciudadesQuery.data ?? [];
  const [datos, setDatos] = useState<DatosComercio>(VACIOS);
  const [error, setError] = useState<string | null>(null);
  // Al abrir se precarga lo que ya tiene la ficha (ajuste durante el render, no en un efecto).
  const [abierto, setAbierto] = useState(false);
  if (visible !== abierto) {
    setAbierto(visible);
    if (visible) {
      setDatos({ ...VACIOS, ...Object.fromEntries(Object.entries(inicial ?? {}).map(([k, v]) => [k, v ?? ''])) });
      setError(null);
    }
  }

  const cambiar = (campo: keyof DatosComercio) => (texto: string) => setDatos((d) => ({ ...d, [campo]: texto }));

  const enviar = () => {
    const problema = errorDatosComercio(datos);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    const limpios = {
      negocio: datos.negocio.trim(),
      direccion: datos.direccion.trim(),
      localidad: datos.localidad.trim(),
      telefono: datos.telefono.trim(),
      ...(datos.lat != null && datos.lng != null ? { lat: datos.lat, lng: datos.lng } : {}),
      ...(ciudades.length > 0 ? { ciudadDeLista: true } : {}),
    };
    guardar.mutate(limpios, { onSuccess: onGuardado, onError: (e) => setError(e.message) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCerrar} style={{ flex: 1 }} />
        <View style={[anchoHoja, { maxHeight: '90%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="storefront-outline" color={accent} size={26} />
            </View>
            <View style={{ gap: 6 }}>
              <T v="h1">{titulo}</T>
              <T v="chico" style={{ fontSize: 14 }}>{detalle}</T>
            </View>

            <Campo etiqueta="Nombre del negocio" value={datos.negocio} onChangeText={cambiar('negocio')} placeholder="Ej.: Almacén Don Pepe" autoCapitalize="words" returnKeyType="next" />
            <Campo etiqueta="Dirección" value={datos.direccion} onChangeText={cambiar('direccion')} placeholder="Calle y número" autoCapitalize="words" returnKeyType="next" />
            {/* Mientras carga, o si falló, no se ofrece escribirla: el servidor la pediría de la lista. */}
            {ciudadesQuery.isPending ? (
              <Cargando />
            ) : ciudadesQuery.isError ? (
              <Aviso texto="No pudimos cargar las localidades." accion={<Boton variante="borde" chico onPress={() => ciudadesQuery.refetch()}>Reintentar</Boton>} />
            ) : ciudades.length > 0 ? (
              <CampoCiudad
                valor={datos.localidad}
                ciudades={ciudades}
                accent={accent}
                onElegir={(localidad, ubicacion) => setDatos((d) => ({ ...d, localidad, lat: ubicacion?.lat ?? null, lng: ubicacion?.lng ?? null }))}
              />
            ) : (
              <Campo etiqueta="Localidad" value={datos.localidad} onChangeText={cambiar('localidad')} placeholder="Ej.: Concepción del Uruguay" autoCapitalize="words" returnKeyType="next" />
            )}
            <Campo etiqueta="Teléfono" value={datos.telefono} onChangeText={cambiar('telefono')} placeholder="Ej.: 3442 123456" keyboardType="phone-pad" returnKeyType="done" onSubmitEditing={enviar} />

            {error && <Aviso texto={error} />}
            <Boton color={accent} icono="check" onPress={enviar} cargando={guardar.isPending}>
              {textoBoton}
            </Boton>
            <Boton variante="borde" onPress={onCerrar} disabled={guardar.isPending}>
              Cancelar
            </Boton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
