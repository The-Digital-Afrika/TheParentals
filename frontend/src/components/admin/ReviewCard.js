import React, { useState } from 'react';

const ReviewCard = ({ review, onModerate }) => {
  const [status, setStatus] = useState(review.status);
  const [disabled, setDisabled] = useState(false);

  const handleModerate = (action) => {
    setDisabled(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    setStatus(newStatus);
    onModerate(review.id, action);
  };

  const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return (
    <div className="review-card" id={review.id}>
      <div className="review-header">
        <span className="review-provider">{review.provider}</span>
        <span className="review-rating" aria-label={`${review.rating} star rating`}>
          {ratingStars}
        </span>
        <span className={`review-status ${status}-badge`}>{status}</span>
      </div>
      <p className="review-text">"{review.text}"</p>
      <p className="review-meta">
        Reviewed by: {review.reviewer} · {review.daysAgo} day{review.daysAgo !== 1 ? 's' : ''} ago
      </p>
      <div className="review-actions">
        <button 
          className="btn-approve" 
          onClick={() => handleModerate('approve')}
          disabled={disabled}
        >
          <i className="fas fa-check"></i> Approve
        </button>
        <button 
          className="btn-reject" 
          onClick={() => handleModerate('reject')}
          disabled={disabled}
        >
          <i className="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;