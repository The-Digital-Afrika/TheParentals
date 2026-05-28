import React, { useState, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { LANGUAGES, PROVINCES } from '../../utils/constants';
import { getMultiSelectValues, setMultiSelectValues } from '../../utils/helpers';

const ProfileSection = ({ 
  profileData, 
  isEditing, 
  onUpdate,
  onPhotoUpload 
}) => {
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(profileData.photo || null);

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file (JPG, PNG, etc.)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be smaller than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
      onPhotoUpload(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field, value) => {
    onUpdate({ ...profileData, [field]: value });
  };

  return (
    <>
      {/* Photo upload row */}
      <div className="photo-placeholder">
        <div 
          className="photo-round" 
          onClick={handlePhotoClick}
          role="button" 
          tabIndex={isEditing ? 0 : -1}
          style={{ cursor: isEditing ? 'pointer' : 'default' }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Profile" />
          ) : (
            <i className="fas fa-user" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
          )}
        </div>
        <div className="photo-upload-area">
          <button 
            className="btn-edit" 
            type="button"
            onClick={handlePhotoClick}
            disabled={!isEditing}
            style={{ opacity: isEditing ? 1 : 0.5 }}
          >
            <i className="fas fa-pencil-alt"></i> Change photo / logo
          </button>
          <p className="hint">Click to upload (JPG, PNG — max 5MB)</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden-file-input" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={!isEditing}
        />
      </div>

      {/* Account Information */}
      <p className="section-label"><i className="fas fa-id-card"></i> Account Information</p>

      <div className="two-col">
        <div className="profile-field">
          <label>Full name / Business <span>*</span></label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="profile-value"
            />
          ) : (
            <div className="profile-value">{profileData.name}</div>
          )}
        </div>

        <div className="profile-field">
          <label>Email address <span>*</span></label>
          {isEditing ? (
            <input
              type="email"
              value={profileData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="profile-value"
            />
          ) : (
            <div className="profile-value">{profileData.email}</div>
          )}
        </div>

        <div className="profile-field">
          <label>Account type <span>*</span></label>
          {isEditing ? (
            <select
              value={profileData.accountType || ''}
              onChange={(e) => handleInputChange('accountType', e.target.value)}
              className="profile-value"
            >
              <option value="">Select type</option>
              <option value="Individual Provider">Individual Provider</option>
              <option value="Organization / Company">Organization / Company</option>
            </select>
          ) : (
            <div className="profile-value">{profileData.accountType}</div>
          )}
        </div>

        <div className="profile-field">
          <label>Years of experience</label>
          {isEditing ? (
            <select
              value={profileData.yearsExperience || ''}
              onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
              className="profile-value"
            >
              <option value="">Select years</option>
              <option value="0-1">0–1 Years</option>
              <option value="1-3">1–3 Years</option>
              <option value="3-5">3–5 Years</option>
              <option value="5-10">5–10 Years</option>
              <option value="10+">10+ Years</option>
            </select>
          ) : (
            <div className="profile-value">{profileData.yearsExperience}</div>
          )}
        </div>

        <div className="profile-field">
          <label>Languages spoken <span>*</span></label>
          {isEditing ? (
            <select
              multiple
              size="5"
              value={profileData.languages || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, opt => opt.value);
                handleInputChange('languages', values);
              }}
              className="language-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          ) : (
            <div className="language-display">
              {(profileData.languages || []).join(', ')}
            </div>
          )}
        </div>

        <div className="profile-field">
          <label>Primary category <span>*</span></label>
          {isEditing ? (
            <select
              value={profileData.primaryCategory || ''}
              onChange={(e) => handleInputChange('primaryCategory', e.target.value)}
              className="profile-value"
            >
              <option value="">Select category</option>
              <option value="Tutor">Tutor</option>
              <option value="Therapist">Therapist</option>
              <option value="Curriculum Provider">Curriculum Provider</option>
              <option value="Online School">Online School</option>
              <option value="Consultant">Consultant</option>
              <option value="Extracurricular">Extracurricular</option>
            </select>
          ) : (
            <div className="profile-value">{profileData.primaryCategory}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileSection;