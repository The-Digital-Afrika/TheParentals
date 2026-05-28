import React from 'react';

const StatsBox = ({ value, label, icon, onClick }) => {
  return (
    <div className="stat-box" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <h3>{value}</h3>
      <p>
        {icon && <i className={`fas fa-${icon}`} style={{ marginRight: '0.3rem' }}></i>}
        {label}
      </p>
    </div>
  );
};

export default StatsBox;