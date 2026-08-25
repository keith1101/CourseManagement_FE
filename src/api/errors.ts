import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) {
      if (message.toLowerCase().includes('account is locked') || message.toLowerCase().includes('tài khoản đã bị khóa')) {
        return 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
      }
      if (message.toLowerCase().includes('assignment already exists')) {
        return 'Học sinh này đã được phân công đề thi này.';
      }
      return message;
    }
    if (error.response?.status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (error.response?.status === 409) return 'Dữ liệu đã tồn tại hoặc đang bị xung đột.';
    if (error.response?.status === 422) return 'Dữ liệu gửi lên chưa hợp lệ.';
    if (!error.response) return 'Không thể kết nối tới máy chủ.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export const isMockEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true';
