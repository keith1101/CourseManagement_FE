import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, FileEdit, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
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
      setExams((previous) => editing
        ? previous.map((exam) => exam.id === saved.id ? saved : exam)
        : [saved, ...previous]);
      setIsModalOpen(false);
      success(editing ? 'Đã cập nhật đề thi.' : 'Đã tạo đề thi.');
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
        exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
      );
      setExams((previous) => previous.map((item) => item.id === exam.id ? updated : item));
      success(updated.status === 'PUBLISHED' ? 'Đã công khai đề thi.' : 'Đã chuyển về bản nháp.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi trạng thái đề thi.'));
    }
  };

  const remove = async (exam: Exam) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề thi này?')) return;
    try {
      await examsApi.deleteExam(exam.id);
      setExams((previous) => previous.filter((item) => item.id !== exam.id));
      success('Đã xóa đề thi.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể xóa đề thi.'));
    }
  };

  const filtered = exams.filter((exam) => (
    exam.title.toLowerCase().includes(search.toLowerCase())
    && (status === 'ALL' || exam.status === status)
  ));

  if (isLoading) return <LoadingSpinner text="Đang tải danh sách đề thi..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quản lý đề thi</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Tạo đề, thiết lập quyền truy cập và quản lý trạng thái công khai.</p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={18} />}>Tạo đề thi</Button>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input className="input-field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên đề thi..." />
        <select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đã công khai</option>
          <option value="DRAFT">Bản nháp</option>
        </select>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Tên đề thi</th><th>Quyền truy cập</th><th>Số câu</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {filtered.map((exam) => (
              <tr key={exam.id}>
                <td><strong>{exam.title}</strong>{exam.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px' }}>{exam.description}</div>}</td>
                <td><Badge variant={exam.accessLevel === 'PRO' ? 'warning' : 'info'}>{exam.accessLevel}</Badge></td>
                <td>{exam.questionsCount ?? '-'}</td>
                <td><button type="button" onClick={() => toggleStatus(exam)}><Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'warning'}>{exam.status === 'PUBLISHED' ? 'Đã công khai' : 'Bản nháp'}</Badge></button></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/exams/${exam.id}/questions`)} leftIcon={<FileEdit size={14} />}>Câu hỏi</Button>
                    <button type="button" onClick={() => openEdit(exam)} title="Sửa" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                    <button type="button" onClick={() => remove(exam)} title="Xóa" style={{ padding: '6px', color: 'var(--error)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Chỉnh sửa đề thi' : 'Tạo đề thi'} maxWidth="520px">
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Tên đề thi" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <div className="form-group"><label className="form-label">Mô tả</label><textarea className="input-field" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
          <div className="form-group"><label className="form-label">Quyền truy cập</label><select className="input-field" value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as AccessLevel)}><option value="FREE">FREE</option><option value="PRO">PRO</option></select></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}><Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button variant="primary" type="submit" isLoading={isSaving}>Lưu đề thi</Button></div>
        </form>
      </Modal>
    </div>
  );
};
