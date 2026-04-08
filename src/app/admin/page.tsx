'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LogOut, Save, Trash2, Pencil, X, Loader2,
  Image as ImageIcon, Eye, EyeOff, ChevronLeft, BarChart3, IceCreamCone,
} from 'lucide-react';
import Image from 'next/image';
import { supabase, getImageUrl } from '@/lib/supabase';
import type { Sabor } from '@/types';
import Dashboard from '@/components/Dashboard';

const CATEGORIAS = ['Agua', 'Leche', 'Gourmet'];

const emptySabor = {
  nombre: '',
  descripcion: '',
  precio: 0,
  categoria: 'Agua',
  disponible: true,
};

export default function AdminPage() {
  const router = useRouter();
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sabor | null>(null);
  const [form, setForm] = useState(emptySabor);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tab, setTab] = useState<'sabores' | 'stats'>('sabores');

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchSabores();
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchSabores = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sabores')
      .select('*')
      .order('orden', { ascending: true });
    setSabores(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptySabor);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (sabor: Sabor) => {
    setEditing(sabor);
    setForm({
      nombre: sabor.nombre,
      descripcion: sabor.descripcion || '',
      precio: sabor.precio,
      categoria: sabor.categoria,
      disponible: sabor.disponible,
    });
    setImageFile(null);
    setImagePreview(sabor.imagen_url ? getImageUrl(sabor.imagen_url) : null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptySabor);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imagen_url = editing?.imagen_url || null;

    // Upload image if new one selected
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${form.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('sabores-img')
        .upload(fileName, imageFile, { upsert: true });

      if (!uploadErr) {
        imagen_url = fileName;
      }
    }

    const record = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: Number(form.precio),
      categoria: form.categoria,
      disponible: form.disponible,
      imagen_url,
    };

    if (editing) {
      await supabase.from('sabores').update(record).eq('id', editing.id);
    } else {
      const maxOrden = sabores.length > 0
        ? Math.max(...sabores.map((s) => s.orden || 0))
        : 0;
      await supabase.from('sabores').insert({ ...record, orden: maxOrden + 1 });
    }

    closeForm();
    await fetchSabores();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('sabores').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchSabores();
  };

  const toggleDisponible = async (sabor: Sabor) => {
    await supabase
      .from('sabores')
      .update({ disponible: !sabor.disponible })
      .eq('id', sabor.id);
    fetchSabores();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-display text-xl font-bold text-gray-800">
              🍦 Admin
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold hover:text-red-500 transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('sabores')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
              tab === 'sabores'
                ? 'bg-boli-orange text-white shadow-md'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <IceCreamCone className="w-4 h-4" />
            Sabores
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
              tab === 'stats'
                ? 'bg-boli-orange text-white shadow-md'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-6">
        {tab === 'stats' ? (
          <Dashboard />
        ) : (
        <>
        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="w-full bg-gradient-to-r from-boli-yellow to-boli-orange text-white font-display font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Agregar Sabor
        </motion.button>

        {/* Sabores list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-boli-orange animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {sabores.map((sabor) => (
              <motion.div
                key={sabor.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {sabor.imagen_url ? (
                      <Image
                        src={getImageUrl(sabor.imagen_url)}
                        alt={sabor.nombre}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍦
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-gray-800 text-sm truncate">
                        {sabor.nombre}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sabor.disponible
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-500'
                        }`}
                      >
                        {sabor.disponible ? 'Activo' : 'Oculto'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {sabor.categoria} · ${sabor.precio}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleDisponible(sabor)}
                      className="p-2 rounded-xl hover:bg-gray-100 transition"
                      title={sabor.disponible ? 'Ocultar' : 'Mostrar'}
                    >
                      {sabor.disponible ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(sabor)}
                      className="p-2 rounded-xl hover:bg-blue-50 transition"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(sabor.id)}
                      className="p-2 rounded-xl hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation */}
                <AnimatePresence>
                  {deleteConfirm === sabor.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-red-50 px-4 py-3 flex items-center justify-between"
                    >
                      <p className="text-xs font-semibold text-red-600">
                        ¿Eliminar este sabor?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg bg-white"
                        >
                          No
                        </button>
                        <button
                          onClick={() => handleDelete(sabor.id)}
                          className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-red-500"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={closeForm}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <h2 className="font-display font-bold text-lg text-gray-800">
                  {editing ? 'Editar Sabor' : 'Nuevo Sabor'}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Image upload */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600 mb-2 block">
                    Foto del boli
                  </label>
                  <label className="block cursor-pointer">
                    <div
                      className={`w-full aspect-video rounded-2xl border-2 border-dashed transition overflow-hidden flex items-center justify-center ${
                        imagePreview
                          ? 'border-transparent'
                          : 'border-gray-300 bg-gray-50 hover:border-boli-orange hover:bg-orange-50'
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover rounded-2xl"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-2xl">
                            <p className="text-white text-sm font-bold">
                              Cambiar foto
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 font-medium">
                            Toca para subir foto
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    required
                    placeholder="Ej: Mango Chamoy"
                    className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">
                    Descripción
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm({ ...form, descripcion: e.target.value })
                    }
                    rows={2}
                    placeholder="Ej: Refrescante y picosito"
                    className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition resize-none"
                  />
                </div>

                {/* Price & Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">
                      Precio (MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.precio}
                      onChange={(e) =>
                        setForm({ ...form, precio: Number(e.target.value) })
                      }
                      required
                      className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">
                      Categoría
                    </label>
                    <select
                      value={form.categoria}
                      onChange={(e) =>
                        setForm({ ...form, categoria: e.target.value })
                      }
                      className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition appearance-none"
                    >
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Disponible switch */}
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                  <div>
                    <p className="font-display font-semibold text-sm text-gray-700">
                      Disponible
                    </p>
                    <p className="text-xs text-gray-400">
                      Si está activo, aparece en el menú
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, disponible: !form.disponible })
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      form.disponible ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        form.disponible ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-boli-yellow to-boli-orange text-white font-display font-bold py-4 rounded-2xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editing ? 'Guardar Cambios' : 'Crear Sabor'}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
