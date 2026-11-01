// Foto del producto en la lista; si tiene foto, al tocarla se abre grande (tocar para cerrar).
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FichaProducto, Icono, T } from '@/components/ui';
import { colors, radius } from '@/theme';

interface Props {
  nombre: string;
  imagenUrl?: string | null;
  size?: number;
  /** Sin foto se muestra el ícono del rubro. */
  rubro?: string | null;
}

export function FotoProducto({ nombre, imagenUrl, size, rubro }: Props) {
  const [abierta, setAbierta] = useState(false);
  const ficha = <FichaProducto imagenUrl={imagenUrl} size={size} rubro={rubro} nombre={nombre} />;
  if (!imagenUrl) return ficha;
  return (
    <>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Ver foto de ${nombre}`} onPress={() => setAbierta(true)} hitSlop={4}>
        {ficha}
      </Pressable>
      <Modal visible={abierta} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAbierta(false)}>
        <Pressable accessibilityLabel="Cerrar foto" onPress={() => setAbierta(false)} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20, gap: 12 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, aspectRatio: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden' }}>
            <Image source={{ uri: imagenUrl }} style={{ flex: 1, margin: 12 }} contentFit="contain" accessibilityLabel={nombre} />
          </View>
          <T v="fuerte" style={{ color: colors.white, textAlign: 'center' }} numberOfLines={3}>{nombre}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icono name="close" size={16} color={colors.white} />
            <T style={{ color: colors.white, fontSize: 13 }}>Tocá para cerrar</T>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
