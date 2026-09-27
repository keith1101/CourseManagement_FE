import React, { useState } from 'react';
import { CheckCircle2, Lock, Mail, Send, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../api/auth';
import { getApiErrorMessage } from '../../api/errors';
import { useToast } from '../../contexts/ToastContext';

type VerificationStatus = 'pending' | 'loading' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';
  const initialEmail = searchParams.get('email')?.trim() || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [message, setMessage] = useState(
    'Vui lòng kiểm tra hộp thư để hoàn tất đăng ký.',
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { success, error } = useToast();

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      error('Liên kết xác nhận không hợp lệ.');
      return;
    }
    if (password.length < 8) {
      error('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsVerifying(true);
    setStatus('loading');
    try {
      const result = await authApi.verifyEmail(token, password);
      setStatus('success');
      setMessage(result.message);
    } catch (requestError) {
      setStatus('error');
      setMessage(
        getApiErrorMessage(
          requestError,
          'Không thể xác nhận email. Vui lòng yêu cầu gửi lại email.',
        ),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      error('Vui lòng nhập email đã đăng ký.');
      return;
    }

    setIsResending(true);
    try {
      await authApi.resendVerification(email.trim());
      const resendMessage =
        'Nếu tài khoản tồn tại và chưa được xác minh, hướng dẫn xác nhận sẽ được gửi qua email.';
      success(resendMessage);
      setMessage(resendMessage);
    } catch (requestError) {
      error(
        getApiErrorMessage(
          requestError,
          'Không thể gửi lại email xác nhận.',
        ),
      );
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthLayout
        title="Đang xác nhận email"
        subtitle="Vui lòng chờ trong giây lát"
      >
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Đang kiểm tra liên kết xác nhận...
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Thư điện tử đã được xác nhận"
        subtitle="Tài khoản của bạn đã sẵn sàng"
      >
        <div style={{ textAlign: 'center' }}>
          <CheckCircle2
            size={52}
            color="var(--success)"
            style={{ marginBottom: '16px' }}
          />
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              leftIcon={<ShieldCheck size={18} />}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Đăng nhập
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (token && status === 'pending') {
    return (
      <AuthLayout
        title="Xác nhận email"
        subtitle="Tạo mật khẩu để kích hoạt tài khoản"
      >
        <form onSubmit={handleVerify}>
          <Input
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ít nhất 8 ký tự"
            leftIcon={<Lock size={18} />}
            disabled={isVerifying}
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Nhập lại mật khẩu"
            leftIcon={<Lock size={18} />}
            disabled={isVerifying}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isVerifying}
            leftIcon={<ShieldCheck size={18} />}
            style={{ width: '100%' }}
          >
            Xác nhận và tạo tài khoản
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={status === 'error' ? 'Liên kết không hợp lệ' : 'Kiểm tra hộp thư'}
      subtitle="Xác nhận email để kích hoạt tài khoản"
    >
      <div
        style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '20px',
        }}
      >
        <Mail size={42} color="var(--primary)" style={{ marginBottom: '12px' }} />
        <p>{message}</p>
      </div>

      <form onSubmit={handleResend}>
        <Input
          label="Thư điện tử đăng ký"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          leftIcon={<Mail size={18} />}
          disabled={isResending}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isResending}
          leftIcon={<Send size={18} />}
          style={{ width: '100%' }}
        >
          Gửi lại email xác nhận
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
};
