import React from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="pml-modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="pml-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="pml-modal-header">
          <h2 className="pml-modal-title">Datenschutzerklärung</h2>
          <button className="pml-modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="pml-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', color: '#cbd5e1', lineHeight: '1.6' }}>
          <h3 style={{ color: '#fff', marginTop: '0' }}>1. Datenschutz auf einen Blick</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
            personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser 
            Datenschutzerklärung.
          </p>

          <h3 style={{ color: '#fff' }}>2. Datenerfassung auf unserer Website</h3>
          <p>
            <strong>Cookies & LocalStorage:</strong> Unsere Website verwendet Techniken, um den Zustand Ihres Warenkorbs 
            und Ihre gewählte Postleitzahl zu speichern. Dies dient ausschließlich der Benutzerfreundlichkeit.
          </p>
          <p>
            <strong>Bestelldaten:</strong> Wenn Sie eine Bestellung aufgeben, werden die von Ihnen eingegebenen Daten 
            (Name, Adresse, Telefonnummer) zur Abwicklung der Lieferung an uns übermittelt.
          </p>

          <h3 style={{ color: '#fff' }}>3. Ihre Rechte</h3>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten 
            personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
          </p>
        </div>
      </div>
    </div>
  );
};