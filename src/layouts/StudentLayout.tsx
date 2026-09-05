import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
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
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Trang chủ', path: '/student', icon: <LayoutDashboard size={19} /> },
    { label: 'Bài thi được giao', path: '/student/assignments', icon: <FileCheck2 size={19} /> },
    { label: 'Tài liệu học tập', path: '/student/materials', icon: <Library size={19} /> },
    { label: 'Hồ sơ cá nhân', path: '/student/profile', icon: <User size={19} /> },
  ];

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/student') return [{ label: 'Cổng Học Sinh', path: '/student' }, { label: 'Tổng quan' }];
    if (path.startsWith('/student/assignments')) return [{ label: 'Cổng Học Sinh', path: '/student' }, { label: 'Bài thi được giao' }];
    if (path.startsWith('/student/materials')) return [{ label: 'Cổng Học Sinh', path: '/student' }, { label: 'Tài liệu học tập' }];
    if (path.startsWith('/student/profile')) return [{ label: 'Cổng Học Sinh', path: '/student' }, { label: 'Hồ sơ cá nhân' }];
    return [{ label: 'Cổng Học Sinh', path: '/student' }];
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(24, 32, 47, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 45,
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${sidebarOpen ? 'app-sidebar-open' : ''}`}>
        {/* Brand */}
        <div
          style={{
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="sidebar-brand-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              CourseManagement
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Cổng Học Sinh
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav
          style={{
            flex: 1,
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
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
                padding: '11px 16px',
                borderRadius: 'var(--border-radius-md)',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9375rem',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all var(--transition-fast)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
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
            padding: '16px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
                backgroundColor: '#FFFDF8',
                color: 'var(--primary)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                flexShrink: 0,
                border: '1px solid var(--border-color)',
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
                  color: '#FFFFFF',
                }}
              >
                {user?.fullName || 'Học sinh'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                {isProActive(user) ? '⭐ Gói PRO' : user?.accessLevel === 'PRO' ? 'PRO hết hạn' : 'Gói Miễn phí'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.65)')}
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
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Breadcrumbs items={getBreadcrumbs()} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {isProActive(user) && (
              <span
                className="badge badge-premium"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <Sparkles size={13} /> PRO
              </span>
            )}
            <button
              onClick={() => navigate('/student/profile')}
              title="Hồ sơ cá nhân"
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
                border: '1.5px solid var(--border-color)',
                boxShadow: 'var(--shadow-xs)',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
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
