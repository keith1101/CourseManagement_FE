import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, UserPlus, User as UserIcon } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim()) return error('Vui lòng điền đầy đủ thông tin bắt buộc.');
    setIsLoading(true);
    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      success('Nếu địa chỉ email có thể đăng ký, hướng dẫn xác minh sẽ được gửi qua hộp thư.');
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
