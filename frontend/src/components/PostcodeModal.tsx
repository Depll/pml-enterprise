import React, { useState, useEffect } from 'react';

interface PostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPostcode: string) => void;
  currentPostcode: string;
  errorMessage?: string; 
}

export const PostcodeModal: React.FC<PostcodeModalProps> = ({ isOpen, onSave, currentPostcode, errorMessage }) => {
  const [inputValue, setInputValue] = useState<string>(currentPostcode);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Reset the internal input value whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentPostcode);
      setErrorMsg('');
    }
  }, [isOpen, currentPostcode]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setInputValue(value);
    
    if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleSave = () => {
    if (inputValue.trim().length !== 5) {
      setErrorMsg('Bitte gib eine gültige 5-stellige Postleitzahl ein.');
      return;
    }
    
    setErrorMsg('');
    onSave(inputValue); 
  };

  const displayedError = errorMsg || errorMessage;

  return (
    <div className="pml-modal-overlay">
      <div className="pml-modal-content-card">
        
        <div className="pml-modal-logo-area">
          <span className="pml-logo-main">Milano</span>
          <span className="pml-logo-sub">PIZZERIA</span>
        </div>

        <h2 className="pml-modal-main-title">Lieferadresse prüfen</h2>
        <p className="pml-modal-sub-text">
          Gib deine Postleitzahl ein, um zu prüfen, ob wir deine Bestellung zu dir nach Hause liefern können.
        </p>

        <p className={`pml-postcode-error-msg ${displayedError ? '' : 'pml-hidden'}`}>
          {displayedError}
        </p>

        <div className="pml-modal-input-container">
          <input 
            type="text" 
            id="postcode-input" 
            placeholder="Deine PLZ (z.B. 51373)" 
            value={inputValue}
            onChange={handleInputChange}
            maxLength={5}
          />
        </div>

        <button className="pml-btn-modal-save" onClick={handleSave}>
          Speichern & Weiter
        </button>

      </div>
    </div>
  );
};
