import React from 'react';
import { ChevronDown, ChevronUp, Copy, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { Question } from '../../types';

interface QuestionSidebarProps {
  questions: Question[];
  activeQuestionId: string | null;
  onSelectQuestion: (question: Question) => void;
  onAddNewQuestion: () => void;
  onDuplicateQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: -1 | 1) => void;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({ questions, activeQuestionId, onSelectQuestion, onAddNewQuestion, onDuplicateQuestion, onDeleteQuestion, onMoveQuestion }) => (
  <aside style={{ width: '280px', background: '#fff', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}><button type="button" onClick={onAddNewQuestion} style={{ width: '100%', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--border-radius-md)', padding: '10px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Plus size={18} />Thêm câu hỏi</button></div>
    <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {questions.length === 0 ? <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}><HelpCircle size={32} style={{ margin: '0 auto 8px' }} />Chưa có câu hỏi.</div> : questions.map((question, index) => {
        const active = question.id === activeQuestionId;
        return <div key={question.id} onClick={() => onSelectQuestion(question)} style={{ padding: '12px', borderRadius: 'var(--border-radius-md)', background: active ? 'var(--primary-light)' : '#fff', border: `2px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><strong style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>Câu {index + 1}</strong><div style={{ display: 'flex', gap: '2px' }}><button type="button" title="Đưa lên" onClick={(event) => { event.stopPropagation(); onMoveQuestion(question.id, -1); }} disabled={index === 0} style={{ padding: '3px', opacity: index === 0 ? .35 : 1 }}><ChevronUp size={14} /></button><button type="button" title="Đưa xuống" onClick={(event) => { event.stopPropagation(); onMoveQuestion(question.id, 1); }} disabled={index === questions.length - 1} style={{ padding: '3px', opacity: index === questions.length - 1 ? .35 : 1 }}><ChevronDown size={14} /></button><button type="button" title="Nhân bản" onClick={(event) => { event.stopPropagation(); onDuplicateQuestion(question); }} style={{ padding: '3px' }}><Copy size={14} /></button><button type="button" title="Xóa" onClick={(event) => { event.stopPropagation(); onDeleteQuestion(question.id); }} style={{ padding: '3px', color: 'var(--error)' }}><Trash2 size={14} /></button></div></div>
          <div style={{ marginTop: '8px', fontSize: '0.8125rem', lineHeight: 1.4, minHeight: '36px', overflow: 'hidden' }}>{question.content || '(Chưa nhập nội dung)'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span>{question.points} điểm</span><span>{question.timeLimit || 30}s</span></div>
        </div>;
      })}
    </div>
  </aside>
);
