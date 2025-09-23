'use client';

import { useState } from 'react';

export interface TabDefinition {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface TabNavigationProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Tab Navigation */}
        <div className="hidden sm:block">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon && (
                    <span className="text-lg" aria-hidden="true">
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Description (optional) */}
      {tabs.find(tab => tab.id === activeTab)?.description && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      )}
    </div>
  );
}