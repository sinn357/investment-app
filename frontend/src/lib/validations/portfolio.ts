import { z } from 'zod'

/**
 * 자산 대분류
 */
export const assetTypeEnum = z.enum([
  'immediate-cash',      // 즉시현금
  'deposit-assets',      // 예치자산
  'investment-assets',   // 투자자산
  'alternative-investment', // 대체투자
])

/**
 * 자산 소분류
 */
export const subCategoryEnum = z.enum([
  // 즉시현금
  'cash',
  'checking-account',
  'securities-deposit',
  // 예치자산
  'savings',
  'installment-savings',
  'mmf',
  // 투자자산
  'domestic-stock',
  'foreign-stock',
  'fund',
  'etf',
  'bond',
  // 대체투자
  'crypto',
  'real-estate',
  'commodity',
])

/**
 * 부동산 임대 유형
 */
export const rentTypeEnum = z.enum(['monthly', 'jeonse'])

/**
 * 공통 필드 스키마
 */
const baseAssetSchema = z.object({
  assetType: assetTypeEnum,
  subCategory: subCategoryEnum,
  name: z.string()
    .min(1, '자산명을 입력하세요')
    .max(200, '자산명은 200자 이하여야 합니다'),
  date: z.string()
    .min(1, '날짜를 입력하세요')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  note: z.string()
    .max(1000, '메모는 1000자 이하여야 합니다')
    .optional()
    .nullable(),
})

/**
 * 즉시현금/예치자산 스키마 (amount만)
 */
const cashDepositAssetSchema = baseAssetSchema.extend({
  amount: z.string()
    .min(1, '보유금액을 입력하세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: '유효한 금액을 입력하세요',
    }),
})

/**
 * 투자자산/대체투자 스키마 (원금+평가금액)
 */
const investmentAssetSchema = baseAssetSchema.extend({
  quantity: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 수량을 입력하세요',
    }),
  avgPrice: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 평균가를 입력하세요',
    }),
  principal: z.string()
    .min(1, '원금을 입력하세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: '유효한 원금을 입력하세요',
    }),
  evaluationAmount: z.string()
    .min(1, '평가금액을 입력하세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: '유효한 평가금액을 입력하세요',
    }),
})

/**
 * 부동산 전용 필드
 */
const realEstateFields = z.object({
  areaPyeong: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 면적을 입력하세요',
    }),
  acquisitionTax: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 취득세를 입력하세요',
    }),
  lawyerFee: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 법무사비용을 입력하세요',
    }),
  brokerageFee: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 중개비를 입력하세요',
    }),
  rentType: rentTypeEnum.default('monthly'),
  rentalIncome: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 월세수입을 입력하세요',
    }),
  jeonseDeposit: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 전세보증금을 입력하세요',
    }),
})

/**
 * 예금/적금 전용 필드
 */
const savingsFields = z.object({
  maturityDate: z.string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)',
    }),
  interestRate: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: '유효한 연이율을 입력하세요 (0-100)',
    }),
  earlyWithdrawalFee: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 중도해지수수료를 입력하세요',
    }),
})

/**
 * MMF 전용 필드
 */
const mmfFields = z.object({
  currentYield: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: '유효한 현재수익률을 입력하세요 (0-100)',
    }),
  annualYield: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: '유효한 연환산수익률을 입력하세요 (0-100)',
    }),
  minimumBalance: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 최소유지잔고를 입력하세요',
    }),
  withdrawalFee: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 출금수수료를 입력하세요',
    }),
})

/**
 * 주식/ETF 전용 필드
 */
const stockFields = z.object({
  dividendRate: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: '유효한 배당율을 입력하세요 (0-100)',
    }),
})

/**
 * 펀드 전용 필드
 */
const fundFields = z.object({
  nav: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 기준가격을 입력하세요',
    }),
  managementFee: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: '유효한 운용보수를 입력하세요 (0-100)',
    }),
})

/**
 * 전체 자산 스키마 (모든 필드 포함)
 * 실제 검증은 조건부로 수행
 */
export const assetSchema = z.intersection(
  z.intersection(
    z.intersection(
      z.intersection(
        z.intersection(
          z.union([cashDepositAssetSchema, investmentAssetSchema]),
          realEstateFields
        ),
        savingsFields
      ),
      mmfFields
    ),
    stockFields
  ),
  fundFields
)
.refine((data) => {
  // 대분류 검증: 즉시현금/예치자산은 amount 필수
  if (['immediate-cash', 'deposit-assets'].includes(data.assetType)) {
    return !!(data as { amount?: string }).amount
  }
  // 투자자산/대체투자는 principal, evaluationAmount 필수
  if (['investment-assets', 'alternative-investment'].includes(data.assetType)) {
    const d = data as { principal?: string; evaluationAmount?: string }
    return !!d.principal && !!d.evaluationAmount
  }
  return true
}, {
  message: '자산군에 맞는 필수 필드를 입력하세요',
  path: ['assetType'],
})
.refine((data) => {
  // 투자자산 중 부동산/원자재가 아닌 경우 수량/평균가 권장
  if (data.assetType === 'investment-assets') {
    return true // 선택사항이므로 항상 통과
  }
  // 암호화폐는 수량/평균가 권장
  if (data.subCategory === 'crypto') {
    return true // 선택사항이므로 항상 통과
  }
  return true
}, {
  message: '수량과 평균가를 입력하는 것을 권장합니다',
  path: ['quantity'],
})

export type AssetInput = z.infer<typeof assetSchema>

/**
 * 간소화된 스키마 (프론트엔드에서 사용하기 쉬운 버전)
 * 모든 필드를 optional로 하고, submit 시점에 조건부 검증
 */
export const portfolioFormSchema = z.object({
  assetType: assetTypeEnum,
  subCategory: subCategoryEnum,
  name: z.string().min(1, '자산명을 입력하세요'),
  date: z.string().min(1, '날짜를 입력하세요'),
  note: z.string().optional().nullable(),
  // 금액 관련
  amount: z.string().optional(),
  quantity: z.string().optional(),
  avgPrice: z.string().optional(),
  principal: z.string().optional(),
  evaluationAmount: z.string().optional(),
  // 부동산
  areaPyeong: z.string().optional(),
  acquisitionTax: z.string().optional(),
  lawyerFee: z.string().optional(),
  brokerageFee: z.string().optional(),
  rentType: rentTypeEnum.optional(),
  rentalIncome: z.string().optional(),
  jeonseDeposit: z.string().optional(),
  // 예금/적금
  maturityDate: z.string().optional(),
  interestRate: z.string().optional(),
  earlyWithdrawalFee: z.string().optional(),
  // MMF
  currentYield: z.string().optional(),
  annualYield: z.string().optional(),
  minimumBalance: z.string().optional(),
  withdrawalFee: z.string().optional(),
  // 주식/ETF
  dividendRate: z.string().optional(),
  // 펀드
  nav: z.string().optional(),
  managementFee: z.string().optional(),
})

export type PortfolioFormInput = z.infer<typeof portfolioFormSchema>
