import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../client';
import { questionsApi } from '../questions';
import { attemptsApi } from '../attempts';
import { mapQuestion, mapSequentialFeedback, mapAnswer } from '../mappers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MULTI_PART_SHORT_ANSWER - Mappers & API', () => {
  it('mapQuestion correctly maps MULTI_PART_SHORT_ANSWER and sorts parts by position', () => {
    const raw = {
      id: 'q-multi-1',
      examId: 'exam-1',
      subjectId: 'sub-1',
      questionType: 'MULTI_PART_SHORT_ANSWER',
      contentText: 'Tính chỉ số và phân loại:',
      instruction: 'Điền đáp án cho từng ý',
      timeLimitSeconds: 180,
      questionParts: [
        {
          id: 'part-2',
          contentText: 'b) Phân loại:',
          correctAnswer: 'overweight',
          position: 1,
        },
        {
          id: 'part-1',
          contentText: 'a) BMI:',
          correctAnswer: '20',
          position: 0,
        },
      ],
      hint: 'Áp dụng công thức BMI',
      explaination: 'BMI = cân nặng / chiều cao ^ 2',
    };

    const question = mapQuestion(raw);

    expect(question.type).toBe('MULTI_PART_SHORT_ANSWER');
    expect(question.points).toBe(2);
    expect(question.timeLimit).toBe(180);
    expect(question.questionParts).toHaveLength(2);
    // Verified position sorting: part-1 (pos 0) before part-2 (pos 1)
    expect(question.questionParts?.[0].id).toBe('part-1');
    expect(question.questionParts?.[0].contentText).toBe('a) BMI:');
    expect(question.questionParts?.[0].correctAnswer).toBe('20');
    expect(question.questionParts?.[1].id).toBe('part-2');
    expect(question.questionParts?.[1].contentText).toBe('b) Phân loại:');
    expect(question.questionParts?.[1].correctAnswer).toBe('overweight');
  });

  it('questionsApi.createQuestion sends only parts and omits options and correctTextAnswer', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        id: 'new-q-1',
        examId: 'exam-1',
        subjectId: 'sub-1',
        questionType: 'MULTI_PART_SHORT_ANSWER',
        contentText: 'Đề chung',
        instruction: 'Làm bài',
        timeLimitSeconds: 120,
        questionParts: [
          { id: 'p-1', contentText: 'a) Ý 1', correctAnswer: '10', position: 0 },
        ],
      },
    } as any);

    await questionsApi.createQuestion('exam-1', {
      subjectId: 'sub-1',
      type: 'MULTI_PART_SHORT_ANSWER',
      content: 'Đề chung',
      instruction: 'Làm bài',
      timeLimit: 120,
      parts: [
        { contentText: 'a) Ý 1', correctAnswer: '10' },
      ],
      // Even if options or correctTextAnswer were accidentally in local state:
      options: [{ label: 'A', content: 'fake' }],
      correctTextAnswer: 'fake',
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, payload] = postSpy.mock.calls[0];
    expect(url).toBe('/exams/exam-1/questions');
    expect(payload).toEqual({
      subjectId: 'sub-1',
      questionType: 'MULTI_PART_SHORT_ANSWER',
      contentText: 'Đề chung',
      instruction: 'Làm bài',
      imageUrl: undefined,
      hintImageUrl: undefined,
      hint: undefined,
      explaination: undefined,
      explanationImageUrl: undefined,
      timeLimitSeconds: 120,
      parts: [
        { contentText: 'a) Ý 1', correctAnswer: '10' },
      ],
    });
    expect((payload as any).options).toBeUndefined();
    expect((payload as any).correctTextAnswer).toBeUndefined();
  });

  it('mapSequentialFeedback computes isCorrect when all parts are correct vs partial wrong', () => {
    const allCorrectRaw = {
      questionId: 'q-multi-1',
      parts: [
        { partId: 'p-1', isCorrect: true },
        { partId: 'p-2', isCorrect: true },
      ],
    };
    const allCorrectFb = mapSequentialFeedback(allCorrectRaw);
    expect(allCorrectFb?.isCorrect).toBe(true);
    expect(allCorrectFb?.parts).toHaveLength(2);

    const partialWrongRaw = {
      questionId: 'q-multi-1',
      parts: [
        { partId: 'p-1', isCorrect: true },
        { partId: 'p-2', isCorrect: false, correctAnswer: 'overweight' },
      ],
    };
    const partialWrongFb = mapSequentialFeedback(partialWrongRaw);
    expect(partialWrongFb?.isCorrect).toBe(false);
    expect(partialWrongFb?.parts?.[1].correctAnswer).toBe('overweight');
  });

  it('mapAnswer maps parts and partFeedback and determines overall isCorrect', () => {
    const rawAnswer = {
      id: 'ans-1',
      questionId: 'q-multi-1',
      parts: [
        { partId: 'p-1', rawValue: '20' },
        { partId: 'p-2', rawValue: 'fat' },
      ],
      partFeedback: [
        { partId: 'p-1', isCorrect: true },
        { partId: 'p-2', isCorrect: false, correctAnswer: 'overweight' },
      ],
    };

    const ans = mapAnswer(rawAnswer);
    expect(ans.isCorrect).toBe(false);
    expect(ans.parts).toHaveLength(2);
    expect(ans.parts?.[0]).toEqual({ partId: 'p-1', rawValue: '20' });
    expect(ans.partFeedback).toHaveLength(2);
    expect(ans.partFeedback?.[1]).toEqual({
      partId: 'p-2',
      isCorrect: false,
      correctAnswer: 'overweight',
    });
  });

  it('attemptsApi.submitCurrentQuestion sends multi-part payload with idempotency key', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        attemptId: 'att-1',
        questionId: 'q-multi-1',
        status: 'INCORRECT',
        isCorrect: false,
        timedOut: false,
        progressVersion: 3,
        feedback: {
          parts: [
            { partId: 'p-1', isCorrect: true },
            { partId: 'p-2', isCorrect: false, correctAnswer: 'overweight' },
          ],
        },
      },
    } as any);

    const result = await attemptsApi.submitCurrentQuestion(
      'att-1',
      {
        questionId: 'q-multi-1',
        progressVersion: 2,
        parts: [
          { partId: 'p-1', rawValue: '20' },
          { partId: 'p-2', rawValue: 'fat' },
        ],
      },
      'key-123',
    );

    expect(postSpy).toHaveBeenCalledWith(
      '/attempts/att-1/current-question/submit',
      {
        questionId: 'q-multi-1',
        progressVersion: 2,
        parts: [
          { partId: 'p-1', rawValue: '20' },
          { partId: 'p-2', rawValue: 'fat' },
        ],
      },
      { headers: { 'Idempotency-Key': 'key-123' } },
    );

    expect((result as any).status).toBe('INCORRECT');
    expect((result as any).isCorrect).toBe(false);
    expect((result as any).feedback.parts).toHaveLength(2);
  });
});
