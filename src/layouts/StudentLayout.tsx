import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  Award,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Library,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isProActive } from '../utils/access';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Trang chủ', path: '/student', icon: <LayoutDashboard size={20} /> },
    { label: 'Bài thi được giao', path: '/student/assignments', icon: <FileCheck2 size={20} /> },
    { label: 'Tài liệu học tập', path: '/student/materials', icon: <Library size={20} /> },
    { label: 'Hồ sơ cá nhân', path: '/student/profile', icon: <User size={20} /> },
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

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
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
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={22} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, lineHeight: 1.2 }}>CourseManagement</h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Cổng Học Sinh
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/student'}
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
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              {user?.fullName?.charAt(0) || 'H'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.fullName || 'Học sinh'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {isProActive(user) ? '⭐ Gói PRO' : user?.tier === 'PRO' ? 'PRO đã hết hạn' : 'Gói Miễn phí'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
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
              style={{
                display: 'none',
                color: 'var(--text-primary)',
                padding: '6px',
              }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Xin chào,</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{user?.fullName}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isProActive(user) && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--secondary-light)',
                  color: 'var(--secondary)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--border-radius-full)',
                  border: '1px solid var(--secondary-accent)',
                }}
              >
                <Sparkles size={14} /> PRO
              </span>
            )}
            <button
              onClick={() => navigate('/student/profile')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
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
