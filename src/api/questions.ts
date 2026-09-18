import { apiClient } from './client';
import { Question } from '../types';
import { mapQuestion } from './mappers';

export interface QuestionImageUploadResponse {
  url: string;
  imageUrl?: string;
  storageUri: string;
  expiresAt?: string;
}

const imageReference = (imageUrl?: string, storageUri?: string) =>
  storageUri || imageUrl || undefined;

const toPayload = (data: Partial<Question>) => {
  const isMultiPart = data.type === 'MULTI_PART_SHORT_ANSWER';
  const isShortAnswer = data.type === 'ESSAY';

  if (isMultiPart) {
    const rawParts = data.parts || data.questionParts || [];
    return {
      subjectId: data.subjectId,
      questionType: 'MULTI_PART_SHORT_ANSWER',
      contentText: data.content,
      instruction: data.instruction,
      imageUrl: imageReference(data.image, data.imageStorageUri),
      hintImageUrl: imageReference(data.hintImage, data.hintImageStorageUri),
      hint: data.hint,
      explaination: data.explanation,
      explanationImageUrl: imageReference(
        data.explanationImage,
        data.explanationImageStorageUri,
      ),
      timeLimitSeconds: data.timeLimit || 30,
      parts: rawParts.map((part) => ({
        contentText: part.contentText,
        correctAnswer: part.correctAnswer,
      })),
    };
  }

  return {
    subjectId: data.subjectId,
    questionType: isShortAnswer ? 'SHORT_ANSWER' : 'MULTIPLE_CHOICE',
    contentText: data.content,
    imageUrl: imageReference(data.image, data.imageStorageUri),
    hintImageUrl: imageReference(data.hintImage, data.hintImageStorageUri),
    hint: data.hint,
    instruction: data.instruction,
    explaination: data.explanation,
    explanationImageUrl: imageReference(
      data.explanationImage,
      data.explanationImageStorageUri,
    ),
    timeLimitSeconds: data.timeLimit || 30,
    correctTextAnswer: isShortAnswer
      ? data.correctTextAnswer || data.options?.[0]?.content || undefined
      : undefined,
    options: isShortAnswer
      ? []
      : (data.options || []).map((option, index) => ({
          contentText: option.content,
          imageUrl: imageReference(option.image, option.imageStorageUri),
          isCorrect: option.isCorrect,
          position: option.position ?? index,
        })),
  };
};

export const questionsApi = {
  getQuestionsByExam: async (examId: string): Promise<Question[]> => {
    const res = await apiClient.get<any[]>(`/exams/${examId}/questions`);
    return res.data.map(mapQuestion);
  },

  getQuestionById: async (id: string): Promise<Question> => {
    const res = await apiClient.get<any>(`/questions/${id}`);
    return mapQuestion(res.data);
  },

  uploadImage: async (file: File): Promise<QuestionImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<QuestionImageUploadResponse>(
      '/questions/images',
      formData,
    );
    return res.data;
  },

  createQuestion: async (examId: string, data: Partial<Question>): Promise<Question> => {
    const res = await apiClient.post<any>(`/exams/${examId}/questions`, toPayload(data));
    return mapQuestion(res.data);
  },

  updateQuestion: async (id: string, data: Partial<Question>): Promise<Question> => {
    const res = await apiClient.patch<any>(`/questions/${id}`, toPayload(data));
    return mapQuestion(res.data);
  },

  deleteQuestion: async (id: string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/questions/${id}`);
    return { success: true };
  },

  reorderQuestions: async (_examId: string, questionIds: string[]): Promise<{ success: boolean }> => {
    for (const [order, id] of questionIds.entries()) {
      await apiClient.patch(`/questions/${id}/order`, { order });
    }
    return { success: true };
  },
};
