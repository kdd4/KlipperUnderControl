import { useState } from 'preact/hooks';

export function MacroEditor() {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="module">
      <div className="module-header">
        <h3 className="module-title">Макросы</h3>
        <button onClick={() => setShowSettings(true)}>⚙️</button>
      </div>
      
      <div className="macro-grid">
        {[...Array(6)].map((_, i) => (
          <button className="macro-button" key={i}>
            <span>Макрос {i + 1}</span>
          </button>
        ))}
      </div>
      
      {showSettings && (
        <div className="settings-modal">
          <h4>Настройки макросов</h4>
          <input type="text" placeholder="Путь к файлу" />
          <button onClick={() => setShowSettings(false)}>Закрыть</button>
        </div>
      )}
    </div>
  );
}