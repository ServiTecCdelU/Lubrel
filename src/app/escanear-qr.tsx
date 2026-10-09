// Escáner de QR accesible con o sin sesión:
// - QR de la distribuidora (sin token): la fija y entra (como visitante si no hay sesión).
// - QR de invitación (?inv=): la guarda; el layout de (app) la canjea apenas hay sesión.
// Sin cámara (o si no lee) se puede subir una imagen del QR.
import { CameraView, scanFromURLAsync, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aviso, Boton, Cargando, Icono, T } from '@/components/ui';
import { usePermisoCamara } from '@/hooks/use-permiso-camara';
import { vibrarExito } from '@/lib/haptica';
import { parseQrDistribuidora } from '@/lib/qr-distribuidora';
import { useComercioStore } from '@/state/comercio';
import { ACCENT_DEFAULT, colors, radius } from '@/theme';

type Estado = { tipo: 'escaneando' } | { tipo: 'error'; mensaje: string };

export default function EscanearQr() {
  const insets = useSafeAreaInsets();
  const { permiso, habilitar: habilitarCamara } = usePermisoCamara();
  const [estado, setEstado] = useState<Estado>({ tipo: 'escaneando' });
  const [sinCamara, setSinCamara] = useState(false);
  // La cámara dispara el mismo código muchas veces por segundo: se procesa uno a la vez.
  const ocupado = useRef(false);
  const distribuidoraActual = useComercioStore((s) => s.distribuidora);
  const setDistribuidora = useComercioStore((s) => s.setDistribuidora);
  const setInvitacion = useComercioStore((s) => s.setInvitacion);

  const escanearOtro = () => {
    ocupado.current = false;
    setEstado({ tipo: 'escaneando' });
  };

  const salir = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const procesar = (data: string) => {
    const resultado = parseQrDistribuidora(data);
    if (!resultado) {
      setEstado({ tipo: 'error', mensaje: 'Ese código no es un QR de Leon Express.' });
      return;
    }

    if (resultado.tipo === 'distribuidora') {
      // Alcanza para entrar: como visitante, o con la cuenta si ya tiene sesión.
      setDistribuidora(resultado.slug);
      router.replace('/');
      return;
    }

    const slug = resultado.slug ?? distribuidoraActual;
    if (!slug) {
      setEstado({ tipo: 'error', mensaje: 'No reconocemos la distribuidora de esa invitación. Escaneá el QR que te dio tu vendedor.' });
      return;
    }
    setDistribuidora(slug);
    setInvitacion({ slug, token: resultado.token });
    salir();
  };

  const onEscaneo = ({ data }: BarcodeScanningResult) => {
    if (ocupado.current) return;
    ocupado.current = true;
    vibrarExito();
    procesar(data);
  };

  // Plan B sin cámara (o si no lee): una foto/captura del QR desde la galería.
  const elegirImagen = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (r.canceled || !r.assets[0]) return;
    ocupado.current = true;
    try {
      const codigos = await scanFromURLAsync(r.assets[0].uri, ['qr']);
      if (codigos[0]) procesar(codigos[0].data);
      else setEstado({ tipo: 'error', mensaje: 'No encontramos un QR en esa imagen. Probá con una más nítida o recortada.' });
    } catch {
      setEstado({ tipo: 'error', mensaje: 'No pudimos leer esa imagen.' });
    }
  };

  const botonImagen = (
    <Boton variante="borde" icono="image-outline" onPress={elegirImagen}>
      Subir imagen del QR
    </Boton>
  );

  if (!permiso) return <Cargando />;

  if (!permiso.granted || sinCamara) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: insets.top + 24, gap: 16, justifyContent: 'center', width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.lg, backgroundColor: ACCENT_DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="qrcode-scan" color={colors.white} size={28} />
        </View>
        <T v="h1">Escanear QR</T>
        <T v="chico" style={{ fontSize: 14 }}>
          {sinCamara
            ? 'No pudimos usar la cámara. Subí una foto o captura del QR de la distribuidora o de tu invitación.'
            : 'Necesitamos la cámara para leer el QR de la distribuidora o de tu invitación. Si no, podés subir una imagen del QR.'}
        </T>
        {estado.tipo === 'error' && <Aviso texto={estado.mensaje} />}
        {!sinCamara &&
          (permiso.canAskAgain ? (
            <Boton color={ACCENT_DEFAULT} icono="camera" onPress={habilitarCamara}>Permitir cámara</Boton>
          ) : (
            <>
              <Aviso tono="info" texto="El permiso de cámara está desactivado. Tocá el botón y activá Cámara en Permisos." />
              <Boton color={ACCENT_DEFAULT} icono="cog-outline" onPress={habilitarCamara}>Habilitar permisos de cámara</Boton>
            </>
          ))}
        {botonImagen}
        <Boton variante="borde" onPress={salir}>Volver</Boton>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={estado.tipo === 'escaneando' ? onEscaneo : undefined}
        onMountError={() => setSinCamara(true)}
      />

      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={salir} style={styles.botonRedondo}>
          <Icono name="close" color={colors.white} />
        </Pressable>
        <T v="fuerte" style={{ color: colors.white }}>Escaneá el QR</T>
        <View style={styles.botonRedondo} />
      </View>

      {estado.tipo === 'escaneando' && (
        <View pointerEvents="none" style={{ position: 'absolute', top: '32%', left: '15%', right: '15%', height: 200, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.white, opacity: 0.9 }} />
      )}

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxWidth: 560, marginHorizontal: 'auto', backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: insets.bottom + 16, gap: 12 }}>
        {estado.tipo === 'escaneando' && (
          <T v="chico" style={{ textAlign: 'center' }}>
            Apuntá la cámara al QR de la distribuidora o de tu invitación.
          </T>
        )}

        {estado.tipo === 'error' && (
          <>
            <Aviso texto={estado.mensaje} />
            <Boton color={ACCENT_DEFAULT} icono="qrcode-scan" onPress={escanearOtro}>Escanear de nuevo</Boton>
          </>
        )}

        {botonImagen}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
