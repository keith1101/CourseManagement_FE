import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, FileText, Lock, PlayCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { materialsApi } from '../../api/materials';
import { Material } from '../../types';
import { canAccessMaterial } from '../../utils/access';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedMaterial, setLockedMaterial] = useState<Material | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [openingMaterialId, setOpeningMaterialId] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    try { setMaterials(await materialsApi.getMaterials()); }
    catch (err) { error(getApiErrorMessage(err, 'Không thể tải tài liệu.')); }
    finally { setIsLoading(false); }
  }, [error]);

  useEffect(() => { void loadMaterials(); }, [loadMaterials]);

  const handleOpenMaterial = async (material: Material) => {
    if (!canAccessMaterial(user, material)) {
      setLockedMaterial(material);
      return;
    }

    setOpeningMaterialId(material.id);
    try {
      const source = material.materialType === 'EMBEDDED_VIDEO' ? material.embedUrl : material.storageUrl;
      if (!source) throw new Error('Tài liệu chưa có địa chỉ mở.');

      const resolvedUrl =
        material.materialType === 'EMBEDDED_VIDEO' || !source.startsWith('gs://')
          ? source
          : (await materialsApi.getMaterialDownloadUrl(material.id)).url;

      setSelectedUrl(resolvedUrl);
      setSelectedMaterial(material);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể mở tài liệu.'));
    } finally {
      setOpeningMaterialId(null);
    }
  };

  const closeViewer = () => {
    setSelectedMaterial(null);
    setSelectedUrl(null);
  };

  const grouped = useMemo(() => materials.reduce<Record<string, Material[]>>((groups, material) => {
    const key = material.subject?.name || 'Tài liệu khác';
    groups[key] = [...(groups[key] || []), material];
    return groups;
  }, {}), [materials]);

  if (isLoading) return <LoadingSpinner text="Đang tải tài liệu học tập..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div><h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tài liệu học tập</h1><p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Tài liệu được nhóm theo môn học và mở trực tiếp trên trình duyệt.</p></div>
      {Object.keys(grouped).length === 0 ? <Card style={{ textAlign: 'center', padding: '48px' }}>Chưa có tài liệu được công khai.</Card> : Object.entries(grouped).map(([subject, items]) => (
        <section key={subject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} color="var(--primary)" />{subject}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
            {items.map((material) => {
              const accessible = canAccessMaterial(user, material);
              const isOpening = openingMaterialId === material.id;
              return <Card key={material.id} interactive={accessible} onClick={() => { if (!isOpening) void handleOpenMaterial(material); }} style={{ opacity: accessible ? 1 : 0.72, cursor: 'pointer' }}>
                <div className="material-card-header"><div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>{material.materialType === 'EMBEDDED_VIDEO' ? <PlayCircle size={22} color="var(--error)" style={{ flexShrink: 0 }} /> : <FileText size={22} color="var(--primary)" style={{ flexShrink: 0 }} />}<strong className="material-card-title" title={material.title}>{material.title}</strong></div>{material.accessLevel === 'PRO' && <Badge variant="warning">PRO</Badge>}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '16px' }}>{isOpening ? <ExternalLink size={14} /> : accessible ? <ExternalLink size={14} /> : <Lock size={14} />}{isOpening ? 'Đang mở...' : accessible ? 'Mở tài liệu' : 'Cần nâng cấp PRO'}</div>
              </Card>;
            })}
          </div>
        </section>
      ))}
      <UpgradeModal isOpen={!!lockedMaterial} onClose={() => setLockedMaterial(null)} title="Tài liệu PRO" />
      {selectedMaterial && selectedUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, .75)', padding: '4vh 5vw' }}>
          <div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
              <strong>{selectedMaterial.title}</strong>
              <button type="button" onClick={closeViewer} style={{ fontSize: '1.4rem', padding: '4px 10px' }}>×</button>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-subtle)' }}>
              {selectedMaterial.materialType === 'EMBEDDED_VIDEO' ? (
                <iframe title={selectedMaterial.title} src={selectedUrl} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen />
              ) : selectedMaterial.materialType === 'PDF' ? (
                <iframe title={selectedMaterial.title} src={selectedUrl} style={{ width: '100%', height: '100%', border: 0 }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
                  <FileText size={48} color="var(--primary)" />
                  <p style={{ margin: 0 }}>DOCX không được trình duyệt hiển thị trực tiếp.</p>
                  <a href={selectedUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700 }}>
                    Mở hoặc tải file DOCX <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
