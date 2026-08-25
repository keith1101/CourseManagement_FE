import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lock, Unlock, Shield, Sparkles, User as UserIcon, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usersApi } from '../../api/users';
import { User, UserRole, UserStatus, UserTier } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const UsersManagementPage: React.FC = () => {
  const { success, error } = useToast();

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleLock = async (u: User) => {
    const nextStatus: UserStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await usersApi.toggleStatus(u.id, nextStatus);
      setUsers((prev) =>
        prev.map((user) => (user.id === u.id ? { ...user, status: nextStatus } : user))
      );
      success(nextStatus === 'ACTIVE' ? `Đã mở khóa tài khoản ${u.fullName}` : `Đã khóa tài khoản ${u.fullName}`);
    } catch (err) {
      error('Không thể thay đổi trạng thái tài khoản');
    }
  };

  const handleOpenEditUser = (u: User) => {
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
      const updated = await usersApi.setUserRoleTier(selectedUser.id, targetRole, targetTier, targetProExpiresAt ? new Date(`${targetProExpiresAt}T23:59:59`).toISOString() : null);
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? updated : user))
      );
      success(`Đã cập nhật quyền hạn cho ${selectedUser.fullName}`);
      setSelectedUser(null);
    } catch (err) {
      error('Không thể cập nhật quyền hạn');
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
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Quản Lý Người Dùng & Học Sinh
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
          Xem danh sách tài khoản, phân quyền quản trị và nâng cấp gói PRO
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field"
          style={{ width: '180px', height: '40px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="STUDENT">Học sinh (Student)</option>
          <option value="ADMIN">Quản trị viên (Admin)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ Và Tên</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Vai Trò</th>
              <th>Gói Dịch Vụ</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                        }}
                      >
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <strong>{u.fullName}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phoneNumber || '-'}</td>
                  <td>
                    <Badge variant={u.role === 'ADMIN' ? 'primary' : 'info'}>
                      {u.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}
                    </Badge>
                  </td>
                  <td>
                    {u.tier === 'PRO' ? (
                      <Badge variant="warning">
                        <Sparkles size={12} /> PRO
                      </Badge>
                    ) : (
                      <Badge variant="info">Miễn phí</Badge>
                    )}
                  </td>
                  <td>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditUser(u)}>
                        Phân quyền
                      </Button>
                      <button
                        onClick={() => handleToggleLock(u)}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: u.status === 'ACTIVE' ? 'var(--error)' : 'var(--success)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {u.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
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
        title={`Phân Quyền: ${selectedUser?.fullName}`}
        maxWidth="460px"
      >
        <form onSubmit={handleSaveRoleTier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Vai trò trong hệ thống</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as UserRole)}
              className="input-field"
            >
              <option value="STUDENT">Học sinh (Student)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Gói dịch vụ học tập</label>
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value as UserTier)}
              className="input-field"
            >
              <option value="FREE">Gói Miễn phí (Free)</option>
              <option value="PRO">Gói Chuyên sâu (PRO - Không giới hạn)</option>
            </select>
          </div>

          {targetTier === 'PRO' && (
            <div className="form-group">
              <label className="form-label">Ngày hết hạn PRO</label>
              <input type="date" value={targetProExpiresAt} onChange={(e) => setTargetProExpiresAt(e.target.value)} className="input-field" min={new Date().toISOString().slice(0, 10)} />
              <small style={{ color: 'var(--text-secondary)' }}>Để trống nếu PRO không có thời hạn.</small>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setSelectedUser(null)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Cập nhật quyền
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
