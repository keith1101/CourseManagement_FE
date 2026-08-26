import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileQuestion,
  Users,
  BookOpen,
  Library,
  Send,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Bảng điều khiển', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Quản lý Đề thi', path: '/admin/exams', icon: <FileQuestion size={20} /> },
    { label: 'Giao bài thi', path: '/admin/assignments', icon: <Send size={20} /> },
    { label: 'Quản lý Môn học', path: '/admin/subjects', icon: <BookOpen size={20} /> },
    { label: 'Quản lý Tài liệu', path: '/admin/materials', icon: <Library size={20} /> },
    { label: 'Quản lý Người dùng', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'Báo cáo & Kết quả', path: '/admin/results', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 45,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${sidebarOpen ? 'app-sidebar-open' : ''}`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform var(--transition-normal)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="sidebar-brand-icon sidebar-brand-icon--admin" aria-hidden="true">
            <ShieldCheck size={22} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.2 }}>CourseManagement</h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>
              Quản Trị Viên
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-md)',
                color: '#FFFFFF',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9375rem',
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                transition: 'all var(--transition-fast)',
                borderLeft: isActive ? '4px solid var(--secondary)' : '4px solid transparent',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Mini Profile & Logout */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: 'var(--primary)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              A
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.fullName || 'Quản trị viên'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {user?.email || 'admin@system.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            style={{
              color: 'rgba(255, 255, 255, 0.75)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={sidebarOpen}
              style={{
                color: 'var(--text-primary)',
                padding: '6px',
              }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Hệ thống quản trị</span>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Bảng Điều Khiển Quản Lý
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 12px',
                borderRadius: 'var(--border-radius-full)',
              }}
            >
              ADMIN
            </span>
          </div>
        </header>

        {/* Page Container */}
        <main className="page-container animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
