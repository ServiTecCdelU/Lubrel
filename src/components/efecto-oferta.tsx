// Efectos de las ofertas: la insignia del descuento late y un brillo cruza la foto de la oferta.
// Un solo reloj animado para toda la app (con el driver nativo): 30 productos en oferta en
// pantalla no suman 30 animaciones.
import { useEffect, useState } from 'react';
import { Animated, Easing, View, type LayoutChangeEvent } from 'react-native';
import { Icono, T } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';

const latido = new Animated.Value(0);
const brillo = new Animated.Value(0);
let andando = false;

function arrancar() {
  if (andando) return;
  andando = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(latido, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(latido, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(700),
    ]),
  ).start();
  Animated.loop(
    Animated.sequence([
      Animated.timing(brillo, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(brillo, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]),
  ).start();
}

/** "−15%" (o "Oferta") que late, con el fueguito. */
export function InsigniaOferta({ texto, color, grande = false }: { texto: string; color: string; grande?: boolean }) {
  useEffect(arrancar, []);
  const escala = latido.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: grande ? 10 : 7,
        paddingVertical: grande ? 4 : 2,
        borderRadius: radius.pill,
        backgroundColor: color,
        transform: [{ scale: escala }],
        elevation: 2,
        shadowColor: color,
        shadowOpacity: 0.35,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      <Icono name="fire" size={grande ? 15 : 12} color={colors.white} />
      <T style={{ fontFamily: fonts.bodySemi, fontSize: grande ? 14 : 12, color: colors.white }}>{texto}</T>
    </Animated.View>
  );
}

/** Franja de luz que cruza el contenedor (va encima, sin tapar los toques). */
export function BrilloOferta() {
  useEffect(arrancar, []);
  const [ancho, setAncho] = useState(0);
  const medir = (e: LayoutChangeEvent) => setAncho(Math.round(e.nativeEvent.layout.width));
  const x = brillo.interpolate({ inputRange: [0, 1], outputRange: [-ancho, ancho * 1.5] });
  return (
    <View pointerEvents="none" onLayout={medir} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
      {ancho > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -40,
            bottom: -40,
            width: Math.max(28, ancho * 0.18),
            backgroundColor: 'rgba(255,255,255,0.45)',
            transform: [{ translateX: x }, { rotate: '20deg' }],
          }}
        />
      )}
    </View>
  );
}
