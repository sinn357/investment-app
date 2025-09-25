'use client';

import React from 'react';
import Navigation from '../../components/Navigation';
import ExpenseManagementDashboard from '../../components/ExpenseManagementDashboard';

export default function ExpensesPage() {
  return (
    <div>
      <Navigation />
      <ExpenseManagementDashboard />
    </div>
  );
}