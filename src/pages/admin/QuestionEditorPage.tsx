import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorHeader } from '../../components/editor/EditorHeader';
import { QuestionSidebar } from '../../components/editor/QuestionSidebar';
import { QuestionCanvas } from '../../components/editor/QuestionCanvas';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { examsApi } from '../../api/exams';
import { questionsApi } from '../../api/questions';
import { subjectsApi } from '../../api/subjects';
import { AnswerOption, Exam, Question, Subject } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../api/errors';

const defaultOptions = (): AnswerOption[] => [
  { label: 'A', content: '', isCorrect: true },
  { label: 'B', content: '', isCorrect: false },
  { label: 'C', content: '', isCorrect: false },
  { label: 'D', content: '', isCorrect: false },
];

const emptyQuestion = (examId: string, order: number, subjectId = ''): Question => ({
  id: `temp-${Date.now()}-${order}`,
  examId,
  subjectId,
  content: '',
  type: 'SINGLE_CHOICE',
  points: 1,
  timeLimit: 30,
  options: defaultOptions(),
  hint: '',
  explanation: '',
  instruction: '',
  order,
});

export const QuestionEditorPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      const [examData, questionData, subjectData] = await Promise.all([
        examsApi.getExamById(examId),
        questionsApi.getQuestionsByExam(examId),
        subjectsApi.getSubjects(),
      ]);
      setExam(examData);
      setSubjects(subjectData);
      const list = questionData.length
        ? questionData
        : [emptyQuestion(examId, 0, subjectData[0]?.id || '')];
      setQuestions(list);
      setActiveQuestion(list[0]);
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể tải đề thi.'));
    } finally {
      setIsLoading(false);
    }
  }, [examId, error]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = (question: Question) => {
    if (isDirty && !window.confirm('Câu hỏi hiện tại chưa được lưu. Bỏ thay đổi?')) return;
    setIsDirty(false);
    setActiveQuestion(question);
  };

  const updateQuestion = (updated: Question) => {
    setActiveQuestion(updated);
    setQuestions((previous) =>
      previous.map((question) => (question.id === updated.id ? updated : question))
    );
    setIsDirty(true);
  };

  const handleAdd = () => {
    if (!examId) return;
    const question = emptyQuestion(examId, questions.length, subjects[0]?.id || '');
    setQuestions((previous) => [...previous, question]);
    setActiveQuestion(question);
    setIsDirty(true);
  };

  const handleDuplicate = (question: Question) => {
    const duplicate = {
      ...question,
      id: `temp-${Date.now()}`,
      content: `${question.content} (Bản sao)`,
      order: questions.length,
    };
    setQuestions((previous) => [...previous, duplicate]);
    setActiveQuestion(duplicate);
    setIsDirty(true);
  };

  const handleDelete = async (id: string) => {
    if (questions.length <= 1) return warning('Đề thi cần có ít nhất một câu hỏi.');
    try {
      if (!id.startsWith('temp-')) await questionsApi.deleteQuestion(id);
      const next = questions
        .filter((question) => question.id !== id)
        .map((question, index) => ({ ...question, order: index }));
      setQuestions(next);
      setActiveQuestion(next[0]);
      setIsDirty(false);
      success('Đã xóa câu hỏi.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể xóa câu hỏi.'));
    }
  };

  const handleMove = async (id: string, direction: -1 | 1) => {
    const index = questions.findIndex((question) => question.id === id);
    const target = index + direction;
    if (
      index < 0 ||
      target < 0 ||
      target >= questions.length ||
      questions.some((question) => question.id.startsWith('temp-'))
    )
      return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next.map((question, position) => ({ ...question, order: position })));
    setActiveQuestion(next[target]);
    try {
      await questionsApi.reorderQuestions(
        examId!,
        next.map((question) => question.id)
      );
      success('Đã cập nhật thứ tự câu hỏi.');
    } catch (err) {
      setQuestions(questions);
      error(getApiErrorMessage(err, 'Không thể cập nhật thứ tự câu hỏi.'));
    }
  };

  const handleSave = async () => {
    if (!activeQuestion || !examId) return;
    if (!activeQuestion.subjectId) return error('Vui lòng chọn môn học cho câu hỏi.');
    if (!activeQuestion.content.trim()) return error('Vui lòng nhập nội dung câu hỏi.');
    if (
      (activeQuestion.type === 'SINGLE_CHOICE' || activeQuestion.type === 'MULTIPLE_CHOICE') &&
      !activeQuestion.options.some((option) => option.isCorrect)
    )
      return warning('Vui lòng chọn ít nhất một đáp án đúng.');

    setIsSaving(true);
    try {
      const saved = activeQuestion.id.startsWith('temp-')
        ? await questionsApi.createQuestion(examId, activeQuestion)
        : await questionsApi.updateQuestion(activeQuestion.id, activeQuestion);
      setQuestions((previous) =>
        previous.map((question) => (question.id === activeQuestion.id ? saved : question))
      );
      setActiveQuestion(saved);
      setIsDirty(false);
      success('Đã lưu câu hỏi thành công.');
    } catch (err) {
      error(getApiErrorMessage(err, 'Không thể lưu câu hỏi.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullPage text="Đang tải giao diện soạn câu hỏi..." />;

  return (
    <div className="question-editor-shell">
      <EditorHeader
        examTitle={exam?.title || 'Soạn đề thi'}
        timeLimit={activeQuestion?.timeLimit || 30}
        points={activeQuestion?.points || 1}
        questionType={activeQuestion?.type || 'SINGLE_CHOICE'}
        isSaving={isSaving}
        onTimeLimitChange={(time) => activeQuestion && updateQuestion({ ...activeQuestion, timeLimit: time })}
        onPointsChange={(points) => activeQuestion && updateQuestion({ ...activeQuestion, points })}
        onQuestionTypeChange={(type) => activeQuestion && updateQuestion({ ...activeQuestion, type })}
        onSave={handleSave}
        onCancel={() => navigate('/admin/exams')}
      />
      <div className="question-editor-body">
        <QuestionSidebar
          questions={questions}
          activeQuestionId={activeQuestion?.id || null}
          onSelectQuestion={handleSelect}
          onAddNewQuestion={handleAdd}
          onDuplicateQuestion={handleDuplicate}
          onDeleteQuestion={handleDelete}
          onMoveQuestion={handleMove}
        />
        {activeQuestion && <QuestionCanvas question={activeQuestion} onChange={updateQuestion} />}
      </div>
    </div>
  );
};
