import React from 'react';
import { AlertCircle, CheckCircle2, Lightbulb, Compass, Activity, ArrowRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const InsightsTab: React.FC = () => {
  const { transactions, totals, savingsGoals } = useFinance();

  // Compute insights
  const insights = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalInc = totals.income;

    // 1. Housing Ratio
    const housingExp = expenses
      .filter(t => t.category === 'Housing & Rent')
      .reduce((sum, t) => sum + t.amount, 0);
    const housingRatio = totalInc > 0 ? (housingExp / totalInc) * 100 : 0;

    // 2. Dining Out / Food Ratio
    const foodExp = expenses
      .filter(t => t.category === 'Food & Dining')
      .reduce((sum, t) => sum + t.amount, 0);
    const foodRatio = totalExp > 0 ? (foodExp / totalExp) * 100 : 0;

    // 3. Emergency Fund Cover
    const emergencyGoal = savingsGoals.find(g => g.name.toLowerCase().includes('emergency'));
    const emergencySaved = emergencyGoal ? emergencyGoal.currentAmount : 0;
    const totalReserve = totals.availableBalance + emergencySaved;
    
    // Average monthly expense
    const avgMonthlyExpense = totalExp > 0 ? totalExp : 1500; // fallback
    const coverMonths = totalReserve / (avgMonthlyExpense || 1);

    // Generate specific recommendation cards
    const cards = [];

    // Savings Rate Card
    if (totals.savingsRate >= 30) {
      cards.push({
        type: 'success',
        title: 'Superb Savings Velocity',
        desc: `Your savings rate is ${totals.savingsRate.toFixed(1)}%, which is elite. You are on a high-velocity path to financial freedom.`,
        recommendation: 'Consider allocating excess liquid cash to long-term index funds or high-yield investments.',
        metric: `${totals.savingsRate.toFixed(0)}% rate`
      });
    } else if (totals.savingsRate >= 20) {
      cards.push({
        type: 'success',
        title: 'Healthy Savings Rate',
        desc: `Your savings rate of ${totals.savingsRate.toFixed(1)}% aligns perfectly with the standard 50/30/20 rule.`,
        recommendation: 'Keep doing what you are doing. Automate your monthly savings transfers to prevent lifestyle creep.',
        metric: `${totals.savingsRate.toFixed(0)}% rate`
      });
    } else if (totals.savingsRate >= 10) {
      cards.push({
        type: 'info',
        title: 'Moderate Savings Buffer',
        desc: `Saving ${totals.savingsRate.toFixed(1)}% is a good start, but you are slightly below the recommended 20% mark.`,
        recommendation: 'Look at trimming discretionary expenses in categories like Shopping or Entertainment by 10%.',
        metric: `${totals.savingsRate.toFixed(0)}% rate`
      });
    } else {
      cards.push({
        type: 'warning',
        title: 'Critical Savings Rate',
        desc: `Your savings rate is very low (${totals.savingsRate.toFixed(1)}%). Most of your income is being consumed immediately.`,
        recommendation: 'Establish immediate category budget spending limits and pause non-essential shopping subscriptions.',
        metric: `${totals.savingsRate.toFixed(0)}% rate`
      });
    }

    // Housing Ratio Card
    if (housingRatio > 40) {
      cards.push({
        type: 'warning',
        title: 'High Housing Cost Burden',
        desc: `Rent/Housing consumes ${housingRatio.toFixed(1)}% of your income. Financial planners recommend keeping housing below 30%.`,
        recommendation: 'Consider subletting, looking for a roommate, or negotiating utilities to bring down fixed costs.',
        metric: `${housingRatio.toFixed(0)}% of income`
      });
    } else if (housingRatio > 30) {
      cards.push({
        type: 'info',
        title: 'Slightly Rent-Heavy',
        desc: `Housing takes up ${housingRatio.toFixed(1)}% of your earnings. This is common in high cost-of-living areas but leaves less room for error.`,
        recommendation: 'Keep other fixed costs low. Restrict your transport or dining budgets to compensate.',
        metric: `${housingRatio.toFixed(0)}% of income`
      });
    } else if (housingRatio > 0) {
      cards.push({
        type: 'success',
        title: 'Optimal Housing Ratio',
        desc: `Your housing expense represents ${housingRatio.toFixed(1)}% of your income. This is a very comfortable ratio.`,
        recommendation: 'This healthy margin gives you significant safety and allows you to funnel more resources to goals.',
        metric: `${housingRatio.toFixed(0)}% of income`
      });
    }

    // Food spending distribution
    if (foodRatio > 25) {
      cards.push({
        type: 'warning',
        title: 'Food & Dining Out Heavy',
        desc: `Food and dining out accounts for ${foodRatio.toFixed(1)}% of your total expenses. Dining out frequently is the fastest budget leaks.`,
        recommendation: 'Try meal prepping on weekends or limit dining out to twice a week. Track grocery spending closely.',
        metric: `${foodRatio.toFixed(0)}% of expenses`
      });
    } else if (foodRatio > 15) {
      cards.push({
        type: 'info',
        title: 'Normal Food & Cafe Spending',
        desc: `Grocery and dining costs represent ${foodRatio.toFixed(1)}% of your outflow. It is balanced but has optimization options.`,
        recommendation: 'Compare receipts from dining out vs groceries. Try swapping premium delivery apps for local pickups.',
        metric: `${foodRatio.toFixed(0)}% of expenses`
      });
    }

    // Liquidity cushion
    if (coverMonths >= 6) {
      cards.push({
        type: 'success',
        title: 'Ironclad Emergency Cushion',
        desc: `Your total liquid assets cover ${coverMonths.toFixed(1)} months of average expenses. You are fully insulated against job loss or medical crises.`,
        recommendation: 'You have crossed the safety threshold! Any future surplus can be deployed into active wealth generation.',
        metric: `${coverMonths.toFixed(1)} months`
      });
    } else if (coverMonths >= 3) {
      cards.push({
        type: 'success',
        title: 'Adequate Liquidity Cushion',
        desc: `Your reserves cover ${coverMonths.toFixed(1)} months of expenses. You are in the recommended safety zone.`,
        recommendation: 'Continue topping up your emergency fund goal until you hit a 6-month buffer.',
        metric: `${coverMonths.toFixed(1)} months`
      });
    } else {
      cards.push({
        type: 'warning',
        title: 'Vulnerable Reserve Buffer',
        desc: `Your total liquid cushion only covers ${coverMonths.toFixed(1)} months of expenses. A minor emergency could cause debt accumulation.`,
        recommendation: 'Prioritize building your "Emergency Fund" savings goal. Temporarily halt other luxury purchases.',
        metric: `${coverMonths.toFixed(1)} months`
      });
    }

    return {
      cards,
      housingRatio,
      foodRatio,
      coverMonths,
      hasEmergencyGoal: !!emergencyGoal
    };
  }, [transactions, totals, savingsGoals]);

  return (
    <div className="tab-content insights-tab">
      {/* Dynamic Health Meters */}
      <div className="insights-meters-grid">
        {/* Health Score Meter */}
        <div className="meter-card glass">
          <div className="meter-header">
            <Activity className="text-primary" size={18} />
            <h4>Cashflow Health Meters</h4>
          </div>
          <div className="meters-stack">
            <div className="meter-bar-item">
              <div className="meter-label">
                <span>Emergency Cushion</span>
                <span className="font-mono">{insights.coverMonths.toFixed(1)} months</span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-fill ${insights.coverMonths >= 3 ? 'bg-success' : 'bg-danger'}`}
                  style={{ width: `${Math.min((insights.coverMonths / 6) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-bar-item">
              <div className="meter-label">
                <span>Housing Burden Ratio</span>
                <span className="font-mono">{insights.housingRatio.toFixed(0)}%</span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-fill ${insights.housingRatio <= 30 ? 'bg-success' : insights.housingRatio <= 40 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${Math.min(insights.housingRatio, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-bar-item">
              <div className="meter-label">
                <span>Food Expense Outflow</span>
                <span className="font-mono">{insights.foodRatio.toFixed(0)}%</span>
              </div>
              <div className="meter-track">
                <div
                  className={`meter-fill ${insights.foodRatio <= 15 ? 'bg-success' : insights.foodRatio <= 25 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width: `${Math.min(insights.foodRatio, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Wealth Tips Box */}
        <div className="meter-card glass text-card">
          <div className="meter-header">
            <Compass className="text-info" size={18} />
            <h4>Wealth Building Guidelines</h4>
          </div>
          <ul className="guidelines-list">
            <li>
              <CheckCircle2 size={13} className="text-success" />
              <span><strong>50/30/20 Rule:</strong> Allocate 50% for Needs, 30% for Wants, and 20% to Savings.</span>
            </li>
            <li>
              <CheckCircle2 size={13} className="text-success" />
              <span><strong>Debt Prevention:</strong> Pay credit cards in full to avoid high-interest traps.</span>
            </li>
            <li>
              <CheckCircle2 size={13} className="text-success" />
              <span><strong>Envelope Method:</strong> Restrict budgets via custom Category Budgets.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recommendation Card Grid */}
      <h3 className="section-title">Automated Financial Diagnostics</h3>
      <div className="recommendations-grid">
        {insights.cards.map((card, i) => (
          <div key={i} className={`recommendation-card glass card-${card.type}`}>
            <div className="rec-card-header">
              <div className="rec-title-group">
                {card.type === 'success' ? (
                  <CheckCircle2 size={20} className="text-success" />
                ) : card.type === 'warning' ? (
                  <AlertCircle size={20} className="text-danger animate-pulse" />
                ) : (
                  <Lightbulb size={20} className="text-info" />
                )}
                <h5>{card.title}</h5>
              </div>
              <span className={`rec-badge badge-${card.type}`}>{card.metric}</span>
            </div>
            
            <p className="rec-desc text-muted">{card.desc}</p>
            
            <div className="rec-action-box">
              <ArrowRight size={14} className="action-arrow" />
              <p className="action-text"><strong>Recommendation:</strong> {card.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
