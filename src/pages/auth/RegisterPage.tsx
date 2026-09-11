import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, UserPlus, User as UserIcon } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return error('Vui lòng điền đầy đủ thông tin bắt buộc.');
    if (password.length < 8) return error('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password !== confirmPassword) return error('Mật khẩu xác nhận không khớp.');
    setIsLoading(true);
    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      const resultMessage = result.message.toLowerCase();
      const announcement = resultMessage.includes('already exists')
        ? 'Thư điện tử này đã được đăng ký nhưng chưa được xác minh. Chúng tôi đã gửi lại thư xác nhận.'
        : 'Đăng ký thành công. Vui lòng kiểm tra hộp thư để xác nhận tài khoản.';

      success(announcement);
      navigate(
        `/verify-email?email=${encodeURIComponent(result.email)}`,
      );
    } catch (err) {
      error(getApiErrorMessage(err, 'Đăng ký không thành công.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản học viên"
      subtitle="Tham gia cùng cộng đồng học tập và kiểm tra trực tuyến"
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<UserIcon size={18} />}
          disabled={isLoading}
        />
        <Input
          label="Thư điện tử"
          type="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          disabled={isLoading}
        />
        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="0987654321"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          leftIcon={<Phone size={18} />}
          disabled={isLoading}
        />
        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ít nhất 8 ký tự"
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
        <Input
          label="Xác nhận mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập lại mật khẩu"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<UserPlus size={18} />}
          style={{ width: '100%', marginTop: '6px' }}
        >
          Đăng Ký Tài Khoản
        </Button>

        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Đăng nhập
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
