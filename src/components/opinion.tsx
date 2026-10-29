// Opiniones sobre la app: hoja con estrellas y texto (calificación, comentario o
// recomendación), la pregunta automática (después del 2.º pedido y cada tanto) y la tarjeta
// "La app" de Cuenta. Lo que se envía lo ven ServiTec (superadmin) y la distribuidora
// (salvo las recomendaciones). Con 4 o 5 estrellas se invita a calificar en Google Play.
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { anchoHoja } from '@/components/marco-app';
import { Aviso, Boton, Icono, T, Tarjeta, type IconName } from '@/components/ui';
import { useEnviarOpinion, type OpinionApp } from '@/lib/queries';
import { abrirTienda } from '@/lib/tienda';
import { useOpinionesStore } from '@/state/opiniones';
import { colors, fonts, radius, tarjetaBase, tint } from '@/theme';

const NOMBRE_APP = Constants.expoConfig?.name ?? 'la app';

function Estrellas({ valor, accent, onCambiar }: { valor: number; accent: string; onCambiar: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} accessibilityState={{ selected: n <= valor }} onPress={() => onCambiar(n)} hitSlop={4}>
          <Icono name={n <= valor ? 'star' : 'star-outline'} size={38} color={n <= valor ? '#F5B301' : colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

export function HojaOpinion({
  visible,
  slug,
  accent,
  tipo,
  origen,
  titulo,
  detalle,
  onCerrar,
}: {
  visible: boolean;
  slug: string;
  accent: string;
  tipo: OpinionApp['tipo'];
  origen: OpinionApp['origen'];
  titulo: string;
  detalle: string;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const enviar = useEnviarOpinion(slug);
  const marcarCalificoEnPlay = useOpinionesStore((s) => s.marcarCalificoEnPlay);
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState('');
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conEstrellas = tipo !== 'recomendacion';

  // Al abrir, vacía (ajuste durante el render, como HojaDatosComercio).
  const [abierta, setAbierta] = useState(false);
  if (visible !== abierta) {
    setAbierta(visible);
    if (visible) {
      setEstrellas(0);
      setTexto('');
      setEnviada(false);
      setError(null);
    }
  }

  const mandar = () => {
    if (!estrellas && !texto.trim()) {
      setError(conEstrellas ? 'Elegí las estrellas o escribinos algo.' : 'Escribí tu recomendación.');
      return;
    }
    setError(null);
    enviar.mutate(
      { tipo, origen, estrellas: estrellas || null, texto: texto.trim() || null },
      { onSuccess: () => setEnviada(true), onError: (e) => setError(e.message) },
    );
  };

  const calificarEnPlay = () => {
    marcarCalificoEnPlay();
    abrirTienda();
    onCerrar();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Cerrar" onPress={onCerrar} style={{ flex: 1 }} />
        <View style={[anchoHoja, { maxHeight: '90%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
            {enviada ? (
              <>
                <T v="h1">¡Gracias!</T>
                <T v="chico" style={{ fontSize: 14 }}>
                  {estrellas >= 4 ? `¿Nos ayudás calificando ${NOMBRE_APP} en Google Play? Son dos toques.` : 'Tu opinión nos ayuda a mejorar la app.'}
                </T>
                {estrellas >= 4 && (
                  <Boton color={accent} icono="google-play" onPress={calificarEnPlay}>
                    Calificar en Google Play
                  </Boton>
                )}
                <Boton variante="borde" onPress={onCerrar}>Listo</Boton>
              </>
            ) : (
              <>
                <View style={{ gap: 6 }}>
                  <T v="h1">{titulo}</T>
                  <T v="chico" style={{ fontSize: 14 }}>{detalle}</T>
                </View>
                {conEstrellas && <Estrellas valor={estrellas} accent={accent} onCambiar={setEstrellas} />}
                <TextInput
                  value={texto}
                  onChangeText={setTexto}
                  placeholder={tipo === 'recomendacion' ? '¿Qué le agregarías o cambiarías a la app?' : 'Contanos (opcional)'}
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Tu opinión"
                  multiline
                  maxLength={1000}
                  style={{ minHeight: 96, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, fontSize: 15, fontFamily: fonts.body, color: colors.ink, textAlignVertical: 'top' }}
                />
                {error && <Aviso texto={error} />}
                <Boton color={accent} icono="send" onPress={mandar} cargando={enviar.isPending}>Enviar</Boton>
                <Boton variante="borde" onPress={onCerrar} disabled={enviar.isPending}>Ahora no</Boton>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Preguntas automáticas: va en el layout de la app, solo con un comercio vinculado. */
export function PreguntaOpinion({ slug, accent }: { slug: string; accent: string }) {
  const pendiente = useOpinionesStore((s) => s.pendiente);
  const revisarPeriodica = useOpinionesStore((s) => s.revisarPeriodica);
  const respondida = useOpinionesStore((s) => s.respondida);
  const marcarCalificoEnPlay = useOpinionesStore((s) => s.marcarCalificoEnPlay);

  useEffect(() => {
    revisarPeriodica();
  }, [revisarPeriodica]);

  if (pendiente === 'segundo_pedido') {
    return (
      <HojaOpinion
        visible
        slug={slug}
        accent={accent}
        tipo="calificacion"
        origen="segundo_pedido"
        titulo="¿Qué te parece la app?"
        detalle="Ya hiciste dos pedidos. Contestar es opcional."
        onCerrar={respondida}
      />
    );
  }
  if (pendiente !== 'periodico') return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={respondida}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={[tarjetaBase, anchoHoja, { padding: 20, gap: 14, borderRadius: radius.lg }]}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: tint(accent), alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="star-outline" size={26} color={accent} />
          </View>
          <View style={{ gap: 6 }}>
            <T v="h2">Calificá la app</T>
            <T v="chico" style={{ fontSize: 14, lineHeight: 20 }}>Si {NOMBRE_APP} te sirve, dejanos tu calificación en Google Play. Nos ayuda mucho.</T>
          </View>
          <Boton color={accent} icono="google-play" onPress={() => { marcarCalificoEnPlay(); abrirTienda(); }}>
            Calificar
          </Boton>
          <Boton variante="borde" onPress={respondida}>Más tarde</Boton>
        </View>
      </View>
    </Modal>
  );
}

function Fila({ icono, texto, accent, onPress }: { icono: IconName; texto: string; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}
    >
      <Icono name={icono} size={22} color={accent} />
      <T v="fuerte" style={{ flex: 1, fontSize: 14 }}>{texto}</T>
      <Icono name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

/** Tarjeta "La app" de Cuenta: calificar en Play, comentar y recomendar. */
export function TarjetaApp({ slug, accent }: { slug: string; accent: string }) {
  const marcarCalificoEnPlay = useOpinionesStore((s) => s.marcarCalificoEnPlay);
  const [hoja, setHoja] = useState<'comentario' | 'recomendacion' | null>(null);
  return (
    <Tarjeta style={{ gap: 2 }}>
      <T v="etiqueta" style={{ marginBottom: 4 }}>La app</T>
      <Fila icono="google-play" texto="Calificar la app" accent={accent} onPress={() => { marcarCalificoEnPlay(); abrirTienda(); }} />
      <Fila icono="comment-text-outline" texto="Dejar un comentario" accent={accent} onPress={() => setHoja('comentario')} />
      <Fila icono="lightbulb-on-outline" texto="Enviar una recomendación" accent={accent} onPress={() => setHoja('recomendacion')} />
      <HojaOpinion
        visible={hoja !== null}
        slug={slug}
        accent={accent}
        tipo={hoja ?? 'comentario'}
        origen="cuenta"
        titulo={hoja === 'recomendacion' ? 'Tu recomendación' : 'Tu comentario'}
        detalle={hoja === 'recomendacion' ? 'Contanos qué mejorarías. Lo lee el equipo que hace la app.' : 'Contanos qué te parece la app.'}
        onCerrar={() => setHoja(null)}
      />
    </Tarjeta>
  );
}
