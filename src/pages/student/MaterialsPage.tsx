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

const viewerUrl = (material: Material) => {
  if (!material.storageUrl) return '';
  if (material.materialType === 'DOCX') return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(material.storageUrl)}`;
  return material.storageUrl;
};

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedMaterial, setLockedMaterial] = useState<Material | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const loadMaterials = useCallback(async () => {
    try { setMaterials(await materialsApi.getMaterials()); }
    catch (err) { error(getApiErrorMessage(err, 'Không thể tải tài liệu.')); }
    finally { setIsLoading(false); }
  }, [error]);

  useEffect(() => { void loadMaterials(); }, [loadMaterials]);

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {items.map((material) => {
              const accessible = canAccessMaterial(user, material);
              return <Card key={material.id} interactive={accessible} onClick={() => accessible ? setSelectedMaterial(material) : setLockedMaterial(material)} style={{ opacity: accessible ? 1 : 0.72, cursor: 'pointer' }}>
                <div className="material-card-header"><div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>{material.materialType === 'EMBEDDED_VIDEO' ? <PlayCircle size={22} color="var(--error)" style={{ flexShrink: 0 }} /> : <FileText size={22} color="var(--primary)" style={{ flexShrink: 0 }} />}<strong className="material-card-title" title={material.title}>{material.title}</strong></div>{material.accessLevel === 'PRO' && <Badge variant="warning">PRO</Badge>}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '16px' }}>{accessible ? <ExternalLink size={14} /> : <Lock size={14} />}{accessible ? 'Mở tài liệu' : 'Cần nâng cấp PRO'}</div>
              </Card>;
            })}
          </div>
        </section>
      ))}
      <UpgradeModal isOpen={!!lockedMaterial} onClose={() => setLockedMaterial(null)} title="Tài liệu PRO" />
      {selectedMaterial && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, .75)', padding: '4vh 5vw' }}><div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}><strong>{selectedMaterial.title}</strong><button type="button" onClick={() => setSelectedMaterial(null)} style={{ fontSize: '1.4rem', padding: '4px 10px' }}>×</button></div><div style={{ flex: 1, background: 'var(--bg-subtle)' }}>{selectedMaterial.materialType === 'EMBEDDED_VIDEO' ? <iframe title={selectedMaterial.title} src={selectedMaterial.embedUrl} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen /> : <iframe title={selectedMaterial.title} src={viewerUrl(selectedMaterial)} style={{ width: '100%', height: '100%', border: 0 }} />}</div></div></div>}
    </div>
  );
};
