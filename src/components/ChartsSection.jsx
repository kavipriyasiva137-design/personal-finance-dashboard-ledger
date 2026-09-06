import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

export default function ChartsSection({ transactions }) {
  const trendCanvasRef = useRef(null);
  const categoryCanvasRef = useRef(null);
  const trendChartInstanceRef = useRef(null);
  const categoryChartInstanceRef = useRef(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Listen for custom theme change events
  useEffect(() => {
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  // Render Charts
  useEffect(() => {
    const isDarkMode = theme === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const incomeColor = '#10b981';
    const expenseColor = '#f43f5e';

    // ---- 1. RENDER TREND CHART ----
    if (trendCanvasRef.current) {
      if (trendChartInstanceRef.current) {
        trendChartInstanceRef.current.destroy();
      }

      // Group and sort transactions
      const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      const dailyData = {};
      sortedTxs.forEach(tx => {
        const date = tx.date;
        if (!dailyData[date]) {
          dailyData[date] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
          dailyData[date].income += tx.amount;
        } else {
          dailyData[date].expense += tx.amount;
        }
      });

      // Get last 7 days of activity
      const dates = Object.keys(dailyData).sort().slice(-7);
      const incomeData = dates.map(d => dailyData[d].income);
      const expenseData = dates.map(d => dailyData[d].expense);

      trendChartInstanceRef.current = new Chart(trendCanvasRef.current, {
        type: 'bar',
        data: {
          labels: dates.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
          }),
          datasets: [
            {
              label: 'Income',
              data: incomeData,
              backgroundColor: incomeColor,
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Expense',
              data: expenseData,
              backgroundColor: expenseColor,
              borderRadius: 6,
              borderSkipped: false,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: textColor,
                font: { family: 'Outfit, sans-serif', size: 12, weight: '500' },
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
              bodyColor: isDarkMode ? '#cbd5e1' : '#334155',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              padding: 12,
              boxPadding: 4,
              usePointStyle: true,
              titleFont: { family: 'Outfit, sans-serif', size: 13, weight: '600' },
              bodyFont: { family: 'Outfit, sans-serif', size: 12 }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: textColor,
                font: { family: 'Outfit, sans-serif', size: 11 }
              }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'Outfit, sans-serif', size: 11 },
                callback: (value) => '$' + value
              }
            }
          }
        }
      });
    }

    // ---- 2. RENDER CATEGORY CHART ----
    if (categoryCanvasRef.current) {
      if (categoryChartInstanceRef.current) {
        categoryChartInstanceRef.current.destroy();
      }

      // Group expenses by category
      const categoryTotals = {};
      const expenses = transactions.filter(t => t.type === 'expense');
      expenses.forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      const categories = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);

      if (categories.length === 0) {
        categories.push('No Expenses');
        data.push(0);
      }

      const colors = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#8b5cf6', // Purple
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#14b8a6', // Teal
        '#64748b', // Slate
        '#06b6d4'  // Cyan
      ];

      categoryChartInstanceRef.current = new Chart(categoryCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, categories.length),
            borderWidth: isDarkMode ? 2 : 1,
            borderColor: isDarkMode ? '#1e293b' : '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: textColor,
                font: { family: 'Outfit, sans-serif', size: 11, weight: '500' },
                boxWidth: 10,
                padding: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
              bodyColor: isDarkMode ? '#cbd5e1' : '#334155',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              padding: 12,
              boxPadding: 4,
              usePointStyle: true,
              titleFont: { family: 'Outfit, sans-serif', size: 13, weight: '600' },
              bodyFont: { family: 'Outfit, sans-serif', size: 12 },
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return ` $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (trendChartInstanceRef.current) {
        trendChartInstanceRef.current.destroy();
      }
      if (categoryChartInstanceRef.current) {
        categoryChartInstanceRef.current.destroy();
      }
    };
  }, [transactions, theme]);

  return (
    <section className="charts-section">
      <div className="chart-container-card">
        <div className="chart-card-header">
          <h3>Income vs. Expenses (Last 7 Days with Activity)</h3>
        </div>
        <div className="chart-wrapper">
          <canvas ref={trendCanvasRef}></canvas>
        </div>
      </div>
      
      <div className="chart-container-card">
        <div className="chart-card-header">
          <h3>Expense Breakdown by Category</h3>
        </div>
        <div className="chart-wrapper">
          <canvas ref={categoryCanvasRef}></canvas>
        </div>
      </div>
    </section>
  );
}
