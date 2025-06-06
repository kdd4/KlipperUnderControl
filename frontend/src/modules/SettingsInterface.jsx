import { useState, useEffect } from 'preact/hooks';
import { API } from '../config';

export function SettingsInterface() {
  // Состояния для настроек
  const [appSettings, setAppSettings] = useState({
    theme: 'dark',
    fontSize: 'medium',
    notifications: true,
    temperatureUnit: 'C'
  });
  
  const [printerSettings, setPrinterSettings] = useState({
    defaultSpeed: 100,
    autoBedLeveling: false,
    safetyChecks: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [apiSettings, setApiSettings] = useState({
    moonrakerUrl: 'http://localhost:7125',
    apiKey: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Загрузка настроек из куков при монтировании
  useEffect(() => {
    const savedSettings = getCookie('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAppSettings(parsed.appSettings || appSettings);
        setPrinterSettings(parsed.printerSettings || printerSettings);
        setApiSettings(parsed.apiSettings || apiSettings);
      } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
      }
    }
  }, []);

  // Функция сохранения настроек
  const saveSettings = async (section) => {
    setIsSaving(true);
    setSaveStatus('Сохраняем...');
    
    try {
      // Для разных секций разная логика сохранения
      if (section === 'security') {
        // Проверка паролей
        if (securitySettings.newPassword !== securitySettings.confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        
        // Отправка на сервер
        const response = await fetch(API + '/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current: securitySettings.currentPassword,
            new: securitySettings.newPassword
          })
        });
        
        if (!response.ok) throw new Error('Ошибка смены пароля');
      }
      
      // Для остальных настроек сохраняем в куки
      const settingsData = {
        appSettings,
        printerSettings,
        apiSettings
      };
      
      setCookie('appSettings', JSON.stringify(settingsData), 30);
      
      setSaveStatus('Сохранено успешно!');
    } catch (error) {
      setSaveStatus(`Ошибка: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Обработчики изменений
  const handleAppSettingChange = (key, value) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePrinterSettingChange = (key, value) => {
    setPrinterSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key, value) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleApiSettingChange = (key, value) => {
    setApiSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="settings-module">
      <div className="settings-group">
        <h4>Внешний вид</h4>
        <div className="settings-item">
          <label>Тема:</label>
          <select 
            value={appSettings.theme}
            onChange={(e) => handleAppSettingChange('theme', e.target.value)}
          >
            <option value="dark">Тёмная</option>
            <option value="light">Светлая</option>
          </select>
        </div>
        
        <div className="settings-item">
          <label>Размер шрифта:</label>
          <select 
            value={appSettings.fontSize}
            onChange={(e) => handleAppSettingChange('fontSize', e.target.value)}
          >
            <option value="small">Мелкий</option>
            <option value="medium">Средний</option>
            <option value="large">Крупный</option>
          </select>
        </div>
      </div>
      
      <div className="settings-group">
        <h4>Параметры принтера</h4>
        <div className="settings-item">
          <label>
            <input 
              type="checkbox"
              checked={printerSettings.autoBedLeveling}
              onChange={(e) => handlePrinterSettingChange('autoBedLeveling', e.target.checked)}
            />
            Автоматическое выравнивание стола
          </label>
        </div>
        
        <div className="settings-item">
          <label>
            <input 
              type="checkbox"
              checked={printerSettings.safetyChecks}
              onChange={(e) => handlePrinterSettingChange('safetyChecks', e.target.checked)}
            />
            Проверка безопасности перед печатью
          </label>
        </div>
        
        <div className="settings-item">
          <label>Скорость по умолчанию:</label>
          <input 
            type="number"
            min="50"
            max="300"
            value={printerSettings.defaultSpeed}
            onChange={(e) => handlePrinterSettingChange('defaultSpeed', parseInt(e.target.value))}
          />
          %
        </div>
      </div>
      
      <div className="settings-group">
        <h4>Безопасность</h4>
        <div className="settings-item">
          <label>Текущий пароль:</label>
          <input 
            type="password"
            value={securitySettings.currentPassword}
            onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
            placeholder="Введите текущий пароль"
          />
        </div>
        
        <div className="settings-item">
          <label>Новый пароль:</label>
          <input 
            type="password"
            value={securitySettings.newPassword}
            onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
            placeholder="Не менее 8 символов"
          />
        </div>
        
        <div className="settings-item">
          <label>Подтвердите пароль:</label>
          <input 
            type="password"
            value={securitySettings.confirmPassword}
            onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
            placeholder="Повторите новый пароль"
          />
        </div>
        
        <button 
          className="settings-save-btn"
          onClick={() => saveSettings('security')}
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сменить пароль'}
        </button>
      </div>
      
      <div className="settings-group">
        <h4>Подключение</h4>
        <div className="settings-item">
          <label>Moonraker URL:</label>
          <input 
            type="text"
            value={apiSettings.moonrakerUrl}
            onChange={(e) => handleApiSettingChange('moonrakerUrl', e.target.value)}
            placeholder="http://localhost:7125"
          />
        </div>
        
        <div className="settings-item">
          <label>API ключ:</label>
          <input 
            type="password"
            value={apiSettings.apiKey}
            onChange={(e) => handleApiSettingChange('apiKey', e.target.value)}
            placeholder="Введите ключ API"
          />
        </div>
        
        <button 
          className="settings-save-btn"
          onClick={() => saveSettings('api')}
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
      
      {saveStatus && <div className="settings-status">{saveStatus}</div>}
    </div>
  );
}

// Вспомогательные функции для работы с куками
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=');
    if (cookieName.trim() === name) {
      return cookieValue;
    }
  }
  return null;
}