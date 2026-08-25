import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
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
  const zaloUrl = import.meta.env.VITE_ZALO_URL;

  useEffect(() => {
    const authMessage = localStorage.getItem('auth_message');
    if (!authMessage) return;
    localStorage.removeItem('auth_message');
    error(authMessage);
  }, [error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      error('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      success(`Chào mừng trở lại, ${user.fullName}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err) {
      error(getApiErrorMessage(err, 'Email hoặc mật khẩu không chính xác.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Ôn Tập & Luyện Thi" subtitle="Đăng nhập để bắt đầu học tập và làm bài thi">
      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={18} />} disabled={isLoading} />
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu của bạn"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          rightIcon={<button type="button" onClick={() => setShowPassword((value) => !value)} style={{ display: 'flex', color: 'var(--text-muted)' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
          disabled={isLoading}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', fontSize: '0.875rem' }}>
          <button type="button" onClick={() => setShowResetHelp(true)} style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent' }}>Quên mật khẩu?</button>
        </div>
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} leftIcon={<LogIn size={18} />} style={{ width: '100%', background: 'var(--primary-gradient)', boxShadow: 'var(--shadow-primary-strong)' }}>
          Đăng Nhập
        </Button>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Đăng ký ngay</Link>
        </div>
      </form>
      <Modal isOpen={showResetHelp} onClose={() => setShowResetHelp(false)} title="Khôi phục mật khẩu" maxWidth="420px">
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Vui lòng liên hệ quản trị viên qua Zalo để được hỗ trợ đặt lại mật khẩu.</p>
        {zaloUrl ? <a href={zaloUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', color: 'var(--primary)', fontWeight: 700 }}>Mở Zalo hỗ trợ</a> : <small style={{ display: 'block', marginTop: '12px', color: 'var(--text-muted)' }}>Chưa cấu hình liên kết Zalo hỗ trợ.</small>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}><Button variant="outline" onClick={() => setShowResetHelp(false)}>Đóng</Button></div>
      </Modal>
    </AuthLayout>
  );
};
