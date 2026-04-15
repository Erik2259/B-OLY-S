'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LogOut, Save, Trash2, Pencil, X, Loader2,
  Image as ImageIcon, Eye, EyeOff, ChevronLeft, BarChart3,
  IceCreamCone, Tag, Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { supabase, getImageUrl } from '@/lib/supabase';
import type { Producto, Categoria } from '@/types';
import Dashboard from '@/components/Dashboard';

const SUBCATEGORIAS = ['Agua', 'Leche', 'Gourmet', 'General'];

export default function AdminPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'productos' | 'categorias' | 'stats'>('productos');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', detalles: '', incluye: '' as string, precio: 0, categoria: 'Agua', categoria_id: '', disponible: true, tipo_producto: 'unidad', destacado: false });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState({ nombre: '', slug: '', icono: '📦', descripcion: '', activa: true, fecha_inicio: '', fecha_fin: '' });
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    fetchAll();
  }, [router]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from('productos').select('*').order('orden', { ascending: true }),
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
    ]);
    setProductos(pRes.data || []);
    setCategorias(cRes.data || []);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  // === PRODUCT CRUD ===
  const openCreate = () => {
    setEditing(null);
    const defaultCat = categorias[0]?.id || '';
    setForm({ nombre: '', descripcion: '', detalles: '', incluye: '', precio: 0, categoria: 'Agua', categoria_id: defaultCat, disponible: true, tipo_producto: 'unidad', destacado: false });
    setImageFile(null); setImagePreview(null); setExtraFiles([]); setShowForm(true);
  };
  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', detalles: p.detalles || '', incluye: (p.incluye || []).join('\n'), precio: p.precio, categoria: p.categoria, categoria_id: p.categoria_id, disponible: p.disponible, tipo_producto: p.tipo_producto, destacado: p.destacado });
    setImageFile(null); setImagePreview(p.imagen_url ? getImageUrl(p.imagen_url) : null); setExtraFiles([]); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setImageFile(null); setImagePreview(null); setExtraFiles([]); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    let imagen_url = editing?.imagen_url || null;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${form.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('sabores-img').upload(fileName, imageFile, { upsert: true });
      if (!uploadErr) imagen_url = fileName;
    }
    const record = { nombre: form.nombre, descripcion: form.descripcion || null, detalles: form.detalles || null, incluye: form.incluye.trim() ? form.incluye.split('\n').map((s: string) => s.trim()).filter(Boolean) : null, precio: Number(form.precio), categoria: form.categoria, categoria_id: form.categoria_id, disponible: form.disponible, tipo_producto: form.tipo_producto, destacado: form.destacado, imagen_url, imagenes_extra: editing?.imagenes_extra || null };

    // Upload extra images
    if (extraFiles.length > 0) {
      const extraUrls: string[] = [...(editing?.imagenes_extra || [])];
      for (const file of extraFiles) {
        const ext = file.name.split('.').pop();
        const fn = `${Date.now()}-extra-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('sabores-img').upload(fn, file, { upsert: true });
        if (!upErr) extraUrls.push(fn);
      }
      record.imagenes_extra = extraUrls;
    }
    if (editing) await supabase.from('productos').update(record).eq('id', editing.id);
    else { const maxOrden = productos.length > 0 ? Math.max(...productos.map((s) => s.orden || 0)) : 0; await supabase.from('productos').insert({ ...record, orden: maxOrden + 1 }); }
    closeForm(); await fetchAll(); setSaving(false);
  };

  const handleDelete = async (id: string) => { await supabase.from('productos').delete().eq('id', id); setDeleteConfirm(null); fetchAll(); };
  const toggleDisponible = async (p: Producto) => { await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id); fetchAll(); };

  // === CATEGORY CRUD ===
  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ nombre: '', slug: '', icono: '📦', descripcion: '', activa: true, fecha_inicio: '', fecha_fin: '' });
    setShowCatForm(true);
  };
  const openEditCat = (c: Categoria) => {
    setEditingCat(c);
    setCatForm({ nombre: c.nombre, slug: c.slug, icono: c.icono, descripcion: c.descripcion || '', activa: c.activa, fecha_inicio: c.fecha_inicio || '', fecha_fin: c.fecha_fin || '' });
    setShowCatForm(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const slug = catForm.slug || catForm.nombre.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const record = { nombre: catForm.nombre, slug, icono: catForm.icono, descripcion: catForm.descripcion || null, activa: catForm.activa, fecha_inicio: catForm.fecha_inicio || null, fecha_fin: catForm.fecha_fin || null };
    if (editingCat) await supabase.from('categorias').update(record).eq('id', editingCat.id);
    else { const maxOrden = categorias.length > 0 ? Math.max(...categorias.map((c) => c.orden || 0)) : 0; await supabase.from('categorias').insert({ ...record, orden: maxOrden + 1 }); }
    setShowCatForm(false); setEditingCat(null); await fetchAll(); setSaving(false);
  };

  const handleDeleteCat = async (id: string) => { await supabase.from('categorias').delete().eq('id', id); setDeleteCatConfirm(null); fetchAll(); };

  const getCatName = (id: string) => categorias.find((c) => c.id === id)?.nombre || '—';

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-gray-100 transition"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <h1 className="font-display text-xl font-bold text-gray-800">🍦 Admin</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold hover:text-red-500 transition"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {[
            { key: 'productos' as const, icon: <IceCreamCone className="w-4 h-4" />, label: 'Productos' },
            { key: 'categorias' as const, icon: <Tag className="w-4 h-4" />, label: 'Secciones' },
            { key: 'stats' as const, icon: <BarChart3 className="w-4 h-4" />, label: 'Estadísticas' },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-display font-semibold text-sm whitespace-nowrap transition-all ${tab === t.key ? 'bg-boli-orange text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-6">
        {tab === 'stats' ? <Dashboard /> : tab === 'categorias' ? (
          <>
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreateCat} className="w-full bg-gradient-to-r from-boli-purple to-violet-500 text-white font-display font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-6">
              <Plus className="w-5 h-5" /> Nueva Sección
            </motion.button>
            {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-boli-orange animate-spin" /></div> : (
              <div className="space-y-3">
                {categorias.map((cat) => (
                  <motion.div key={cat.id} layout className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cat.icono}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-gray-800">{cat.nombre}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.activa ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{cat.activa ? 'Activa' : 'Inactiva'}</span>
                        </div>
                        <p className="text-xs text-gray-400">{cat.slug} · {productos.filter((p) => p.categoria_id === cat.id).length} productos</p>
                        {cat.fecha_inicio && <p className="text-[10px] text-gray-300 mt-0.5">📅 {cat.fecha_inicio} → {cat.fecha_fin || '∞'}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditCat(cat)} className="p-2 rounded-xl hover:bg-blue-50"><Pencil className="w-4 h-4 text-blue-500" /></button>
                        <button onClick={() => setDeleteCatConfirm(cat.id)} className="p-2 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {deleteCatConfirm === cat.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100 bg-red-50 px-4 py-3 flex items-center justify-between mt-3 rounded-xl">
                          <p className="text-xs font-semibold text-red-600">¿Eliminar sección?</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeleteCatConfirm(null)} className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg bg-white">No</button>
                            <button onClick={() => handleDeleteCat(cat.id)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-red-500">Sí</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="w-full bg-gradient-to-r from-boli-yellow to-boli-orange text-white font-display font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-6">
              <Plus className="w-5 h-5" /> Agregar Producto
            </motion.button>
            {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-boli-orange animate-spin" /></div> : (
              <div className="space-y-3">
                {productos.map((prod) => (
                  <motion.div key={prod.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                        {prod.imagen_url ? <Image src={getImageUrl(prod.imagen_url)} alt={prod.nombre} fill sizes="64px" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-gray-800 truncate">{prod.nombre}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.disponible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{prod.disponible ? 'Activo' : 'Oculto'}</span>
                          {prod.destacado && <Sparkles className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{getCatName(prod.categoria_id)} · {prod.categoria} · ${prod.precio}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleDisponible(prod)} className="p-2 rounded-xl hover:bg-gray-100">{prod.disponible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}</button>
                        <button onClick={() => openEdit(prod)} className="p-2 rounded-xl hover:bg-blue-50"><Pencil className="w-4 h-4 text-blue-500" /></button>
                        <button onClick={() => setDeleteConfirm(prod.id)} className="p-2 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {deleteConfirm === prod.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100 bg-red-50 px-4 py-3 flex items-center justify-between">
                          <p className="text-xs font-semibold text-red-600">¿Eliminar?</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg bg-white">No</button>
                            <button onClick={() => handleDelete(prod.id)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-red-500">Sí</button>
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

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={closeForm}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <h2 className="font-display font-bold text-lg text-gray-800">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Image */}
                <label className="block cursor-pointer">
                  <p className="text-sm font-display font-semibold text-gray-600 mb-2">Foto</p>
                  <div className={`w-full aspect-video rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center ${imagePreview ? 'border-transparent' : 'border-gray-300 bg-gray-50 hover:border-boli-orange hover:bg-orange-50'}`}>
                    {imagePreview ? (
                      <div className="relative w-full h-full"><Image src={imagePreview} alt="Preview" fill className="object-cover rounded-2xl" /></div>
                    ) : (
                      <div className="text-center py-8"><ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-400">Toca para subir</p></div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {/* Name */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Nombre</label>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej: Kit de Yesitos" className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition" />
                </div>
                {/* Description */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Descripción corta</label>
                  <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} placeholder="Descripción corta..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition resize-none" />
                </div>
                {/* Details */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Descripción detallada</label>
                  <textarea value={form.detalles} onChange={(e) => setForm({ ...form, detalles: e.target.value })} rows={3} placeholder="Descripción larga para la vista expandida..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition resize-none" />
                </div>
                {/* Includes */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Lo que incluye (uno por línea)</label>
                  <textarea value={form.incluye} onChange={(e) => setForm({ ...form, incluye: e.target.value })} rows={3} placeholder={"Ej:\n3 figuras de yeso\nPinturas lavables\nPincel"} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition resize-none" />
                </div>
                {/* Extra images */}
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Fotos extra (galería)</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setExtraFiles(Array.from(e.target.files || []))} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm" />
                  {extraFiles.length > 0 && <p className="text-xs text-gray-400 mt-1">{extraFiles.length} foto(s) seleccionadas</p>}
                </div>
                {/* Section + SubCategory */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">Sección</label>
                    <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition appearance-none">
                      {categorias.map((c) => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">Subcategoría</label>
                    <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition appearance-none">
                      {SUBCATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {/* Price + Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">Precio (MXN)</label>
                    <input type="number" min="0" step="1" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition" />
                  </div>
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">Tipo</label>
                    <select value={form.tipo_producto} onChange={(e) => setForm({ ...form, tipo_producto: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-boli-yellow transition appearance-none">
                      <option value="unidad">Por unidad</option>
                      <option value="paquete">Paquete</option>
                    </select>
                  </div>
                </div>
                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                    <div><p className="font-display font-semibold text-sm text-gray-700">Disponible</p><p className="text-xs text-gray-400">Aparece en el menú</p></div>
                    <button type="button" onClick={() => setForm({ ...form, disponible: !form.disponible })} className={`relative w-12 h-7 rounded-full transition-colors ${form.disponible ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${form.disponible ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                    <div><p className="font-display font-semibold text-sm text-gray-700">Destacado ⭐</p><p className="text-xs text-gray-400">Se muestra como banner grande</p></div>
                    <button type="button" onClick={() => setForm({ ...form, destacado: !form.destacado })} className={`relative w-12 h-7 rounded-full transition-colors ${form.destacado ? 'bg-amber-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${form.destacado ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-boli-yellow to-boli-orange text-white font-display font-bold py-4 rounded-2xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {editing ? 'Guardar' : 'Crear Producto'}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Form Modal */}
      <AnimatePresence>
        {showCatForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowCatForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <h2 className="font-display font-bold text-lg text-gray-800">{editingCat ? 'Editar Sección' : 'Nueva Sección'}</h2>
                <button onClick={() => setShowCatForm(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleCatSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-display font-semibold text-gray-600">Nombre</label>
                    <input type="text" value={catForm.nombre} onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '') })} required placeholder="Ej: Día del Niño" className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-display font-semibold text-gray-600">Ícono</label>
                    <input type="text" value={catForm.icono} onChange={(e) => setCatForm({ ...catForm, icono: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-center text-2xl" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-display font-semibold text-gray-600">Descripción</label>
                  <input type="text" value={catForm.descripcion} onChange={(e) => setCatForm({ ...catForm, descripcion: e.target.value })} placeholder="Descripción corta..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-display font-semibold text-gray-600">Fecha inicio</label><input type="date" value={catForm.fecha_inicio} onChange={(e) => setCatForm({ ...catForm, fecha_inicio: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm" /></div>
                  <div><label className="text-sm font-display font-semibold text-gray-600">Fecha fin</label><input type="date" value={catForm.fecha_fin} onChange={(e) => setCatForm({ ...catForm, fecha_fin: e.target.value })} className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm" /></div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                  <div><p className="font-display font-semibold text-sm text-gray-700">Activa</p><p className="text-xs text-gray-400">Visible en el menú</p></div>
                  <button type="button" onClick={() => setCatForm({ ...catForm, activa: !catForm.activa })} className={`relative w-12 h-7 rounded-full transition-colors ${catForm.activa ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${catForm.activa ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-boli-purple to-violet-500 text-white font-display font-bold py-4 rounded-2xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {editingCat ? 'Guardar' : 'Crear Sección'}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
