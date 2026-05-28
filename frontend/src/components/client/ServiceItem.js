import React from 'react';
import { AGE_GROUPS, DELIVERY_MODES } from '../../utils/constants';

const ServiceItem = ({ service, index, isEditing, onUpdate, onRemove, canRemove }) => {
  const handleChange = (field, value) => {
    onUpdate(index, { ...service, [field]: value });
  };

  return (
    <div className="inline-group" style={index > 0 ? { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' } : {}}>
      <div className="profile-field">
        <label>Service title <span>*</span></label>
        {isEditing ? (
          <input
            type="text"
            value={service.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="profile-value"
          />
        ) : (
          <div className="profile-value">{service.title}</div>
        )}
      </div>

      <div className="profile-field">
        <label>Age group served</label>
        {isEditing ? (
          <select
            multiple
            size="4"
            value={service.ageGroups || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, opt => opt.value);
              handleChange('ageGroups', values);
            }}
            className="profile-value"
          >
            {AGE_GROUPS.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        ) : (
          <div className="agegroup-display">
            {(service.ageGroups || []).join(', ')}
          </div>
        )}
      </div>

      <div className="profile-field">
        <label>Mode of delivery</label>
        {isEditing ? (
          <select
            value={service.deliveryMode || ''}
            onChange={(e) => handleChange('deliveryMode', e.target.value)}
            className="profile-value"
          >
            <option value="">Select mode</option>
            {DELIVERY_MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        ) : (
          <div className="profile-value">{service.deliveryMode}</div>
        )}
      </div>

      {isEditing && canRemove && index > 0 && (
        <button 
          className="btn-edit" 
          style={{ padding: '0.2rem 0.8rem', alignSelf: 'center' }}
          onClick={() => onRemove(index)}
        >
          <i className="fas fa-trash"></i> Remove
        </button>
      )}
    </div>
  );
};

export default ServiceItem;