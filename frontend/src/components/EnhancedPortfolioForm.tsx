'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { portfolioFormSchema, type PortfolioFormInput } from '../lib/validations/portfolio';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';

interface User {
  id: number;
  username: string;
  token?: string;
}

interface EnhancedPortfolioFormProps {
  onAddItem: () => void;
  user: User;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function EnhancedPortfolioForm({ onAddItem, user, onExpandedChange }: EnhancedPortfolioFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 접기/펼치기 상태 변경을 상위 컴포넌트에 알림
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // React Hook Form으로 전환
  const form = useForm<PortfolioFormInput>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      assetType: 'immediate-cash',
      subCategory: 'cash',
      name: '',
      amount: '',
      quantity: '',
      avgPrice: '',
      principal: '',
      evaluationAmount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      // 부동산 전용 필드
      areaPyeong: '',
      acquisitionTax: '',
      lawyerFee: '',
      brokerageFee: '',
      rentType: 'monthly',
      rentalIncome: '',
      jeonseDeposit: '',
      // 예금/적금 전용 필드
      maturityDate: '',
      interestRate: '',
      earlyWithdrawalFee: '',
      // MMF/CMA 전용 필드
      currentYield: '',
      annualYield: '',
      minimumBalance: '',
      withdrawalFee: '',
      // 주식/ETF 전용 필드
      dividendRate: '',
      // 펀드 전용 필드
      nav: '',
      managementFee: ''
    },
  });

  // 기존 로직 호환성을 위한 formData (watch로 실시간 동기화)
  const formData = form.watch();

  const assetTypes = [
    { value: 'immediate-cash', label: '즉시현금' },
    { value: 'deposit-assets', label: '예치자산' },
    { value: 'investment-assets', label: '투자자산' },
    { value: 'alternative-investment', label: '대체투자' }
  ];

  const subCategories = {
    'immediate-cash': [
      { value: 'cash', label: '현금' },
      { value: 'checking-account', label: '입출금통장' },
      { value: 'securities-deposit', label: '증권예수금' }
    ],
    'deposit-assets': [
      { value: 'savings', label: '예금' },
      { value: 'installment-savings', label: '적금' },
      { value: 'mmf', label: 'MMF' }
    ],
    'investment-assets': [
      { value: 'domestic-stock', label: '국내주식' },
      { value: 'foreign-stock', label: '해외주식' },
      { value: 'fund', label: '펀드' },
      { value: 'etf', label: 'ETF' },
      { value: 'bond', label: '채권' }
    ],
    'alternative-investment': [
      { value: 'crypto', label: '암호화폐' },
      { value: 'real-estate', label: '부동산' },
      { value: 'commodity', label: '원자재' }
    ]
  };

  // 자산군별 필드 표시 로직
  const showQuantityAndPrice = (() => {
    if (formData.assetType === 'investment-assets') return true;
    if (formData.assetType === 'alternative-investment') {
      // 부동산, 원자재는 수량/평균가 대신 원금/평가금액만 사용
      return !['real-estate', 'commodity'].includes(formData.subCategory);
    }
    return false;
  })();

  const showPrincipalAndEvaluation = (() => {
    if (formData.assetType === 'investment-assets') return true;
    if (formData.assetType === 'alternative-investment') return true;
    return false;
  })();
  const showOnlyAmount = ['immediate-cash', 'deposit-assets'].includes(formData.assetType);

  // 소분류별 전용 필드 표시 로직
  const getSubCategorySpecificFields = () => {
    const subCat = formData.subCategory;

    switch (subCat) {
      // 부동산
      case 'real-estate':
        return ['areaPyeong', 'acquisitionTax', 'lawyerFee', 'brokerageFee', 'rentType', 'rentalIncome', 'jeonseDeposit'];

      // 예금/적금
      case 'savings':
      case 'installment-savings':
        return ['maturityDate', 'interestRate', 'earlyWithdrawalFee'];

      // MMF
      case 'mmf':
        return ['currentYield', 'annualYield', 'minimumBalance', 'withdrawalFee'];

      // 입출금통장, 증권예수금 - 연이율만
      case 'checking-account':
      case 'securities-deposit':
        return ['interestRate'];

      // 주식/ETF - 배당율
      case 'domestic-stock':
      case 'foreign-stock':
      case 'etf':
        return ['dividendRate'];

      // 펀드 - 기준가격, 운용보수
      case 'fund':
        return ['nav', 'managementFee'];

      default:
        return [];
    }
  };

  // 필드 라벨과 설명 매핑
  const getFieldConfig = (fieldName: string) => {
    const configs: Record<string, { label: string; placeholder: string; step?: string; type?: string }> = {
      areaPyeong: { label: '면적(평)', placeholder: '25.55', step: '0.01' },
      acquisitionTax: { label: '취득세', placeholder: '15000000' },
      lawyerFee: { label: '법무사 비용', placeholder: '1500000' },
      brokerageFee: { label: '중개비', placeholder: '3000000' },
      rentType: { label: '임대 유형', placeholder: '', type: 'select' },
      rentalIncome: { label: '월세 수입', placeholder: '2000000' },
      jeonseDeposit: { label: '전세보증금', placeholder: '500000000' },
      maturityDate: { label: '만기일', placeholder: '', type: 'date' },
      interestRate: { label: '연이율(%)', placeholder: '3.5', step: '0.01' },
      earlyWithdrawalFee: { label: '중도해지수수료', placeholder: '50000' },
      currentYield: { label: '현재수익률(%)', placeholder: '2.8', step: '0.01' },
      annualYield: { label: '연환산수익률(%)', placeholder: '3.2', step: '0.01' },
      minimumBalance: { label: '최소유지잔고', placeholder: '1000000' },
      withdrawalFee: { label: '출금수수료', placeholder: '1000' },
      dividendRate: { label: '배당율(%)', placeholder: '2.5', step: '0.01' },
      nav: { label: '기준가격', placeholder: '10500' },
      managementFee: { label: '운용보수(%)', placeholder: '0.8', step: '0.01' }
    };
    return configs[fieldName] || { label: fieldName, placeholder: '' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 대분류 변경 시 소분류 초기화
    if (name === 'assetType') {
      form.setValue(name as keyof PortfolioFormInput, value as never);
      form.setValue('subCategory', '' as never);
    } else if (name === 'rentType') {
      // 임대 유형 변경 시 관련 필드 초기화
      form.setValue('rentType', value as never);
      form.setValue('rentalIncome', '');
      form.setValue('jeonseDeposit', '');
    } else {
      form.setValue(name as keyof PortfolioFormInput, value as never);

      // 수량 또는 평균가가 변경될 때 원금 자동 계산
      if ((name === 'quantity' || name === 'avgPrice') && showPrincipalAndEvaluation) {
        const currentFormData = form.getValues();
        const quantity = parseFloat(name === 'quantity' ? value : currentFormData.quantity || '0') || 0;
        const avgPrice = parseFloat(name === 'avgPrice' ? value : currentFormData.avgPrice || '0') || 0;

        // 수량과 평균가가 모두 있으면 원금 자동 계산
        if (quantity > 0 && avgPrice > 0) {
          const calculatedPrincipal = quantity * avgPrice;
          const currentPrincipal = parseFloat(currentFormData.principal || '0') || 0;

          // 원금이 비어있거나, 기존 계산값과 동일한 경우에만 업데이트
          if (!currentFormData.principal || Math.abs(currentPrincipal - (parseFloat(currentFormData.quantity || '0') * parseFloat(currentFormData.avgPrice || '0'))) < 0.01) {
            form.setValue('principal', calculatedPrincipal.toString());
          }
        }
      }
    }
  };

  // 수익률 계산 함수
  const calculateProfitRate = () => {
    const principal = parseFloat(formData.principal || '0') || 0;
    const evaluationAmount = parseFloat(formData.evaluationAmount || '0') || 0;

    if (principal > 0) {
      return ((evaluationAmount - principal) / principal * 100).toFixed(2);
    }
    return '0.00';
  };

  const calculateProfitLoss = () => {
    const principal = parseFloat(formData.principal || '0') || 0;
    const evaluationAmount = parseFloat(formData.evaluationAmount || '0') || 0;
    return evaluationAmount - principal;
  };

  // React Hook Form submit handler - Zod validation is already done at this point
  const onSubmit = async (data: PortfolioFormInput) => {
    // 데이터 정리 및 출력
    const submitData: Record<string, unknown> = {
      assetType: assetTypes.find(type => type.value === formData.assetType)?.label || formData.assetType,
      subCategory: subCategories[formData.assetType as keyof typeof subCategories]?.find(sub => sub.value === formData.subCategory)?.label || formData.subCategory,
      name: formData.name,
      date: formData.date,
      note: formData.note || undefined,
      user_id: user.id
    };

    // 소분류별 전용 필드들 추가
    const specificFields = getSubCategorySpecificFields();
    specificFields.forEach(fieldName => {
      const value = formData[fieldName as keyof typeof formData];
      if (value) {
        // 백엔드에서 기대하는 snake_case 형태로 변환
        const backendFieldName = fieldName
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '');

        // 날짜 필드와 문자열 필드는 그대로, 나머지는 숫자로 변환
        if (fieldName.includes('Date') || fieldName === 'rentType') {
          submitData[backendFieldName] = value;
        } else {
          submitData[backendFieldName] = Number(value);
        }
      }
    });

    if (showQuantityAndPrice) {
      submitData.quantity = Number(formData.quantity);
      submitData.avgPrice = Number(formData.avgPrice);
      submitData.amount = Number(formData.quantity) * Number(formData.avgPrice);

      // 주식/펀드/크립토도 원금/평가액이 있으면 수익률 계산
      if (formData.principal && formData.evaluationAmount) {
        submitData.principal = Number(formData.principal);
        submitData.evaluationAmount = Number(formData.evaluationAmount);
        submitData.profitLoss = Number(formData.evaluationAmount) - Number(formData.principal);
        submitData.profitRate = Number(formData.principal) > 0
          ? ((Number(formData.evaluationAmount) - Number(formData.principal)) / Number(formData.principal) * 100)
          : 0;
      }
    } else if (showPrincipalAndEvaluation ||
               (formData.assetType === 'alternative-investment' && ['real-estate', 'commodity'].includes(formData.subCategory))) {
      submitData.principal = Number(formData.principal);
      submitData.evaluationAmount = Number(formData.evaluationAmount);
      submitData.amount = Number(formData.evaluationAmount);
      submitData.profitLoss = Number(formData.evaluationAmount) - Number(formData.principal);
      submitData.profitRate = Number(formData.principal) > 0
        ? ((Number(formData.evaluationAmount) - Number(formData.principal)) / Number(formData.principal) * 100)
        : 0;
    } else if (showOnlyAmount) {
      submitData.amount = Number(formData.amount);
    }

    console.log('Portfolio Data:', JSON.stringify(submitData, null, 2));

    // 백엔드 API로 데이터 전송
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // JWT 토큰이 있으면 Authorization 헤더에 추가
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/add-asset', {
        method: 'POST',
        headers,
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('자산이 성공적으로 저장되었습니다!');
        onAddItem(); // 대시보드 새로고침 트리거
      } else {
        alert(`저장 실패: ${result.message}`);
        return;
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('서버 연결에 실패했습니다.');
      return;
    }

    // React Hook Form으로 폼 초기화
    form.reset({
      assetType: 'immediate-cash',
      subCategory: 'cash',
      name: '',
      amount: '',
      quantity: '',
      avgPrice: '',
      principal: '',
      evaluationAmount: '',
      date: '',
      note: '',
      // 부동산 전용 필드
      areaPyeong: '',
      acquisitionTax: '',
      lawyerFee: '',
      brokerageFee: '',
      rentType: 'monthly',
      rentalIncome: '',
      jeonseDeposit: '',
      // 예금/적금 전용 필드
      maturityDate: '',
      interestRate: '',
      earlyWithdrawalFee: '',
      // MMF/CMA 전용 필드
      currentYield: '',
      annualYield: '',
      minimumBalance: '',
      withdrawalFee: '',
      // 주식/ETF 전용 필드
      dividendRate: '',
      // 펀드 전용 필드
      nav: '',
      managementFee: ''
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* 접기/펼치기 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-xl font-semibold text-gray-900 dark:text-white mb-6 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <span>새 자산 추가</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 폼 내용 - 애니메이션과 함께 조건부 렌더링 */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        {/* 자산군 선택 */}
        <div>
          <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자산군 <span className="text-red-500">*</span>
          </label>
          <select
            id="assetType"
            name="assetType"
            value={formData.assetType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">자산군을 선택하세요</option>
            {assetTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* 소분류 선택 */}
        {formData.assetType && (
          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              소분류 <span className="text-red-500">*</span>
            </label>
            <select
              id="subCategory"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">소분류를 선택하세요</option>
              {subCategories[formData.assetType as keyof typeof subCategories]?.map(subType => (
                <option key={subType.value} value={subType.value}>
                  {subType.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 자산명/종목명 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                자산명/종목명 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 지갑현금, KB예금, 삼성전자, 비트코인"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 자산군별 특화 필드 */}
        {showQuantityAndPrice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    보유수량 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.001"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avgPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    매수평균가 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {(showPrincipalAndEvaluation ||
          (formData.assetType === 'alternative-investment' && ['real-estate', 'commodity'].includes(formData.subCategory))) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      원금 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evaluationAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      평가금액 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 실시간 수익률 표시 */}
            {(formData.principal || formData.evaluationAmount) && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">수익/손실:</span>
                    <span className={`font-semibold ${calculateProfitLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateProfitLoss() >= 0 ? '+' : ''}{calculateProfitLoss().toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">수익률:</span>
                    <span className={`font-semibold ${parseFloat(calculateProfitRate()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(calculateProfitRate()) >= 0 ? '+' : ''}{calculateProfitRate()}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {showOnlyAmount && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  보유금액 <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* 계산된 금액 표시 (주식/펀드/크립토) */}
        {showQuantityAndPrice && formData.quantity && formData.avgPrice && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              총 보유금액: {(Number(formData.quantity) * Number(formData.avgPrice)).toLocaleString()}원
            </p>
          </div>
        )}

        {/* 소분류별 전용 필드들 */}
        {formData.subCategory && getSubCategorySpecificFields().length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {subCategories[formData.assetType as keyof typeof subCategories]?.find(sub => sub.value === formData.subCategory)?.label} 전용 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getSubCategorySpecificFields().map((fieldName) => {
                const config = getFieldConfig(fieldName);
                return (
                  <div key={fieldName}>
                    <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {config.label}
                    </label>
                    {fieldName === 'rentType' ? (
                      <select
                        id={fieldName}
                        name={fieldName}
                        value={formData[fieldName as keyof typeof formData] ?? ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="monthly">월세</option>
                        <option value="jeonse">전세</option>
                      </select>
                    ) : (
                      <input
                        type={config.type || "number"}
                        id={fieldName}
                        name={fieldName}
                        value={formData[fieldName as keyof typeof formData] ?? ''}
                        onChange={handleInputChange}
                        placeholder={config.placeholder}
                        step={config.step}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 날짜 입력 */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {showQuantityAndPrice ? '매수일' : '등록일'} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 메모 */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            메모 (선택사항)
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note ?? ''}
            onChange={handleInputChange}
            rows={3}
            placeholder="추가 정보나 메모를 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* 저장 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          포트폴리오에 추가
        </button>
          </form>
        </Form>
      </div>
    </div>
  );
}