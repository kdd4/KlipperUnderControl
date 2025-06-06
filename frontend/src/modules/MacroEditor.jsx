import { useState, useEffect, useRef } from 'preact/hooks';
import { API } from '../config';

const DEFAULT_ICONS = ['⚡', '🔧', '🔄', '⏹️', '🖨️', '⚠️'];
const GCODE_SYNTAX = [
  'G0', 'G1', 'G2', 'G3', 'G4', 'G10', 'G11', 'G20', 'G21', 'G28', 'G29', 'G90', 'G91', 'G92',
  'M80', 'M81', 'M82', 'M83', 'M84', 'M104', 'M105', 'M106', 'M107', 'M109', 'M140', 'M190', 'M220', 'M221'
];

export function MacroEditor() {
  const [macros, setMacros] = useState([]);
  const [currentMacro, setCurrentMacro] = useState(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const editorRef = useRef(null);
  
  // Загрузка списка макросов с сервера
  const loadMacros = async () => {
    try {
      // Заглушка для API запроса
      const response = await fetch(API + '/api/macros');
      const data = await response.json();
      setMacros(data);
    } catch (error) {
      console.error("Ошибка загрузки макросов:", error);
    }
  };

  // Загрузка содержимого файла
  const loadFileContent = async (path) => {
    try {
      // Заглушка для API запроса
      const response = await fetch(API + `/api/file?path=${encodeURIComponent(path)}`);
      const content = await response.text();
      setFileContent(content);
      return content;
    } catch (error) {
      console.error("Ошибка загрузки файла:", error);
      return '';
    }
  };

  // Сохранение макроса
  const saveMacro = async () => {
    setIsSaving(true);
    try {
      // Заглушка для API запроса
      await fetch(API + '/api/save-macro', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: currentMacro.name,
          icon: currentMacro.icon,
          path: filePath,
          content: fileContent
        })
      });
      loadMacros();
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Выполнение макроса
  const executeMacro = async () => {
    setIsExecuting(true);
    setExecutionLog([]);
    
    try {
      // Заглушка для API запроса
      const response = await fetch(API + '/api/execute-macro', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          path: filePath,
          content: fileContent
        })
      });
      
      // Имитация потока выполнения
      const commands = fileContent.split('\n').filter(cmd => cmd.trim());
      let log = [];
      
      for (let i = 0; i < commands.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        log = [...log, {command: commands[i], status: 'success'}];
        setExecutionLog(log);
      }
      
    } catch (error) {
      console.error("Ошибка выполнения:", error);
      setExecutionLog([...executionLog, {command: "Ошибка выполнения", status: 'error'}]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Проверка синтаксиса
  const validateSyntax = () => {
    const errors = [];
    const lines = fileContent.split('\n');
    
    lines.forEach((line, index) => {
      const command = line.trim().split(' ')[0].toUpperCase();
      
      if (command && !GCODE_SYNTAX.includes(command) && !command.startsWith(';')) {
        errors.push({
          line: index + 1,
          message: `Неизвестная команда: ${command}`,
          command: line.trim()
        });
      }
    });
    
    setSyntaxErrors(errors);
    return errors.length === 0;
  };

  // Прокрутка к ошибке
  const scrollToError = (line) => {
    if (editorRef.current) {
      const lineHeight = 20; // Примерная высота строки
      editorRef.current.scrollTop = (line - 1) * lineHeight;
    }
  };

  // Инициализация
  useEffect(() => {
    loadMacros();
  }, []);

  // Создание нового макроса
  const createNewMacro = () => {
    setCurrentMacro({
      name: `Макрос ${macros.length + 1}`,
      icon: DEFAULT_ICONS[macros.length % DEFAULT_ICONS.length],
    });
    setFilePath('');
    setFileContent('; Новый макрос\n; Введите команды G-code здесь\n');
    setSyntaxErrors([]);
  };

  // Выбор существующего макроса
  const selectMacro = async (macro) => {
    setCurrentMacro(macro);
    setFilePath(macro.path);
    const content = await loadFileContent(macro.path);
    setFileContent(content);
    setSyntaxErrors([]);
  };

  return (
    <div className="macro-editor">
      <div className="editor-header">
        <h2 className="editor-title">
          {currentMacro ? `Редактор макросов: ${currentMacro.name}` : "Управление макросами"}
        </h2>
        
        <div className="header-actions">
          <button 
            className={`execute-button ${isExecuting ? 'executing' : ''}`}
            onClick={executeMacro}
            disabled={isExecuting || !currentMacro}
            title="Выполнить макрос"
          >
            {isExecuting ? (
              <span className="executing-indicator">⏳</span>
            ) : (
              <span>▶️ Выполнить</span>
            )}
          </button>
          
          <button 
            className="save-button"
            onClick={saveMacro}
            disabled={isSaving || !currentMacro}
            title="Сохранить макрос"
          >
            {isSaving ? "Сохранение..." : "💾 Сохранить"}
          </button>
          
          <button 
            className="new-button"
            onClick={createNewMacro}
            title="Создать новый макрос"
          >
            ➕ Новый
          </button>
        </div>
      </div>
      
      <div className="editor-container">
        {/* Панель макросов */}
        <div className="macro-panel">
          <h3>Список макросов</h3>
          
          <div className="macro-list">
            {macros.map((macro, i) => (
              <div 
                key={i}
                className={`macro-item ${currentMacro?.name === macro.name ? 'selected' : ''}`}
                onClick={() => selectMacro(macro)}
              >
                <div className="macro-icon">{macro.icon}</div>
                <div className="macro-info">
                  <div className="macro-name">{macro.name}</div>
                  <div className="macro-path">{macro.path}</div>
                </div>
              </div>
            ))}
            
            {macros.length === 0 && (
              <div className="empty-macros">
                <p>Нет сохраненных макросов</p>
                <button onClick={createNewMacro}>Создать первый макрос</button>
              </div>
            )}
          </div>
          
          <button 
            className="file-manager-button"
            onClick={() => setShowFileManager(true)}
          >
            📁 Открыть файловый менеджер
          </button>
        </div>
        
        {/* Редактор кода */}
        <div className="code-editor">
          <div className="editor-toolbar">
            <div className="macro-properties">
              <div className="property">
                <label>Иконка:</label>
                <select
                  value={currentMacro?.icon || DEFAULT_ICONS[0]}
                  onChange={(e) => currentMacro && setCurrentMacro({
                    ...currentMacro,
                    icon: e.currentTarget.value
                  })}
                  disabled={!currentMacro}
                >
                  {DEFAULT_ICONS.map(icon => (
                    <option value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              
              <div className="property">
                <label>Название:</label>
                <input
                  type="text"
                  value={currentMacro?.name || ''}
                  onChange={(e) => currentMacro && setCurrentMacro({
                    ...currentMacro,
                    name: e.currentTarget.value
                  })}
                  disabled={!currentMacro}
                />
              </div>
              
              <div className="property">
                <label>Путь к файлу:</label>
                <div className="file-path">
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.currentTarget.value)}
                    disabled={!currentMacro}
                  />
                  <button 
                    onClick={() => setShowFileManager(true)}
                    disabled={!currentMacro}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              className="validate-button"
              onClick={validateSyntax}
              disabled={!currentMacro}
            >
              🔍 Проверить синтаксис
            </button>
          </div>
          
          <div className="editor-content" ref={editorRef}>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              spellCheck={false}
              disabled={!currentMacro}
              placeholder={currentMacro ? "Введите код макроса..." : "Выберите или создайте макрос для редактирования"}
            />
            
            {syntaxErrors.length > 0 && (
              <div className="syntax-errors">
                <div className="errors-header">
                  <span>Ошибки синтаксиса ({syntaxErrors.length})</span>
                  <button onClick={() => setSyntaxErrors([])}>✕</button>
                </div>
                <div className="errors-list">
                  {syntaxErrors.map((error, i) => (
                    <div 
                      key={i} 
                      className="error-item"
                      onClick={() => scrollToError(error.line)}
                    >
                      <span className="error-line">Строка {error.line}:</span>
                      <span className="error-message">{error.message}</span>
                      <code>{error.command}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Панель выполнения */}
        <div className="execution-panel">
          <h3>Выполнение макроса</h3>
          
          <div className="execution-log">
            {executionLog.length > 0 ? (
              executionLog.map((entry, i) => (
                <div key={i} className={`log-entry ${entry.status}`}>
                  <span className="log-status">
                    {entry.status === 'success' ? '✓' : '✗'}
                  </span>
                  <code>{entry.command}</code>
                </div>
              ))
            ) : (
              <div className="empty-log">
                {isExecuting ? (
                  <div className="executing-status">
                    <div className="spinner"></div>
                    <p>Выполнение макроса...</p>
                  </div>
                ) : (
                  <p>Журнал выполнения пуст</p>
                )}
              </div>
            )}
          </div>
          
          <div className="execution-info">
            <div className="info-item">
              <span>Статус:</span>
              <span className="status-value">
                {isExecuting ? "Выполняется" : "Ожидание"}
              </span>
            </div>
            <div className="info-item">
              <span>Команд:</span>
              <span className="commands-count">
                {fileContent.split('\n').filter(cmd => cmd.trim()).length}
              </span>
            </div>
            <div className="info-item">
              <span>Ошибки:</span>
              <span className="errors-count">
                {syntaxErrors.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Файловый менеджер */}
      {showFileManager && (
        <div className="file-manager-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Выбор файла макроса</h3>
              <button onClick={() => setShowFileManager(false)}>✕</button>
            </div>
            
            <div className="file-list">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="file-item"
                  onClick={() => {
                    setFilePath(`/macros/macro_${i + 1}.gcode`);
                    setShowFileManager(false);
                  }}
                >
                  <div className="file-icon">📄</div>
                  <div className="file-name">macro_{i + 1}.gcode</div>
                  <div className="file-info">1.{i + 1}KB · {i + 1} мин назад</div>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowFileManager(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}