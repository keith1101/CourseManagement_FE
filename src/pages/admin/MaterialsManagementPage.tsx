import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, ExternalLink, FileText, Library, PlayCircle, Plus, Trash2, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { materialsApi } from '../../api/materials';
import { subjectsApi } from '../../api/subjects';
import { AccessLevel, Material, MaterialType, Subject } from '../../types';
import { getApiErrorMessage } from '../../api/errors';
import { useToast } from '../../contexts/ToastContext';

interface MaterialFormState {
  subjectId: string;
  title: string;
  materialType: MaterialType;
  storageUrl: string;
  embedUrl: string;
  accessLevel: AccessLevel;
}

const createEmptyForm = (subjectId = ''): MaterialFormState => ({
  subjectId,
  title: '',
  materialType: 'PDF',
  storageUrl: '',
  embedUrl: '',
  accessLevel: 'FREE',
});

const materialTypeLabel: Record<MaterialType, string> = {
  PDF: 'Tài liệu PDF',
  DOCX: 'Văn bản DOCX',
  EMBEDDED_VIDEO: 'Video bài giảng',
};

const materialSource = (material: Material) =>
  material.materialType === 'EMBEDDED_VIDEO' ? material.embedUrl : material.storageUrl;

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-');

export const MaterialsManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialFormState>(createEmptyForm());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedSubjectId = searchParams.get('subjectId') || '';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectData, materialData] = await Promise.all([
        subjectsApi.getSubjects(),
        materialsApi.getMaterials(),
      ]);
      setSubjects(subjectData);
      setMaterials(materialData);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể tải danh sách tài liệu.'));
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleMaterials = useMemo(
    () =>
      selectedSubjectId
        ? materials.filter((material) => material.subjectId === selectedSubjectId)
        : materials,
    [materials, selectedSubjectId]
  );

  const filtered = useMemo(() => {
    return visibleMaterials.filter((m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visibleMaterials, searchTerm]);

  const selectSubject = (subjectId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (subjectId) nextParams.set('subjectId', subjectId);
    else nextParams.delete('subjectId');
    setSearchParams(nextParams);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    setSelectedFile(null);
    setForm(createEmptyForm(selectedSubjectId || subjects[0]?.id || ''));
    setIsModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setSelectedFile(null);
    setForm({
      subjectId: material.subjectId || '',
      title: material.title,
      materialType: material.materialType,
      storageUrl: material.storageUrl || '',
      embedUrl: material.embedUrl || '',
      accessLevel: material.accessLevel,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return error('Tiêu đề tài liệu không được để trống.');

    setIsSaving(true);
    try {
      if (editingMaterial) {
        const updated = await materialsApi.updateMaterial(editingMaterial.id, {
          subjectId: form.subjectId || undefined,
          title: form.title.trim(),
          accessLevel: form.accessLevel,
          embedUrl: form.materialType === 'EMBEDDED_VIDEO' ? form.embedUrl.trim() : undefined,
          storageUrl: form.materialType !== 'EMBEDDED_VIDEO' ? form.storageUrl.trim() : undefined,
        });
        setMaterials((prev) =>
          prev.map((item) => (item.id === editingMaterial.id ? updated : item))
        );
        success('Đã cập nhật tài liệu.');
      } else {
        let created: Material;
        if (form.materialType === 'EMBEDDED_VIDEO') {
          if (!form.embedUrl.trim()) throw new Error('Vui lòng nhập đường dẫn URL video nhúng.');
          created = await materialsApi.createMaterial({
            subjectId: form.subjectId || undefined,
            title: form.title.trim(),
            materialType: 'EMBEDDED_VIDEO',
            embedUrl: form.embedUrl.trim(),
            accessLevel: form.accessLevel,
          });
        } else {
          if (!selectedFile && !form.storageUrl.trim()) {
            throw new Error('Vui lòng chọn tệp tin tải lên hoặc nhập URL tệp.');
          }
          if (selectedFile) {
            created = await materialsApi.uploadMaterial(selectedFile, {
              subjectId: form.subjectId || '',
              title: form.title.trim(),
              accessLevel: form.accessLevel,
            });
          } else {
            created = await materialsApi.createMaterial({
              subjectId: form.subjectId || undefined,
              title: form.title.trim(),
              materialType: form.materialType,
              storageUrl: form.storageUrl.trim(),
              accessLevel: form.accessLevel,
            });
          }
        }
        setMaterials((prev) => [created, ...prev]);
        success('Đã thêm tài liệu mới.');
      }
      setIsModalOpen(false);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể lưu tài liệu.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (material: Material) => {
    setActionId(material.id);
    try {
      const updated = material.isPublished
        ? await materialsApi.unpublishMaterial(material.id)
        : await materialsApi.publishMaterial(material.id);
      setMaterials((prev) => prev.map((item) => (item.id === material.id ? updated : item)));
      success(updated.isPublished ? 'Đã công khai tài liệu.' : 'Đã ẩn tài liệu.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi trạng thái công khai.'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (material: Material) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${material.title}"?`)) return;
    setActionId(material.id);
    try {
      await materialsApi.deleteMaterial(material.id);
      setMaterials((prev) => prev.filter((item) => item.id !== material.id));
      success('Đã xóa tài liệu.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể xóa tài liệu.'));
    } finally {
      setActionId(null);
    }
  };

  const handleOpenSource = async (material: Material) => {
    try {
      const source = materialSource(material);
      if (!source) throw new Error('Tài liệu chưa có đường dẫn.');
      const resolvedUrl =
        material.materialType === 'EMBEDDED_VIDEO' || !source.startsWith('gs://')
          ? source
          : (await materialsApi.getMaterialDownloadUrl(material.id)).url;
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể mở tài liệu.'));
    }
  };

  if (isLoading) return <LoadingSpinner text="Đang tải danh sách tài liệu..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        eyebrow="Quản trị học liệu"
        title="Quản lý tài liệu học tập"
        description="Tải lên giáo trình PDF, văn bản DOCX hoặc video bài giảng và phân quyền PRO/FREE."
        actions={
          <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={18} />}>
            Thêm Tài Liệu Mới
          </Button>
        }
      />

      {/* Subject Filter Tabs & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div className="segmented-tabs" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`segmented-tab ${!selectedSubjectId ? 'active' : ''}`}
            onClick={() => selectSubject('')}
          >
            Tất cả môn học ({materials.length})
          </button>
          {subjects.map((sub) => {
            const count = materials.filter((m) => m.subjectId === sub.id).length;
            return (
              <button
                key={sub.id}
                type="button"
                className={`segmented-tab ${selectedSubjectId === sub.id ? 'active' : ''}`}
                onClick={() => selectSubject(sub.id)}
              >
                {sub.name} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
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
            placeholder="Tìm theo tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tài liệu</th>
              <th>Môn học</th>
              <th>Định dạng</th>
              <th>Quyền hạn</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState
                    title="Chưa có tài liệu nào"
                    description="Bấm 'Thêm Tài Liệu Mới' để tải lên tài liệu học tập."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((mat) => {
                const isBusy = actionId === mat.id;
                return (
                  <tr key={mat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--border-radius-sm)',
                            backgroundColor:
                              mat.materialType === 'EMBEDDED_VIDEO'
                                ? 'var(--error-bg)'
                                : 'var(--primary-light)',
                            color:
                              mat.materialType === 'EMBEDDED_VIDEO'
                                ? 'var(--error)'
                                : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {mat.materialType === 'EMBEDDED_VIDEO' ? (
                            <PlayCircle size={18} />
                          ) : (
                            <FileText size={18} />
                          )}
                        </div>
                        <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {mat.title}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>
                        {mat.subject?.name || 'Tài liệu chung'}
                      </span>
                    </td>
                    <td>
                      <Badge variant="neutral">{mat.materialType}</Badge>
                    </td>
                    <td>
                      <Badge variant={mat.accessLevel === 'PRO' ? 'premium' : 'info'}>
                        {mat.accessLevel}
                      </Badge>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(mat)}
                        disabled={isBusy}
                        title="Bấm để chuyển đổi trạng thái"
                        style={{ cursor: 'pointer' }}
                      >
                        <Badge variant={mat.isPublished ? 'success' : 'warning'}>
                          {mat.isPublished ? 'Công khai' : 'Bản nháp'}
                        </Badge>
                      </button>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {formatDate(mat.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenSource(mat)}
                          title="Mở xem tài liệu"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            color: 'var(--primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                          }}
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(mat)}
                          title="Chỉnh sửa"
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
                          onClick={() => handleDelete(mat)}
                          disabled={isBusy}
                          title="Xóa tài liệu"
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
        maxWidth="540px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Tiêu đề tài liệu"
            placeholder="Ví dụ: Giáo trình Đại số Tuyến tính"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="form-group">
            <label className="form-label">Môn học</label>
            <select
              className="input-field"
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            >
              <option value="">-- Tài liệu chung (Không phân môn) --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Định dạng tài liệu</label>
              <select
                className="input-field"
                value={form.materialType}
                disabled={!!editingMaterial}
                onChange={(e) =>
                  setForm({ ...form, materialType: e.target.value as MaterialType })
                }
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="EMBEDDED_VIDEO">Video bài giảng</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quyền truy cập</label>
              <select
                className="input-field"
                value={form.accessLevel}
                onChange={(e) =>
                  setForm({ ...form, accessLevel: e.target.value as AccessLevel })
                }
              >
                <option value="FREE">FREE - Miễn phí</option>
                <option value="PRO">PRO - Gói PRO</option>
              </select>
            </div>
          </div>

          {form.materialType === 'EMBEDDED_VIDEO' ? (
            <Input
              label="Đường dẫn Video nhúng (YouTube / Google Drive Embed URL)"
              placeholder="https://www.youtube.com/embed/..."
              value={form.embedUrl}
              onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
              required
            />
          ) : (
            <div>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                Chọn tệp tải lên
              </label>
              <input
                type="file"
                accept={form.materialType === 'PDF' ? '.pdf' : '.docx,.doc'}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="input-field"
                style={{ padding: '8px', cursor: 'pointer' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              {editingMaterial ? 'Lưu cập nhật' : 'Tải lên tài liệu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
