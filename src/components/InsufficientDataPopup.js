import React from 'react';
import './InsufficientDataPopup.css';

const InsufficientDataPopup = ({ isOpen, missingFields, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="insufficient-data-overlay">
      <div className="insufficient-data-popup">
        <div className="popup-header">
          <h3>⚠️ Incomplete User Data</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="popup-content">
          <p>
            Some user data is incomplete. The following information is missing:
          </p>
          
          <ul className="missing-fields-list">
            {missingFields.map((field, index) => (
              <li key={index} className="missing-field-item">
                • {field}
              </li>
            ))}
          </ul>
          
          <p className="warning-message">
            <strong>Warning:</strong> This may affect some features. The app will continue with available data.
          </p>
        </div>
        
        <div className="popup-footer">
          <button className="continue-button" onClick={onClose}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientDataPopup;
