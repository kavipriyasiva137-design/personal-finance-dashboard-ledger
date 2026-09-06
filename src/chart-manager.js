import Chart from 'chart.js/auto';

let trendChartInstance = null;
let categoryChartInstance = null;

// Helper to get CSS variable values
const getCssVar = (name) => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

export const chartManager = {
  renderTrendChart(canvasId, transactions, isDarkMode) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    // Process transactions: Group by date (last 7 entries with activity)
    // Sort transactions by date ascending
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group by date
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

    // Dynamic color selection based on dark mode
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const incomeColor = '#10b981'; // Emerald
    const expenseColor = '#f43f5e'; // Rose

    trendChartInstance = new Chart(ctx, {
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
  },

  renderCategoryChart(canvasId, transactions, isDarkMode) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    // Process expenses by category
    const categoryTotals = {};
    const expenses = transactions.filter(t => t.type === 'expense');
    
    expenses.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const categories = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // If no expense data, show a placeholder category
    if (categories.length === 0) {
      categories.push('No Expenses');
      data.push(0);
    }

    // Premium category palette
    const colors = [
      '#6366f1', // Indigo (Housing/Rent)
      '#ec4899', // Pink (Entertainment)
      '#f59e0b', // Amber (Food)
      '#10b981', // Emerald (Transport/Health)
      '#8b5cf6', // Purple (Education)
      '#3b82f6', // Blue (Utilities)
      '#ef4444', // Red (Travel)
      '#14b8a6', // Teal (Shopping)
      '#64748b', // Slate (Miscellaneous)
      '#06b6d4'  // Cyan
    ];

    const textColor = isDarkMode ? '#94a3b8' : '#64748b';

    categoryChartInstance = new Chart(ctx, {
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
};
