import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiGrid, FiPackage, FiUsers, FiShoppingBag } from 'react-icons/fi';
import Dashboard  from './pages/Dashboard';
import Products   from './pages/Products/Products';
import Customers  from './pages/Customers/Customers';
import Orders     from './pages/Orders/Orders';

function Sidebar() {
  const links = [
    { to: '/',          label: 'Dashboard', icon: <FiGrid size={18} />,      end: true },
    { to: '/products',  label: 'Products',  icon: <FiPackage size={18} /> },
    { to: '/customers', label: 'Customers', icon: <FiUsers size={18} /> },
    { to: '/orders',    label: 'Orders',    icon: <FiShoppingBag size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        📦 <span>Inventory</span>MS
      </div>
      <nav className="sidebar__nav">
        {links.map(l => (
          <NavLink
            key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '0 1rem', fontSize: '0.72rem', color: '#475569' }}>
        v1.0.0 — FastAPI + React
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/products"  element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="*"          element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Inter', fontSize: '0.88rem' } }} />
    </BrowserRouter>
  );
}
