import React, { ReactNode } from 'react';
import { BookOpen, CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--border-radius-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Left Editorial Brand Panel */}
        <div
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            color: '#FFFFFF',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: 'var(--shadow-primary)',
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  CourseManagement
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  Hệ thống Ôn tập & Luyện thi
                </span>
              </div>
            </div>

            {/* Headline / Editorial Quote */}
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(200, 100, 62, 0.2)',
                  color: '#F4A988',
                  padding: '4px 12px',
                  borderRadius: 'var(--border-radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={13} /> Nền tảng học thuật cao cấp
              </div>
              <h2
                className="font-serif"
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: '#FFFFFF',
                  marginBottom: '16px',
                }}
              >
                Tối ưu hóa hành trình ôn luyện và kiểm tra trực tuyến.
              </h2>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  lineHeight: 1.6,
                }}
              >
                Trải nghiệm giao diện tinh gọn, tập trung hoàn toàn vào nội dung đề thi với hệ thống phân tích kết quả chuyên sâu.
              </p>
            </div>

            {/* Value Highlights */}
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="var(--accent)" />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Soạn thảo và làm bài trắc nghiệm tương tác</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="var(--accent)" />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Ngân hàng tài liệu PDF & Video đa phương tiện</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="var(--accent)" />
                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Báo cáo chi tiết và giải thích đáp án chuẩn xác</span>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <GraduationCap size={16} />
            <span>Tiêu chuẩn chất lượng khảo thí giáo dục</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div
          style={{
            padding: '48px 40px',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ marginBottom: '28px' }}>
            <h1
              className="font-serif"
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                marginBottom: '6px',
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
