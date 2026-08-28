import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, FileEdit, Plus, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { examsApi } from '../../api/exams';
import { Exam, AccessLevel } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const ExamsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('FREE');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setExams(await examsApi.getExams());
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể tải danh sách đề thi.'));
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setAccessLevel('FREE');
    setIsModalOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setAccessLevel(exam.accessLevel);
    setIsModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return error('Tên đề thi không được để trống.');
    setIsSaving(true);
    try {
      const saved = editing
        ? await examsApi.updateExam(editing.id, { title: title.trim(), description, accessLevel })
        : await examsApi.createExam({ title: title.trim(), description, accessLevel });
      setExams((previous) =>
        editing
          ? previous.map((exam) => (exam.id === saved.id ? saved : exam))
          : [saved, ...previous]
      );
      setIsModalOpen(false);
      success(editing ? 'Đã cập nhật đề thi.' : 'Đã tạo đề thi thành công.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể lưu đề thi.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (exam: Exam) => {
    try {
      const updated = await examsApi.publishExam(
        exam.id,
        exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      );
      setExams((previous) => previous.map((item) => (item.id === exam.id ? updated : item)));
      success(updated.status === 'PUBLISHED' ? 'Đã công khai đề thi.' : 'Đã chuyển về bản nháp.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi trạng thái đề thi.'));
    }
  };

  const remove = async (exam: Exam) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) return;
    try {
      await examsApi.deleteExam(exam.id);
      setExams((previous) => previous.filter((item) => item.id !== exam.id));
      success('Đã xóa đề thi.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể xóa đề thi.'));
    }
  };

  const filtered = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === 'ALL' || exam.status === status)
  );

  if (isLoading) return <LoadingSpinner text="Đang tải danh sách đề thi..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Quản trị khảo thí"
        title="Quản lý đề thi trắc nghiệm"
        description="Tạo đề thi mới, phân quyền truy cập PRO/FREE, thiết lập trạng thái công khai và soạn câu hỏi."
        actions={
          <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={18} />}>
            Tạo Đề Thi Mới
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input-field"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên đề thi..."
            style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
          />
        </div>

        <select
          className="input-field"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ width: '180px', height: '40px', minHeight: '40px', cursor: 'pointer' }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đã công khai</option>
          <option value="DRAFT">Bản nháp</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên đề thi</th>
              <th>Quyền truy cập</th>
              <th>Số câu hỏi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState title="Không tìm thấy đề thi" description="Chưa có đề thi nào phù hợp với bộ lọc." />
                </td>
              </tr>
            ) : (
              filtered.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {exam.title}
                    </strong>
                    {exam.description && (
                      <div
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.8125rem',
                          marginTop: '2px',
                        }}
                      >
                        {exam.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={exam.accessLevel === 'PRO' ? 'premium' : 'info'}>
                      {exam.accessLevel}
                    </Badge>
                  </td>
                  <td>
                    <strong>{exam.questionsCount ?? 0} câu</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleStatus(exam)}
                      title="Bấm để thay đổi trạng thái"
                      style={{ cursor: 'pointer' }}
                    >
                      <Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'warning'}>
                        {exam.status === 'PUBLISHED' ? 'Đã công khai' : 'Bản nháp'}
                      </Badge>
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                        leftIcon={<FileEdit size={14} />}
                      >
                        Soạn câu hỏi
                      </Button>
                      <button
                        type="button"
                        onClick={() => openEdit(exam)}
                        title="Chỉnh sửa thông tin đề"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(exam)}
                        title="Xóa đề thi"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          color: 'var(--error)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                        }}
                      >
                        <Trash2 size={15} />
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
        title={editing ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
        maxWidth="520px"
      >
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Tên đề thi"
            placeholder="Ví dụ: Đề ôn thi học kỳ I môn Toán"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />

          <div className="form-group">
            <label className="form-label">Mô tả / Hướng dẫn đề thi</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Giới thiệu nội dung và phạm vi kiến thức của đề thi..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quyền truy cập</label>
            <select
              className="input-field"
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value as AccessLevel)}
            >
              <option value="FREE">FREE - Miễn phí cho mọi học sinh</option>
              <option value="PRO">PRO - Chỉ dành cho học sinh gói PRO</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              {editing ? 'Lưu cập nhật' : 'Tạo đề thi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
