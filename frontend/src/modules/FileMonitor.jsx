import { useState, useEffect, useRef } from 'preact/hooks';

import { API } from '../config';

import { apiGet, apiPost, apiPut, apiDelete } from '../api';

const moonrakerAPI = {
  listDirectory: async (path='/prints') => {
    return await apiGet('/api/files.php', { path });
  },
  uploadFile: async (file, dirPath='/prints') => {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch(API + '/api/files.php?path=' + encodeURIComponent(dirPath), {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
  },
  getFileContent: async (path) => {
    return await apiGet('/api/files.php', { action: 'content', path });
  },
  saveFileContent: async (path, content) => {
    return await apiPut('/api/files.php?path=' + encodeURIComponent(path), { content });
  },
  deleteFile: async (path) => {
    return await apiDelete('/api/files.php', { path });
  },
  // directory functions
  createDirectory: async (path, name) => {
    return await apiPost('/api/files.php?path=' + encodeURIComponent(path), { type: 'dir', name });
  },
  deleteDirectory: async (path) => {
    return await apiDelete('/api/files.php', { path });
  },
  renameDirectory: async (path, newName) => {
    return { success:false };
  },
  renameFile: async (path, newPath) => {
    return { success:false };
  },
  updateFileComment: async (path, comment) => {
    // Not implemented server side
    return { success:false };
  },
  printFile: async (path) => {
    return { success:false };
  }
};

// Заглушка для API Moonraker
const oldMoonrakerAPI = {
  // Структура файловой системы
    fileSystem: {
    '/prints': {
      files: [
        { 
          name: 'test_cube.gcode', 
          isDir: false, 
          size: '0.8MB', 
          modified: '2024-03-22',
          printTime: '1h 20m',
          materialUsed: '45g PLA',
          comment: 'Тестовый кубик 20x20x20'
        },
        { 
          name: 'project_A', 
          isDir: true, 
          modified: '2024-03-25',
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
              materialUsed: '30g PLA',
              comment: 'Калибровочный файл'
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
            }
          ]
        },
        { 
          name: 'project_B', 
          isDir: true, 
          modified: '2024-03-26',
          files: [
            { 
              name: 'part_1.gcode', 
              isDir: false, 
              size: '3.2MB', 
              modified: '2024-03-26',
              printTime: '7h 15m',
              materialUsed: '200g PETG',
              comment: 'Первая часть сборки'
            }
          ]
        }
      ]
    }
  },

  // Хранилище содержимого файлов
  fileContents: {
    '/prints/test_cube.gcode': `; Test Cube 20x20x20
; Generated: 2024-03-22
G28 ; Home all axes
G1 Z15 F5000 ; Move Z up
G92 E0 ; Reset extruder
G1 F200 E3 ; Extrude 3mm
G92 E0 ; Reset extruder
G1 F1500 ; Set feedrate
; Start printing...`,
    
    '/prints/project_A/version_1.gcode': `; Project A - Version 1
; Print time: 5h 30m
; Material: PLA
G28 ; Home all axes
G29 ; Auto bed leveling
M109 S210 ; Set hotend temp
M190 S60 ; Set bed temp
G1 Z10 F3000
M117 Starting print...
; Layer 1
G1 X10 Y10 F3000
G1 Z0.2 F1000`,
    
    '/prints/project_A/calibration.gcode': `; Calibration File
; Duration: 45 minutes
G28 ; Home
M117 Calibration started
G1 X100 Y100 F3000
G1 Z5 F1000
; Calibration pattern
G1 X50 Y50 F2000
G1 X150 Y50 F2000
G1 X150 Y150 F2000
G1 X50 Y150 F2000
G1 X50 Y50 F2000`,
    
    '/prints/project_A/config.txt': `# Printer Configuration
# Updated: 2024-03-25

[printer]
kinematics = cartesian
max_velocity = 300
max_accel = 3000
max_z_velocity = 5
max_z_accel = 100

[stepper_x]
step_pin = PF0
dir_pin = PF1
enable_pin = !PD7
microsteps = 16
rotation_distance = 40`,
    
    '/prints/project_A/settings.cfg': `# User Settings
# Modified: 2024-03-24

[gcode_macro START_PRINT]
gcode:
    G28 ; Home
    G29 ; ABL
    G1 Z10 F3000
    
[gcode_macro END_PRINT]
gcode:
    M104 S0 ; Turn off hotend
    M140 S0 ; Turn off bed
    G91 ; Relative positioning
    G1 E-2 F2700 ; Retract
    G1 Z10 F3000 ; Move Z up`,
    
    '/prints/project_B/part_1.gcode': `; Project B - Part 1
; Material: PETG
; Nozzle: 0.4mm
G28 ; Home all axes
M109 S240 ; PETG temperature
M190 S80 ; Bed temperature
G1 Z15 F5000
M117 Printing Part 1...`
  },

  // Исправленный метод создания директории
    async createDirectory(path, name) {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Находим текущую директорию
          if (path === '/prints') {
            // Проверяем, существует ли уже такая директория
            const exists = this.fileSystem['/prints'].files.some(
              f => f.isDir && f.name === name
            );
            
            if (exists) {
              reject(new Error('Директория с таким именем уже существует'));
              return;
            }
            
            // Создаем новую директорию
            const newDir = {
              name: name,
              isDir: true,
              modified: new Date().toISOString().split('T')[0],
              files: []
            };
            
            this.fileSystem['/prints'].files.push(newDir);
          } else {
            // Для поддиректорий
            const parts = path.split('/').filter(p => p);
            if (parts[0] === 'prints') {
              parts.shift();
            }
            
            let current = this.fileSystem['/prints'];
            for (const part of parts) {
              const found = current.files.find(f => f.isDir && f.name === part);
              if (found) {
                current = found;
              }
            }
            
            if (current && current.files) {
              const exists = current.files.some(
                f => f.isDir && f.name === name
              );
              
              if (exists) {
                reject(new Error('Директория с таким именем уже существует'));
                return;
              }
              
              const newDir = {
                name: name,
                isDir: true,
                modified: new Date().toISOString().split('T')[0],
                files: []
              };
              
              current.files.push(newDir);
            }
          }
          
          resolve();
        }, 500);
      });
    },

  // Исправленный метод удаления директории
    async deleteDirectory(path) {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Защита от удаления корневой директории
          if (path === '/prints' || path === '/') {
            reject(new Error('Невозможно удалить корневую директорию'));
            return;
          }
          
          const parts = path.split('/').filter(p => p);
          const dirName = parts.pop();
          
          if (parts[0] === 'prints') {
            parts.shift();
          }
          
          // Находим родительскую директорию
          let parent = this.fileSystem['/prints'];
          for (const part of parts) {
            const found = parent.files.find(f => f.isDir && f.name === part);
            if (found) {
              parent = found;
            }
          }
          
          // Находим директорию для удаления
          const dirIndex = parent.files.findIndex(f => f.isDir && f.name === dirName);
          if (dirIndex !== -1) {
            const dir = parent.files[dirIndex];
            
            // Проверяем, пустая ли директория
            if (dir.files && dir.files.length > 0) {
              reject(new Error('Невозможно удалить непустую директорию'));
              return;
            }
            
            // Удаляем директорию
            parent.files.splice(dirIndex, 1);
          }
          
          resolve();
        }, 500);
      });
    },

  // Исправленный метод переименования директории
    async renameDirectory(oldPath, newName) {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const parts = oldPath.split('/').filter(p => p);
          const oldName = parts.pop();
          
          if (parts[0] === 'prints') {
            parts.shift();
          }
          
          // Находим родительскую директорию
          let parent = this.fileSystem['/prints'];
          for (const part of parts) {
            const found = parent.files.find(f => f.isDir && f.name === part);
            if (found) {
              parent = found;
            }
          }
          
          // Проверяем, существует ли уже директория с новым именем
          const exists = parent.files.some(
            f => f.isDir && f.name === newName
          );
          
          if (exists) {
            reject(new Error('Директория с таким именем уже существует'));
            return;
          }
          
          // Находим и переименовываем директорию
          const dir = parent.files.find(f => f.isDir && f.name === oldName);
          if (dir) {
            dir.name = newName;
          }
          
          resolve();
        }, 500);
      });
    },

  // Получить содержимое директории
  async listDirectory(path) {

    return new Promise(resolve => {
      setTimeout(() => {
        // Если это корневой путь или /prints
        if (path === '/' || path === '/prints') {
          resolve({ files: [...this.fileSystem['/prints'].files] });
          return;
        }

        // Разбираем путь
        const parts = path.split('/').filter(p => p);
        
        // Убираем 'prints' из начала, если есть
        if (parts[0] === 'prints') {
          parts.shift();
        }

        // Начинаем с корневой директории
        let current = this.fileSystem['/prints'];
        
        // Проходим по каждой части пути
        for (const part of parts) {
          if (current.files) {
            const found = current.files.find(f => f.isDir && f.name === part);
            if (found) {
              current = found;
            } else {
              console.error(`Directory not found: ${part}`);
              resolve({ files: [] });
              return;
            }
          } else {
            console.error(`No files in current directory`);
            resolve({ files: [] });
            return;
          }
        }

        // Возвращаем файлы из найденной директории
        resolve({ files: current.files ? [...current.files] : [] });
      }, 500);
    });
  },

  // Вспомогательная функция для поиска директории
  findDirectory(node, dirName) {
    if (node.files) {
      const dir = node.files.find(f => f.isDir && f.name === dirName);
      if (dir) return dir;
      
      for (const file of node.files) {
        if (file.isDir && file.files) {
          const result = this.findDirectory(file, dirName);
          if (result) return result;
        }
      }
    }
    return null;
  },

  // Получить содержимое файла
  async getFileContent(path) {

    return new Promise(resolve => {
      setTimeout(() => {
        const content = this.fileContents[path];
        if (content) {
          resolve(content);
        } else {
          // Генерируем содержимое для новых файлов
          const fileName = path.split('/').pop();
          const defaultContent = `; File: ${fileName}\n; Generated: ${new Date().toLocaleString()}\n; No content yet`;
          resolve(defaultContent);
        }
      }, 300);
    });
  },

  // Сохранить содержимое файла
  async saveFileContent(path, content) {

    return new Promise(resolve => {
      setTimeout(() => {
        this.fileContents[path] = content;
        resolve();
      }, 500);
    });
  },

  // Удалить файл
  async deleteFile(path) {

    return new Promise(resolve => {
      setTimeout(() => {
        // Удаляем содержимое файла
        delete this.fileContents[path];
        
        // Удаляем файл из структуры
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        this.updateFileInStructure(dirPath, fileName, null);
        resolve();
      }, 300);
    });
  },

  // Переименовать файл
  async renameFile(oldPath, newPath) {

    return new Promise(resolve => {
      setTimeout(() => {
        // Переносим содержимое
        if (this.fileContents[oldPath]) {
          this.fileContents[newPath] = this.fileContents[oldPath];
          delete this.fileContents[oldPath];
        }
        
        // Обновляем структуру
        const oldParts = oldPath.split('/').filter(p => p);
        const oldName = oldParts.pop();
        const dirPath = '/' + oldParts.join('/');
        
        const newName = newPath.split('/').pop();
        
        this.updateFileInStructure(dirPath, oldName, null, newName);
        resolve();
      }, 300);
    });
  },

  // Обновить комментарий файла
  async updateFileComment(path, comment) {

    return new Promise(resolve => {
      setTimeout(() => {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        this.updateFileInStructure(dirPath, fileName, { comment });
        resolve();
      }, 300);
    });
  },

  // Загрузить файл
  async uploadFile(file, currentPath) {

    return new Promise(resolve => {
      setTimeout(() => {
        const newFile = {
          name: file.name,
          isDir: false,
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          modified: new Date().toISOString().split('T')[0],
          comment: 'Новый загруженный файл'
        };
        
        if (file.name.endsWith('.gcode')) {
          newFile.printTime = '2h 15m';
          newFile.materialUsed = '75g PLA';
        }
        
        // Добавляем файл в структуру
        const parts = currentPath.split('/').filter(p => p);
        if (parts.length === 0 || (parts.length === 1 && parts[0] === 'prints')) {
          this.fileSystem['/prints'].files.push(newFile);
        } else {
          // Добавляем в поддиректорию
          const dirName = parts[parts.length - 1];
          const dir = this.findDirectory(this.fileSystem['/prints'], dirName);
          if (dir && dir.files) {
            dir.files.push(newFile);
          }
        }
        
        // Создаем содержимое для нового файла
        const filePath = `${currentPath}/${file.name}`;
        this.fileContents[filePath] = `; Uploaded file: ${file.name}\n; Date: ${new Date().toLocaleString()}\n; Size: ${newFile.size}\n\n; File content will be here`;
        
        resolve();
      }, 1000);
    });
  },

  // Вспомогательная функция для обновления файла в структуре
  updateFileInStructure(dirPath, fileName, updates, newName = null) {
    const parts = dirPath.split('/').filter(p => p);
    
    if (parts.length <= 1) {
      // Корневая директория
      const files = this.fileSystem['/prints'].files;
      const fileIndex = files.findIndex(f => f.name === fileName);
      if (fileIndex !== -1) {
        if (updates === null && !newName) {
          // Удаление
          files.splice(fileIndex, 1);
        } else if (newName) {
          // Переименование
          files[fileIndex].name = newName;
        } else {
          // Обновление
          Object.assign(files[fileIndex], updates);
        }
      }
    } else {
      // Поддиректория
      const dirName = parts[parts.length - 1];
      const dir = this.findDirectory(this.fileSystem['/prints'], dirName);
      if (dir && dir.files) {
        const fileIndex = dir.files.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
          if (updates === null && !newName) {
            dir.files.splice(fileIndex, 1);
          } else if (newName) {
            dir.files[fileIndex].name = newName;
          } else {
            Object.assign(dir.files[fileIndex], updates);
          }
        }
      }
    }
  },

  async printFile(path) {

    return new Promise(resolve => setTimeout(resolve, 300));
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
  const [editingComment, setEditingComment] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const fileInputRef = useRef(null);
  const [newDirName, setNewDirName] = useState('');
  
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

  // Обработчик загрузки файла
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await moonrakerAPI.uploadFile(file, currentPath);
      await loadDirectory(currentPath);
    } catch (err) {
      setError(`Ошибка загрузки файла: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Очищаем input для возможности повторной загрузки того же файла
      event.target.value = '';
    }
  };

  // Обработчик сохранения комментария
  const handleSaveComment = async (file, newComment) => {
    try {
      await moonrakerAPI.updateFileComment(`${currentPath}/${file.name}`, newComment);
      await loadDirectory(currentPath);
      setEditingComment(null);
    } catch (err) {
      setError(`Ошибка сохранения комментария: ${err.message}`);
    }
  };

  // Переключение развернутости комментария
  const toggleCommentExpanded = (fileName) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName);
    } else {
      newExpanded.add(fileName);
    }
    setExpandedComments(newExpanded);
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

  // Открытие редактора
  const openEditor = async (file) => {
    const content = await loadFileContent(file.path);
    if (content !== null) {
      setActionModal({
        type: 'editor',
        file,
        content
      });
    }
  };

  // Сохранение файла в редакторе
  const handleSaveFile = async () => {
    const success = await saveFile(actionModal.file.path, fileContent);
    if (success) {
      setActionModal(null);
      await loadDirectory(currentPath);
    }
  };

    // Обработчик создания директории
  const handleCreateDirectory = async () => {
    try {
      await moonrakerAPI.createDirectory(currentPath, newDirName);
      await loadDirectory(currentPath);
      setActionModal(null);
      setNewDirName('');
    } catch (err) {
      setError(`Ошибка создания директории: ${err.message}`);
    }
  };

  // Обработчик удаления директории
  const handleDeleteDirectory = async (dirPath) => {
    try {
      await moonrakerAPI.deleteDirectory(dirPath);
      await loadDirectory(currentPath);
      setActionModal(null);
    } catch (err) {
      setError(`Ошибка удаления директории: ${err.message}`);
    }
  };

  // Обработчик переименования директории
  const handleRenameDirectory = async (dirPath, newName) => {
    try {
      await moonrakerAPI.renameDirectory(dirPath, newName);
      await loadDirectory(currentPath);
      setActionModal(null);
      setNewFileName('');
    } catch (err) {
      setError(`Ошибка переименования директории: ${err.message}`);
    }
  };

  // Обновляем обработчик открытия контекстного меню
  const openContextMenu = (item, event) => {
    const fullPath = `${currentPath}/${item.name}`;
    setSelectedFile(fullPath);
    
    setContextMenu({
      item,
      fullPath,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    });
  };

  // Обновляем обработчик действий с файлами
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
          
        case 'deleteDir':
          await handleDeleteDirectory(file.path);
          break;
          
        case 'renameDir':
          await handleRenameDirectory(file.path, newFileName);
          break;
      }
      
      if (action !== 'deleteDir' && action !== 'renameDir') {
        await loadDirectory(currentPath);
      }
    } catch (err) {
      setError(`Ошибка выполнения: ${err.message}`);
      console.error(`Ошибка ${action}:`, err);
    }
  };

  return (
    <div className="module">
      <div className="module-header">
        <div className="navigation-controls">
          <button 
            className="back-button"
            onClick={() => handleNavigate('..')}
            disabled={currentPath === '/' || currentPath === '/prints'}
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
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            title="Загрузить файл"
          >
            📤
          </button>
          <button
            className="create-dir-button"
            onClick={() => setActionModal({ type: 'createDir' })}
            title="Создать папку"
          >
            📁+
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".gcode,.txt,.cfg,.md"
          />
        </div>
        <h3 className="module-title">Файловая система: {currentPath}</h3>
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
          expandedComments={expandedComments}
          toggleCommentExpanded={toggleCommentExpanded}
          editingComment={editingComment}
          setEditingComment={setEditingComment}
          onSaveComment={handleSaveComment}
          currentPath={currentPath}
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
                  {contextMenu.item.isDir ? (
                    <span>Папка • Изменена: {contextMenu.item.modified}</span>
                  ) : (
                    <>
                      <span>Размер: {contextMenu.item.size}</span>
                      <span>Изменен: {contextMenu.item.modified}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Информация для файлов (существующий код) */}
            {!contextMenu.item.isDir && (
              <>
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
                    </div>
                  </div>
                )}
                
                {/* Комментарий для всех файлов */}
                {contextMenu.item.comment && (
                  <div className="print-info">
                    <h4>Комментарий:</h4>
                    <div className="print-details">
                      <div className="print-detail full-width">
                        <span className="detail-value comment">{contextMenu.item.comment}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="context-actions">
              {contextMenu.item.isDir ? (
                // Действия для директорий
                <>
                  <button 
                    className="context-action"
                    onClick={() => handleNavigate(contextMenu.item.name)}
                  >
                    Открыть папку
                  </button>
                  <button 
                    className="context-action"
                    onClick={() => {
                      setNewFileName(contextMenu.item.name);
                      setActionModal({
                        type: 'renameDir',
                        file: {
                          path: contextMenu.fullPath,
                          name: contextMenu.item.name
                        }
                      });
                    }}
                  >
                    Переименовать папку
                  </button>
                  {currentPath !== '/prints' && (
                    <button 
                      className="context-action delete"
                      onClick={() => setActionModal({
                        type: 'deleteDir',
                        file: {
                          path: contextMenu.fullPath,
                          name: contextMenu.item.name
                        }
                      })}
                    >
                      Удалить папку
                    </button>
                  )}
                </>
              ) : (
                // Действия для файлов (существующий код)
                <>
                  {isGcodeFile(contextMenu.item.name) && (
                    <button 
                      className="context-action print"
                      onClick={() => setActionModal({
                        type: 'print',
                        file: {
                          path: contextMenu.fullPath,
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
            </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания директории */}
      {actionModal?.type === 'createDir' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Создание новой папки</h3>
            <p>Создать папку в: <strong>{currentPath}</strong></p>
            
            <div className="form-group">
              <label>Имя папки:</label>
              <input
                type="text"
                value={newDirName}
                onChange={e => setNewDirName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newDirName.trim()) {
                    handleCreateDirectory();
                  }
                }}
                placeholder="Введите имя папки"
                autoFocus
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => {
                  setActionModal(null);
                  setNewDirName('');
                }}
              >
                Отмена
              </button>
              <button 
                className="modal-button confirm"
                onClick={handleCreateDirectory}
                disabled={!newDirName.trim()}
              >
                Создать
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

      {/* Модальное окно удаления директории */}
      {actionModal?.type === 'deleteDir' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить папку <strong>{actionModal.file.name}</strong>?</p>
            <p className="warning-text">⚠️ Папка должна быть пустой для удаления</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setActionModal(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-button delete"
                onClick={() => handleFileAction('deleteDir', actionModal.file)}
              >
                Удалить папку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно переименования директории */}
      {actionModal?.type === 'renameDir' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Переименование папки</h3>
            <p>Переименование: <strong>{actionModal.file.name}</strong></p>
            
            <div className="form-group">
              <label>Новое имя:</label>
              <input
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFileName.trim()) {
                    handleFileAction('renameDir', actionModal.file);
                  }
                }}
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
                onClick={() => handleFileAction('renameDir', actionModal.file)}
                disabled={!newFileName.trim()}
              >
                Переименовать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для отображения плиток
function FileGrid({ 
  items, 
  onSelect, 
  onNavigate, 
  getIcon, 
  isGcodeFile, 
  selectedPath,
  expandedComments,
  toggleCommentExpanded,
  editingComment,
  setEditingComment,
  onSaveComment,
  currentPath
}) {
  const [tempComment, setTempComment] = useState('');
  const [draggedOver, setDraggedOver] = useState(null);

  const handleClick = (item, e) => {
    // Для директорий тоже открываем контекстное меню по клику
    onSelect(item, e);
  };

  const handleDoubleClick = (item, e) => {
    e.stopPropagation();
    if (item.isDir) {
      onNavigate(item.name);
    }
  };

  // Обработчики для drag & drop файлов в папки
  const handleDragStart = (e, item) => {
    if (!item.isDir) {
      e.dataTransfer.setData('fileName', item.name);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, item) => {
    if (item.isDir) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDraggedOver(item.name);
    }
  };

  const handleDragLeave = (e) => {
    setDraggedOver(null);
  };

  const handleDrop = async (e, targetDir) => {
    e.preventDefault();
    setDraggedOver(null);
    
    const fileName = e.dataTransfer.getData('fileName');
    if (fileName && targetDir.isDir) {
      // Здесь будет логика перемещения файла в директорию

      // В реальном приложении вызываем API для перемещения
    }
  };

  const handleStartEditComment = (item, e) => {
    e.stopPropagation();
    setEditingComment(item.name);
    setTempComment(item.comment || '');
  };

  const handleSaveComment = (item, e) => {
    e.stopPropagation();
    onSaveComment(item, tempComment);
    setEditingComment(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingComment(null);
    setTempComment('');
  };

  const handleCommentKeyDown = (e, item) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveComment(item, e);
    } else if (e.key === 'Escape') {
      handleCancelEdit(e);
    }
  };

  return (
    <div className="file-grid">
      {items.length === 0 ? (
        <div className="empty-directory">
          <span className="empty-icon">📂</span>
          <p>Папка пуста</p>
          <button 
            className="create-first-item"
            onClick={() => document.querySelector('.create-dir-button').click()}
          >
            Создать папку
          </button>
        </div>
      ) : (
        items.map((item, index) => {
          const isSelected = selectedPath && selectedPath.endsWith(item.name);
          const isGcode = !item.isDir && isGcodeFile(item.name);
          const isExpanded = expandedComments.has(item.name);
          const isEditing = editingComment === item.name;
          const isDraggedOver = draggedOver === item.name;
          
          return (
            <div 
              key={index}
              className={`file-tile ${item.isDir ? 'dir' : 'file'} ${isSelected ? 'selected' : ''} ${isDraggedOver ? 'dragged-over' : ''}`}
              onClick={(e) => handleClick(item, e)}
              onDoubleClick={(e) => handleDoubleClick(item, e)}
              title={item.isDir ? 'Двойной клик для открытия' : item.name}
              draggable={!item.isDir}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item)}
            >
              <div className="tile-icon">
                {getIcon(item)}
                {isGcode && <span className="gcode-badge">GCODE</span>}
                {item.isDir && <span className="dir-indicator">▶</span>}
              </div>
              <div className="tile-name">
                {item.name}
              </div>
              
              {/* Информация о директории */}
              {item.isDir && (
                <div className="tile-info">
                  <span className="dir-info">
                    Папка
                  </span>
                  <span className="dir-modified">{item.modified}</span>
                </div>
              )}
            
            {/* Информация о файле */}
            {!item.isDir && (
              <>
                <div className="tile-info">
                  {item.size} • {item.modified.split('-').reverse().join('.')}
                </div>
                
                {/* Блок комментария */}
                <div className="tile-comment-section" onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="comment-edit-form">
                      <textarea
                        className="comment-edit-input"
                        value={tempComment}
                        onChange={e => setTempComment(e.target.value)}
                        onKeyDown={e => handleCommentKeyDown(e, item)}
                        placeholder="Введите комментарий..."
                        rows={2}
                        autoFocus
                      />
                      <div className="comment-edit-actions">
                        <button 
                          className="comment-btn save"
                          onClick={(e) => handleSaveComment(item, e)}
                          title="Сохранить (Enter)"
                        >
                          ✓
                        </button>
                        <button 
                          className="comment-btn cancel"
                          onClick={handleCancelEdit}
                          title="Отмена (Esc)"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`tile-comment ${isExpanded ? 'expanded' : ''} ${!item.comment ? 'no-comment' : ''}`}
                      onClick={() => toggleCommentExpanded(item.name)}
                    >
                      <div className="comment-content">
                        {item.comment || 'Нет комментария'}
                      </div>
                      <button 
                        className="comment-edit-btn"
                        onClick={(e) => handleStartEditComment(item, e)}
                        title="Редактировать комментарий"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}