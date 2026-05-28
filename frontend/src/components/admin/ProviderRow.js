import React, { useState } from 'react';

const ProviderRow = ({ provider, onStatusChange, onOverride, onBadgeSelect }) => {
  const [overrideActive, setOverrideActive] = useState(false);

  const handleOverride = (e) => {
    const checked = e.target.checked;
    setOverrideActive(checked);
    onOverride(provider.id, checked);
  };

  const getBadgeClass = (badgeType) => {
    if (provider.badge === badgeType) return 'badge-option selected';
    return `badge-option ${badgeType}`;
  };

  return (
    <div className="provider-row" id={provider.id} style={overrideActive ? { backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b' } : {}}>
      <div 
        className="provider-info" 
        onClick={() => provider.onClick?.()} 
        role="button" 
        tabIndex="0"
      >
        <span className="avatar-small">{provider.avatar}</span>
        <div>
          <div className="provider-name-row">
            <strong>{provider.name}</strong>
            <span className="provider-cat">({provider.category})</span>
            <span className={`${provider.status}-badge`}>{provider.status}</span>
            {provider.badge === 'featured' && (
              <span className="featured-tag"><i className="fas fa-crown"></i> featured</span>
            )}
          </div>
          {provider.missing && (
            <p className="missing-hint">
              <i className="fas fa-triangle-exclamation"></i> Missing: {provider.missing}
            </p>
          )}
        </div>
      </div>
      <div className="provider-actions">
        <select 
          className="status-select" 
          onChange={(e) => onStatusChange(provider.id, e.target.value)}
          value={provider.status}
          aria-label={`Change status for ${provider.name}`}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
        <label className="override-toggle">
          <input 
            type="checkbox" 
            onChange={handleOverride} 
            checked={overrideActive}
            aria-label={`Override for ${provider.name}`}
          />
          <i className="fas fa-gavel"></i> Override
        </label>
        <div className="badge-selector" aria-label="Assign badge">
          <span 
            className={getBadgeClass('community')} 
            onClick={() => onBadgeSelect(provider.id, 'community')}
            role="button" 
            tabIndex="0"
          >
            Community
          </span>
          <span 
            className={getBadgeClass('trusted')} 
            onClick={() => onBadgeSelect(provider.id, 'trusted')}
            role="button" 
            tabIndex="0"
          >
            Trusted
          </span>
          <span 
            className={getBadgeClass('featured')} 
            onClick={() => onBadgeSelect(provider.id, 'featured')}
            role="button" 
            tabIndex="0"
          >
            Featured
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProviderRow;