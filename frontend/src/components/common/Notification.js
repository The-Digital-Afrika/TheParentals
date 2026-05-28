import React, { useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  useEffect(() => {
    // Inject keyframes if not already present
    if (!document.getElementById('notification-keyframes')) {
      const style = document.createElement('style');
      style.id = 'notification-keyframes';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div id="notification-container">
      {notifications.map((notification) => {
        const colors = {
          success: '#10b981',
          error: '#ef4444',
          info: '#3b82f6',
          warning: '#f59e0b'
        };

        const icons = {
          success: 'fa-circle-check',
          error: 'fa-circle-exclamation',
          info: 'fa-circle-info',
          warning: 'fa-triangle-exclamation'
        };

        return (
          <div
            key={notification.id}
            style={{
              background: colors[notification.type] || colors.info,
              color: 'white',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              fontWeight: '600',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'slideInRight 0.3s ease both',
              cursor: 'pointer',
              pointerEvents: 'auto',
              maxWidth: '320px',
              wordBreak: 'break-word'
            }}
            onClick={() => removeNotification(notification.id)}
          >
            <i className={`fas ${icons[notification.type] || icons.info}`} aria-hidden="true"></i>
            {notification.message}
          </div>
        );
      })}
    </div>
  );
};

export default Notification;