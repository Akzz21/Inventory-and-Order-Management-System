import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiX, FiEye, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const STATUS_COLORS = { pending: 'badge-pending', confirmed: 'badge-confirmed', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [modal, setModal]         = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] });

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders${filterStatus ? `?status=${filterStatus}` : ''}`);
      setOrders(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data));
    api.get('/products').then(r => setProducts(r.data));
  }, []);

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }));

  const getOrderTotal = () => form.items.reduce((sum, item) => {
    const p = products.find(p => p.id === Number(item.product_id));
    return sum + (p ? p.price * (item.quantity || 0) : 0);
  }, 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const items = form.items.filter(i => i.product_id && i.quantity > 0);
    if (!form.customer_id) return toast.error('Please select a customer');
    if (items.length === 0) return toast.error('Add at least one product');
    setSaving(true);
    try {
      await api.post('/orders', { customer_id: Number(form.customer_id), notes: form.notes, items: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })) });
      toast.success('Order created successfully!');
      setModal(false);
      setForm({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] });
      fetchOrders();
      api.get('/products').then(r => setProducts(r.data));
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}`, { status });
      toast.success('Status updated');
      fetchOrders();
      api.get('/products').then(r => setProducts(r.data));
    } catch (e) { toast.error(e.message); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this order? Stock will be restored.')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order deleted'); fetchOrders();
      api.get('/products').then(r => setProducts(r.data));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={{ padding: '0.5rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.86rem', background: 'white' }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setModal(true)}><FiPlus size={16} /> New Order</button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <table>
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No orders found.</div></td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td><strong>#{String(o.id).padStart(4, '0')}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customer?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{o.customer?.email}</div>
                  </td>
                  <td>{o.order_items?.length} item(s)</td>
                  <td style={{ fontWeight: 700 }}>₹{o.total_price.toLocaleString()}</td>
                  <td>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className={`badge ${STATUS_COLORS[o.status]}`}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', background: 'transparent' }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewOrder(o)}><FiEye size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(o.id)}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Order Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Create New Order</h2>
              <button className="modal-close" onClick={() => setModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal__body">
                <div className="form-group">
                  <label>Customer *</label>
                  <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} required>
                    <option value="">Select a customer…</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Items *</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><FiPlus size={13} /> Add Item</button>
                </div>

                {form.items.map((item, i) => {
                  const prod = products.find(p => p.id === Number(item.product_id));
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.6rem', background: 'var(--bg)', padding: '0.7rem', borderRadius: 'var(--radius)' }}>
                      <div style={{ flex: 2 }}>
                        <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} style={{ width: '100%', padding: '0.55rem 0.8rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.86rem', background: 'white' }}>
                          <option value="">Select product…</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) — ₹{p.price}</option>)}
                        </select>
                        {prod && <div style={{ fontSize: '0.73rem', color: prod.stock < 5 ? 'var(--danger)' : 'var(--muted)', marginTop: 3 }}>Available: {prod.stock} units</div>}
                      </div>
                      <div style={{ flex: '0 0 80px' }}>
                        <input type="number" min={1} max={prod?.stock || 999} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.86rem' }} />
                      </div>
                      <div style={{ flex: '0 0 80px', fontSize: '0.85rem', fontWeight: 700, paddingTop: '0.6rem', color: 'var(--dark)' }}>
                        {prod ? `₹${(prod.price * item.quantity).toLocaleString()}` : '—'}
                      </div>
                      {form.items.length > 1 && (
                        <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '0.5rem', display: 'flex', alignItems: 'center' }} onClick={() => removeItem(i)}><FiMinus size={14} /></button>
                      )}
                    </div>
                  );
                })}

                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', marginTop: '0.5rem', color: 'var(--dark)' }}>
                  Total: ₹{getOrderTotal().toLocaleString()}
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any special instructions…" style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Order #{String(viewOrder.id).padStart(4, '0')}</h2>
              <button className="modal-close" onClick={() => setViewOrder(null)}><FiX /></button>
            </div>
            <div className="modal__body">
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Customer</p>
                <p style={{ fontWeight: 700 }}>{viewOrder.customer?.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{viewOrder.customer?.email}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Items</p>
                {viewOrder.order_items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                    <span>{item.product?.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 700 }}>₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '0.7rem' }}>
                  <span>Total</span>
                  <span>₹{viewOrder.total_price.toLocaleString()}</span>
                </div>
              </div>
              {viewOrder.notes && <div style={{ background: 'var(--bg)', padding: '0.7rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--muted)' }}><strong>Notes:</strong> {viewOrder.notes}</div>}
              <div style={{ marginTop: '0.8rem' }}>
                <span className={`badge ${STATUS_COLORS[viewOrder.status]}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>{viewOrder.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
