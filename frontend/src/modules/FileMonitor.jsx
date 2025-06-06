import { useState, useEffect } from 'preact/hooks';

// Заглушка для API Moonraker
const moonrakerAPI = {
  async listDirectory(path) {
    console.log(`Fetching directory: ${path}`);
    // В реальном приложении здесь будет fetch к Moonraker API
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          files: [
            { 
              name: 'version_1.gcode', 
              isDir: false, 
              size: '2.4MB', 
              modified: '2024-03-20',
              printTime: '5h 30m',
              materialUsed: '150g PLA',
              comment: 'Первая версия, требуется проверка'
            },
            { 
              name: 'calibration.gcode', 
              isDir: false, 
              size: '1.2MB', 
              modified: '2024-03-18',
              printTime: '0h 45m',
              materialUsed: '30g PLA'
            },
            { 
              name: 'config.txt', 
              isDir: false, 
              size: '0.1MB', 
              modified: '2024-03-25',
              comment: 'Основные настройки принтера'
            },
            { 
              name: 'settings.cfg', 
              isDir: false, 
              size: '0.2MB', 
              modified: '2024-03-24',
              comment: 'Пользовательские параметры'
            },
            { 
              name: 'project_A', 
              isDir: true, 
              modified: '2024-03-25',
            }
          ]
        });
      }, 500);
    });
  },

  async deleteFile(path) {
    console.log(`Deleting file: ${path}`);
    // Реальный запрос к API
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  async renameFile(oldPath, newPath) {
    console.log(`Renaming: ${oldPath} -> ${newPath}`);
    // Реальный запрос к API
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  async printFile(path) {
    console.log(`Printing: ${path}`);
    // Реальный запрос к API
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  async getFileContent(path) {
    console.log(`Fetching content: ${path}`);
    // Реальный запрос к API
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`; Файл: ${path}\n; Сгенерировано ${new Date().toLocaleString()}\nG28\nG1 Z10 F3000\nM117 Печать...`);
      }, 500);
    });
  },

  async saveFileContent(path, content) {
    console.log(`Saving file: ${path}`);
    // Реальный запрос к API
    return new Promise(resolve => setTimeout(resolve, 500));
  }
};

export function FileMonitor({ navigate }) {
  const [currentPath, setCurrentPath] = useState('/prints');
  const [currentDirContents, setCurrentDirContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Загрузка содержимого директории
  const loadDirectory = async (path) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await moonrakerAPI.listDirectory(path);
      setCurrentDirContents(data.files);
    } catch (err) {
      setError(`Ошибка загрузки: ${err.message}`);
      console.error('Ошибка загрузки директории:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка содержимого файла для редактора
  const loadFileContent = async (path) => {
    setIsLoading(true);
    try {
      const content = await moonrakerAPI.getFileContent(path);
      setFileContent(content);
      return content;
    } catch (err) {
      setError(`Ошибка загрузки файла: ${err.message}`);
      console.error('Ошибка загрузки файла:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение файла
  const saveFile = async (path, content) => {
    setIsSaving(true);
    try {
      await moonrakerAPI.saveFileContent(path, content);
      return true;
    } catch (err) {
      setError(`Ошибка сохранения файла: ${err.message}`);
      console.error('Ошибка сохранения файла:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Первоначальная загрузка
  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  // Обработчик навигации
  const handleNavigate = (path) => {
    if (path === '..') {
      // Возврат на уровень выше
      const newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      setCurrentPath(newPath);
    } else {
      // Вход в директорию
      setCurrentPath(`${currentPath}/${path}`);
    }
    setSelectedFile(null);
    setContextMenu(null);
    setActionModal(null);
  };

  // Обработчик открытия контекстного меню
  const openContextMenu = (item, event) => {
    const fullPath = `${currentPath}/${item.name}`;
    setSelectedFile(fullPath);
    
    if (!item.isDir) {
      setContextMenu({
        item,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      });
    }
  };

  // Получение иконки для элемента
  const getIcon = (item) => {
    if (item.isDir) return '📁';
    
    const ext = item.name.split('.').pop().toLowerCase();
    switch(ext) {
      case 'gcode': return '🖨️';
      case 'txt': return '📝';
      case 'cfg': return '⚙️';
      case 'md': return '📄';
      default: return '📄';
    }
  };

  // Проверка, является ли файл GCODE
  const isGcodeFile = (fileName) => {
    return fileName.toLowerCase().endsWith('.gcode');
  };

  // Обработчик действий с файлами
  const handleFileAction = async (action, file) => {
    setContextMenu(null);
    setActionModal(null);
    
    try {
      switch(action) {
        case 'delete':
          await moonrakerAPI.deleteFile(file.path);
          break;
          
        case 'rename':
          const newPath = `${currentPath}/${newFileName}`;
          await moonrakerAPI.renameFile(file.path, newPath);
          break;
          
        case 'print':
          await moonrakerAPI.printFile(file.path);
          break;
          
        case 'edit':
          // Загрузка контента уже происходит при открытии редактора
          break;
      }
      
      // Обновляем содержимое после действия
      await loadDirectory(currentPath);
    } catch (err) {
      setError(`Ошибка выполнения: ${err.message}`);
      console.error(`Ошибка ${action}:`, err);
    }
  };

  // Открытие редактора
  const openEditor = async (file) => {
    const content = await loadFileContent(file.path);
    setActionModal({
      type: 'editor',
      file,
      content
    });
  };

  // Сохранение файла в редакторе
  const handleSaveFile = async () => {
    const success = await saveFile(actionModal.file.path, fileContent);
    if (success) {
      setActionModal(null);
      await loadDirectory(currentPath);
    }
  };

  return (
    <div className="module">
      <div className="module-header">
        <div className="navigation-controls">
          <button 
            className="back-button"
            onClick={() => handleNavigate('..')}
            disabled={currentPath === '/'}
            title="Назад"
          >
            ←
          </button>
          <button
            className="refresh-button"
            onClick={() => loadDirectory(currentPath)}
            title="Обновить"
          >
            ↻
          </button>
        </div>
        <h3 className="module-title">Файловая система: {currentPath}</h3>
      </div>
      
      <div className="file-actions">
        <button onClick={() => handleFileAction('upload', { path: currentPath })}>
          Загрузить
        </button>
        <button 
          onClick={() => selectedFile && setActionModal({
            type: 'delete',
            file: { path: selectedFile, name: selectedFile.split('/').pop() }
          })}
          disabled={!selectedFile}
        >
          Удалить
        </button>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Загрузка...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <FileGrid 
          items={currentDirContents}
          onSelect={openContextMenu}
          onNavigate={handleNavigate}
          getIcon={getIcon}
          isGcodeFile={isGcodeFile}
          selectedPath={selectedFile}
        />
      )}

      <div className="file-info">
        {selectedFile && (
          <>
            <div>Выбранный файл: {selectedFile.split('/').pop()}</div>
            <div>Путь: {selectedFile}</div>
          </>
        )}
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <div className="context-overlay" onClick={() => setContextMenu(null)}>
          <div 
            className="context-menu" 
            style={{
              left: `${contextMenu.position.x}px`,
              top: `${contextMenu.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-header">
              <div className="context-icon">
                <span style={{ fontSize: '3rem' }}>
                  {getIcon(contextMenu.item)}
                </span>
              </div>
              <div className="context-info">
                <div className="context-name">{contextMenu.item.name}</div>
                <div className="context-details">
                  <span>Размер: {contextMenu.item.size}</span>
                  <span>Изменен: {contextMenu.item.modified}</span>
                </div>
              </div>
            </div>
            
            {/* Блок информации о печати для GCODE */}
            {isGcodeFile(contextMenu.item.name) && (
              <div className="print-info">
                <h4>Информация для печати:</h4>
                <div className="print-details">
                  <div className="print-detail">
                    <span className="detail-label">Время печати:</span>
                    <span className="detail-value">{contextMenu.item.printTime || 'Не указано'}</span>
                  </div>
                  <div className="print-detail">
                    <span className="detail-label">Материал:</span>
                    <span className="detail-value">{contextMenu.item.materialUsed || 'Не указан'}</span>
                  </div>
                  {contextMenu.item.comment && (
                    <div className="print-detail full-width">
                      <span className="detail-label">Комментарий:</span>
                      <span className="detail-value comment">{contextMenu.item.comment}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Комментарий для не-GCODE файлов */}
            {!isGcodeFile(contextMenu.item.name) && contextMenu.item.comment && (
              <div className="print-info">
                <h4>Комментарий:</h4>
                <div className="print-details">
                  <div className="print-detail full-width">
                    <span className="detail-value comment">{contextMenu.item.comment}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="context-actions">
              {isGcodeFile(contextMenu.item.name) && (
                <button 
                  className="context-action print"
                  onClick={() => setActionModal({
                    type: 'print',
                    file: {
                      path: `${currentPath}/${contextMenu.item.name}`,
                      name: contextMenu.item.name
                    }
                  })}
                >
                  Запустить печать
                </button>
              )}
              <button 
                className="context-action"
                onClick={() => openEditor({
                  path: `${currentPath}/${contextMenu.item.name}`,
                  name: contextMenu.item.name
                })}
              >
                Редактировать файл
              </button>
              <button 
                className="context-action"
                onClick={() => {
                  setNewFileName(contextMenu.item.name);
                  setActionModal({
                    type: 'rename',
                    file: {
                      path: `${currentPath}/${contextMenu.item.name}`,
                      name: contextMenu.item.name
                    }
                  });
                }}
              >
                Переименовать
              </button>
              <button 
                className="context-action delete"
                onClick={() => setActionModal({
                  type: 'delete',
                  file: {
                    path: `${currentPath}/${contextMenu.item.name}`,
                    name: contextMenu.item.name
                  }
                })}
              >
                Удалить файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {actionModal?.type === 'delete' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить файл <strong>{actionModal.file.name}</strong>?</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setActionModal(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-button delete"
                onClick={() => handleFileAction('delete', actionModal.file)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно переименования */}
      {actionModal?.type === 'rename' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Переименование файла</h3>
            <p>Переименование: <strong>{actionModal.file.name}</strong></p>
            
            <div className="form-group">
              <label>Новое имя:</label>
              <input
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setActionModal(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-button confirm"
                onClick={() => handleFileAction('rename', {
                  ...actionModal.file,
                  newName: newFileName
                })}
                disabled={!newFileName.trim()}
              >
                Переименовать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения печати */}
      {actionModal?.type === 'print' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение печати</h3>
            <p>Запустить печать файла <strong>{actionModal.file.name}</strong>?</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setActionModal(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-button print"
                onClick={() => handleFileAction('print', actionModal.file)}
              >
                Запустить печать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактора файлов */}
      {actionModal?.type === 'editor' && (
        <div className="editor-overlay" onClick={() => setActionModal(null)}>
          <div 
            className="editor-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="editor-header">
              <h3>Редактор: {actionModal.file.name}</h3>
              <div className="editor-path">Путь: {actionModal.file.path}</div>
              <div className="editor-actions">
                <button 
                  className="editor-button cancel"
                  onClick={() => setActionModal(null)}
                >
                  Отмена
                </button>
                <button 
                  className="editor-button save"
                  onClick={handleSaveFile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
            
            <textarea
              className="editor-content"
              value={fileContent}
              onChange={e => setFileContent(e.target.value)}
              spellCheck={false}
              placeholder="Введите содержимое файла..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для отображения плиток
function FileGrid({ items, onSelect, onNavigate, getIcon, isGcodeFile, selectedPath }) {
  const handleClick = (item, e) => {
    if (item.isDir) {
      onNavigate(item.name);
    } else {
      onSelect(item, e);
    }
  };

  // Получение полного пути к файлу
  const getFullPath = (item) => {
    return `${item.name}`;
  };

  return (
    <div className="file-grid">
      {items.map((item, index) => {
        const fullPath = getFullPath(item);
        const isSelected = selectedPath && selectedPath.endsWith(item.name);
        const isGcode = !item.isDir && isGcodeFile(item.name);
        
        return (
          <div 
            key={index}
            className={`file-tile ${item.isDir ? 'dir' : 'file'} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => handleClick(item, e)}
          >
            <div className="tile-icon">
              {getIcon(item)}
              {isGcode && <span className="gcode-badge">GCODE</span>}
            </div>
            <div className="tile-name">
              {item.name}
            </div>
            {!item.isDir && (
              <div className="tile-info">
                {item.size} • {item.modified.split('-').reverse().join('.')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}