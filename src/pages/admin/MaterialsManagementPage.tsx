import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, ExternalLink, FileText, Library, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
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
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: string;
  accessLevel: AccessLevel;
}

const createEmptyForm = (subjectId = ''): MaterialFormState => ({
  subjectId,
  title: '',
  materialType: 'PDF',
  storageUrl: '',
  embedUrl: '',
  originalFileName: '',
  mimeType: 'application/pdf',
  fileSizeBytes: '',
  accessLevel: 'FREE',
});

const materialTypeLabel: Record<MaterialType, string> = {
  PDF: 'PDF',
  DOCX: 'DOCX',
  EMBEDDED_VIDEO: 'Video nhúng',
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
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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
    [materials, selectedSubjectId],
  );

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);

  const selectSubject = (subjectId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (subjectId) nextParams.set('subjectId', subjectId);
    else nextParams.delete('subjectId');
    setSearchParams(nextParams);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    setForm(createEmptyForm(selectedSubjectId || subjects[0]?.id || ''));
    setIsModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setForm({
      subjectId: material.subjectId,
      title: material.title,
      materialType: material.materialType,
      storageUrl: material.storageUrl || '',
      embedUrl: material.embedUrl || '',
      originalFileName: material.originalFileName || '',
      mimeType: material.mimeType || '',
      fileSizeBytes: material.fileSizeBytes ? String(material.fileSizeBytes) : '',
      accessLevel: material.accessLevel,
    });
    setIsModalOpen(true);
  };

  const updateForm = <K extends keyof MaterialFormState>(key: K, value: MaterialFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleTypeChange = (materialType: MaterialType) => {
    setForm((previous) => ({
      ...previous,
      materialType,
      storageUrl: materialType === 'EMBEDDED_VIDEO' ? '' : previous.storageUrl,
      embedUrl: materialType === 'EMBEDDED_VIDEO' ? previous.embedUrl : '',
      mimeType:
        materialType === 'PDF'
          ? 'application/pdf'
          : materialType === 'DOCX'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : '',
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const source = form.materialType === 'EMBEDDED_VIDEO' ? form.embedUrl : form.storageUrl;
    if (!form.subjectId) return error('Vui lòng chọn môn học.');
    if (!form.title.trim()) return error('Tên tài liệu không được để trống.');
    if (!source.trim()) return error('Vui lòng nhập URL tài liệu hợp lệ.');

    setIsSaving(true);
    try {
      const payload: Partial<Material> = {
        subjectId: form.subjectId,
        title: form.title.trim(),
        materialType: form.materialType,
        storageUrl: form.materialType === 'EMBEDDED_VIDEO' ? undefined : form.storageUrl.trim(),
        embedUrl: form.materialType === 'EMBEDDED_VIDEO' ? form.embedUrl.trim() : undefined,
        originalFileName: form.materialType === 'EMBEDDED_VIDEO' ? undefined : form.originalFileName.trim() || undefined,
        mimeType: form.materialType === 'EMBEDDED_VIDEO' ? undefined : form.mimeType.trim() || undefined,
        fileSizeBytes: form.materialType === 'EMBEDDED_VIDEO' || !form.fileSizeBytes ? undefined : Number(form.fileSizeBytes),
        accessLevel: form.accessLevel,
      };
      const saved = editingMaterial
        ? await materialsApi.updateMaterial(editingMaterial.id, payload)
        : await materialsApi.createMaterial(payload);

      setMaterials((previous) =>
        editingMaterial
          ? previous.map((material) => (material.id === saved.id ? saved : material))
          : [saved, ...previous],
      );
      setIsModalOpen(false);
      success(editingMaterial ? 'Đã cập nhật tài liệu.' : 'Đã tạo tài liệu ở trạng thái nháp.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể lưu tài liệu.'));
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublished = async (material: Material) => {
    setActionId(material.id);
    try {
      const updated = material.isPublished
        ? await materialsApi.unpublishMaterial(material.id)
        : await materialsApi.publishMaterial(material.id);
      setMaterials((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      success(updated.isPublished ? 'Đã công khai tài liệu.' : 'Đã chuyển tài liệu về bản nháp.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể đổi trạng thái tài liệu.'));
    } finally {
      setActionId(null);
    }
  };

  const removeMaterial = async (material: Material) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài liệu “${material.title}”?`)) return;
    setActionId(material.id);
    try {
      await materialsApi.deleteMaterial(material.id);
      setMaterials((previous) => previous.filter((item) => item.id !== material.id));
      success('Đã xóa tài liệu.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể xóa tài liệu.'));
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) return <LoadingSpinner text="Đang tải danh sách tài liệu..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quản lý tài liệu</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Quản lý tài liệu PDF, DOCX và video theo từng môn học.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={18} />} disabled={subjects.length === 0}>
          Thêm tài liệu
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Library size={20} color="var(--primary)" />
        <label htmlFor="material-subject" style={{ fontWeight: 700 }}>Môn học</label>
        <select
          id="material-subject"
          className="input-field"
          value={selectedSubjectId}
          onChange={(event) => selectSubject(event.target.value)}
          style={{ maxWidth: '360px' }}
        >
          <option value="">Tất cả môn học ({materials.length})</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name} ({materials.filter((material) => material.subjectId === subject.id).length})
            </option>
          ))}
        </select>
        {selectedSubject && <Badge variant="info">{selectedSubject.code}</Badge>}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tài liệu</th>
              <th>Môn học</th>
              <th>Loại</th>
              <th>Gói</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Chưa có tài liệu cho môn học này.
                </td>
              </tr>
            ) : (
              visibleMaterials.map((material) => (
                <tr key={material.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: '220px' }}>
                      {material.materialType === 'EMBEDDED_VIDEO' ? (
                        <PlayCircle size={20} color="var(--error)" style={{ flexShrink: 0 }} />
                      ) : (
                        <FileText size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <strong className="material-card-title" title={material.title}>{material.title}</strong>
                        {materialSource(material) && (
                          <a
                            href={materialSource(material)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}
                          >
                            Mở nguồn <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{material.subject?.name || subjects.find((subject) => subject.id === material.subjectId)?.name || '-'}</td>
                  <td><Badge variant="primary">{materialTypeLabel[material.materialType]}</Badge></td>
                  <td><Badge variant={material.accessLevel === 'PRO' ? 'warning' : 'info'}>{material.accessLevel}</Badge></td>
                  <td>
                    <button type="button" onClick={() => togglePublished(material)} disabled={actionId === material.id}>
                      <Badge variant={material.isPublished ? 'success' : 'warning'}>
                        {material.isPublished ? 'Đã công khai' : 'Bản nháp'}
                      </Badge>
                    </button>
                  </td>
                  <td>{formatDate(material.updatedAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => openEdit(material)} title="Sửa" style={{ padding: '6px' }} disabled={actionId === material.id}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => removeMaterial(material)} title="Xóa" style={{ padding: '6px', color: 'var(--error)' }} disabled={actionId === material.id}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
        maxWidth="620px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="material-form-subject">Môn học</label>
            <select id="material-form-subject" className="input-field" value={form.subjectId} onChange={(event) => updateForm('subjectId', event.target.value)} required>
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </div>

          <Input label="Tên tài liệu" value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="material-form-type">Loại tài liệu</label>
              <select id="material-form-type" className="input-field" value={form.materialType} onChange={(event) => handleTypeChange(event.target.value as MaterialType)}>
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="EMBEDDED_VIDEO">Video nhúng</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="material-form-access">Gói truy cập</label>
              <select id="material-form-access" className="input-field" value={form.accessLevel} onChange={(event) => updateForm('accessLevel', event.target.value as AccessLevel)}>
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
          </div>

          {form.materialType === 'EMBEDDED_VIDEO' ? (
            <Input label="Embed URL" type="url" placeholder="https://www.youtube.com/embed/..." value={form.embedUrl} onChange={(event) => updateForm('embedUrl', event.target.value)} required />
          ) : (
            <>
              <Input label="Storage URL" type="url" placeholder="https://example.com/file.pdf" value={form.storageUrl} onChange={(event) => updateForm('storageUrl', event.target.value)} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input label="Tên file gốc" value={form.originalFileName} onChange={(event) => updateForm('originalFileName', event.target.value)} />
                <Input label="Dung lượng (bytes)" type="number" min={1} value={form.fileSizeBytes} onChange={(event) => updateForm('fileSizeBytes', event.target.value)} />
              </div>
              <Input label="MIME type" value={form.mimeType} onChange={(event) => updateForm('mimeType', event.target.value)} />
            </>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>
            Tài liệu mới sẽ ở trạng thái bản nháp. Chỉ tài liệu đã công khai mới hiển thị cho học sinh.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>{editingMaterial ? 'Lưu thay đổi' : 'Tạo tài liệu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
