export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  icono: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  orden: number;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  detalles: string | null;
  incluye: string[] | null;
  imagenes_extra: string[] | null;
  precio: number;
  categoria: string;
  categoria_id: string;
  imagen_url: string | null;
  disponible: boolean;
  tipo_producto: 'unidad' | 'paquete';
  destacado: boolean;
  orden: number;
  created_at: string;
  categorias?: Categoria;
}

export type Sabor = Producto;
export type SubCategoria = 'Todos' | 'Agua' | 'Leche' | 'Gourmet';

export type MetodoEntrega = 'recoger' | 'punto_medio' | 'domicilio';
export type EstadoReserva = 'pendiente' | 'confirmada' | 'preparando' | 'entregada' | 'cancelada';

export interface Reserva {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  fecha_entrega: string;
  hora_entrega: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  customer_id: string | null;
  metodo_entrega: MetodoEntrega;
  ubicacion_detalle: string | null;
  notas: string | null;
  estado: EstadoReserva;
  total: number;
  created_at: string;
}

export const PUNTOS_MEDIOS_SBT = [
  { id: 'plaza', nombre: 'Plaza principal', coords: '20.3990,-98.2004' },
  { id: 'iglesia', nombre: 'Frente a la Iglesia', coords: '20.3988,-98.2008' },
  { id: 'auditorio', nombre: 'Auditorio Municipal', coords: '20.3985,-98.1995' },
  { id: 'mercado', nombre: 'Mercado Municipal', coords: '20.3992,-98.2001' },
] as const;
