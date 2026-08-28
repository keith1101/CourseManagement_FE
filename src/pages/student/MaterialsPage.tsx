import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, FileText, Lock, PlayCircle, Search, X } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadMaterials = useCallback(async () => {
    try {
      setMaterials(await materialsApi.getMaterials());
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể tải tài liệu.'));
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const handleOpenMaterial = async (material: Material) => {
    if (!canAccessMaterial(user, material)) {
      setLockedMaterial(material);
      return;
    }

    setOpeningMaterialId(material.id);
    try {
      const source =
        material.materialType === 'EMBEDDED_VIDEO' ? material.embedUrl : material.storageUrl;
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

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || material.materialType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [materials, searchTerm, typeFilter]);

  const grouped = useMemo(() => {
    return filteredMaterials.reduce<Record<string, Material[]>>((groups, material) => {
      const key = material.subject?.name || 'Tài liệu chung';
      groups[key] = [...(groups[key] || []), material];
      return groups;
    }, {});
  }, [filteredMaterials]);

  if (isLoading) return <LoadingSpinner text="Đang tải tài liệu học tập..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Thư viện tài nguyên"
        title="Tài liệu học tập & Bài giảng"
        description="Tra cứu và mở trực tiếp giáo trình PDF, tài liệu tham khảo và video bài giảng theo môn học."
      />

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', height: '40px', minHeight: '40px' }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
            style={{ width: '170px', height: '40px', minHeight: '40px', cursor: 'pointer' }}
          >
            <option value="ALL">Tất cả định dạng</option>
            <option value="PDF">Tài liệu PDF</option>
            <option value="EMBEDDED_VIDEO">Video bài giảng</option>
            <option value="DOCX">Văn bản DOCX</option>
          </select>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={<BookOpen size={44} />}
          title="Chưa có tài liệu phù hợp"
          description="Hiện tại chưa có tài liệu nào thuộc môn học hoặc bộ lọc này."
        />
      ) : (
        Object.entries(grouped).map(([subject, items]) => (
          <section key={subject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SectionHeader
              icon={<BookOpen size={20} />}
              title={subject}
              description={`${items.length} tài liệu học tập`}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: '18px',
              }}
            >
              {items.map((material) => {
                const accessible = canAccessMaterial(user, material);
                const isOpening = openingMaterialId === material.id;
                return (
                  <Card
                    key={material.id}
                    interactive={accessible}
                    onClick={() => {
                      if (!isOpening) void handleOpenMaterial(material);
                    }}
                    style={{
                      opacity: accessible ? 1 : 0.8,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', minWidth: 0 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--border-radius-md)',
                            backgroundColor:
                              material.materialType === 'EMBEDDED_VIDEO'
                                ? 'var(--error-bg)'
                                : 'var(--primary-light)',
                            color:
                              material.materialType === 'EMBEDDED_VIDEO'
                                ? 'var(--error)'
                                : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {material.materialType === 'EMBEDDED_VIDEO' ? (
                            <PlayCircle size={22} />
                          ) : (
                            <FileText size={22} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              fontSize: '0.9375rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                            title={material.title}
                          >
                            {material.title}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                            Định dạng: {material.materialType}
                          </span>
                        </div>
                      </div>

                      {material.accessLevel === 'PRO' && (
                        <Badge variant="premium">PRO</Badge>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: accessible ? 'var(--primary)' : 'var(--accent)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        marginTop: 'auto',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      {isOpening ? (
                        <ExternalLink size={14} />
                      ) : accessible ? (
                        <ExternalLink size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                      {isOpening
                        ? 'Đang tải...'
                        : accessible
                        ? 'Mở tài liệu'
                        : 'Yêu cầu gói PRO'}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      <UpgradeModal
        isOpen={!!lockedMaterial}
        onClose={() => setLockedMaterial(null)}
        title="Tài liệu chuyên sâu PRO"
      />

      {/* Embedded Document / Video Viewer Modal */}
      {selectedMaterial && selectedUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(24, 32, 47, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '3vh 4vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              width: '100%',
              maxWidth: '1200px',
              height: '100%',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Viewer Header */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <Badge variant="primary">{selectedMaterial.materialType}</Badge>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedMaterial.title}
                </strong>
              </div>
              <button
                type="button"
                onClick={closeViewer}
                aria-label="Đóng tài liệu"
                style={{
                  color: 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewer Body */}
            <div style={{ flex: 1, backgroundColor: 'var(--bg-subtle)' }}>
              {selectedMaterial.materialType === 'EMBEDDED_VIDEO' ? (
                <iframe
                  title={selectedMaterial.title}
                  src={selectedUrl}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                />
              ) : selectedMaterial.materialType === 'PDF' ? (
                <iframe
                  title={selectedMaterial.title}
                  src={selectedUrl}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '32px',
                    textAlign: 'center',
                  }}
                >
                  <FileText size={52} color="var(--primary)" />
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Định dạng DOCX được tải trực tiếp về thiết bị của bạn.
                  </p>
                  <a
                    href={selectedUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#FFFFFF',
                      backgroundColor: 'var(--primary)',
                      padding: '10px 20px',
                      borderRadius: 'var(--border-radius-md)',
                      fontWeight: 700,
                      boxShadow: 'var(--shadow-primary)',
                    }}
                  >
                    Tải file DOCX <ExternalLink size={16} />
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
