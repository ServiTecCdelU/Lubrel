// Carrito: precios y total vienen de /cotizar (servidor); confirmar reusa el mismo
// clientRequestId en cada reintento (el servidor no duplica). El visitante arma el carrito
// con precios de referencia y al confirmar se le pide registrarse.
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nombreDeGoogle } from '@/components/alta-comercio';
import { BarraSuperior } from '@/components/barra-superior';
import { DetalleCantidad, SelectorCantidad } from '@/components/cantidad';
import { HojaDatosComercio } from '@/components/datos-comercio';
import { FotoProducto } from '@/components/foto-producto';
import { columnaAncha, columnaLectura, useEsAncha } from '@/components/marco-app';
import { Aviso, Boton, Fila, Insignia, T, Tarjeta, Vacio } from '@/components/ui';
import { useComercioActivo } from '@/hooks/use-comercio-activo';
import { useDebounce } from '@/hooks/use-debounce';
import { ApiError } from '@/lib/api';
import { vibrarExito } from '@/lib/haptica';
import { equivalencia } from '@/lib/cantidad';
import { precio, presentacion } from '@/lib/format';
import { useCotizacion, useCrearPedido, useCuenta } from '@/lib/queries';
import { useCarrito, useCarritoStore, type ItemCarrito } from '@/state/carrito';
import { useRegistroStore } from '@/state/registro';
import { useSesion } from '@/state/sesion';
import { colors, fonts, radius } from '@/theme';

const CLASIFICACION: Record<string, { texto: string; bg: string; fg: string; borde: string }> = {
  normal: { texto: 'Al día', bg: colors.okSoft, fg: colors.okInk, borde: '#a7f3d0' },
  atrasado: { texto: 'Con atraso', bg: colors.amberSoft, fg: colors.amberInk, borde: colors.warnLine },
  moroso: { texto: 'Saldo vencido', bg: colors.errorSoft, fg: colors.errorInk, borde: colors.errorLine },
};

export default function Pedido() {
  const { slug, accent, visitante } = useComercioActivo();
  const pedirRegistro = useRegistroStore((s) => s.abrir);
  const insets = useSafeAreaInsets();
  const ancha = useEsAncha();
  const carrito = useCarrito(slug);
  const setCantidad = useCarritoStore((s) => s.setCantidad);
  const vaciar = useCarritoStore((s) => s.vaciar);
  const requestId = useCarritoStore((s) => (slug ? s.requestIds[slug] : undefined));
  const setRequestId = useCarritoStore((s) => s.setRequestId);
  const [notas, setNotas] = useState('');

  const lineas = useMemo(() => Object.values(carrito), [carrito]);
  const items = useMemo(() => lineas.map((l) => ({ productId: l.productId, quantity: l.cantidad })), [lineas]);
  // Tocar [+] cinco veces seguidas cotiza una vez, no cinco: se espera a que la cantidad se asiente.
  const itemsAsentados = useDebounce(items, 400);
  const asentando = itemsAsentados !== items;
  const cot = useCotizacion(slug!, itemsAsentados, !visitante);
  const crear = useCrearPedido(slug!);
  const cuenta = useCuenta(slug!, !visitante);
  const nombreGoogle = nombreDeGoogle(useSesion().session?.user.user_metadata);
  const [pidiendoDatos, setPidiendoDatos] = useState(false);

  const precioServidor = new Map((cot.data?.lineas ?? []).map((l) => [l.productId, l]));
  const errorProducto = cot.error instanceof ApiError ? (cot.error.extra?.productId as string | undefined) : undefined;
  const cambiar = (l: ItemCarrito, cantidad: number) => setCantidad(slug!, l, cantidad);

  const enviarPedido = () => {
    const id = requestId ?? Crypto.randomUUID();
    if (!requestId) setRequestId(slug!, id);
    crear.mutate(
      { items, clientRequestId: id, notas: notas.trim() || undefined },
      {
        onSuccess: (r) => {
          vibrarExito();
          vaciar(slug!);
          setNotas('');
          router.push({ pathname: '/pedidos/[id]', params: { id: r.pedidoId, nuevo: '1' } });
        },
        // El servidor también controla los datos (por si la cuenta estaba desactualizada).
        onError: (e) => {
          if (e instanceof ApiError && e.extra?.codigo === 'datos_incompletos') setPidiendoDatos(true);
        },
      },
    );
  };

  // Sin dirección, localidad o teléfono en la ficha, primero se piden los datos del comercio.
  const confirmar = () => {
    if (cuenta.data && !cuenta.data.datosCompletos) {
      setPidiendoDatos(true);
      return;
    }
    enviarPedido();
  };

  const fichaCliente = cuenta.data?.cliente;
  const hojaDatos = (
    <HojaDatosComercio
      visible={pidiendoDatos}
      slug={slug!}
      accent={accent}
      // Las fichas de altas viejas de la app tienen el nombre de la cuenta de Google, no el del negocio.
      inicial={{
        negocio: fichaCliente && fichaCliente.nombre !== nombreGoogle ? fichaCliente.nombre : '',
        direccion: fichaCliente?.direccion ?? '',
        localidad: fichaCliente?.localidad ?? '',
        telefono: fichaCliente?.telefono ?? '',
      }}
      textoBoton="Guardar y enviar pedido"
      onCerrar={() => setPidiendoDatos(false)}
      onGuardado={() => {
        setPidiendoDatos(false);
        enviarPedido();
      }}
    />
  );

  if (lineas.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <BarraSuperior titulo="Carrito" color={accent} />
        <Vacio
          icono="cart-outline"
          titulo="Tu carrito está vacío"
          detalle="Sumá productos desde el catálogo, escaneá un código de barras o repetí tu último pedido desde el inicio."
          accion={
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Boton color={accent} chico icono="package-variant-closed" onPress={() => router.navigate('/catalogo')}>Ver productos</Boton>
              <Boton variante="suave" color={accent} chico icono="barcode-scan" onPress={() => router.push('/escanear')}>Escanear</Boton>
            </View>
          }
        />
      </View>
    );
  }

  const credito = cot.data?.credito;
  const total = visitante ? lineas.reduce((acc, l) => acc + l.precioReferencia * l.cantidad, 0) : cot.data?.total;
  const clasif = CLASIFICACION[credito?.clasificacion ?? 'normal'] ?? CLASIFICACION.atrasado;

  const listaItems = (
    <Tarjeta style={{ padding: 0 }}>
      {lineas.map((l, i) => {
        const srv = precioServidor.get(l.productId);
        const conError = errorProducto === l.productId;
        const unitario = srv ? precio(srv.price) : visitante ? precio(l.precioReferencia) : '…';
        const subtotal = conError ? (
          <Insignia texto="Ya no está disponible" bg={colors.errorSoft} fg={colors.errorInk} borde={colors.errorLine} />
        ) : (
          <T v="numero" style={{ fontSize: 15 }}>{srv ? precio(srv.subtotal) : visitante ? precio(l.precioReferencia * l.cantidad) : '…'}</T>
        );
        // Bultos: "10 bultos · 120 u" (en productos por unidad no agrega nada y se omite).
        const enBultos = equivalencia(l.cantidad, l.unidadesPorBulto, l.seDivideEn) !== null;
        const selector = <SelectorCantidad cantidad={l.cantidad} color={accent} nombre={l.nombre} onCambiar={(n) => cambiar(l, n)} />;
        const datos = (
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T v="fuerte" numberOfLines={2} style={{ fontSize: 14 }}>{l.nombre}</T>
            <T v="chico" style={{ fontSize: 12 }} numberOfLines={1}>
              {presentacion(l.unidadesPorBulto, l.seDivideEn)} · {unitario} c/u
            </T>
            {enBultos && <DetalleCantidad cantidad={l.cantidad} unidadesPorBulto={l.unidadesPorBulto} seDivideEn={l.seDivideEn} />}
            {srv?.itemDiscount ? (
              <View style={{ marginTop: 2, alignSelf: 'flex-start' }}>
                <Insignia texto={`Oferta −${srv.itemDiscount}%`} bg={colors.tealSoft} fg={colors.tealInk} borde={colors.tealLine} />
              </View>
            ) : null}
          </View>
        );
        const estiloFila = { padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft, backgroundColor: conError ? colors.errorSoft : undefined };

        // Pantallas anchas: foto y datos, subtotal y cantidad en una línea larga.
        if (ancha) {
          return (
            <View key={l.productId} style={[estiloFila, { flexDirection: 'row', alignItems: 'center', gap: 24 }]}>
              <View style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <FotoProducto nombre={l.nombre} imagenUrl={l.imageUrl} size={40} />
                {datos}
              </View>
              {subtotal}
              {selector}
            </View>
          );
        }
        // Celular: una sola fila; el subtotal va debajo del selector.
        return (
          <View key={l.productId} style={[estiloFila, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <FotoProducto nombre={l.nombre} imagenUrl={l.imageUrl} size={40} />
            {datos}
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {selector}
              {subtotal}
            </View>
          </View>
        );
      })}
    </Tarjeta>
  );

  const avisos = (
    <>
      {visitante && <Aviso tono="info" texto="Precios de referencia: se confirman al registrarte." />}
      {cot.error && <Aviso texto={cot.error.message} />}
      {cot.data?.retencion && <Aviso tono="info" texto={cot.data.retencion} />}
    </>
  );

  const resumen = (
    <>
      {credito && (
        <Tarjeta style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T v="fuerte" style={{ fontSize: 14 }}>Cuenta corriente</T>
            <Insignia {...clasif} />
          </View>
          <Fila etiqueta="Saldo actual" valor={precio(credito.saldo)} />
          {credito.limite ? <Fila etiqueta="Límite" valor={precio(credito.limite)} /> : null}
          {credito.disponible != null ? <Fila etiqueta="Disponible" valor={precio(credito.disponible)} /> : null}
        </Tarjeta>
      )}

      <Tarjeta style={{ gap: 8 }}>
        <T v="fuerte" style={{ fontSize: 14 }}>Nota para la distribuidora</T>
        <TextInput
          accessibilityLabel="Nota para la distribuidora"
          value={notas}
          onChangeText={setNotas}
          placeholder="Ej.: si no hay aceite de 1,5 L, mandar el de 900 ml"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={500}
          style={{ minHeight: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 10, fontSize: 14, fontFamily: fonts.body, color: colors.ink, textAlignVertical: 'top' }}
        />
      </Tarjeta>

      <Tarjeta style={{ gap: 8 }}>
        {cot.data?.lista && <Fila etiqueta="Lista de precios" valor={cot.data.lista.nombre} />}
        <Fila etiqueta="Forma de pago" valor="Cuenta corriente" />
        <View style={{ height: 1, backgroundColor: colors.lineSoft, marginVertical: 4 }} />
        <Fila etiqueta="Total" valor={total !== undefined ? precio(total) : '…'} fuerte />
      </Tarjeta>
    </>
  );

  const accion = (
    <>
      {crear.error && <Aviso texto={crear.error.message} />}
      {visitante ? (
        <Boton color={accent} icono="account-plus-outline" onPress={() => pedirRegistro('Registrate para enviar tu pedido. Tu carrito queda guardado.')}>
          Registrarme y enviar{total !== undefined ? ` · ${precio(total)}` : ''}
        </Boton>
      ) : (
        <Boton color={accent} icono="check" onPress={confirmar} cargando={crear.isPending} disabled={!cot.data || cot.isFetching || asentando || !!cot.error}>
          Confirmar pedido{total !== undefined ? ` · ${precio(total)}` : ''}
        </Boton>
      )}
    </>
  );

  const subtitulo = `${lineas.length} ${lineas.length === 1 ? 'producto' : 'productos'}`;

  // Tablet apaisada y PC: productos a la izquierda, resumen y confirmar fijos a la derecha.
  if (ancha) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <BarraSuperior titulo="Carrito" subtitulo={subtitulo} color={accent} />
        <View style={[columnaAncha, { flex: 1, flexDirection: 'row', gap: 16, padding: 16 }]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {listaItems}
            {avisos}
          </ScrollView>
          <ScrollView style={{ width: 380, flexGrow: 0 }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {resumen}
            {accion}
          </ScrollView>
        </View>
        {hojaDatos}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BarraSuperior titulo="Carrito" subtitulo={subtitulo} color={accent} />
      <ScrollView contentContainerStyle={[columnaLectura, { padding: 16, gap: 12, paddingBottom: 170 }]} keyboardShouldPersistTaps="handled">
        {listaItems}
        {avisos}
        {resumen}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, padding: 16, paddingBottom: 16 + Math.min(insets.bottom, 8) }}>
        <View style={[columnaLectura, { gap: 8 }]}>{accion}</View>
      </View>
      {hojaDatos}
    </View>
  );
}
