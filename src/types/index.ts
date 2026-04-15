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
