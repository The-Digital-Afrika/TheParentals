import React from 'react';
import { PLAN_LIMITS } from '../../utils/constants';

const PlanSelector = ({ currentPlan, onSelectPlan }) => {
  const plans = [
    { key: 'free', name: 'Community Member', desc: 'Basic profile — always free', price: 'R0', features: [
      'Basic profile information',
      '1 service listing',
      'Contact form only'
    ]},
    { key: 'pro', name: 'Trusted Provider', desc: 'Full profile + direct contact details', price: 'R149', features: [
      'Everything in Community',
      'Up to 5 services',
      'Direct contact details',
      'Phone & WhatsApp visible'
    ]},
    { key: 'featured', name: 'Featured Partner', desc: 'Homepage placement + analytics', price: 'R399', features: [
      'Everything in Trusted',
      'Homepage featured slot',
      'Priority in search results',
      'Basic analytics'
    ]}
  ];

  return (
    <div className="plan-selection">
      {plans.map(plan => {
        const isSelected = currentPlan === plan.key;
        const limits = PLAN_LIMITS[plan.key];

        return (
          <div 
            key={plan.key}
            className={`plan-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectPlan(plan.key)}
            data-plan={plan.key}
          >
            <h4>{plan.name}</h4>
            <div className="plan-desc">{plan.desc}</div>
            <div className="plan-price">{plan.price}</div>
            <div className="plan-period">/ month</div>
            <ul className="feature-list">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <i className="fas fa-check-circle"></i> {feature}
                </li>
              ))}
              <li>
                <i className="fas fa-check-circle"></i> Max {limits.maxServices} services
              </li>
            </ul>
            {isSelected && (
              <div className="current-plan-badge">Current</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlanSelector;