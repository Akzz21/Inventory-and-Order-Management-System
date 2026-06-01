import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get(`/customers${search ? `?search=${search}` : ''}`);
      setCustomers(res.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        toast.success('Customer updated!');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added!');
      }
      closeModal(); fetch();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? Their orders will also be removed.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetch();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div className="search-bar">
            <FiSearch size={15} color="var(--muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Customer</button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No customers found.</div></td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-l)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><FiEdit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}><FiTrash2 size={13} /></button>
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
              <h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="modal-close" onClick={closeModal}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="john@example.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Street, City, State, PIN" style={{ width: '100%', padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
