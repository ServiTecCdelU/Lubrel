// Primitivas visuales con la identidad del panel del SaaS (estilo shadcn: tarjetas blancas
// con borde, botones teal, rounded-2xl, Geist).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type ColorValue,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ACCENT_DEFAULT, colors, fonts, radius, tarjetaBase, tint } from '@/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icono({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: ColorValue }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

type Variante = 'titulo' | 'h1' | 'h2' | 'cuerpo' | 'fuerte' | 'chico' | 'etiqueta' | 'numero';

const ESTILOS: Record<Variante, TextStyle> = {
  titulo: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  h1: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22 },
  cuerpo: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  fuerte: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  chico: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  etiqueta: { fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 0.3, color: colors.muted },
  // Cifras de ancho fijo: precios y cantidades alineados en listas y resúmenes.
  numero: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
};

export function T({ v = 'cuerpo', style, ...props }: TextProps & { v?: Variante }) {
  return <Text {...props} style={[{ color: colors.ink }, ESTILOS[v], style]} />;
}

export function Boton({
  children,
  onPress,
  color = ACCENT_DEFAULT,
  variante = 'solido',
  icono,
  cargando,
  disabled,
  style,
  chico,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  color?: string;
  /** solido = bg-teal-600; borde = variant="outline"; suave = bg-teal-50 text-teal-700 */
  variante?: 'solido' | 'borde' | 'suave';
  icono?: IconName;
  cargando?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  chico?: boolean;
  accessibilityLabel?: string;
}) {
  const inactivo = disabled || cargando;
  const fondo = variante === 'solido' ? color : variante === 'suave' ? tint(color) : colors.card;
  const texto = variante === 'solido' ? colors.white : variante === 'suave' ? color : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        {
          minHeight: chico ? 40 : 48,
          borderRadius: radius.md,
          paddingHorizontal: chico ? 14 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: fondo,
          borderWidth: variante === 'borde' ? 1 : 0,
          borderColor: colors.line,
          opacity: inactivo ? 0.5 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={texto} />
      ) : (
        <>
          {icono && <Icono name={icono} size={18} color={texto} />}
          <T v="fuerte" style={{ color: texto, fontSize: chico ? 14 : 15 }}>
            {children}
          </T>
        </>
      )}
    </Pressable>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[tarjetaBase, { padding: 16 }, style]}>{children}</View>;
}

/** Encabezado de sección del panel: ícono en cuadrado teal-50 + título + descripción. */
export function Encabezado({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <T v="h1">{titulo}</T>
        {descripcion ? <T v="chico">{descripcion}</T> : null}
      </View>
      {accion}
    </View>
  );
}

export function Chip({
  texto,
  activo,
  color,
  icono,
  onPress,
}: {
  texto: string;
  activo?: boolean;
  color: string;
  icono?: IconName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 36,
        paddingHorizontal: icono ? 12 : 14,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: activo ? color : pressed ? colors.lineSoft : colors.card,
        borderWidth: 1,
        borderColor: activo ? color : colors.line,
      })}
    >
      {icono ? <Icono name={icono} size={16} color={activo ? colors.white : color} /> : null}
      <T style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: activo ? colors.white : colors.inkSoft }}>{texto}</T>
    </Pressable>
  );
}

export function Insignia({ texto, bg, fg, borde }: { texto: string; bg: string; fg: string; borde?: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.pill,
        backgroundColor: bg,
        borderWidth: borde ? 1 : 0,
        borderColor: borde,
      }}
    >
      <T style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: fg }}>{texto}</T>
    </View>
  );
}

/** Foto del producto sobre blanco; sin foto (o si no carga), ícono neutro de paquete (las
 *  iniciales de un código de ERP como "0118 T500GM" no ayudan a reconocer nada). */
export function FichaProducto({ imagenUrl, size = 56 }: { imagenUrl?: string | null; size?: number }) {
  // Se guarda la URL que falló (no un booleano) por si la fila se recicla con otro producto.
  const [fallida, setFallida] = useState<string | null>(null);
  if (imagenUrl && imagenUrl !== fallida) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
        <Image source={{ uri: imagenUrl }} style={{ flex: 1, margin: 2 }} contentFit="contain" onError={() => setFallida(imagenUrl)} />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.lineSoft,
        borderWidth: 1,
        borderColor: colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icono name="package-variant-closed" size={Math.round(size * 0.5)} color={colors.muted} />
    </View>
  );
}

/** Estado vacío de una lista: ícono, título, explicación y una acción. */
export function Vacio({ icono, titulo, detalle, accion }: { icono: IconName; titulo: string; detalle?: string; accion?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 48, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} size={30} color={colors.muted} />
      </View>
      <T v="h2" style={{ textAlign: 'center' }}>{titulo}</T>
      {detalle ? <T v="chico" style={{ textAlign: 'center' }}>{detalle}</T> : null}
      {accion}
    </View>
  );
}

export function Cargando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={ACCENT_DEFAULT} />
    </View>
  );
}

export function Aviso({ texto, tono = 'error', accion }: { texto: string; tono?: 'error' | 'info' | 'ok'; accion?: ReactNode }) {
  const t =
    tono === 'error'
      ? { bg: colors.errorSoft, borde: colors.errorLine, fg: colors.errorInk, icono: 'alert-circle-outline' as const }
      : tono === 'ok'
        ? { bg: colors.okSoft, borde: '#a7f3d0', fg: colors.okInk, icono: 'check-circle-outline' as const }
        : { bg: colors.warnSoft, borde: colors.warnLine, fg: colors.warnInk, icono: 'information-outline' as const };
  return (
    <View style={{ borderRadius: radius.lg, padding: 12, gap: 10, backgroundColor: t.bg, borderWidth: 1, borderColor: t.borde }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icono name={t.icono} color={t.fg} size={18} />
        <T style={{ color: t.fg, fontFamily: fonts.bodyMedium, fontSize: 14, flex: 1 }}>{texto}</T>
      </View>
      {accion}
    </View>
  );
}

/** Fila etiqueta / valor (resúmenes). */
export function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T v="chico" style={{ fontSize: 14 }}>{etiqueta}</T>
      <T v={fuerte ? 'numero' : 'fuerte'} style={{ fontSize: fuerte ? 18 : 14 }}>{valor}</T>
    </View>
  );
}
