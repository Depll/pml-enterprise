import React, { useState, useEffect } from 'react';

interface PlzModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (neuePlz: string) => void;
  currentPlz: string;
  errorMessage?: string; 
}

export const PlzModal: React.FC<PlzModalProps> = ({ isOpen, onSave, currentPlz, errorMessage }) => {
  const [inputValue, setInputValue] = useState<string>(currentPlz);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Setzt den internen Input-Wert zurück, wenn das Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentPlz);
      setErrorMsg('');
    }
  }, [isOpen, currentPlz]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Erlaubt nur Ziffern
    setInputValue(value);
    
    // Sobald der User tippt, löschen wir den Frontend-Fehler
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

  const anzuzeigenderFehler = errorMsg || errorMessage;

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

        <p className={`pml-plz-error-msg ${anzuzeigenderFehler ? '' : 'pml-hidden'}`}>
          {anzuzeigenderFehler}
        </p>

        <div className="pml-modal-input-container">
          <input 
            type="text" 
            id="plz-input" 
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