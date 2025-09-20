'use client';

import { useState } from 'react';

interface PortfolioFormProps {
  onAddItem: (item: { assetType: string; symbol: string; title: string }) => void;
}

export default function PortfolioForm({ onAddItem }: PortfolioFormProps) {
  const [formData, setFormData] = useState({
    assetType: '',
    symbol: '',
    title: ''
  });

  const assetTypes = [
    { value: 'stock', label: '주식' },
    { value: 'bond', label: '채권' },
    { value: 'crypto', label: '암호화폐' },
    { value: 'etf', label: 'ETF' },
    { value: 'real-estate', label: '부동산' },
    { value: 'commodity', label: '원자재' },
    { value: 'cash', label: '현금' },
    { value: 'other', label: '기타' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetType || !formData.symbol || !formData.title) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    onAddItem(formData);
    setFormData({ assetType: '', symbol: '', title: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        새 자산 추가
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 자산 종류 */}
        <div>
          <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자산 종류
          </label>
          <select
            id="assetType"
            name="assetType"
            value={formData.assetType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">자산 종류를 선택하세요</option>
            {assetTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* 종목/심볼 */}
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            종목/심볼
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            placeholder="예: AAPL, 삼성전자, BTC"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 제목/메모 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            제목/메모
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="예: 성장주 포지션, 안전자산"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 추가 버튼 */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          포트폴리오에 추가
        </button>
      </form>
    </div>
  );
}