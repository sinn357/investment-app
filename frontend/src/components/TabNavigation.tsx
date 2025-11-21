'use client';

import React from 'react';
import { CARD_CLASSES, TAB_CLASSES } from '../styles/theme';

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
    <div className={TAB_CLASSES.container}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Tab Navigation */}
        <div className="hidden sm:block">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${TAB_CLASSES.button} ${
                  activeTab === tab.id ? TAB_CLASSES.buttonActive : TAB_CLASSES.buttonInactive
                }`}
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
            className={TAB_CLASSES.select}
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
          <p className={`text-sm ${CARD_CLASSES.subtitle}`}>
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      )}
    </div>
  );
}