import React from 'react';

const FeaturedSlotCard = ({ slot, onRemove, onAssign, onRotate }) => {
  const { id, provider, addedDaysAgo, daysRemaining } = slot;

  return (
    <div className="slot-card" id={`slot${id}`}>
      <h4>Featured Slot #{id}</h4>
      {provider ? (
        <>
          <p><span className="slot-filled">{provider}</span></p>
          <div className="slot-timer">
            <i className="far fa-clock"></i>
            <span>
              Added {addedDaysAgo} day{addedDaysAgo !== 1 ? 's' : ''} ago · 
              <span className="timer-badge">{daysRemaining} days remaining</span>
            </span>
          </div>
          <ul className="slot-list">
            <li style={{ justifyContent: 'flex-end', borderBottom: 'none' }}>
              <button onClick={() => onRemove(id, provider)}>remove</button>
              <button onClick={() => onRotate(id)}>rotate</button>
            </li>
          </ul>
        </>
      ) : (
        <>
          <p><em style={{ color: 'var(--ink-4)' }}>empty slot</em></p>
          <div className="slot-timer">
            <i className="far fa-clock"></i>
            <span>Available</span>
          </div>
          <ul className="slot-list">
            <li style={{ justifyContent: 'flex-end', borderBottom: 'none' }}>
              <button onClick={() => onAssign(id)}>assign</button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default FeaturedSlotCard;