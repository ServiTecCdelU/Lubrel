// Tarjeta "Código de tu distribuidora": alternativa al QR cuando está lejos, la cámara no
// lee o el vendedor lo dictó por teléfono. Acepta el código corto, el link del QR o el de
// una invitación.
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Aviso, Boton, T, Tarjeta } from '@/components/ui';
import { useVincularCodigo } from '@/hooks/use-vincular-codigo';
import { colors, fonts, radius } from '@/theme';

export function CodigoDistribuidora({ accent, autoFoco = false }: { accent: string; autoFoco?: boolean }) {
  const [texto, setTexto] = useState('');
  const { vincular, cargando, error } = useVincularCodigo();
  const [enfocado, setEnfocado] = useState(false);
  const enviar = () => texto.trim() && vincular(texto);

  return (
    <Tarjeta style={{ gap: 12 }}>
      <View style={{ gap: 2 }}>
        <T v="fuerte" style={{ fontSize: 14 }}>Código de tu distribuidora</T>
        <T v="chico" style={{ fontSize: 13 }}>Te lo da tu vendedor. También sirve el link del QR.</T>
      </View>
      <TextInput
        accessibilityLabel="Código o link de la distribuidora"
        value={texto}
        onChangeText={setTexto}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        onSubmitEditing={enviar}
        placeholder="Ej.: lubrel"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFoco}
        returnKeyType="go"
        style={{ height: 48, borderRadius: radius.md, borderWidth: enfocado ? 2 : 1, borderColor: enfocado ? accent : colors.line, paddingHorizontal: enfocado ? 13 : 14, fontSize: 16, fontFamily: fonts.bodyMedium, color: colors.ink, backgroundColor: colors.card }}
      />
      {error ? <Aviso texto={error} /> : null}
      <Boton color={accent} icono="arrow-right" onPress={enviar} cargando={cargando} disabled={!texto.trim()}>
        Continuar
      </Boton>
    </Tarjeta>
  );
}
