import { z } from 'zod'

/**
 * 비밀번호 변경 스키마
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, '현재 비밀번호를 입력하세요'),

  newPassword: z.string()
    .min(6, '새 비밀번호는 6자리 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다'),

  confirmPassword: z.string()
    .min(1, '비밀번호 확인을 입력하세요'),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: '새 비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'], // 에러를 confirmPassword 필드에 표시
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * 계정 삭제 스키마
 */
export const deleteAccountSchema = z.object({
  password: z.string()
    .min(1, '비밀번호를 입력해주세요'),

  confirmDelete: z.string()
    .refine((val) => val === '계정 삭제', {
      message: '"계정 삭제"라고 정확히 입력해주세요',
    }),
})

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>

/**
 * 로그인 스키마 (향후 사용)
 */
export const loginSchema = z.object({
  username: z.string()
    .min(1, '사용자명을 입력하세요')
    .max(50, '사용자명은 50자 이하여야 합니다'),

  password: z.string()
    .min(1, '비밀번호를 입력하세요')
    .max(100, '비밀번호는 100자 이하여야 합니다'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * 회원가입 스키마 (향후 사용)
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, '사용자명은 3자 이상이어야 합니다')
    .max(50, '사용자명은 50자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '사용자명은 영문, 숫자, _만 사용 가능합니다'),

  password: z.string()
    .min(6, '비밀번호는 6자리 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다'),

  confirmPassword: z.string()
    .min(1, '비밀번호 확인을 입력하세요'),
})
.refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>
