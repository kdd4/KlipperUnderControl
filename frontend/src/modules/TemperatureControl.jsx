import { useState } from 'preact/hooks';
import { API } from '../config';

export function TemperatureControl() {
  const [targetTemp, setTargetTemp] = useState({
    extruder: 0,
    bed: 0,
  });
  const [isLoading, setIsLoading] = useState({
    extruder: false,
    bed: false,
  });
  const [status, setStatus] = useState({
    extruder: null,
    bed: null,
  });
  const [errors, setErrors] = useState({
    extruder: null,
    bed: null,
  });

  const handleSetTemp = async (type) => {
    const heater = type === 'extruder' ? 'extruder' : 'heater_bed';
    const temperature = targetTemp[type];

    // Очистка предыдущих статусов
    setStatus(prev => ({ ...prev, [type]: null }));
    setErrors(prev => ({ ...prev, [type]: null }));
    setIsLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const response = await fetch(API + '/api/set-temperature.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heater: heater,
          target: temperature
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка установки температуры');
      }
      
      // Успешная установка
      setStatus(prev => ({ 
        ...prev, 
        [type]: `Температура установлена: ${temperature}°C` 
      }));
      
      // Очистка поля ввода после успешной установки
      setTimeout(() => {
        setTargetTemp(prev => ({ ...prev, [type]: 0 }));
        setStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
      
    } catch (error) {
      console.error('Error setting temperature:', error);
      setErrors(prev => ({ 
        ...prev, 
        [type]: error.message || 'Ошибка соединения с сервером' 
      }));
      
      // Очистка ошибки через 5 секунд
      setTimeout(() => {
        setErrors(prev => ({ ...prev, [type]: null }));
      }, 5000);
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handlePresetClick = (type, temp) => {
    setTargetTemp(prev => ({ ...prev, [type]: temp }));
    // Автоматически применяем пресет
    if (temp > 0) {
      setTimeout(() => handleSetTemp(type), 100);
    }
  };

  const handleInputChange = (type, value) => {
    const numValue = Number(value);
    const limits = {
      extruder: { min: 0, max: 300 },
      bed: { min: 0, max: 120 }
    };
    
    // Валидация на клиенте
    if (numValue >= limits[type].min && numValue <= limits[type].max) {
      setTargetTemp(prev => ({ ...prev, [type]: numValue }));
    }
  };

  const presetTemps = {
    extruder: [0, 180, 200, 210, 230, 250],
    bed: [0, 50, 60, 65, 80, 100]
  };

  const renderControl = (type, title) => {
    const isExtruder = type === 'extruder';
    const maxTemp = isExtruder ? 300 : 120;
    
    return (
      <div className="temp-control-group">
        <h4>{title}</h4>
        
        {/* Статус сообщения */}
        {status[type] && (
          <div className="status-message success">
            {status[type]}
          </div>
        )}
        
        {/* Сообщение об ошибке */}
        {errors[type] && (
          <div className="status-message error">
            {errors[type]}
          </div>
        )}
        
        <div className="temp-presets">
          {presetTemps[type].map(temp => (
            <button 
              key={temp}
              className={`preset-button ${targetTemp[type] === temp ? 'active' : ''}`}
              onClick={() => handlePresetClick(type, temp)}
              disabled={isLoading[type]}
            >
              {temp}°
            </button>
          ))}
        </div>
        
        <div className="temp-input-row">
          <input
            type="number"
            value={targetTemp[type]}
            onChange={(e) => handleInputChange(type, e.currentTarget.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && targetTemp[type] > 0) {
                handleSetTemp(type);
              }
            }}
            min="0"
            max={maxTemp}
            placeholder="0"
            disabled={isLoading[type]}
          />
          <span className="temp-unit">°C</span>
          <button 
            className={`apply-button ${isLoading[type] ? 'loading' : ''}`}
            onClick={() => handleSetTemp(type)}
            disabled={isLoading[type] || targetTemp[type] === 0}
          >
            {isLoading[type] ? (
              <>
                <span className="spinner"></span>
                Установка...
              </>
            ) : (
              'Применить'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="temperature-control">
      {renderControl('extruder', 'Экструдер')}
      {renderControl('bed', 'Стол')}
      
      {/* Кнопка выключения всех нагревателей */}
      <div className="emergency-controls">
        <button 
          className="emergency-button"
          onClick={async () => {
            await handleSetTemp('extruder');
            await handleSetTemp('bed');
          }}
          disabled={isLoading.extruder || isLoading.bed}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
          </svg>
          Выключить все нагреватели
        </button>
      </div>
    </div>
  );
}
