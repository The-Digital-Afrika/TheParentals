import React, { useState } from 'react';

const TagsInput = ({ tags, isEditing, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAddTag(inputValue.trim().toLowerCase());
      setInputValue('');
    }
  };

  return (
    <div className="profile-field">
      <label>
        Tags <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--ink-4)' }}>
          (e.g. mathematics, tutoring, therapy)
        </span>
      </label>
      <div className="tags-container" role="list" aria-label="Current tags">
        {tags.map((tag, index) => (
          <span key={index} className="tag-item" role="listitem">
            {tag}
            {isEditing && (
              <i 
                className="fas fa-times" 
                onClick={() => onRemoveTag(index)}
                aria-label={`Remove tag ${tag}`}
                tabIndex="0"
                role="button"
              ></i>
            )}
          </span>
        ))}
      </div>
      {isEditing && (
        <div className="tag-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag…"
            aria-label="New tag text"
          />
          <button 
            onClick={() => {
              if (inputValue.trim()) {
                onAddTag(inputValue.trim().toLowerCase());
                setInputValue('');
              }
            }}
            aria-label="Add tag"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default TagsInput;