// Tipos de las respuestas de /api/app/v1. Espejo de SaaS:
// services/app-pedidos-service.ts y services/app-invitaciones-service.ts.

export interface Comercio {
  slug: string;
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string | null;
  /** Solo en GET /comercios/{slug}: secciones opcionales (false = apagada). */
  secciones?: Partial<Record<SeccionApp, boolean>>;
}

export type SeccionApp = 'ofertas' | 'masElegidos' | 'destacados' | 'favoritos' | 'escanear' | 'repetirPedido';

export interface Me {
  telefono: string | null;
  comercios: Comercio[];
}

export interface ProductoApp {
  id: string;
  nombre: string;
  codigo: string;
  rubro: string;
  /** Precio con la lista del cliente (sin oferta). */
  precio: number;
  /** % de oferta vigente y precio final (null = sin oferta). */
  descuentoPct: number | null;
  precioOferta: number | null;
  unidadesPorBulto: number | null;
  seDivideEn: number | null;
  imageUrl: string | null;
}

export interface OfertaApp {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  descuentoPct: number | null;
  producto: ProductoApp | null;
}

export interface PaginaCatalogo {
  items: ProductoApp[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Credito {
  saldo: number;
  limite: number | null;
  disponible: number | null;
  clasificacion: string;
}

export interface LineaCotizada {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  /** % de oferta aplicado a la línea (null = sin oferta). */
  itemDiscount: number | null;
  subtotal: number;
  unidadesPorBulto: number | null;
}

export interface Cotizacion {
  lineas: LineaCotizada[];
  total: number;
  lista: { id: string; nombre: string } | null;
  credito: Credito;
  retencion: string | null;
}

export interface PedidoCreado {
  pedidoId: string;
  retenido: boolean;
  mensaje: string | null;
  duplicado: boolean;
}

export type EstadoPedido = 'recibido' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado';

export interface PedidoResumen {
  id: string;
  numero: number | null;
  estado: EstadoPedido;
  retenido: boolean;
  /** true mientras está "recibido": el comercio todavía lo puede cancelar o modificar. */
  cancelable?: boolean;
  fecha: string;
  desdeApp: boolean;
  cantidadProductos: number;
  total: number;
  items: { productId: string | null; nombre: string; cantidad: number }[];
}

export interface Cuenta {
  cliente: { nombre: string; direccion: string | null; localidad: string | null; telefono: string | null };
  /** false → falta dirección, localidad o teléfono: se piden al confirmar el pedido. */
  datosCompletos: boolean;
  vendedor: string | null;
  credito: Credito;
  /** null si la distribuidora no tiene el módulo de puntos. */
  puntos: {
    saldo: number;
    /** Pesos por punto (regla de la distribuidora). */
    cadaPesos: number;
    movimientos: { fecha: string; puntos: number; descripcion: string | null }[];
    /** Premios de merchandising, de menos a más puntos. */
    premios: { id: string; nombre: string; descripcion: string | null; imagenUrl: string | null; puntos: number }[];
  } | null;
  /** Últimos movimientos (opcionales: el servidor viejo no los manda). */
  movimientos?: MovimientoCuenta[];
  pagosInformados?: PagoInformado[];
  /** false → la distribuidora no muestra la cuenta corriente (el servidor viejo no lo manda: se muestra). */
  mostrarCuentaCorriente?: boolean;
  contacto?: {
    /** WhatsApp del vendedor: 10 dígitos (área + número). */
    vendedor: { nombre: string; whatsapp: string } | null;
    transferencia: DatosTransferencia | null;
  } | null;
}

export interface DatosTransferencia {
  alias: string;
  titular: string;
  banco: string;
}

/** Movimiento de cuenta corriente: compra (suma al saldo) o pago (lo baja). */
export interface MovimientoCuenta {
  id: string;
  fecha: string;
  tipo: 'compra' | 'pago';
  monto: number;
  descripcion: string;
}

/** Pago que informó el comercio desde la app (la distribuidora lo verifica). */
export interface PagoInformado {
  id: string;
  fecha: string;
  monto: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivoRechazo: string | null;
}

export type MetodoPago = 'transferencia' | 'efectivo' | 'cheque' | 'otro';

export interface InformarPago {
  monto: number;
  metodo: MetodoPago;
  nota?: string;
  comprobante?: { base64: string; tipo: 'image/jpeg' | 'image/png' | 'image/webp' } | null;
}

/** Datos del comercio que se piden al confirmar el pedido (van a la ficha del cliente). */
export interface DatosComercio {
  negocio: string;
  direccion: string;
  localidad: string;
  telefono: string;
}
