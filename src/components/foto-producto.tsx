// Foto del producto en la lista (miniatura); si tiene foto, al tocarla se abre la grande (tocar para cerrar).
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FichaProducto, Icono, T } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { colors, radius } from '@/theme';

interface Props {
  nombre: string;
  /** Foto grande: la que se abre al tocar. */
  imagenUrl?: string | null;
  /** Miniatura de 300 px para la ficha chica; sin ella se usa la grande. */
  miniUrl?: string | null;
  size?: number;
  /** A todo el ancho, cuadrada (tarjeta de la cuadrícula). */
  llenar?: boolean;
  /** Sin uso: sin foto se muestra el logo de la distribuidora. */
  rubro?: string | null;
}

export function FotoProducto({ nombre, imagenUrl, miniUrl, size, llenar }: Props) {
  const [abierta, setAbierta] = useState(false);
  const logoUrl = useComercioActivo().comercio?.logoUrl;
  const ficha = <FichaProducto imagenUrl={miniUrl ?? imagenUrl} size={size} llenar={llenar} logoUrl={logoUrl} />;
  if (!imagenUrl) return ficha;
  return (
    <>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Ver foto de ${nombre}`} onPress={() => setAbierta(true)} hitSlop={4} style={llenar ? { width: '100%' } : undefined}>
        {ficha}
      </Pressable>
      <Modal visible={abierta} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAbierta(false)}>
        <Pressable accessibilityLabel="Cerrar foto" onPress={() => setAbierta(false)} style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20, gap: 12 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, aspectRatio: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden' }}>
            <Image source={{ uri: imagenUrl }} style={{ flex: 1, margin: 12 }} contentFit="contain" cachePolicy="disk" accessibilityLabel={nombre} />
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
