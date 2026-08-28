import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lock, Unlock, Shield, Sparkles, User as UserIcon, Edit2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { usersApi } from '../../api/users';
import { User, UserRole, UserStatus, UserTier } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const UsersManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Edit user modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('STUDENT');
  const [targetTier, setTargetTier] = useState<UserTier>('FREE');
  const [targetProExpiresAt, setTargetProExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
    setTargetTier(u.tier || 'FREE');
    setTargetProExpiresAt(u.proExpiresAt ? u.proExpiresAt.slice(0, 10) : '');
  };

  const handleSaveRoleTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const updated = await usersApi.setUserRoleTier(
        selectedUser.id,
        targetRole,
        targetTier,
        targetProExpiresAt ? new Date(`${targetProExpiresAt}T23:59:59`).toISOString() : null
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

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field"
          style={{ width: '180px', height: '40px', minHeight: '40px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="STUDENT">Học sinh</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Gói thành viên</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
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
                  <td>
                    <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>
                      {u.role === 'ADMIN' ? 'Quản trị' : 'Học sinh'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={u.tier === 'PRO' ? 'premium' : 'neutral'}>
                      {u.tier === 'PRO' ? '⭐ Gói PRO' : 'Miễn phí'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        title="Phân quyền vai trò & gói PRO"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit2 size={14} /> Phân quyền
                      </button>
                      <button
                        onClick={() => handleToggleLock(u)}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: u.status === 'ACTIVE' ? 'var(--error)' : 'var(--success)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
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
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value as UserTier)}
            >
              <option value="FREE">Gói Miễn phí (FREE)</option>
              <option value="PRO">Gói Cao cấp (PRO)</option>
            </select>
          </div>

          {targetTier === 'PRO' && (
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
    </div>
  );
};
