import { describe, it, expect } from 'vitest';
import { mapOption, mapAnswer, mapAttempt } from '../mappers';

describe('API Mappers - Grading and Result Consistency', () => {
  it('preserves isCorrect: true, isCorrect: false, and does NOT force undefined to false in mapOption', () => {
    const optTrue = mapOption({ id: 'opt-1', contentText: 'A', isCorrect: true }, 0);
    expect(optTrue.isCorrect).toBe(true);

    const optFalse = mapOption({ id: 'opt-2', contentText: 'B', isCorrect: false }, 1);
    expect(optFalse.isCorrect).toBe(false);

    // Case B: Backend least-disclosure policy omits isCorrect
    const optUndefined = mapOption({ id: 'opt-3', contentText: 'C' }, 2);
    expect(optUndefined.isCorrect).toBeUndefined();

    // Snake case support
    const optSnake = mapOption({ id: 'opt-4', content_text: 'D', is_correct: true }, 3);
    expect(optSnake.isCorrect).toBe(true);
  });

  it('maps answer grading fields and snake_case variants in mapAnswer', () => {
    const ansCamel = mapAnswer({
      id: 'ans-1',
      questionId: 'q-1',
      selectedOptionId: 'opt-1',
      isCorrect: true,
      score: 1,
    });
    expect(ansCamel.isCorrect).toBe(true);
    expect(ansCamel.score).toBe(1);
    expect(ansCamel.questionId).toBe('q-1');
    expect(ansCamel.selectedOptionId).toBe('opt-1');

    const ansSnake = mapAnswer({
      id: 'ans-2',
      question_id: 'q-2',
      selected_option_id: 'opt-2',
      is_correct: false,
      score: 0,
    });
    expect(ansSnake.isCorrect).toBe(false);
    expect(ansSnake.score).toBe(0);
    expect(ansSnake.questionId).toBe('q-2');
    expect(ansSnake.selectedOptionId).toBe('opt-2');

    // Case B: No isCorrect in response
    const ansUndefined = mapAnswer({
      id: 'ans-3',
      questionId: 'q-3',
      rawValue: 'Short answer content',
    });
    expect(ansUndefined.isCorrect).toBeUndefined();
    expect(ansUndefined.textAnswer).toBe('Short answer content');
  });

  it('correctly maps attempt with attemptedAnswers and scores', () => {
    const rawAttempt = {
      id: 'att-1',
      examId: 'exam-1',
      status: 'COMPLETED',
      correctCount: 2,
      totalQuestions: 2,
      attemptedAnswers: [
        { id: 'ans-1', questionId: 'q-1', selectedOptionId: 'opt-1', isCorrect: true },
        { id: 'ans-2', questionId: 'q-2', rawValue: '42', isCorrect: true },
      ],
      questions: [
        { id: 'q-1', contentText: 'Question 1', questionType: 'MULTIPLE_CHOICE' },
        { id: 'q-2', contentText: 'Question 2', questionType: 'SHORT_ANSWER' },
      ],
    };

    const mapped = mapAttempt(rawAttempt);
    expect(mapped.totalQuestions).toBe(2);
    expect(mapped.correctAnswers).toBe(2);
    expect(mapped.score).toBe(10);
    expect(mapped.answers).toHaveLength(2);
    expect(mapped.answers?.[0].isCorrect).toBe(true);
    expect(mapped.answers?.[1].isCorrect).toBe(true);
  });
});
