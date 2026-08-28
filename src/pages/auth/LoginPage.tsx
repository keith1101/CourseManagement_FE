import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const zaloUrl = import.meta.env.ZALO_URL || import.meta.env.VITE_ZALO_URL;

  useEffect(() => {
    const authMessage = localStorage.getItem('auth_message');
    if (!authMessage) return;
    localStorage.removeItem('auth_message');
    error(authMessage);
  }, [error]);

  const handleSubmit = async (event?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (event) event.preventDefault();
    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    if (!loginEmail.trim() || !loginPassword) {
      error('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login({ email: loginEmail.trim(), password: loginPassword });
      success(`Chào mừng trở lại, ${user.fullName}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err) {
      error(getApiErrorMessage(err, 'Email hoặc mật khẩu không chính xác.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (mockEmail: string, mockPass = '12345678') => {
    setEmail(mockEmail);
    setPassword(mockPass);
    void handleSubmit(undefined, mockEmail, mockPass);
  };

  return (
    <AuthLayout
      title="Đăng nhập tài khoản"
      subtitle="Nhập thông tin xác thực để bắt đầu học tập và làm bài thi"
    >
      <form onSubmit={(e) => handleSubmit(e)}>
        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          disabled={isLoading}
        />
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu của bạn"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              style={{ display: 'flex', color: 'var(--text-muted)' }}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          disabled={isLoading}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '20px',
            fontSize: '0.875rem',
          }}
        >
          <button
            type="button"
            onClick={() => setShowResetHelp(true)}
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              background: 'transparent',
              fontSize: '0.8125rem',
            }}
          >
            Quên mật khẩu?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<LogIn size={18} />}
          style={{ width: '100%' }}
        >
          Đăng Nhập
        </Button>

        {/* Quick Mock Login Shortcuts (Only visible when ENABLE_MOCKS=true) */}
        {(import.meta.env.ENABLE_MOCKS ?? import.meta.env.VITE_ENABLE_MOCKS) === 'true' && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent)',
                textAlign: 'center',
              }}
            >
              ⚡ Tài khoản thử nghiệm nhanh (Mock)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('student@test.com')}
                disabled={isLoading}
                leftIcon={<UserCheck size={14} color="var(--primary)" />}
                style={{ fontSize: '0.8125rem' }}
              >
                Học Sinh (PRO)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('admin@test.com')}
                disabled={isLoading}
                leftIcon={<ShieldCheck size={14} color="var(--secondary)" />}
                style={{ fontSize: '0.8125rem' }}
              >
                Quản Trị (ADMIN)
              </Button>
            </div>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary)', fontWeight: 700 }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </form>

      <Modal
        isOpen={showResetHelp}
        onClose={() => setShowResetHelp(false)}
        title="Khôi phục mật khẩu"
        maxWidth="440px"
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
          Vui lòng liên hệ trực tiếp với quản trị viên qua Zalo để được hỗ trợ cấp lại mật khẩu an toàn.
        </p>
        {zaloUrl ? (
          <a
            href={zaloUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '16px',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.9375rem',
            }}
          >
            Mở kênh Zalo hỗ trợ →
          </a>
        ) : (
          <small style={{ display: 'block', marginTop: '12px', color: 'var(--text-muted)' }}>
            Chưa cấu hình liên kết Zalo hỗ trợ.
          </small>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button variant="outline" onClick={() => setShowResetHelp(false)}>
            Đóng
          </Button>
        </div>
      </Modal>
    </AuthLayout>
  );
};
