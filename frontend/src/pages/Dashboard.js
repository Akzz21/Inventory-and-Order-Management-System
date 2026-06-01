import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiUsers, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiClock } from 'react-icons/fi';
import api from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/dashboard')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const cards = [
    { label: 'Total Products',  value: stats.total_products,               icon: <FiPackage />,    color: '#eef2ff', iconColor: '#6366f1' },
    { label: 'Total Customers', value: stats.total_customers,              icon: <FiUsers />,      color: '#f0fdf4', iconColor: '#22c55e' },
    { label: 'Total Orders',    value: stats.total_orders,                 icon: <FiShoppingBag />,color: '#fdf4ff', iconColor: '#a855f7' },
    { label: 'Total Revenue',   value: `₹${stats.total_revenue.toLocaleString()}`, icon: <FiDollarSign />, color: '#fefce8', iconColor: '#eab308' },
    { label: 'Low Stock Items', value: stats.low_stock_count,              icon: <FiAlertTriangle />,color: '#fef2f2', iconColor: '#ef4444' },
    { label: 'Pending Orders',  value: stats.pending_orders,               icon: <FiClock />,      color: '#fff7ed', iconColor: '#f97316' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="stat-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-card__icon" style={{ background: c.color, color: c.iconColor }}>
              {c.icon}
            </div>
            <div className="stat-card__label">{c.label}</div>
            <div className="stat-card__value">{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        {stats.low_stock_count > 0 && (
          <div className="card" style={{ padding: '1.4rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiAlertTriangle color="#ef4444" /> Low Stock Alert
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              <strong style={{ color: '#ef4444' }}>{stats.low_stock_count}</strong> product(s) have stock ≤ 10 units.
            </p>
            <Link to="/products" className="btn btn-outline btn-sm" style={{ marginTop: '0.8rem' }}>View Products</Link>
          </div>
        )}
        {stats.pending_orders > 0 && (
          <div className="card" style={{ padding: '1.4rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiClock color="#f97316" /> Pending Orders
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              <strong style={{ color: '#f97316' }}>{stats.pending_orders}</strong> order(s) are awaiting confirmation.
            </p>
            <Link to="/orders" className="btn btn-outline btn-sm" style={{ marginTop: '0.8rem' }}>View Orders</Link>
          </div>
        )}
      </div>
    </div>
  );
}
