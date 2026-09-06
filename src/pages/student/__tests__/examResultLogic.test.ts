import { describe, it, expect } from 'vitest';
import { Question, StudentAnswer } from '../../../types';

// Extraction of the pure determination logic from ExamResultPage
export function evaluateQuestionResult(
  question: Question,
  studentAns: StudentAnswer | undefined,
) {
  const selectedOptionId =
    studentAns?.selectedOptionId != null ? String(studentAns.selectedOptionId) : undefined;
  const selectedOpt = question.options?.find(
    (o) =>
      (o.id != null && String(o.id) === selectedOptionId) ||
      (o.label != null && String(o.label) === selectedOptionId),
  );
  const correctOpt =
    question.options?.find((o) => o.isCorrect === true) ||
    (studentAns?.correctOptionId
      ? question.options?.find(
          (o) => o.id != null && String(o.id) === String(studentAns.correctOptionId),
        )
      : undefined);

  let isCorrect: boolean | undefined = undefined;
  if (typeof studentAns?.isCorrect === 'boolean') {
    isCorrect = studentAns.isCorrect;
  } else if (typeof selectedOpt?.isCorrect === 'boolean') {
    isCorrect = selectedOpt.isCorrect;
  } else if (correctOpt && selectedOpt) {
    isCorrect = String(selectedOpt.id) === String(correctOpt.id);
  }

  // Option UI state resolution
  const optionsEvaluation = (question.options || []).map((opt) => {
    const isThisSelected =
      (selectedOpt && (selectedOpt.id === opt.id || selectedOpt.label === opt.label)) ||
      (selectedOptionId != null &&
        (String(opt.id) === selectedOptionId || String(opt.label) === selectedOptionId));

    const isThisCorrect =
      opt.isCorrect === true ||
      (correctOpt && String(correctOpt.id) === String(opt.id));

    let status: 'correct_selected' | 'wrong_selected' | 'neutral_selected' | 'correct_unselected' | 'neutral';

    if (isThisSelected) {
      if (isCorrect === true || isThisCorrect) {
        status = 'correct_selected';
      } else if (isCorrect === false) {
        status = 'wrong_selected';
      } else {
        status = 'neutral_selected';
      }
    } else if (isThisCorrect) {
      status = 'correct_unselected';
    } else {
      status = 'neutral';
    }

    return {
      optionId: opt.id,
      label: opt.label,
      isThisSelected,
      status,
    };
  });

  return {
    isCorrect,
    badgeText:
      isCorrect === true
        ? '✓ Chính xác'
        : isCorrect === false
        ? '✕ Chưa đúng'
        : 'Đã ghi nhận',
    borderType:
      isCorrect === true
        ? 'success'
        : isCorrect === false
        ? 'error'
        : 'neutral',
    optionsEvaluation,
  };
}

describe('ExamResultPage Grading & Display Logic', () => {
  const choiceQuestion: Question = {
    id: 'q-1',
    examId: 'exam-1',
    subjectId: 'subj-1',
    content: 'Phân số nào bằng 1/2?',
    type: 'SINGLE_CHOICE',
    points: 5,
    timeLimit: 30,
    order: 0,
    options: [
      { id: 'opt-1-a', label: 'A', content: '2/4', isCorrect: true },
      { id: 'opt-1-b', label: 'B', content: '2/3', isCorrect: false },
    ],
  };

  const essayQuestion: Question = {
    id: 'q-2',
    examId: 'exam-1',
    subjectId: 'subj-1',
    content: 'Tính giá trị biểu thức: 10 + 20',
    type: 'ESSAY',
    points: 5,
    timeLimit: 30,
    order: 1,
    options: [],
  };

  it('1. Tất cả câu đều đúng: Cả hai câu đều có isCorrect: true, badge Chính xác và viền xanh', () => {
    const ans1: StudentAnswer = {
      questionId: 'q-1',
      selectedOptionId: 'opt-1-a',
      isCorrect: true,
    };
    const ans2: StudentAnswer = {
      questionId: 'q-2',
      textAnswer: '30',
      isCorrect: true,
    };

    const res1 = evaluateQuestionResult(choiceQuestion, ans1);
    const res2 = evaluateQuestionResult(essayQuestion, ans2);

    expect(res1.isCorrect).toBe(true);
    expect(res1.badgeText).toBe('✓ Chính xác');
    expect(res1.borderType).toBe('success');

    expect(res2.isCorrect).toBe(true);
    expect(res2.badgeText).toBe('✓ Chính xác');
    expect(res2.borderType).toBe('success');
  });

  it('2. Một câu đúng, một câu sai: Câu 1 đúng viền xanh, câu 2 sai viền đỏ và badge Chưa đúng', () => {
    const ans1: StudentAnswer = {
      questionId: 'q-1',
      selectedOptionId: 'opt-1-a',
      isCorrect: true,
    };
    const ans2: StudentAnswer = {
      questionId: 'q-2',
      textAnswer: '99',
      isCorrect: false,
    };

    const res1 = evaluateQuestionResult(choiceQuestion, ans1);
    const res2 = evaluateQuestionResult(essayQuestion, ans2);

    expect(res1.isCorrect).toBe(true);
    expect(res1.borderType).toBe('success');

    expect(res2.isCorrect).toBe(false);
    expect(res2.badgeText).toBe('✕ Chưa đúng');
    expect(res2.borderType).toBe('error');
  });

  it('3. Câu trắc nghiệm đúng: Option được chọn hiển thị trạng thái correct_selected (nền xanh, icon check)', () => {
    const ans: StudentAnswer = {
      questionId: 'q-1',
      selectedOptionId: 'opt-1-a',
      isCorrect: true,
    };

    const res = evaluateQuestionResult(choiceQuestion, ans);
    expect(res.isCorrect).toBe(true);

    const selectedOpt = res.optionsEvaluation.find((o) => o.isThisSelected);
    expect(selectedOpt?.optionId).toBe('opt-1-a');
    expect(selectedOpt?.status).toBe('correct_selected');
  });

  it('4. Câu trắc nghiệm sai: Option được chọn hiển thị wrong_selected (nền đỏ, icon X)', () => {
    const ans: StudentAnswer = {
      questionId: 'q-1',
      selectedOptionId: 'opt-1-b',
      isCorrect: false,
    };

    const res = evaluateQuestionResult(choiceQuestion, ans);
    expect(res.isCorrect).toBe(false);

    const selectedOpt = res.optionsEvaluation.find((o) => o.isThisSelected);
    expect(selectedOpt?.optionId).toBe('opt-1-b');
    expect(selectedOpt?.status).toBe('wrong_selected');
  });

  it('5. Câu trả lời ngắn đúng: Dựa vào isCorrect: true do backend trả về', () => {
    const ans: StudentAnswer = {
      questionId: 'q-2',
      textAnswer: '30',
      isCorrect: true,
    };

    const res = evaluateQuestionResult(essayQuestion, ans);
    expect(res.isCorrect).toBe(true);
    expect(res.badgeText).toBe('✓ Chính xác');
    expect(res.borderType).toBe('success');
  });

  it('6. Response API không có isCorrect: UI KHÔNG được tự kết luận là sai, không viền đỏ, hiển thị Đã ghi nhận', () => {
    // Case B: Backend least-disclosure policy does not provide isCorrect, nor option isCorrect
    const questionWithoutKey: Question = {
      ...choiceQuestion,
      options: [
        { id: 'opt-1-a', label: 'A', content: '2/4' }, // isCorrect undefined
        { id: 'opt-1-b', label: 'B', content: '2/3' }, // isCorrect undefined
      ],
    };

    const ansWithoutGrade: StudentAnswer = {
      questionId: 'q-1',
      selectedOptionId: 'opt-1-a',
      // isCorrect is undefined
    };

    const res = evaluateQuestionResult(questionWithoutKey, ansWithoutGrade);
    expect(res.isCorrect).toBeUndefined();
    expect(res.isCorrect).not.toBe(false); // CRITICAL: Must not default to false
    expect(res.badgeText).toBe('Đã ghi nhận'); // Not "Chưa đúng"
    expect(res.borderType).toBe('neutral'); // Not "error" / red

    const selectedOpt = res.optionsEvaluation.find((o) => o.isThisSelected);
    expect(selectedOpt?.status).toBe('neutral_selected'); // Not "wrong_selected" (no red background, no X icon)
  });
});
