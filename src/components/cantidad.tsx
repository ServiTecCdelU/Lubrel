// Controles de cantidad del catálogo y el carrito: "+" chico para agregar y un selector
// compacto [−] [número] [+] donde el número se toca y se tipea (1 o 1000 igual de fácil).
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icono, T } from '@/components/ui';
import { equivalencia, parsearCantidad, unidadDeVenta } from '@/lib/cantidad';
import { vibrarAgregado, vibrarSeleccion } from '@/lib/haptica';
import { colors, fonts, radius } from '@/theme';

// 40: cómodo con el dedo (el área táctil llega a 44+ con el hitSlop).
const ALTO = 40;

export function BotonAgregar({ color, onPress, etiqueta }: { color: string; onPress: () => void; etiqueta: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={() => {
        vibrarAgregado();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({ width: ALTO, height: ALTO, borderRadius: ALTO / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <Icono name="plus" color={colors.white} size={20} />
    </Pressable>
  );
}

export function SelectorCantidad({
  cantidad,
  onCambiar,
  color,
  nombre,
}: {
  cantidad: number;
  onCambiar: (cantidad: number) => void;
  color: string;
  nombre: string;
}) {
  // Mientras se tipea se edita un texto local; se confirma al salir o al dar "Listo".
  const [texto, setTexto] = useState<string | null>(null);
  const confirmar = () => {
    if (texto === null) return;
    onCambiar(parsearCantidad(texto));
    setTexto(null);
  };
  const boton = { width: ALTO, height: ALTO, alignItems: 'center', justifyContent: 'center' } as const;
  const paso = (n: number) => {
    vibrarSeleccion();
    onCambiar(n);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: ALTO, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar uno de ${nombre}`} onPress={() => paso(cantidad - 1)} style={boton} hitSlop={4}>
        <Icono name={cantidad <= 1 ? 'trash-can-outline' : 'minus'} color={colors.inkSoft} size={16} />
      </Pressable>
      <TextInput
        accessibilityLabel={`Cantidad de ${nombre}`}
        value={texto ?? String(cantidad)}
        onChangeText={(t) => setTexto(t.replace(/\D/g, '').slice(0, 5))}
        onFocus={() => setTexto(String(cantidad))}
        onBlur={confirmar}
        onSubmitEditing={confirmar}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        maxLength={5}
        style={{ minWidth: 38, maxWidth: 58, height: ALTO, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 15, color, paddingHorizontal: 2 }}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`Sumar uno de ${nombre}`} onPress={() => paso(cantidad + 1)} style={boton} hitSlop={4}>
        <Icono name="plus" color={color} size={16} />
      </Pressable>
    </View>
  );
}

/** "10 bultos · 120 u" debajo del selector. */
export function DetalleCantidad({ cantidad, unidadesPorBulto, seDivideEn }: { cantidad: number; unidadesPorBulto: number | null; seDivideEn: number | null }) {
  const eq = equivalencia(cantidad, unidadesPorBulto, seDivideEn);
  return (
    <T v="chico" style={{ fontSize: 12, textAlign: 'center' }} numberOfLines={1}>
      {unidadDeVenta(unidadesPorBulto, seDivideEn, cantidad)}
      {eq ? ` · ${eq}` : ''}
    </T>
  );
}
