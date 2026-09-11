import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lock, Unlock, Shield, Sparkles, User as UserIcon, Edit2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { usersApi } from '../../api/users';
import { AccessLevel, User, UserRole, UserStatus } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../api/errors';

export const UsersManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>('ALL');

  // Edit user modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('STUDENT');
  const [targetAccessLevel, setTargetAccessLevel] = useState<AccessLevel>('FREE');
  const [targetProExpiresAt, setTargetProExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reset student password modal
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err) {
      error('Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleLock = async (u: User) => {
    if (u.id === currentUser?.id && u.status === 'ACTIVE') {
      error('Bạn không thể khóa tài khoản đang đăng nhập.');
      return;
    }

    const nextStatus: UserStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await usersApi.toggleStatus(u.id, nextStatus);
      setUsers((prev) =>
        prev.map((user) => (user.id === u.id ? { ...user, status: nextStatus } : user))
      );
      success(
        nextStatus === 'ACTIVE'
          ? `Đã mở khóa tài khoản ${u.fullName}`
          : `Đã khóa tài khoản ${u.fullName}`
      );
    } catch (err) {
      error('Không thể thay đổi trạng thái tài khoản.');
    }
  };

  const handleOpenEditUser = (u: User) => {
    if (u.id === currentUser?.id) {
      error('Bạn không thể tự phân quyền cho tài khoản đang đăng nhập.');
      return;
    }

    setSelectedUser(u);
    setTargetRole(u.role);
    setTargetAccessLevel(u.accessLevel || 'FREE');
    setTargetProExpiresAt(u.proExpiresAt ? u.proExpiresAt.slice(0, 10) : '');
  };

  const handleSaveRoleTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const updated = await usersApi.setUserAccessLevel(
        selectedUser.id,
        targetRole,
        targetAccessLevel,
        targetProExpiresAt ? new Date(`${targetProExpiresAt}T23:59:59`).toISOString() : null,
      );
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? updated : user))
      );
      success(`Đã cập nhật quyền hạn cho ${selectedUser.fullName}`);
      setSelectedUser(null);
    } catch (err) {
      error('Không thể cập nhật quyền hạn.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResetPassword = (u: User) => {
    if (u.role !== 'STUDENT') return;
    setResetPasswordUser(u);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const handleCloseResetPassword = () => {
    if (isResettingPassword) return;
    setResetPasswordUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (newPassword.length < 8) {
      error('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await usersApi.resetPassword(resetPasswordUser.id, newPassword);
      success(`Đã đổi mật khẩu cho ${resetPasswordUser.fullName}. Các phiên đăng nhập cũ đã bị thu hồi.`);
      setResetPasswordUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi mật khẩu cho học sinh.'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchAccessLevel = accessLevelFilter === 'ALL' || u.accessLevel === accessLevelFilter;
    return matchSearch && matchRole && matchAccessLevel;
  });

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách người dùng..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Quản trị người dùng"
        title="Quản lý thành viên & Học sinh"
        description="Theo dõi danh sách người dùng, kích hoạt gói thành viên PRO và quản lý trạng thái tài khoản."
      />

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '360px', maxWidth: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '44px', width: '100%' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field"
          style={{ minWidth: '200px', width: 'auto', height: '46px', minHeight: '46px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="STUDENT">Học sinh</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>

        <select
          value={accessLevelFilter}
          onChange={(e) => setAccessLevelFilter(e.target.value)}
          className="input-field"
          style={{ minWidth: '200px', width: 'auto', height: '46px', minHeight: '46px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả gói</option>
          <option value="FREE">Gói Miễn phí</option>
          <option value="PRO">Gói PRO</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Họ và tên</th>
              <th style={{ minWidth: '200px' }}>Thư điện tử</th>
              <th style={{ minWidth: '130px' }}>Số điện thoại</th>
              <th style={{ textAlign: 'center', width: '120px', minWidth: '110px' }}>Vai trò</th>
              <th style={{ textAlign: 'center', width: '130px', minWidth: '120px' }}>Gói thành viên</th>
              <th style={{ textAlign: 'center', width: '120px', minWidth: '110px' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', width: '260px', minWidth: '220px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState
                    title="Không tìm thấy người dùng"
                    description="Không có tài khoản nào phù hợp với từ khóa tìm kiếm."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor:
                            u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)',
                          flexShrink: 0,
                        }}
                      >
                        {u.fullName.charAt(0)}
                      </div>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {u.fullName}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {u.phoneNumber || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>
                      {u.role === 'ADMIN' ? 'Quản trị' : 'Học sinh'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={u.accessLevel === 'PRO' ? 'premium' : 'neutral'}>
                      {u.accessLevel === 'PRO' ? '⭐ Gói PRO' : 'Miễn phí'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center', width: '260px', minWidth: '220px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        title="Phân quyền vai trò & gói PRO"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <Edit2 size={14} /> Phân quyền
                      </button>
                      {u.role === 'STUDENT' && (
                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          title="Đổi mật khẩu cho học sinh"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <KeyRound size={14} /> Đổi mật khẩu
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleLock(u)}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                          color: u.status === 'ACTIVE' ? 'var(--error)' : 'var(--success)',
                          border: `1px solid ${
                            u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'
                          }`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          minWidth: '32px',
                          height: '32px',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {u.status === 'ACTIVE' ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role & Tier Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Phân quyền tài khoản: ${selectedUser?.fullName}`}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveRoleTier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Vai trò trong hệ thống</label>
            <select
              className="input-field"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as UserRole)}
            >
              <option value="STUDENT">Học sinh (STUDENT)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Gói thành viên</label>
            <select
              className="input-field"
              value={targetAccessLevel}
              onChange={(e) => setTargetAccessLevel(e.target.value as AccessLevel)}
            >
              <option value="FREE">Gói Miễn phí (FREE)</option>
              <option value="PRO">Gói Cao cấp (PRO)</option>
            </select>
          </div>

          {targetAccessLevel === 'PRO' && (
            <div className="form-group">
              <label className="form-label">Hạn dùng PRO (Tùy chọn)</label>
              <input
                type="date"
                className="input-field"
                value={targetProExpiresAt}
                onChange={(e) => setTargetProExpiresAt(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Để trống nếu muốn cấp gói PRO không thời hạn.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setSelectedUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Student Password Modal */}
      <Modal
        isOpen={!!resetPasswordUser}
        onClose={handleCloseResetPassword}
        title={`Đổi mật khẩu: ${resetPasswordUser?.fullName}`}
        maxWidth="500px"
      >
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Mật khẩu mới sẽ được áp dụng ngay. Các phiên đăng nhập hiện tại của học sinh sẽ bị đăng xuất.
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                minLength={8}
                required
                autoComplete="new-password"
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                onClick={() => setShowNewPassword((visible) => !visible)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                className="input-field"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                minLength={8}
                required
                autoComplete="new-password"
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                aria-label={showConfirmNewPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                onClick={() => setShowConfirmNewPassword((visible) => !visible)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}
              >
                {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="outline" type="button" onClick={handleCloseResetPassword} disabled={isResettingPassword}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isResettingPassword} leftIcon={<KeyRound size={16} />}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
