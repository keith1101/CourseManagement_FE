import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Library, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { subjectsApi } from '../../api/subjects';
import { Subject } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const SubjectsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [order, setOrder] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await subjectsApi.getSubjects();
      setSubjects(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setDescription('');
    setOrder(subjects.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setDescription(sub.description || '');
    setOrder(sub.order || 1);
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      error('Vui lòng nhập tên môn và mã môn!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSubject) {
        const updated = await subjectsApi.updateSubject(editingSubject.id, {
          name,
          code,
          description,
          order,
        });
        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? { ...s, ...updated } : s)));
        success('Cập nhật môn học thành công!');
      } else {
        const created = await subjectsApi.createSubject({
          name,
          code,
          description,
          order,
        });
        setSubjects((prev) => [...prev, created]);
        success('Thêm môn học mới thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      error(getApiErrorMessage(err, 'Không thể lưu môn học. Vui lòng thử lại!'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa môn học này?')) return;
    try {
      await subjectsApi.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      success('Đã xóa môn học');
    } catch (err) {
      error('Không thể xóa môn học');
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner text="Đang tải danh sách môn học..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Quản Lý Môn Học
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Danh mục các bộ môn trong hệ thống ôn tập & luyện thi
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreateModal} leftIcon={<Plus size={18} />}>
          Thêm Môn Học Mới
        </Button>
      </div>

      {/* Search Input */}
      <div className="page-search" style={{ position: 'relative', width: '280px' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '36px', height: '40px' }}
        />
      </div>

      {/* Subjects Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Thứ Tự</th>
              <th>Mã Môn</th>
              <th>Tên Môn Học</th>
              <th>Mô Tả</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Chưa có môn học nào
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <strong>#{sub.order || 1}</strong>
                  </td>
                  <td>
                    <Badge variant="primary">{sub.code}</Badge>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.9375rem' }}>{sub.name}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {sub.description || '-'}
                    </span>
                  </td>
                  <td>
                    <Badge variant={sub.isActive ? 'success' : 'error'}>
                      {sub.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/admin/materials?subjectId=${sub.id}`)}
                        title="Quản lý tài liệu"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Library size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: 'var(--error)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Chỉnh Sửa Môn Học' : 'Thêm Môn Học Mới'}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveSubject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Tên môn học"
            placeholder="Ví dụ: Toán Học, Tiếng Anh..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Mã môn (Code)"
              placeholder="MATH, ENG..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả môn học</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu chương trình môn học..."
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              {editingSubject ? 'Lưu cập nhật' : 'Thêm môn học'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
