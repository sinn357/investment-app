import { z } from 'zod'

/**
 * 거래 유형
 */
export const transactionTypeEnum = z.enum(['수입', '지출', '이체'])

/**
 * 통화
 */
export const currencyEnum = z.enum(['KRW', 'USD', 'EUR', 'JPY', 'CNY'])

/**
 * 결제 수단
 */
export const paymentMethodEnum = z.enum(['현금', '신용카드', '체크카드', '계좌이체', '기타'])

/**
 * 지출 대분류
 */
export const expenseCategoryEnum = z.enum(['생활', '건강', '사회', '여가', '쇼핑', '기타'])

/**
 * 지출 소분류 (대분류별)
 */
export const expenseSubcategoryMap = {
  생활: ['유틸리티', '생필품', '교통', '구독', '요리', '외식', '세금', '카드대금', '집', '미용'],
  건강: ['식단', '보험', '영양제', '검진', '탈모'],
  사회: ['대금지출', '경조사', '가족지원'],
  여가: ['자유시간', '스포츠', '여행'],
  쇼핑: ['의류', '전자기기', '시계', '차', '사치품'],
  기타: ['기타'],
} as const

/**
 * 수입 대분류
 */
export const incomeCategoryEnum = z.enum(['근로소득', '사업소득', '투자소득', '기타소득'])

/**
 * 수입 소분류 (대분류별)
 */
export const incomeSubcategoryMap = {
  근로소득: ['급여', '보너스', '부업'],
  사업소득: ['사업수익', '프리랜서'],
  투자소득: ['주식', 'ETF', '채권', '암호화폐', '부동산', '이자', '배당금', '기타'],
  기타소득: ['용돈', '선물', '환급'],
} as const

/**
 * 이체 대분류
 */
export const transferCategoryEnum = z.enum(['계좌이체', '현금이체', '환전', '환불'])

/**
 * 이체 소분류 (대분류별)
 */
export const transferSubcategoryMap = {
  계좌이체: ['계좌이체'],
  현금이체: ['현금이체'],
  환전: ['환전'],
  환불: ['환불'],
} as const

/**
 * 모든 카테고리 통합
 */
export const categoryEnum = z.union([
  expenseCategoryEnum,
  incomeCategoryEnum,
  transferCategoryEnum,
])

/**
 * 기본 거래 스키마
 */
export const baseTransactionSchema = z.object({
  transaction_type: transactionTypeEnum,
  amount: z.string()
    .min(1, '금액을 입력하세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: '유효한 금액을 입력하세요 (0보다 커야 합니다)',
    }),
  currency: currencyEnum.default('KRW'),
  category: z.string()
    .min(1, '대분류를 선택하세요'),
  subcategory: z.string()
    .min(1, '소분류를 선택하세요'),
  name: z.string()
    .min(1, '거래명을 입력하세요')
    .max(200, '거래명은 200자 이하여야 합니다'),
  memo: z.string()
    .max(1000, '메모는 1000자 이하여야 합니다')
    .optional()
    .nullable()
    .default(''),
  payment_method: paymentMethodEnum.default('현금'),
  payment_method_name: z.string()
    .max(100, '결제수단명은 100자 이하여야 합니다')
    .optional()
    .nullable()
    .default(''),
  transaction_date: z.string()
    .min(1, '거래일을 입력하세요')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
})

/**
 * 지출 거래 스키마
 */
export const expenseTransactionSchema = baseTransactionSchema
  .extend({
    transaction_type: z.literal('지출'),
    category: expenseCategoryEnum,
  })
  .refine((data) => {
    // 소분류가 대분류에 속하는지 검증
    const validSubcategories = expenseSubcategoryMap[data.category as keyof typeof expenseSubcategoryMap]
    return validSubcategories.includes(data.subcategory as never)
  }, {
    message: '선택한 대분류에 속하지 않는 소분류입니다',
    path: ['subcategory'],
  })

/**
 * 수입 거래 스키마
 */
export const incomeTransactionSchema = baseTransactionSchema
  .extend({
    transaction_type: z.literal('수입'),
    category: incomeCategoryEnum,
  })
  .refine((data) => {
    // 소분류가 대분류에 속하는지 검증
    const validSubcategories = incomeSubcategoryMap[data.category as keyof typeof incomeSubcategoryMap]
    return validSubcategories.includes(data.subcategory as never)
  }, {
    message: '선택한 대분류에 속하지 않는 소분류입니다',
    path: ['subcategory'],
  })

/**
 * 이체 거래 스키마
 */
export const transferTransactionSchema = baseTransactionSchema
  .extend({
    transaction_type: z.literal('이체'),
    category: transferCategoryEnum,
  })
  .refine((data) => {
    // 소분류가 대분류에 속하는지 검증
    const validSubcategories = transferSubcategoryMap[data.category as keyof typeof transferSubcategoryMap]
    return validSubcategories.includes(data.subcategory as never)
  }, {
    message: '선택한 대분류에 속하지 않는 소분류입니다',
    path: ['subcategory'],
  })

/**
 * 전체 거래 스키마 (Union)
 */
export const transactionSchema = z.discriminatedUnion('transaction_type', [
  expenseTransactionSchema,
  incomeTransactionSchema,
  transferTransactionSchema,
])

export type TransactionInput = z.infer<typeof transactionSchema>
export type ExpenseInput = z.infer<typeof expenseTransactionSchema>
export type IncomeInput = z.infer<typeof incomeTransactionSchema>
export type TransferInput = z.infer<typeof transferTransactionSchema>

/**
 * 간소화된 스키마 (프론트엔드 폼용)
 * 모든 필드를 optional로 하고, submit 시점에 검증
 */
export const expenseFormSchema = z.object({
  transaction_type: transactionTypeEnum.default('지출'),
  amount: z.string().optional(),
  currency: currencyEnum.optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  name: z.string().optional(),
  memo: z.string().optional().nullable(),
  payment_method: paymentMethodEnum.optional(),
  payment_method_name: z.string().optional().nullable(),
  transaction_date: z.string().optional(),
})

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>

/**
 * 유틸리티: 거래 유형에 따른 카테고리 목록 가져오기
 */
export const getCategoriesByType = (transactionType: '수입' | '지출' | '이체') => {
  switch (transactionType) {
    case '지출':
      return Object.keys(expenseSubcategoryMap)
    case '수입':
      return Object.keys(incomeSubcategoryMap)
    case '이체':
      return Object.keys(transferSubcategoryMap)
    default:
      return []
  }
}

/**
 * 유틸리티: 대분류에 따른 소분류 목록 가져오기
 */
export const getSubcategoriesByCategory = (
  transactionType: '수입' | '지출' | '이체',
  category: string
) => {
  switch (transactionType) {
    case '지출':
      return expenseSubcategoryMap[category as keyof typeof expenseSubcategoryMap] || []
    case '수입':
      return incomeSubcategoryMap[category as keyof typeof incomeSubcategoryMap] || []
    case '이체':
      return transferSubcategoryMap[category as keyof typeof transferSubcategoryMap] || []
    default:
      return []
  }
}
