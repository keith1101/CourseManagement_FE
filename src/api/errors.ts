import axios from 'axios';

const translateErrorMessage = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (
    lower.includes('dueat must be a valid iso 8601 date string') ||
    lower.includes('must be a valid iso 8601') ||
    (lower.includes('dueat') && lower.includes('date')) ||
    (lower.includes('due_at') && lower.includes('date'))
  ) {
    return 'Vui lòng chọn ngày và thời hạn hoàn thành bài thi.';
  }
  if (lower.includes('account is locked') || lower.includes('tài khoản đã bị khóa')) {
    return 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.';
  }
  if (lower.includes('email already exists')) {
    return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
  }
  if (
    lower.includes('unable to send verification email') ||
    lower.includes('gmail email service is not configured') ||
    lower.includes('email service is not configured')
  ) {
    return 'Không thể gửi email xác nhận lúc này. Vui lòng thử gửi lại sau.';
  }
  if (lower.includes('assignment already exists') || lower.includes('already assigned')) {
    return 'Học sinh này đã được phân công đề thi này.';
  }
  if (lower.includes('invalid credentials') || lower.includes('wrong password') || lower.includes('email or password')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (lower.includes('user not found') || lower.includes('không tìm thấy người dùng')) {
    return 'Không tìm thấy thông tin người dùng.';
  }
  return msg;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') => {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    if (code === 'EMAIL_NOT_VERIFIED') {
      return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác nhận.';
    }
    if (code === 'INVALID_EMAIL_VERIFICATION_TOKEN') {
      return 'Liên kết xác nhận email không hợp lệ hoặc đã hết hạn.';
    }

    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.map((m) => translateErrorMessage(String(m))).join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return translateErrorMessage(message.trim());
    }
    if (error.response?.status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (error.response?.status === 409) return 'Dữ liệu đã tồn tại hoặc đang bị xung đột.';
    if (error.response?.status === 503) {
      return 'Dịch vụ email tạm thời không khả dụng. Vui lòng thử gửi lại email xác nhận sau.';
    }
    if (error.response?.status === 422) return 'Dữ liệu gửi lên chưa hợp lệ.';
    if (!error.response) return 'Không thể kết nối tới máy chủ.';
  }
  if (error instanceof Error && error.message) {
    return translateErrorMessage(error.message);
  }
  return fallback;
};

export const isEmailNotVerifiedError = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  error.response?.data?.code === 'EMAIL_NOT_VERIFIED';

export const isMockEnabled = (import.meta.env.ENABLE_MOCKS ?? import.meta.env.VITE_ENABLE_MOCKS) === 'true';
