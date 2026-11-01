// Botón "Continuar con Google" del ingreso: la acción principal, con el estilo que pide Google
// (fondo blanco, borde gris, logo de colores). Grande para el dedo pero sin ocupar media pantalla.
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';

const LOGO = require('../../assets/images/google-g.png');

export function BotonGoogle({ onPress, cargando = false, disabled = false }: { onPress: () => void; cargando?: boolean; disabled?: boolean }) {
  const inactivo = disabled || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => ({
        height: 54,
        width: '100%',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: pressed ? '#94a3b8' : '#cbd5e1',
        backgroundColor: pressed ? '#f1f5f9' : colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 16,
        opacity: disabled && !cargando ? 0.55 : 1,
        // Sombra suave: se lee como el botón principal sin ser un bloque de color.
        shadowColor: '#0f172a',
        shadowOpacity: pressed ? 0.04 : 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: pressed ? 1 : 2,
      })}
    >
      {cargando ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <View style={{ width: 24, height: 24 }}>
          <Image source={LOGO} style={{ width: 24, height: 24 }} contentFit="contain" />
        </View>
      )}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: '#1f2937' }} numberOfLines={1}>
        {cargando ? 'Ingresando…' : 'Continuar con Google'}
      </Text>
    </Pressable>
  );
}
