// Barra superior al estilo del header del panel: logo de la distribuidora a la izquierda,
// título de la pantalla, acción y la campanita de notificaciones.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Campanita } from '@/components/campanita';
import { LogoMarca } from '@/components/logo-marca';
import { T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { colors } from '@/theme';

export function BarraSuperior({
  titulo,
  subtitulo,
  color,
  izquierda,
  derecha,
  campanita = true,
}: {
  titulo: string;
  subtitulo?: string;
  color: string;
  izquierda?: ReactNode;
  derecha?: ReactNode;
  /** La pantalla de Notificaciones no la muestra (ya está ahí). */
  campanita?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { comercio } = useComercioActivo();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Siempre la distribuidora (sin nombre todavía: ícono de negocio), nunca la inicial de la pantalla. */}
      {izquierda ?? <LogoMarca nombre={comercio?.nombre ?? ''} logoUrl={comercio?.logoUrl} color={color} />}
      <View style={{ flex: 1 }}>
        <T v="fuerte" numberOfLines={1}>{titulo}</T>
        {subtitulo ? <T v="chico" numberOfLines={1}>{subtitulo}</T> : null}
      </View>
      {derecha}
      {campanita && <Campanita />}
    </View>
  );
}
