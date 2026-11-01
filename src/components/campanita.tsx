// Campanita de la barra superior: abre "Notificaciones" y muestra cuántas hay sin ver.
// Solo con sesión y comercio vinculado (el visitante no tiene historial).
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { contarNoLeidas } from '@/lib/no-leidas';
import { useNotificaciones } from '@/lib/queries';
import { useNotificacionesVistas } from '@/state/notificaciones';
import { colors, fonts, radius } from '@/theme';

export function Campanita() {
  const { slug, visitante, conSesion, accent } = useComercioActivo();
  const activa = conSesion && !visitante && !!slug;
  const notificaciones = useNotificaciones(slug, activa);
  const vistasHasta = useNotificacionesVistas((s) => (slug ? s.vistasHasta[slug] : undefined));
  const { refetch } = notificaciones;

  // Al volver a la app se pregunta de nuevo (un aviso pudo llegar con la app cerrada).
  useEffect(() => {
    if (!activa) return;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void refetch();
    });
    return () => sub.remove();
  }, [activa, refetch]);

  if (!activa) return null;
  const noLeidas = contarNoLeidas(notificaciones.data?.items ?? [], vistasHasta);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin ver` : 'Notificaciones'}
      onPress={() => router.push('/notificaciones')}
      hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icono name={noLeidas > 0 ? 'bell-ring-outline' : 'bell-outline'} size={20} color={noLeidas > 0 ? accent : colors.ink} />
      {noLeidas > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: colors.errorInk,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 14 }}>{noLeidas > 9 ? '9+' : noLeidas}</T>
        </View>
      )}
    </Pressable>
  );
}
