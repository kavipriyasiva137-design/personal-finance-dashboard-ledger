import React, { useState } from 'react';
import type { Transaction } from '../types';

interface ChartsProps {
  transactions: Transaction[];
}

// Beautiful color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  'Salary': '#10b981', // emerald
  'Freelance': '#34d399', // light emerald
  'Food & Dining': '#f59e0b', // amber
  'Housing & Rent': '#6366f1', // indigo
  'Utilities': '#06b6d4', // cyan
  'Transport': '#3b82f6', // blue
  'Entertainment': '#ec4899', // pink
  'Shopping': '#a855f7', // purple
  'Healthcare': '#ef4444', // red
  'Education': '#f97316', // orange
  'Travel': '#eab308', // yellow
  'Other': '#6b7280' // gray
};

const DEFAULT_COLOR = '#6b7280';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  // --- Donut Chart State & Logic ---
  const [hoveredSlice, setHoveredSlice] = useState<{ category: string; value: number; percent: number } | null>(null);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const expenseByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory)
    .map(([category, value]) => ({
      category,
      value,
      percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
      color: CATEGORY_COLORS[category] || DEFAULT_COLOR
    }))
    .sort((a, b) => b.value - a.value);

  // Donut SVG parameters
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Build segments with startPercent to avoid reassigning outer variables during render
  type Segment = { category: string; value: number; percent: number; color: string; startPercent: number };
  const segments = sortedCategories.reduce<{ segments: Segment[]; current: number }>((acc, cat) => {
    const startPercent = acc.current;
    acc.segments.push({ ...cat, startPercent } as Segment);
    acc.current += cat.percent;
    return acc;
  }, { segments: [] as Segment[], current: 0 }).segments;

  // --- Bar Chart Logic (Income vs Expense for last 7 active days) ---
  // Let's get the last 7 calendar days that have transactions
  const uniqueDates = Array.from(new Set(transactions.map(t => t.date)))
    .sort((a, b) => a.localeCompare(b))
    .slice(-7); // Last 7 days with activity

  const barData = uniqueDates.map(date => {
    let dayIncome = 0;
    let dayExpense = 0;
    transactions.forEach(t => {
      if (t.date === date) {
        if (t.type === 'income') dayIncome += t.amount;
        else dayExpense += t.amount;
      }
    });

    // format date for display e.g. "Jun 15"
    const parsedDate = new Date(date + 'T00:00:00');
    const label = parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return { date, label, income: dayIncome, expense: dayExpense };
  });

  const maxBarValue = Math.max(
    ...barData.flatMap(d => [d.income, d.expense]),
    100 // fallback min max
  ) * 1.1; // 10% padding

  const [hoveredBar, setHoveredBar] = useState<{ index: number; type: 'income' | 'expense'; value: number; label: string } | null>(null);

  return (
    <div className="charts-container">
      {/* Donut Chart: Expense Break Down */}
      <div className="chart-card glass">
        <h4 className="chart-title">Expenses by Category</h4>
        {sortedCategories.length === 0 ? (
          <div className="chart-empty">No expense data available</div>
        ) : (
          <div className="donut-chart-wrapper">
            <div className="donut-svg-container">
              <svg width="220" height="220" viewBox="0 0 200 200" className="donut-svg">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth={strokeWidth}
                />
                {segments.map(cat => {
                  const strokeLength = (cat.percent / 100) * circumference;
                  const strokeOffset = circumference - (cat.startPercent / 100) * circumference;

                  return (
                    <circle
                      key={cat.category}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                      className="donut-segment"
                      onMouseEnter={() => setHoveredSlice({ category: cat.category, value: cat.value, percent: cat.percent })}
                      onMouseLeave={() => setHoveredSlice(null)}
                      style={{
                        transition: 'stroke-width 0.3s ease, filter 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
              </svg>
              <div className="donut-center-text">
                {hoveredSlice ? (
                  <>
                    <span className="donut-center-category text-truncate" style={{ color: CATEGORY_COLORS[hoveredSlice.category] }}>
                      {hoveredSlice.category}
                    </span>
                    <span className="donut-center-val">
                     {formatINR(hoveredSlice.value)}
                    </span>
                    <span className="donut-center-pct">{hoveredSlice.percent.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <span className="donut-center-lbl">Total Spent</span>
                    <span className="donut-center-val">
                      {formatINR(totalExpense)}
                    </span>
                    <span className="donut-center-pct">100%</span>
                  </>
                )}
              </div>
            </div>

            <div className="donut-legend">
              {sortedCategories.slice(0, 5).map(cat => (
                <div
                  key={cat.category}
                  className="legend-item"
                  onMouseEnter={() => setHoveredSlice({ category: cat.category, value: cat.value, percent: cat.percent })}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                  <span className="legend-name">{cat.category}</span>
                  <span className="legend-val">{formatINR(cat.value)}</span>
                  <span className="legend-pct">{cat.percent.toFixed(0)}%</span>
                </div>
              ))}
              {sortedCategories.length > 5 && (
                <div className="legend-more-text">
                  + {sortedCategories.length - 5} more categories in ledger
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grouped Bar Chart: Income vs Expense */}
      <div className="chart-card glass">
        <h4 className="chart-title">Income vs Expenses (Last 7 Active Days)</h4>
        {barData.length === 0 ? (
          <div className="chart-empty">No transaction history to plot</div>
        ) : (
          <div className="bar-chart-wrapper">
            <svg width="100%" height="220" viewBox="0 0 400 220" preserveAspectRatio="none" className="bar-svg">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = 20 + pct * 150;
                const gridVal = maxBarValue * (1 - pct);
                return (
                  <g key={i}>
                    <line x1="45" y1={y} x2="390" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
                    <text 
                    x="5" 
                    y={y + 4} 
                    fill="var(--text)" 
                    fontSize="9" textAnchor="start"
                    >
                      {formatINR(Math.round(gridVal))}
                    </text>
                  </g>
                );
              })}

              {/* Bars rendering */}
              {barData.map((d, index) => {
                const groupWidth = 350 / barData.length;
                const startX = 45 + index * groupWidth;
                const padding = 6;
                const barWidth = (groupWidth - padding * 2 - 4) / 2;

                const incomeHeight = (d.income / maxBarValue) * 150;
                const expenseHeight = (d.expense / maxBarValue) * 150;

                const incomeY = 170 - incomeHeight;
                const expenseY = 170 - expenseHeight;

                const incomeBarX = startX + padding;
                const expenseBarX = incomeBarX + barWidth + 2;

                return (
                  <g key={d.date}>
                    {/* Income Bar */}
                    <rect
                      x={incomeBarX}
                      y={incomeY}
                      width={barWidth}
                      height={incomeHeight}
                      fill="#10b981"
                      rx="3"
                      className="bar-rect income-bar"
                      onMouseEnter={() => setHoveredBar({ index, type: 'income', value: d.income, label: d.label })}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    />
                    {/* Expense Bar */}
                    <rect
                      x={expenseBarX}
                      y={expenseY}
                      width={barWidth}
                      height={expenseHeight}
                      fill="#ef4444"
                      rx="3"
                      className="bar-rect expense-bar"
                      onMouseEnter={() => setHoveredBar({ index, type: 'expense', value: d.expense, label: d.label })}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    />
                    {/* Date label */}
                    <text
                      x={startX + groupWidth / 2}
                      y="190"
                      fill="var(--text)"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}

              {/* Base line */}
              <line x1="45" y1="170" x2="390" y2="170" stroke="var(--border)" strokeWidth="1" />
            </svg>

            {/* Custom Tooltip */}
            <div className={`bar-tooltip ${hoveredBar ? 'visible' : ''}`}>
              {hoveredBar && (
                <>
                  <div className="tooltip-date">{hoveredBar.label}</div>
                  <div className="tooltip-value">
                    <span
                      className="tooltip-dot"
                      style={{ backgroundColor: hoveredBar.type === 'income' ? '#10b981' : '#ef4444' }}
                    ></span>
                    <span className="tooltip-type">{hoveredBar.type === 'income' ? 'Income' : 'Expense'}:</span>
                    <span className="tooltip-amt">
                      {formatINR(hoveredBar.value)}
                      </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="bar-legend">
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span> Income</span>
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span> Expenses</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
