// Cuenta: datos del comercio, puntos de fidelidad, saldo y crédito, movimientos de cuenta
// corriente, informar un pago y cerrar sesión (o registrarse, si es visitante).
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { BarraSuperior } from '@/components/barra-superior';
import { HojaInformarPago, TarjetaMovimientos } from '@/components/cuenta-corriente';
import { LinksCuenta } from '@/components/eliminar-cuenta';
import { HojaDatosComercio } from '@/components/datos-comercio';
import { columnaAncha, columnaLectura, useEsAncha } from '@/components/marco-app';
import { PieServiTec } from '@/components/pie-servitec';
import { VersionApp } from '@/components/version-app';
import { BannerRegistro } from '@/components/registro';
import { Aviso, Boton, Cargando, Fila, Icono, Insignia, T, Tarjeta, type IconName } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { fechaCorta, precio } from '@/lib/format';
import { cerrarSesion } from '@/lib/notificaciones';
import { useCuenta, useMe } from '@/lib/queries';
import type { Cuenta as CuentaApp } from '@/lib/tipos';
import { colors, radius, tint } from '@/theme';

const CLASIFICACION: Record<string, { texto: string; bg: string; fg: string; borde: string }> = {
  normal: { texto: 'Al día', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  atrasado: { texto: 'Con atraso', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  moroso: { texto: 'Saldo vencido', bg: colors.errorSoft, fg: colors.errorInk, borde: colors.errorLine },
};

// Visitante (entró por el QR): registrarse y salir.
function CuentaVisitante() {
  const { accent, comercio, conSesion } = useComercioActivo();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Cuenta" subtitulo={comercio?.nombre} color={accent} />
      <ScrollView contentContainerStyle={[columnaLectura, { padding: 16, gap: 12, paddingBottom: 32 }]}>
        <BannerRegistro conSesion={conSesion} accent={accent} />
        {conSesion && (
          <Boton variante="borde" icono="logout" onPress={cerrarSesion}>
            Cerrar sesión
          </Boton>
        )}
        <LinksCuenta conSesion={conSesion} />
        <VersionApp />
        <PieServiTec />
      </ScrollView>
    </View>
  );
}

export default function Cuenta() {
  const { visitante } = useComercioActivo();
  return visitante ? <CuentaVisitante /> : <CuentaCliente />;
}

function Dato({ icono, texto }: { icono: IconName; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icono name={icono} size={18} color={colors.muted} />
      <T style={{ flex: 1, fontSize: 14, color: colors.inkSoft }}>{texto}</T>
    </View>
  );
}

function TarjetaDatos({ cuenta, telefonoIngreso, accent, onEditar }: { cuenta: CuentaApp; telefonoIngreso?: string | null; accent: string; onEditar: () => void }) {
  const cli = cuenta.cliente;
  return (
    <Tarjeta style={{ gap: 8 }}>
      <T v="etiqueta">Tus datos</T>
      <T v="h2">{cli.nombre}</T>
      <View style={{ gap: 6 }}>
        <Dato icono="map-marker-outline" texto={[cli.direccion, cli.localidad].filter(Boolean).join(', ') || 'Sin dirección cargada'} />
        <Dato icono="phone-outline" texto={cli.telefono || 'Sin teléfono cargado'} />
        {cuenta.vendedor ? <Dato icono="account-tie-outline" texto={`Vendedor: ${cuenta.vendedor}`} /> : null}
        {telefonoIngreso ? <Dato icono="login" texto={`Ingresás con ${telefonoIngreso}`} /> : null}
      </View>
      <Boton variante="suave" color={accent} icono="pencil-outline" chico onPress={onEditar} style={{ marginTop: 4 }}>
        {cuenta.datosCompletos ? 'Editar mis datos' : 'Completar mis datos'}
      </Boton>
      {cuenta.contacto?.vendedor && (
        <Boton
          variante="borde"
          icono="whatsapp"
          chico
          onPress={() => Linking.openURL(`https://wa.me/549${cuenta.contacto!.vendedor!.whatsapp}?text=${encodeURIComponent(`Hola, soy ${cli.nombre}.`)}`)}
        >
          Escribirle a mi vendedor
        </Boton>
      )}
    </Tarjeta>
  );
}

/** Premio de merchandising con cuántos puntos faltan (el canje se pide a la distribuidora). */
function Premio({ premio, saldo, accent }: { premio: NonNullable<CuentaApp['puntos']>['premios'][number]; saldo: number; accent: string }) {
  const alcanza = saldo >= premio.puntos;
  const avance = Math.min(100, (saldo / premio.puntos) * 100);
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: alcanza ? accent : colors.line, backgroundColor: colors.card }}>
      <View style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lineSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {premio.imagenUrl ? (
          <Image source={{ uri: premio.imagenUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityLabel={premio.nombre} />
        ) : (
          <Icono name="gift-outline" color={accent} size={26} />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <T v="fuerte" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>{premio.nombre}</T>
          <T v="fuerte" style={{ fontSize: 13, color: accent }}>{premio.puntos.toLocaleString('es-AR')} pts</T>
        </View>
        {premio.descripcion ? <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>{premio.descripcion}</T> : null}
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.lineSoft }}>
          <View style={{ width: `${avance}%`, height: 6, borderRadius: 3, backgroundColor: accent }} />
        </View>
        <T v="chico" style={{ fontSize: 12, color: alcanza ? colors.okInk : colors.muted }}>
          {alcanza ? '¡Ya lo podés canjear! Pedíselo a tu vendedor.' : `Te faltan ${(premio.puntos - saldo).toLocaleString('es-AR')} puntos`}
        </T>
      </View>
    </View>
  );
}

/** Puntos de fidelidad (si la distribuidora tiene el módulo): saldo, premios y últimos movimientos. */
function TarjetaPuntos({ puntos, accent }: { puntos: NonNullable<CuentaApp['puntos']>; accent: string }) {
  return (
    <Tarjeta style={{ gap: 10, borderColor: tint(accent, 0.3), backgroundColor: tint(accent, 0.04) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="star-circle-outline" color={colors.white} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="etiqueta">Tus puntos</T>
          <T v="titulo" style={{ color: accent }}>{puntos.saldo.toLocaleString('es-AR')}</T>
        </View>
      </View>
      <T v="chico" style={{ fontSize: 13 }}>
        Sumás 1 punto cada {precio(puntos.cadaPesos)} de cada pedido entregado.
        {puntos.premios.length > 0 ? ' Canjealos por estos premios:' : ' Muy pronto vas a poder canjearlos por merchandising.'}
      </T>
      {puntos.premios.length > 0 && (
        <View style={{ gap: 8 }}>
          {puntos.premios.map((p) => (
            <Premio key={p.id} premio={p} saldo={puntos.saldo} accent={accent} />
          ))}
        </View>
      )}
      {puntos.movimientos.length > 0 && (
        <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 10 }}>
          {puntos.movimientos.slice(0, 5).map((m, i) => (
            <View key={`${m.fecha}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <T v="chico" style={{ flex: 1 }} numberOfLines={1}>{fechaCorta(m.fecha)} · {m.descripcion ?? 'Movimiento'}</T>
              <T v="fuerte" style={{ fontSize: 14, color: m.puntos > 0 ? colors.okInk : colors.errorInk }}>
                {m.puntos > 0 ? '+' : ''}{m.puntos}
              </T>
            </View>
          ))}
        </View>
      )}
    </Tarjeta>
  );
}

function TarjetaSaldo({ cuenta, accent, onInformarPago }: { cuenta: CuentaApp; accent: string; onInformarPago: () => void }) {
  const clasif = CLASIFICACION[cuenta.credito.clasificacion ?? 'normal'] ?? CLASIFICACION.atrasado;
  const usado = cuenta.credito.limite ? Math.min(100, (cuenta.credito.saldo / cuenta.credito.limite) * 100) : null;
  return (
    <Tarjeta style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T v="etiqueta">Saldo a pagar</T>
        <Insignia {...clasif} />
      </View>
      <T v="titulo">{precio(cuenta.credito.saldo)}</T>
      {usado !== null && (
        <View style={{ gap: 8 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.lineSoft }}>
            <View style={{ width: `${usado}%`, height: 8, borderRadius: 4, backgroundColor: accent }} />
          </View>
          <Fila etiqueta="Disponible" valor={precio(cuenta.credito.disponible ?? 0)} />
          <Fila etiqueta="Límite de crédito" valor={precio(cuenta.credito.limite!)} />
        </View>
      )}
      {cuenta.credito.saldo > 0 && (
        <Boton variante="suave" color={accent} icono="cash-fast" chico onPress={onInformarPago}>
          Informar un pago
        </Boton>
      )}
    </Tarjeta>
  );
}

function CuentaCliente() {
  const { slug, accent, comercio } = useComercioActivo();
  const cuenta = useCuenta(slug!);
  const me = useMe();
  const c = cuenta.data;
  // En tablet apaisada y PC, las tarjetas van lado a lado.
  const ancha = useEsAncha();
  const [editando, setEditando] = useState(false);
  const [informandoPago, setInformandoPago] = useState(false);
  const columna = ancha ? { flex: 1, minWidth: 280 } : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Mi cuenta" subtitulo={comercio?.nombre} color={accent} />
      {cuenta.isLoading ? (
        <Cargando />
      ) : (
        <ScrollView
          contentContainerStyle={[ancha ? columnaAncha : columnaLectura, { padding: 16, gap: 12, paddingBottom: 32 }]}
          refreshControl={<RefreshControl refreshing={cuenta.isRefetching} onRefresh={() => cuenta.refetch()} />}
        >
          {cuenta.error && <Aviso texto={cuenta.error.message} />}

          {c && (
            <View style={{ flexDirection: ancha ? 'row' : 'column', flexWrap: ancha ? 'wrap' : 'nowrap', gap: 12, alignItems: ancha ? 'flex-start' : 'stretch' }}>
              <View style={columna}>
                <TarjetaDatos cuenta={c} telefonoIngreso={me.data?.telefono} accent={accent} onEditar={() => setEditando(true)} />
              </View>
              {c.puntos && (
                <View style={columna}>
                  <TarjetaPuntos puntos={c.puntos} accent={accent} />
                </View>
              )}
              <View style={columna}>
                <TarjetaSaldo cuenta={c} accent={accent} onInformarPago={() => setInformandoPago(true)} />
              </View>
              {((c.movimientos?.length ?? 0) > 0 || (c.pagosInformados?.length ?? 0) > 0) && (
                <View style={columna}>
                  <TarjetaMovimientos movimientos={c.movimientos ?? []} pagos={c.pagosInformados ?? []} />
                </View>
              )}
            </View>
          )}

          <Boton variante="borde" icono="logout" onPress={cerrarSesion} style={ancha ? { alignSelf: 'flex-start' } : undefined}>
            Cerrar sesión
          </Boton>
          <LinksCuenta conSesion />
          <VersionApp />

          <PieServiTec />
        </ScrollView>
      )}
      {c && (
        <HojaDatosComercio
          visible={editando}
          slug={slug!}
          accent={accent}
          inicial={{ negocio: c.cliente.nombre, direccion: c.cliente.direccion ?? '', localidad: c.cliente.localidad ?? '', telefono: c.cliente.telefono ?? '' }}
          detalle="La distribuidora los usa para entregarte los pedidos."
          onCerrar={() => setEditando(false)}
          onGuardado={() => setEditando(false)}
        />
      )}
      <HojaInformarPago visible={informandoPago} slug={slug!} accent={accent} transferencia={c?.contacto?.transferencia} onCerrar={() => setInformandoPago(false)} />
    </View>
  );
}
