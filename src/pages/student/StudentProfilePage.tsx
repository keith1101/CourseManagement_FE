import React, { useState } from 'react';
import { Lock, Mail, Phone, Save, Shield, Sparkles, User as UserIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';
import { isProActive } from '../../utils/access';

export const StudentProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const { success, error } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) return error('Họ và tên không được để trống.');
    setIsUpdatingProfile(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      setUser(updated);
      success('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể cập nhật thông tin.'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) return error('Vui lòng nhập đầy đủ mật khẩu.');
    if (newPassword.length < 8) return error('Mật khẩu mới phải có ít nhất 8 ký tự.');
    if (newPassword !== confirmNewPassword) return error('Mật khẩu xác nhận không khớp.');
    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      success('Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      <PageHeader
        eyebrow="Tài khoản & Thiết lập"
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản, quyền hạn thành viên và mật khẩu bảo mật."
      />

      {/* Academic Dossier Summary Card */}
      <Card
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '28px 32px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 800,
            border: '2px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          {user?.fullName?.charAt(0) || 'U'}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {user?.fullName}
            </h2>
            <Badge variant="primary">
              {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}
            </Badge>
            {isProActive(user) ? (
              <Badge variant="premium" icon={<Sparkles size={13} />}>
                Gói PRO
              </Badge>
            ) : user?.accessLevel === 'PRO' ? (
              <Badge variant="error">PRO đã hết hạn</Badge>
            ) : (
              <Badge variant="neutral">Gói Miễn phí</Badge>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {user?.email}
          </p>

          {user?.proExpiresAt && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '6px' }}>
              Thời hạn PRO đến ngày {new Date(user.proExpiresAt).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      </Card>

      {/* 2-Column Responsive Forms Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Account Info Form Card */}
        <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--primary)',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            Thông tin tài khoản
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              label="Họ và tên học viên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon size={18} />}
              required
            />
            <Input
              label="Địa chỉ Email"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail size={18} />}
              helperText="Email được dùng làm tên đăng nhập cố định và không thể thay đổi."
            />
            <Input
              label="Số điện thoại liên hệ"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leftIcon={<Phone size={18} />}
              placeholder="0987654321"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingProfile}
                leftIcon={<Save size={16} />}
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Form Card */}
        <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--primary)',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            Đổi mật khẩu bảo mật
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button
                type="submit"
                variant="secondary"
                isLoading={isChangingPassword}
                leftIcon={<Shield size={16} />}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
