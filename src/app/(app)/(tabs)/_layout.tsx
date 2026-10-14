import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEsAncha } from '@/components/marco-app';
import { RecordatorioRegistro } from '@/components/registro';
import { Icono, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { monitorearDistribuidora } from '@/lib/monitoreo';
import { useCarrito } from '@/state/carrito';
import { useRegistroStore } from '@/state/registro';
import { colors, fonts, tint } from '@/theme';

/** Ícono de contorno; la pestaña activa pasa a la versión rellena. */
const icono = (name: IconName, activo: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icono name={focused ? activo : name} color={color} size={22} />;
  };

export default function TabsLayout() {
  const { slug, accent, visitante, conSesion } = useComercioActivo();
  const carrito = useCarrito(slug);
  const lineas = Object.keys(carrito).length;
  const recordarSiToca = useRegistroStore((s) => s.recordarSiToca);
  // Tablet apaisada y PC: el menú pasa a una barra lateral con ícono y nombre.
  const ancha = useEsAncha();
  // Alto de la barra + el de los botones o gestos del celular, para que no queden encimados.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visitante) recordarSiToca();
  }, [visitante, recordarSiToca]);

  useEffect(() => {
    monitorearDistribuidora(slug);
  }, [slug]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarPosition: ancha ? 'left' : 'bottom',
          tabBarLabelPosition: ancha ? 'beside-icon' : 'below-icon',
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: ancha ? 14 : 11 },
          tabBarStyle: ancha
            ? { backgroundColor: colors.card, borderRightColor: colors.line, paddingTop: 12, width: 220, minWidth: 220 }
            : { backgroundColor: colors.card, borderTopColor: colors.line, height: 58 + insets.bottom, paddingTop: 6 },
          tabBarActiveBackgroundColor: ancha ? tint(accent, 0.1) : undefined,
          tabBarBadgeStyle: { backgroundColor: accent, fontFamily: fonts.bodySemi, fontSize: 11 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('view-dashboard-outline', 'view-dashboard') }} />
        <Tabs.Screen name="catalogo" options={{ title: 'Productos', tabBarIcon: icono('package-variant-closed', 'package-variant') }} />
        <Tabs.Screen
          name="pedido"
          options={{ title: 'Carrito', tabBarIcon: icono('cart-outline', 'cart'), tabBarBadge: lineas > 0 ? lineas : undefined }}
        />
        <Tabs.Screen name="pedidos" options={{ title: 'Pedidos', tabBarIcon: icono('clipboard-list-outline', 'clipboard-list') }} />
        <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', tabBarIcon: icono('wallet-outline', 'wallet') }} />
      </Tabs>
      {visitante && <RecordatorioRegistro conSesion={conSesion} accent={accent} />}
    </>
  );
}
