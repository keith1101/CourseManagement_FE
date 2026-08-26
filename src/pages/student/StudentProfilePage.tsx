import React, { useState } from 'react';
import { Lock, Mail, Phone, Save, Shield, Sparkles, User as UserIcon } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
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
      const updated = await authApi.updateProfile({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined });
      setUser(updated);
      success('Cập nhật thông tin cá nhân thành công.');
    } catch (err) { error(getApiErrorMessage(err, 'Không thể cập nhật thông tin.')); }
    finally { setIsUpdatingProfile(false); }
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
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err) { error(getApiErrorMessage(err, 'Không thể đổi mật khẩu.')); }
    finally { setIsChangingPassword(false); }
  };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
    <div><h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Hồ sơ cá nhân</h1><p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>Quản lý thông tin tài khoản và mật khẩu bảo mật.</p></div>
    <Card className="profile-summary" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '28px' }}><div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>{user?.fullName?.charAt(0) || 'U'}</div><div><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user?.fullName}</h2><Badge variant="primary">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}</Badge>{isProActive(user) ? <Badge variant="warning"><Sparkles size={12} /> PRO</Badge> : user?.tier === 'PRO' && <Badge variant="error">PRO đã hết hạn</Badge>}</div><p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{user?.email}</p>{user?.proExpiresAt && <small style={{ color: 'var(--text-secondary)' }}>PRO đến {new Date(user.proExpiresAt).toLocaleDateString('vi-VN')}</small>}</div></Card>
    <Card style={{ padding: '28px' }}><h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Thông tin tài khoản</h3><form onSubmit={handleUpdateProfile}><Input label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} leftIcon={<UserIcon size={18} />} required /><Input label="Địa chỉ Email" value={user?.email || ''} disabled leftIcon={<Mail size={18} />} /><Input label="Số điện thoại" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} leftIcon={<Phone size={18} />} placeholder="0987654321" /><Button type="submit" variant="primary" isLoading={isUpdatingProfile} leftIcon={<Save size={16} />} style={{ marginTop: '12px' }}>Lưu thay đổi</Button></form></Card>
    <Card style={{ padding: '28px' }}><h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Đổi mật khẩu</h3><form onSubmit={handleChangePassword}><Input label="Mật khẩu hiện tại" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} leftIcon={<Lock size={18} />} required /><Input label="Mật khẩu mới" type="password" placeholder="Ít nhất 8 ký tự" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} leftIcon={<Lock size={18} />} required /><Input label="Xác nhận mật khẩu mới" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} leftIcon={<Lock size={18} />} required /><Button type="submit" variant="secondary" isLoading={isChangingPassword} leftIcon={<Shield size={16} />} style={{ marginTop: '12px', backgroundColor: 'var(--secondary)' }}>Cập nhật mật khẩu</Button></form></Card>
  </div>;
};
