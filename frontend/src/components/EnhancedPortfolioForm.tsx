'use client';

import { useState } from 'react';

interface User {
  id: number;
  username: string;
  token?: string;
}

interface EnhancedPortfolioFormProps {
  onAddItem: () => void;
  user: User;
}

export default function EnhancedPortfolioForm({ onAddItem, user }: EnhancedPortfolioFormProps) {
  const [formData, setFormData] = useState({
    assetType: '',
    subCategory: '',
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
    rentalIncome: '',
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
        return ['areaPyeong', 'acquisitionTax', 'rentalIncome'];

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
      areaPyeong: { label: '면적(평)', placeholder: '25.5', step: '0.1' },
      acquisitionTax: { label: '취득세', placeholder: '15000000' },
      rentalIncome: { label: '임대수익(월세)', placeholder: '2000000' },
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
      setFormData(prev => ({ ...prev, [name]: value, subCategory: '' }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };

        // 수량 또는 평균가가 변경될 때 원금 자동 계산 (사용자가 원금을 직접 입력하지 않은 경우만)
        if ((name === 'quantity' || name === 'avgPrice') && showPrincipalAndEvaluation) {
          const quantity = parseFloat(name === 'quantity' ? value : newData.quantity) || 0;
          const avgPrice = parseFloat(name === 'avgPrice' ? value : newData.avgPrice) || 0;

          // 수량과 평균가가 모두 있고, 원금이 비어있거나 기존 계산값과 같은 경우에만 자동 계산
          if (quantity > 0 && avgPrice > 0) {
            const calculatedPrincipal = quantity * avgPrice;
            const currentPrincipal = parseFloat(newData.principal) || 0;

            // 원금이 비어있거나, 기존 계산값과 동일한 경우에만 업데이트
            if (!newData.principal || Math.abs(currentPrincipal - (parseFloat(prev.quantity || '0') * parseFloat(prev.avgPrice || '0'))) < 0.01) {
              newData.principal = calculatedPrincipal.toString();
            }
          }
        }

        return newData;
      });
    }
  };

  // 수익률 계산 함수
  const calculateProfitRate = () => {
    const principal = parseFloat(formData.principal) || 0;
    const evaluationAmount = parseFloat(formData.evaluationAmount) || 0;

    if (principal > 0) {
      return ((evaluationAmount - principal) / principal * 100).toFixed(2);
    }
    return '0.00';
  };

  const calculateProfitLoss = () => {
    const principal = parseFloat(formData.principal) || 0;
    const evaluationAmount = parseFloat(formData.evaluationAmount) || 0;
    return evaluationAmount - principal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetType || !formData.subCategory || !formData.name || !formData.date) {
      alert('자산군, 소분류, 자산명, 날짜는 필수 입력 항목입니다.');
      return;
    }

    // 자산군별 필수 필드 검증
    if (showQuantityAndPrice && (!formData.quantity || !formData.avgPrice)) {
      alert('보유수량과 매수평균가를 입력해주세요.');
      return;
    }

    // 원금/평가금액 검증 - 부동산/원자재는 수량 없이도 원금/평가금액 필요
    const needsPrincipalAndEvaluation = showPrincipalAndEvaluation ||
      (formData.assetType === 'alternative-investment' && ['real-estate', 'commodity'].includes(formData.subCategory));

    if (needsPrincipalAndEvaluation && (!formData.principal || !formData.evaluationAmount)) {
      alert('원금과 평가금액을 입력해주세요.');
      return;
    }

    if (showOnlyAmount && !formData.amount) {
      alert('보유금액을 입력해주세요.');
      return;
    }

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

        // 날짜 필드는 그대로, 나머지는 숫자로 변환
        submitData[backendFieldName] = fieldName.includes('Date') ? value : Number(value);
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

    // 폼 초기화
    setFormData({
      assetType: '',
      subCategory: '',
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
      rentalIncome: '',
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
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        새 자산 추가
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자산명/종목명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="예: 지갑현금, KB예금, 삼성전자, 비트코인"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 자산군별 특화 필드 */}
        {showQuantityAndPrice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                보유수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="avgPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                매수평균가 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="avgPrice"
                name="avgPrice"
                value={formData.avgPrice}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}

        {(showPrincipalAndEvaluation ||
          (formData.assetType === 'alternative-investment' && ['real-estate', 'commodity'].includes(formData.subCategory))) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="principal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  원금 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="principal"
                  name="principal"
                  value={formData.principal}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="evaluationAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  평가금액 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="evaluationAmount"
                  name="evaluationAmount"
                  value={formData.evaluationAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
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
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              보유금액 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
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
                    <input
                      type={config.type || "number"}
                      id={fieldName}
                      name={fieldName}
                      value={formData[fieldName as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={config.placeholder}
                      step={config.step}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 날짜 입력 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {showQuantityAndPrice ? '매수일' : '등록일'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 메모 */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            메모 (선택사항)
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
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
    </div>
  );
}