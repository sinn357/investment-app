'use client';

import { useState } from 'react';

interface EnhancedPortfolioFormProps {
  onAddItem: () => void;
}

export default function EnhancedPortfolioForm({ onAddItem }: EnhancedPortfolioFormProps) {
  const [formData, setFormData] = useState({
    assetType: '',
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
    { value: 'cash', label: '현금' },
    { value: 'account', label: '계좌' },
    { value: 'securities', label: '증권' },
    { value: 'stock', label: '주식' },
    { value: 'fund', label: '펀드' },
    { value: 'crypto', label: '크립토' },
    { value: 'bond', label: '채권' },
    { value: 'real-estate', label: '부동산' },
    { value: 'foreign-currency', label: '외화' }
  ];

  // 자산군별 필드 표시 로직
  const showQuantityAndPrice = ['stock', 'fund', 'crypto'].includes(formData.assetType);
  const showPrincipalAndEvaluation = ['real-estate', 'bond'].includes(formData.assetType);
  const showOnlyAmount = ['cash', 'account', 'securities', 'foreign-currency'].includes(formData.assetType);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetType || !formData.name || !formData.date) {
      alert('자산군, 자산명, 날짜는 필수 입력 항목입니다.');
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
      name: formData.name,
      date: formData.date,
      note: formData.note || undefined
    };

    if (showQuantityAndPrice) {
      submitData.quantity = Number(formData.quantity);
      submitData.avgPrice = Number(formData.avgPrice);
      submitData.amount = Number(formData.quantity) * Number(formData.avgPrice);
    } else if (showPrincipalAndEvaluation) {
      submitData.principal = Number(formData.principal);
      submitData.evaluationAmount = Number(formData.evaluationAmount);
      submitData.amount = Number(formData.evaluationAmount);
    } else if (showOnlyAmount) {
      submitData.amount = Number(formData.amount);
    }

    console.log('Portfolio Data:', JSON.stringify(submitData, null, 2));

    // 백엔드 API로 데이터 전송
    try {
      const response = await fetch('http://localhost:5001/api/add-asset', {
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
            placeholder="예: 삼성전자, 엔비디아, 비트코인"
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