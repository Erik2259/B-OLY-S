export interface Sabor {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: 'Agua' | 'Leche' | 'Gourmet';
  imagen_url: string | null;
  disponible: boolean;
  orden: number;
  created_at: string;
}

export type Categoria = 'Todos' | 'Agua' | 'Leche' | 'Gourmet';

export interface SaborFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
}
