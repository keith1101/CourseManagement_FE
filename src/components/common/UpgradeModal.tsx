import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, title = 'Nội dung dành cho tài khoản PRO' }) => {
  const zaloUrl = import.meta.env.VITE_ZALO_URL || '#';
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Để sau</Button>
          <Button
            variant="primary"
            leftIcon={<ExternalLink size={16} />}
            onClick={() => {
              if (zaloUrl !== '#') window.open(zaloUrl, '_blank', 'noopener,noreferrer');
            }}
            disabled={zaloUrl === '#'}
          >
            Liên hệ Zalo
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <Sparkles size={32} color="var(--secondary)" />
        <p>Nâng cấp PRO để mở khóa toàn bộ đề thi và tài liệu học tập.</p>
        {zaloUrl === '#' && <small>Quản trị viên chưa cấu hình liên kết Zalo.</small>}
      </div>
    </Modal>
  );
};
