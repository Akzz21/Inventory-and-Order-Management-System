import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY = {
  name: '',
  sku: '',
  description: '',
  image_url: '',
  price: '',
  stock: '',
  category: 'General'
};
const CATEGORIES = ['General', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Books', 'Tools', 'Other'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get(`/products${search ? `?search=${search}` : ''}`);
      setProducts(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
   const openEdit = (p) => {
  setEditing(p);
  setForm({
    name: p.name,
    sku: p.sku,
    description: p.description || '',
    image_url: p.image_url || '',
    price: p.price,
    stock: p.stock,
    category: p.category
  });
  setModal(true);
};
  const closeModal = () => { setModal(false); setEditing(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      closeModal(); fetch();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetch();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div className="search-bar">
            <FiSearch size={15} color="var(--muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or SKU…" />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>SKU</th><th>Category</th>
                <th>Price</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No products found. Add your first product!</div></td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><code style={{ fontSize: '0.8rem', background: 'var(--bg)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>{p.sku}</code></td>
                  <td><span className="badge" style={{ background: 'var(--primary-l)', color: 'var(--primary-d)' }}>{p.category}</span></td>
                  <td>₹{p.price.toLocaleString()}</td>
                  <td>
                    <span className={p.stock <= 10 ? 'low-stock' : 'in-stock'}>
                      {p.stock} {p.stock <= 10 && p.stock > 0 ? '⚠️' : p.stock === 0 ? '🚫' : '✓'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><FiEdit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={closeModal}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Wireless Mouse" />
                  </div>
                  <div className="form-group">
                    <label>SKU * {editing && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(read-only)</span>}</label>
                    <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} required placeholder="e.g. WM-001" disabled={!!editing} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                 <label>Image URL</label>
                <input
                 value={form.image_url}
                 onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://example.com/product.jpg"
                         />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Optional product description…" style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
