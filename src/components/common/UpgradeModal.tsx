import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Nội dung dành riêng cho tài khoản PRO',
}) => {
  const zaloUrl = import.meta.env.VITE_ZALO_URL || '#';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Để sau
          </Button>
          <Button
            variant="secondary"
            leftIcon={<ExternalLink size={16} />}
            onClick={() => {
              if (zaloUrl !== '#') window.open(zaloUrl, '_blank', 'noopener,noreferrer');
            }}
            disabled={zaloUrl === '#'}
          >
            Liên hệ nâng cấp Zalo
          </Button>
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          padding: '12px 8px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={28} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Mở khóa toàn bộ tài nguyên học tập
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Nâng cấp gói <strong>PRO</strong> để truy cập không giới hạn tất cả các đề kiểm tra chuyên sâu, tài liệu ôn tập và bài giảng độc quyền.
          </p>
        </div>
        {zaloUrl === '#' && (
          <small style={{ color: 'var(--text-muted)' }}>
            Quản trị viên chưa cấu hình liên kết Zalo hỗ trợ.
          </small>
        )}
      </div>
    </Modal>
  );
};
