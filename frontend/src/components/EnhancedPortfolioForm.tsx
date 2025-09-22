'use client';

import { useState } from 'react';

interface EnhancedPortfolioFormProps {
  onAddItem: () => void;
}

export default function EnhancedPortfolioForm({ onAddItem }: EnhancedPortfolioFormProps) {
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
    note: ''
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
  const showQuantityAndPrice = ['investment-assets'].includes(formData.assetType);
  const showPrincipalAndEvaluation = ['investment-assets', 'alternative-investment'].includes(formData.assetType);
  const showOnlyAmount = ['immediate-cash', 'deposit-assets'].includes(formData.assetType);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 대분류 변경 시 소분류 초기화
    if (name === 'assetType') {
      setFormData(prev => ({ ...prev, [name]: value, subCategory: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

    if (showPrincipalAndEvaluation && (!formData.principal || !formData.evaluationAmount)) {
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
      note: formData.note || undefined
    };

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
    } else if (showPrincipalAndEvaluation) {
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
      const response = await fetch('https://investment-app-backend-x166.onrender.com/api/add-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      note: ''
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

        {showPrincipalAndEvaluation && (
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