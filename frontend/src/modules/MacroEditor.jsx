import { useState, useEffect, useRef } from 'preact/hooks';

// API для работы с макросами (аналогично moonrakerAPI)
const macrosAPI = {
  // Структура файловой системы макросов
  fileSystem: {
    '/macros': {
      files: [
        {
          name: 'start_print.gcode',
          isDir: false,
          size: '1.2KB',
          modified: '2024-03-20',
          comment: 'Макрос начала печати',
          icon: '🚀',
          description: 'Подготовка принтера к печати'
        },
        {
          name: 'end_print.gcode',
          isDir: false,
          size: '0.8KB',
          modified: '2024-03-20',
          comment: 'Макрос завершения печати',
          icon: '🏁',
          description: 'Выключение нагревателей и парковка'
        },
        {
          name: 'calibration',
          isDir: true,
          modified: '2024-03-22',
          files: [
            {
              name: 'bed_level.gcode',
              isDir: false,
              size: '2.1KB',
              modified: '2024-03-22',
              comment: 'Автокалибровка стола',
              icon: '📐',
              description: 'Процедура выравнивания стола'
            },
            {
              name: 'pid_tune.gcode',
              isDir: false,
              size: '1.5KB',
              modified: '2024-03-21',
              comment: 'Настройка PID',
              icon: '🌡️',
              description: 'Калибровка температурных параметров'
            }
          ]
        },
        {
          name: 'maintenance',
          isDir: true,
          modified: '2024-03-25',
          files: [
            {
              name: 'clean_nozzle.gcode',
              isDir: false,
              size: '0.9KB',
              modified: '2024-03-25',
              comment: 'Очистка сопла',
              icon: '🧹',
              description: 'Процедура очистки экструдера'
            },
            {
              name: 'load_filament.gcode',
              isDir: false,
              size: '1.1KB',
              modified: '2024-03-24',
              comment: 'Загрузка филамента',
              icon: '📥',
              description: 'Автоматическая загрузка пластика'
            },
            {
              name: 'unload_filament.gcode',
              isDir: false,
              size: '1.0KB',
              modified: '2024-03-24',
              comment: 'Выгрузка филамента',
              icon: '📤',
              description: 'Автоматическая выгрузка пластика'
            }
          ]
        },
        {
          name: 'emergency_stop.gcode',
          isDir: false,
          size: '0.5KB',
          modified: '2024-03-19',
          comment: 'Экстренная остановка',
          icon: '🛑',
          description: 'Немедленная остановка всех операций'
        }
      ]
    }
  },

  // Хранилище содержимого макросов
  macroContents: {
    '/macros/start_print.gcode': `; START_PRINT макрос
; Подготовка принтера к печати
[gcode_macro START_PRINT]
gcode:
    G28 ; Домой все оси
    G90 ; Абсолютное позиционирование
    
    ; Нагрев стола
    M140 S{params.BED_TEMP|default(60)}
    
    ; Нагрев хотэнда до температуры предварительного нагрева
    M104 S150
    
    ; Ждем нагрева стола
    M190 S{params.BED_TEMP|default(60)}
    
    ; Автокалибровка стола
    BED_MESH_CALIBRATE
    
    ; Финальный нагрев хотэнда
    M109 S{params.EXTRUDER_TEMP|default(200)}
    
    ; Прочистка сопла
    G1 Z5 F3000
    G1 X10 Y10 F3000
    G1 Z0.3 F300
    G92 E0
    G1 X100 E10 F1000
    G1 X150 E15 F1000
    G92 E0
    
    ; Готов к печати
    M117 Печать началась`,

    '/macros/end_print.gcode': `; END_PRINT макрос
; Завершение печати
[gcode_macro END_PRINT]
gcode:
    ; Отключение экструдера
    M104 S0
    
    ; Отключение стола
    M140 S0
    
    ; Относительное позиционирование
    G91
    
    ; Ретракт и подъем
    G1 E-2 F2700
    G1 Z10 F3000
    
    ; Абсолютное позиционирование
    G90
    
    ; Парковка
    G1 X10 Y200 F3000
    
    ; Отключение моторов
    M84
    
    ; Отключение вентилятора
    M106 S0
    
    M117 Печать завершена`,

    '/macros/calibration/bed_level.gcode': `; BED_LEVEL макрос
; Автоматическая калибровка стола
[gcode_macro BED_LEVEL]
gcode:
    {% if printer.toolhead.homed_axes != "xyz" %}
        G28
    {% endif %}
    
    BED_MESH_CLEAR
    
    ; Нагрев для точной калибровки
    M140 S60
    M104 S200
    M190 S60
    M109 S200
    
    ; Калибровка
    BED_MESH_CALIBRATE
    
    ; Сохранение профиля
    BED_MESH_PROFILE SAVE=default
    
    ; Охлаждение
    M104 S0
    M140 S0
    
    SAVE_CONFIG`,

    '/macros/calibration/pid_tune.gcode': `; PID_TUNE макрос
; Калибровка PID параметров
[gcode_macro PID_TUNE_HOTEND]
gcode:
    {% set TEMP = params.TEMP|default(200)|float %}
    
    M106 S64 ; Вентилятор на 25%
    PID_CALIBRATE HEATER=extruder TARGET={TEMP}
    
[gcode_macro PID_TUNE_BED]
gcode:
    {% set TEMP = params.TEMP|default(60)|float %}
    
    PID_CALIBRATE HEATER=heater_bed TARGET={TEMP}`,

    '/macros/maintenance/clean_nozzle.gcode': `; CLEAN_NOZZLE макрос
; Очистка сопла
[gcode_macro CLEAN_NOZZLE]
gcode:
    SAVE_GCODE_STATE NAME=clean_nozzle_state
    
    G90
    G1 Z10 F3000
    G1 X50 Y0 F5000
    
    ; Нагрев для очистки
    M109 S200
    
    ; Движения очистки
    {% for i in range(5) %}
        G1 X100 F3000
        G1 X50 F3000
    {% endfor %}
    
    ; Выдавливание остатков
    G1 E10 F300
    G1 E-2 F1800
    
    RESTORE_GCODE_STATE NAME=clean_nozzle_state`,

    '/macros/maintenance/load_filament.gcode': `; LOAD_FILAMENT макрос
; Загрузка филамента
[gcode_macro LOAD_FILAMENT]
gcode:
    {% set TEMP = params.TEMP|default(200)|float %}
    
    SAVE_GCODE_STATE NAME=load_state
    
    M117 Нагрев...
    M109 S{TEMP}
    
    M117 Загрузка филамента
    M83 ; Относительная экструзия
    G1 E50 F300
    G1 E30 F150
    G1 E20 F150
    
    M117 Филамент загружен
    
    RESTORE_GCODE_STATE NAME=load_state`,

    '/macros/maintenance/unload_filament.gcode': `; UNLOAD_FILAMENT макрос
; Выгрузка филамента
[gcode_macro UNLOAD_FILAMENT]
gcode:
    {% set TEMP = params.TEMP|default(200)|float %}
    
    SAVE_GCODE_STATE NAME=unload_state
    
    M117 Нагрев...
    M109 S{TEMP}
    
    M117 Выгрузка филамента
    M83 ; Относительная экструзия
    G1 E10 F300 ; Экструзия для размягчения
    G1 E-10 F3600
    G1 E-90 F1800
    
    M117 Филамент выгружен
    
    RESTORE_GCODE_STATE NAME=unload_state`,

    '/macros/emergency_stop.gcode': `; EMERGENCY_STOP макрос
; Экстренная остановка
[gcode_macro EMERGENCY_STOP]
gcode:
    M112 ; Аварийная остановка
    
; Альтернативный вариант
[gcode_macro PANIC]
gcode:
    M117 АВАРИЙНАЯ ОСТАНОВКА!
    M104 S0 ; Выключить хотэнд
    M140 S0 ; Выключить стол
    M106 S0 ; Выключить вентилятор
    M84 ; Отключить моторы
    CANCEL_PRINT`
  },

  // Создание директории
  async createDirectory(path, name) {
    console.log(`Creating directory: ${name} in ${path}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (path === '/macros') {
          const exists = this.fileSystem['/macros'].files.some(
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
          
          this.fileSystem['/macros'].files.push(newDir);
        } else {
          const parts = path.split('/').filter(p => p);
          if (parts[0] === 'macros') {
            parts.shift();
          }
          
          let current = this.fileSystem['/macros'];
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

  // Создание нового макроса
  async createMacro(path, name, icon = '⚡', description = '') {
    console.log(`Creating macro: ${name} in ${path}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fileName = name.endsWith('.gcode') ? name : `${name}.gcode`;
        const filePath = `${path}/${fileName}`;
        
        // Находим директорию
        const parts = path.split('/').filter(p => p);
        if (parts[0] === 'macros') {
          parts.shift();
        }
        
        let current = this.fileSystem['/macros'];
        if (parts.length > 0) {
          for (const part of parts) {
            const found = current.files.find(f => f.isDir && f.name === part);
            if (found) {
              current = found;
            }
          }
        }
        
        if (current && current.files) {
          const exists = current.files.some(f => !f.isDir && f.name === fileName);
          
          if (exists) {
            reject(new Error('Макрос с таким именем уже существует'));
            return;
          }
          
          const newMacro = {
            name: fileName,
            isDir: false,
            size: '0.1KB',
            modified: new Date().toISOString().split('T')[0],
            comment: 'Новый макрос',
            icon: icon,
            description: description
          };
          
          current.files.push(newMacro);
          
          // Создаем содержимое макроса
          const macroName = fileName.replace('.gcode', '').toUpperCase();
          this.macroContents[filePath] = `; ${macroName} макрос
; ${description || 'Описание макроса'}
[gcode_macro ${macroName}]
gcode:
    ; Ваш код здесь
    M117 Выполняется ${macroName}`;
        }
        
        resolve();
      }, 500);
    });
  },

  // Удаление директории
  async deleteDirectory(path) {
    console.log(`Deleting directory: ${path}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (path === '/macros' || path === '/') {
          reject(new Error('Невозможно удалить корневую директорию'));
          return;
        }
        
        const parts = path.split('/').filter(p => p);
        const dirName = parts.pop();
        
        if (parts[0] === 'macros') {
          parts.shift();
        }
        
        let parent = this.fileSystem['/macros'];
        for (const part of parts) {
          const found = parent.files.find(f => f.isDir && f.name === part);
          if (found) {
            parent = found;
          }
        }
        
        const dirIndex = parent.files.findIndex(f => f.isDir && f.name === dirName);
        if (dirIndex !== -1) {
          const dir = parent.files[dirIndex];
          
          if (dir.files && dir.files.length > 0) {
            reject(new Error('Невозможно удалить непустую директорию'));
            return;
          }
          
          parent.files.splice(dirIndex, 1);
        }
        
        resolve();
      }, 500);
    });
  },

  // Переименование директории
  async renameDirectory(oldPath, newName) {
    console.log(`Renaming directory: ${oldPath} to ${newName}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const parts = oldPath.split('/').filter(p => p);
        const oldName = parts.pop();
        
        if (parts[0] === 'macros') {
          parts.shift();
        }
        
        let parent = this.fileSystem['/macros'];
        for (const part of parts) {
          const found = parent.files.find(f => f.isDir && f.name === part);
          if (found) {
            parent = found;
          }
        }
        
        const exists = parent.files.some(
          f => f.isDir && f.name === newName
        );
        
        if (exists) {
          reject(new Error('Директория с таким именем уже существует'));
          return;
        }
        
        const dir = parent.files.find(f => f.isDir && f.name === oldName);
        if (dir) {
          dir.name = newName;
          dir.modified = new Date().toISOString().split('T')[0];
        }
        
        resolve();
      }, 500);
    });
  },

  // Получить содержимое директории
  async listDirectory(path) {
    console.log(`Fetching directory: ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        if (path === '/' || path === '/macros') {
          resolve({ files: [...this.fileSystem['/macros'].files] });
          return;
        }

        const parts = path.split('/').filter(p => p);
        
        if (parts[0] === 'macros') {
          parts.shift();
        }

        let current = this.fileSystem['/macros'];
        
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

        resolve({ files: current.files ? [...current.files] : [] });
      }, 500);
    });
  },

  // Получить содержимое макроса
  async getMacroContent(path) {
    console.log(`Fetching macro content: ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const content = this.macroContents[path];
        if (content) {
          resolve(content);
        } else {
          const fileName = path.split('/').pop();
          const macroName = fileName.replace('.gcode', '').toUpperCase();
          const defaultContent = `; ${macroName} макрос
; Автоматически созданный макрос
[gcode_macro ${macroName}]
gcode:
    ; Добавьте ваш G-code здесь
    M117 ${macroName} выполняется`;
          resolve(defaultContent);
        }
      }, 300);
    });
  },

  // Сохранить содержимое макроса
  async saveMacroContent(path, content) {
    console.log(`Saving macro: ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        this.macroContents[path] = content;
        
        // Обновляем дату изменения файла
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        
        if (parts[0] === 'macros') {
          parts.shift();
        }
        
        let current = this.fileSystem['/macros'];
        for (const part of parts) {
          const found = current.files.find(f => f.isDir && f.name === part);
          if (found) {
            current = found;
          }
        }
        
        const file = current.files.find(f => !f.isDir && f.name === fileName);
        if (file) {
          file.modified = new Date().toISOString().split('T')[0];
          file.size = `${(content.length / 1024).toFixed(1)}KB`;
        }
        
        resolve();
      }, 500);
    });
  },

  // Удалить макрос
  async deleteMacro(path) {
    console.log(`Deleting macro: ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        delete this.macroContents[path];
        
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        this.updateFileInStructure(dirPath, fileName, null);
        resolve();
      }, 300);
    });
  },

  // Переименовать макрос
  async renameMacro(oldPath, newPath) {
    console.log(`Renaming: ${oldPath} -> ${newPath}`);
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.macroContents[oldPath]) {
          this.macroContents[newPath] = this.macroContents[oldPath];
          delete this.macroContents[oldPath];
        }
        
        const oldParts = oldPath.split('/').filter(p => p);
        const oldName = oldParts.pop();
        const dirPath = '/' + oldParts.join('/');
        
        const newName = newPath.split('/').pop();
        
        this.updateFileInStructure(dirPath, oldName, null, newName);
        resolve();
      }, 300);
    });
  },

  // Обновить метаданные макроса
  async updateMacroMetadata(path, metadata) {
    console.log(`Updating metadata for: ${path}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        this.updateFileInStructure(dirPath, fileName, metadata);
        resolve();
      }, 300);
    });
  },

  // Выполнить макрос
  async executeMacro(path) {
    console.log(`Executing macro: ${path}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const content = this.macroContents[path];
        if (!content) {
          reject(new Error('Макрос не найден'));
          return;
        }
        
        // Имитация выполнения макроса
        const lines = content.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith(';')
        );
        
        const executionLog = [];
        let hasErrors = false;
        
        lines.forEach((line, index) => {
          // Простая проверка синтаксиса
          const command = line.trim().split(' ')[0].toUpperCase();
          
          if (command.startsWith('G') || command.startsWith('M') || 
              command.startsWith('[') || command === 'gcode:' || 
              command.includes('=') || command.startsWith('{%')) {
            executionLog.push({
              line: index + 1,
              command: line,
              status: 'success',
              message: 'OK'
            });
          } else if (line.trim()) {
            executionLog.push({
              line: index + 1,
              command: line,
              status: 'error',
              message: `Неизвестная команда: ${command}`
            });
            hasErrors = true;
          }
        });
        
        if (hasErrors) {
          reject({ 
            error: 'Выполнение завершено с ошибками', 
            log: executionLog 
          });
        } else {
          resolve({ 
            success: true, 
            log: executionLog,
            message: 'Макрос выполнен успешно'
          });
        }
      }, 1000);
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

  // Вспомогательная функция для обновления файла в структуре
  updateFileInStructure(dirPath, fileName, updates, newName = null) {
    const parts = dirPath.split('/').filter(p => p);
    
    if (parts.length <= 1) {
      const files = this.fileSystem['/macros'].files;
      const fileIndex = files.findIndex(f => f.name === fileName);
      if (fileIndex !== -1) {
        if (updates === null && !newName) {
          files.splice(fileIndex, 1);
        } else if (newName) {
          files[fileIndex].name = newName;
          files[fileIndex].modified = new Date().toISOString().split('T')[0];
        } else {
          Object.assign(files[fileIndex], updates);
          files[fileIndex].modified = new Date().toISOString().split('T')[0];
        }
      }
    } else {
      const dirName = parts[parts.length - 1];
      const dir = this.findDirectory(this.fileSystem['/macros'], dirName);
      if (dir && dir.files) {
        const fileIndex = dir.files.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
          if (updates === null && !newName) {
            dir.files.splice(fileIndex, 1);
          } else if (newName) {
            dir.files[fileIndex].name = newName;
            dir.files[fileIndex].modified = new Date().toISOString().split('T')[0];
          } else {
            Object.assign(dir.files[fileIndex], updates);
            dir.files[fileIndex].modified = new Date().toISOString().split('T')[0];
          }
        }
      }
    }
  }
};

// Доступные иконки для макросов
const MACRO_ICONS = ['⚡', '🔧', '🔄', '⏹️', '🖨️', '⚠️', '🚀', '🏁', '📐', '🌡️', '🧹', '📥', '📤', '🛑', '⚙️', '🎯', '🔍', '💾', '🔥', '❄️'];

export function MacroEditor({ navigate }) {
  const [currentPath, setCurrentPath] = useState('/macros');
  const [currentDirContents, setCurrentDirContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [macroContent, setMacroContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [editingMetadata, setEditingMetadata] = useState(null);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroIcon, setNewMacroIcon] = useState('⚡');
  const [newMacroDescription, setNewMacroDescription] = useState('');
  const [newDirName, setNewDirName] = useState('');
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const editorRef = useRef(null);

  // Загрузка содержимого директории
  const loadDirectory = async (path) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await macrosAPI.listDirectory(path);
      setCurrentDirContents(data.files);
    } catch (err) {
      setError(`Ошибка загрузки: ${err.message}`);
      console.error('Ошибка загрузки директории:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка содержимого макроса
  const loadMacroContent = async (path) => {
    setIsLoading(true);
    try {
      const content = await macrosAPI.getMacroContent(path);
      setMacroContent(content);
      validateSyntax(content);
      return content;
    } catch (err) {
      setError(`Ошибка загрузки макроса: ${err.message}`);
      console.error('Ошибка загрузки макроса:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение макроса
  const saveMacro = async () => {
    if (!selectedMacro) return;
    
    setIsSaving(true);
    try {
      await macrosAPI.saveMacroContent(selectedMacro.path, macroContent);
      await loadDirectory(currentPath);
      setError(null);
    } catch (err) {
      setError(`Ошибка сохранения: ${err.message}`);
      console.error('Ошибка сохранения макроса:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Выполнение макроса
  const executeMacro = async () => {
    if (!selectedMacro) return;
    
    setIsExecuting(true);
    setExecutionLog([]);
    
    try {
      const result = await macrosAPI.executeMacro(selectedMacro.path);
      setExecutionLog(result.log);
      setError(null);
    } catch (err) {
      if (err.log) {
        setExecutionLog(err.log);
      }
      setError(err.error || `Ошибка выполнения: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Проверка синтаксиса
  const validateSyntax = (content = macroContent) => {
    const errors = [];
    const lines = content.split('\n');
    const validCommands = ['G', 'M', '[', '{%', 'gcode:', 'variable_', 'default_parameter_'];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Пропускаем пустые строки и комментарии
      if (!trimmedLine || trimmedLine.startsWith(';')) return;
      
      // Проверяем основные команды
      const isValid = validCommands.some(cmd => trimmedLine.startsWith(cmd)) ||
                     trimmedLine.includes('=') || // переменные
                     trimmedLine.endsWith(':') || // метки
                     trimmedLine === 'gcode:' ||
                     trimmedLine.startsWith('{% ') || // Jinja2 шаблоны
                     trimmedLine === '{% endif %}' ||
                     trimmedLine === '{% endfor %}';
      
      if (!isValid) {
        errors.push({
          line: index + 1,
          message: `Возможная синтаксическая ошибка`,
          command: trimmedLine
        });
      }
    });
    
    setSyntaxErrors(errors);
    return errors.length === 0;
  };

  // Первоначальная загрузка
  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  // Обработчик навигации
  const handleNavigate = (path) => {
    if (path === '..') {
      const newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      setCurrentPath(newPath);
    } else {
      setCurrentPath(`${currentPath}/${path}`);
    }
    setSelectedMacro(null);
    setContextMenu(null);
    setActionModal(null);
    setMacroContent('');
    setSyntaxErrors([]);
    setExecutionLog([]);
  };

  // Получение иконки для элемента
  const getIcon = (item) => {
    if (item.isDir) return '📁';
    return item.icon || '📄';
  };

  // Открытие редактора макроса
  const openMacroEditor = async (macro) => {
    const content = await loadMacroContent(macro.path);
    if (content !== null) {
      setSelectedMacro(macro);
      setActionModal({
        type: 'editor',
        macro
      });
    }
  };

  // Создание нового макроса
  const handleCreateMacro = async () => {
    try {
      await macrosAPI.createMacro(currentPath, newMacroName, newMacroIcon, newMacroDescription);
      await loadDirectory(currentPath);
      setActionModal(null);
      setNewMacroName('');
      setNewMacroIcon('⚡');
      setNewMacroDescription('');
    } catch (err) {
      setError(`Ошибка создания макроса: ${err.message}`);
    }
  };

  // Создание директории
  const handleCreateDirectory = async () => {
    try {
      await macrosAPI.createDirectory(currentPath, newDirName);
      await loadDirectory(currentPath);
      setActionModal(null);
      setNewDirName('');
    } catch (err) {
      setError(`Ошибка создания директории: ${err.message}`);
    }
  };

  // Удаление макроса
  const handleDeleteMacro = async (macroPath) => {
    try {
      await macrosAPI.deleteMacro(macroPath);
      await loadDirectory(currentPath);
      setActionModal(null);
      if (selectedMacro?.path === macroPath) {
        setSelectedMacro(null);
        setMacroContent('');
      }
    } catch (err) {
      setError(`Ошибка удаления макроса: ${err.message}`);
    }
  };

  // Удаление директории
  const handleDeleteDirectory = async (dirPath) => {
    try {
      await macrosAPI.deleteDirectory(dirPath);
      await loadDirectory(currentPath);
      setActionModal(null);
    } catch (err) {
      setError(`Ошибка удаления директории: ${err.message}`);
    }
  };

  // Переименование макроса
  const handleRenameMacro = async (oldPath, newName) => {
    try {
      const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${dir}/${newName}`;
      await macrosAPI.renameMacro(oldPath, newPath);
      await loadDirectory(currentPath);
      setActionModal(null);
      if (selectedMacro?.path === oldPath) {
        setSelectedMacro({ ...selectedMacro, path: newPath, name: newName });
      }
    } catch (err) {
      setError(`Ошибка переименования макроса: ${err.message}`);
    }
  };

  // Переименование директории
  const handleRenameDirectory = async (dirPath, newName) => {
    try {
      await macrosAPI.renameDirectory(dirPath, newName);
      await loadDirectory(currentPath);
      setActionModal(null);
    } catch (err) {
      setError(`Ошибка переименования директории: ${err.message}`);
    }
  };

  // Обновление метаданных макроса
  const handleUpdateMetadata = async (macro, metadata) => {
    try {
      await macrosAPI.updateMacroMetadata(macro.path, metadata);
      await loadDirectory(currentPath);
      setEditingMetadata(null);
    } catch (err) {
      setError(`Ошибка обновления метаданных: ${err.message}`);
    }
  };

  // Открытие контекстного меню
  const openContextMenu = (item, event) => {
    const fullPath = `${currentPath}/${item.name}`;
    
    setContextMenu({
      item,
      fullPath,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    });
  };

  // Прокрутка к ошибке в редакторе
  const scrollToError = (line) => {
    if (editorRef.current) {
      const lineHeight = 20;
      const scrollTop = (line - 1) * lineHeight;
      editorRef.current.scrollTop = scrollTop;
      
      // Подсветка строки с ошибкой
      const lines = macroContent.split('\n');
      if (lines[line - 1]) {
        // Можно добавить визуальную индикацию ошибки
      }
    }
  };

  return (
    <div className="module">
      <div className="module-header">
        <div className="navigation-controls">
          <button 
            className="back-button"
            onClick={() => handleNavigate('..')}
            disabled={currentPath === '/' || currentPath === '/macros'}
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
            className="create-macro-button"
            onClick={() => setActionModal({ type: 'createMacro' })}
            title="Создать макрос"
          >
            ⚡+
          </button>
          <button
            className="create-dir-button"
            onClick={() => setActionModal({ type: 'createDir' })}
            title="Создать папку"
          >
            📁+
          </button>
        </div>
        <h3 className="module-title">Редактор макросов: {currentPath}</h3>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Загрузка...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <MacroGrid 
          items={currentDirContents}
          onSelect={openContextMenu}
          onNavigate={handleNavigate}
          getIcon={getIcon}
          selectedMacro={selectedMacro}
          editingMetadata={editingMetadata}
          setEditingMetadata={setEditingMetadata}
          onUpdateMetadata={handleUpdateMetadata}
          currentPath={currentPath}
        />
      )}

      {/* Панель выполнения макроса */}
      {selectedMacro && (
        <div className="macro-execution-panel">
          <div className="execution-header">
            <h4>Выполнение: {selectedMacro.name}</h4>
            <div className="execution-controls">
              <button 
                className={`execute-button ${isExecuting ? 'executing' : ''}`}
                onClick={executeMacro}
                disabled={isExecuting || syntaxErrors.length > 0}
              >
                {isExecuting ? '⏳ Выполняется...' : '▶️ Выполнить'}
              </button>
              <button 
                className="validate-button"
                onClick={() => validateSyntax()}
              >
                🔍 Проверить синтаксис
              </button>
            </div>
          </div>
          
          {executionLog.length > 0 && (
            <div className="execution-log">
              {executionLog.map((entry, i) => (
                <div key={i} className={`log-entry ${entry.status}`}>
                  <span className="log-line">Строка {entry.line}:</span>
                  <code>{entry.command}</code>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            
            {/* Информация о макросе */}
            {!contextMenu.item.isDir && (
              <>
                {contextMenu.item.description && (
                  <div className="macro-info">
                    <h4>Описание:</h4>
                    <p>{contextMenu.item.description}</p>
                  </div>
                )}
                
                {contextMenu.item.comment && (
                  <div className="macro-info">
                    <h4>Комментарий:</h4>
                    <p>{contextMenu.item.comment}</p>
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
                      setNewDirName(contextMenu.item.name);
                      setActionModal({
                        type: 'renameDir',
                        dir: {
                          path: contextMenu.fullPath,
                          name: contextMenu.item.name
                        }
                      });
                    }}
                  >
                    Переименовать папку
                  </button>
                  {currentPath !== '/macros' && (
                    <button 
                      className="context-action delete"
                      onClick={() => setActionModal({
                        type: 'deleteDir',
                        dir: {
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
                // Действия для макросов
                <>
                  <button 
                    className="context-action execute"
                    onClick={() => {
                      setSelectedMacro({
                        ...contextMenu.item,
                        path: contextMenu.fullPath
                      });
                      executeMacro();
                    }}
                  >
                    Выполнить макрос
                  </button>
                  <button 
                    className="context-action"
                    onClick={() => openMacroEditor({
                      ...contextMenu.item,
                      path: contextMenu.fullPath
                    })}
                  >
                    Редактировать макрос
                  </button>
                  <button 
                    className="context-action"
                    onClick={() => {
                      setNewMacroName(contextMenu.item.name);
                      setActionModal({
                        type: 'renameMacro',
                        macro: {
                          path: contextMenu.fullPath,
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
                      type: 'deleteMacro',
                      macro: {
                        path: contextMenu.fullPath,
                        name: contextMenu.item.name
                      }
                    })}
                  >
                    Удалить макрос
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальные окна */}
      {/* Создание макроса */}
      {actionModal?.type === 'createMacro' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Создание нового макроса</h3>
            <p>Создать макрос в: <strong>{currentPath}</strong></p>
            
            <div className="form-group">
              <label>Имя макроса:</label>
              <input
                type="text"
                value={newMacroName}
                onChange={e => setNewMacroName(e.target.value)}
                placeholder="my_macro или my_macro.gcode"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>Иконка:</label>
              <div className="icon-selector">
                {MACRO_ICONS.map(icon => (
                  <button
                    key={icon}
                    className={`icon-option ${newMacroIcon === icon ? 'selected' : ''}`}
                    onClick={() => setNewMacroIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Описание:</label>
              <textarea
                value={newMacroDescription}
                onChange={e => setNewMacroDescription(e.target.value)}
                placeholder="Краткое описание макроса"
                rows={3}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => {
                  setActionModal(null);
                  setNewMacroName('');
                  setNewMacroIcon('⚡');
                  setNewMacroDescription('');
                }}
              >
                Отмена
              </button>
              <button 
                className="modal-button confirm"
                onClick={handleCreateMacro}
                disabled={!newMacroName.trim()}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Создание директории */}
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

      {/* Удаление макроса */}
      {actionModal?.type === 'deleteMacro' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить макрос <strong>{actionModal.macro.name}</strong>?</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => setActionModal(null)}
              >
                Отмена
              </button>
              <button 
                className="modal-button delete"
                onClick={() => handleDeleteMacro(actionModal.macro.path)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Переименование макроса */}
      {actionModal?.type === 'renameMacro' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Переименование макроса</h3>
            <p>Переименование: <strong>{actionModal.macro.name}</strong></p>
            
            <div className="form-group">
              <label>Новое имя:</label>
              <input
                type="text"
                value={newMacroName}
                onChange={e => setNewMacroName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMacroName.trim()) {
                    handleRenameMacro(actionModal.macro.path, newMacroName);
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => {
                  setActionModal(null);
                  setNewMacroName('');
                }}
              >
                Отмена
              </button>
              <button 
                className="modal-button confirm"
                onClick={() => handleRenameMacro(actionModal.macro.path, newMacroName)}
                disabled={!newMacroName.trim()}
              >
                Переименовать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Удаление директории */}
      {actionModal?.type === 'deleteDir' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить папку <strong>{actionModal.dir.name}</strong>?</p>
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
                onClick={() => handleDeleteDirectory(actionModal.dir.path)}
              >
                Удалить папку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Переименование директории */}
      {actionModal?.type === 'renameDir' && (
        <div className="action-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <h3>Переименование папки</h3>
            <p>Переименование: <strong>{actionModal.dir.name}</strong></p>
            
            <div className="form-group">
              <label>Новое имя:</label>
              <input
                type="text"
                value={newDirName}
                onChange={e => setNewDirName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newDirName.trim()) {
                    handleRenameDirectory(actionModal.dir.path, newDirName);
                  }
                }}
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
                onClick={() => handleRenameDirectory(actionModal.dir.path, newDirName)}
                disabled={!newDirName.trim()}
              >
                Переименовать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Редактор макроса */}
      {actionModal?.type === 'editor' && (
        <div className="editor-overlay" onClick={() => setActionModal(null)}>
          <div 
            className="editor-modal macro-editor-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="editor-header">
              <div className="editor-title-section">
                <h3>Редактор макроса: {actionModal.macro.name}</h3>
                <div className="editor-path">Путь: {actionModal.macro.path}</div>
              </div>
              <div className="editor-actions">
                <button 
                  className="editor-button execute"
                  onClick={executeMacro}
                  disabled={isExecuting || syntaxErrors.length > 0}
                >
                  {isExecuting ? '⏳ Выполняется...' : '▶️ Выполнить'}
                </button>
                <button 
                  className="editor-button validate"
                  onClick={() => validateSyntax()}
                >
                  🔍 Проверить
                </button>
                <button 
                  className="editor-button save"
                  onClick={saveMacro}
                  disabled={isSaving}
                >
                  {isSaving ? 'Сохранение...' : '💾 Сохранить'}
                </button>
                <button 
                  className="editor-button cancel"
                  onClick={() => {
                    setActionModal(null);
                    setSelectedMacro(null);
                    setMacroContent('');
                    setSyntaxErrors([]);
                    setExecutionLog([]);
                  }}
                >
                  ✕ Закрыть
                </button>
              </div>
            </div>
            
            <div className="editor-body">
              <div className="editor-main">
                <div className="line-numbers">
                  {macroContent.split('\n').map((_, i) => (
                    <div key={i} className="line-number">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  className="editor-content"
                  value={macroContent}
                  onChange={e => {
                    setMacroContent(e.target.value);
                    validateSyntax(e.target.value);
                  }}
                  spellCheck={false}
                  placeholder="Введите код макроса..."
                />
              </div>
              
              {/* Панель ошибок синтаксиса */}
              {syntaxErrors.length > 0 && (
                <div className="syntax-errors">
                  <div className="errors-header">
                    <span>Предупреждения синтаксиса ({syntaxErrors.length})</span>
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
              
              {/* Панель выполнения */}
              {executionLog.length > 0 && (
                <div className="execution-results">
                  <div className="results-header">
                    <span>Результаты выполнения</span>
                    <button onClick={() => setExecutionLog([])}>✕</button>
                  </div>
                  <div className="results-list">
                    {executionLog.map((entry, i) => (
                      <div key={i} className={`result-item ${entry.status}`}>
                        <span className="result-status">
                          {entry.status === 'success' ? '✓' : '✗'}
                        </span>
                        <span className="result-line">Строка {entry.line}:</span>
                        <code>{entry.command}</code>
                        <span className="result-message">{entry.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Справочная панель */}
            <div className="editor-help">
              <h4>Справка по синтаксису</h4>
              <div className="help-section">
                <h5>Основные команды:</h5>
                <code>G0/G1</code> - Движение
                <code>G28</code> - Домой
                <code>G90/G91</code> - Абс./Отн. позиционирование
                <code>M104/M109</code> - Температура хотэнда
                <code>M140/M190</code> - Температура стола
              </div>
              <div className="help-section">
                <h5>Макросы Klipper:</h5>
                <code>[gcode_macro NAME]</code> - Определение макроса
                <code>gcode:</code> - Начало кода
                <code>{`{params.VAR|default(val)}`}</code> - Параметры
                <code>{`{% if condition %}`}</code> - Условия
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для отображения плиток макросов
function MacroGrid({ 
  items, 
  onSelect, 
  onNavigate, 
  getIcon, 
  selectedMacro,
  editingMetadata,
  setEditingMetadata,
  onUpdateMetadata,
  currentPath
}) {
  const [tempIcon, setTempIcon] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempComment, setTempComment] = useState('');

  const handleClick = (item, e) => {
    onSelect(item, e);
  };

  const handleDoubleClick = (item, e) => {
    e.stopPropagation();
    if (item.isDir) {
      onNavigate(item.name);
    }
  };

  const handleStartEditMetadata = (item, e) => {
    e.stopPropagation();
    setEditingMetadata(item.name);
    setTempIcon(item.icon || '⚡');
    setTempDescription(item.description || '');
    setTempComment(item.comment || '');
  };

  const handleSaveMetadata = (item, e) => {
    e.stopPropagation();
    onUpdateMetadata(item, {
      icon: tempIcon,
      description: tempDescription,
      comment: tempComment
    });
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingMetadata(null);
    setTempIcon('');
    setTempDescription('');
    setTempComment('');
  };

  return (
    <div className="file-grid macro-grid">
      {items.length === 0 ? (
        <div className="empty-directory">
          <span className="empty-icon">📂</span>
          <p>Папка пуста</p>
          <button 
            className="create-first-item"
            onClick={() => document.querySelector('.create-macro-button').click()}
          >
            Создать макрос
          </button>
        </div>
      ) : (
        items.map((item, index) => {
          const isSelected = selectedMacro?.name === item.name;
          const isEditing = editingMetadata === item.name;
          
          return (
            <div 
              key={index}
              className={`file-tile macro-tile ${item.isDir ? 'dir' : 'file'} ${isSelected ? 'selected' : ''}`}
              onClick={(e) => handleClick(item, e)}
              onDoubleClick={(e) => handleDoubleClick(item, e)}
              title={item.isDir ? 'Двойной клик для открытия' : item.description || item.name}
            >
              <div className="tile-icon macro-icon">
                {getIcon(item)}
                {item.isDir && <span className="dir-indicator">▶</span>}
              </div>
              <div className="tile-name">
                {item.name}
              </div>
              
              {/* Информация о директории */}
              {item.isDir && (
                <div className="tile-info">
                  <span className="dir-info">Папка</span>
                  <span className="dir-modified">{item.modified}</span>
                </div>
              )}
              
              {/* Информация о макросе */}
              {!item.isDir && (
                <>
                  <div className="tile-info">
                    {item.size} • {item.modified}
                  </div>
                  
                  {/* Метаданные макроса */}
                  <div className="macro-metadata" onClick={e => e.stopPropagation()}>
                    {isEditing ? (
                      <div className="metadata-edit-form">
                        <div className="edit-field">
                          <label>Иконка:</label>
                          <select
                            value={tempIcon}
                            onChange={e => setTempIcon(e.target.value)}
                          >
                            {MACRO_ICONS.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                        <div className="edit-field">
                          <label>Описание:</label>
                          <input
                            type="text"
                            value={tempDescription}
                            onChange={e => setTempDescription(e.target.value)}
                            placeholder="Краткое описание"
                          />
                        </div>
                        <div className="edit-field">
                          <label>Комментарий:</label>
                          <textarea
                            value={tempComment}
                            onChange={e => setTempComment(e.target.value)}
                            placeholder="Дополнительный комментарий"
                            rows={2}
                          />
                        </div>
                        <div className="metadata-edit-actions">
                          <button 
                            className="metadata-btn save"
                            onClick={(e) => handleSaveMetadata(item, e)}
                          >
                            ✓
                          </button>
                          <button 
                            className="metadata-btn cancel"
                            onClick={handleCancelEdit}
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.description && (
                          <div className="macro-description">
                            {item.description}
                          </div>
                        )}
                        {item.comment && (
                          <div className="macro-comment">
                            {item.comment}
                          </div>
                        )}
                        <button 
                          className="metadata-edit-btn"
                          onClick={(e) => handleStartEditMetadata(item, e)}
                          title="Редактировать метаданные"
                        >
                          ✏️
                        </button>
                      </>
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

// Добавляем CSS стили для нового функционала
const macroEditorStyles = `
/* Дополнительные стили для редактора макросов */
.macro-grid {
  padding: 1rem;
}

.macro-tile {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-height: 120px;
}

.macro-tile:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: var(--logo-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.macro-tile.selected {
  background-color: rgba(212, 17, 21, 0.2);
  border-color: var(--logo-color);
}

.macro-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

/* Метаданные макроса */
.macro-metadata {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.macro-description {
  font-size: 0.85rem;
  color: var(--text-light);
  opacity: 0.9;
  margin-bottom: 0.3rem;
}

.macro-comment {
  font-size: 0.75rem;
  opacity: 0.7;
  font-style: italic;
}

.metadata-edit-btn {
  position: absolute;
  top: 0.5rem;
  right: 0;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.metadata-edit-btn:hover {
  opacity: 1;
}

/* Форма редактирования метаданных */
.metadata-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.edit-field label {
  font-size: 0.75rem;
  opacity: 0.7;
}

.edit-field input,
.edit-field select,
.edit-field textarea {
  background-color: var(--block-color-set);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.3rem;
  padding: 0.3rem 0.5rem;
  color: var(--text-light);
  font-size: 0.85rem;
}

.metadata-edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.metadata-btn {
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-weight: 500;
}

.metadata-btn.save {
  background-color: #4CAF50;
  color: white;
}

.metadata-btn.cancel {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

/* Кнопки навигации */
.navigation-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.navigation-controls button {
  padding: 0.5rem 0.8rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.3rem;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
}

.navigation-controls button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
}

.navigation-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-macro-button {
  background-color: rgba(212, 17, 21, 0.2) !important;
  border: 1px solid var(--logo-color) !important;
}

/* Панель выполнения макроса */
.macro-execution-panel {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem;
}

.execution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.execution-header h4 {
  margin: 0;
}

.execution-controls {
  display: flex;
  gap: 0.5rem;
}

.execute-button,
.validate-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.execute-button {
  background-color: var(--logo-color);
  color: white;
}

.execute-button.executing {
  background-color: #FF9800;
}

.validate-button {
  background-color: #2196F3;
  color: white;
}

.execution-log {
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.3rem;
  padding: 0.5rem;
}

.log-entry {
  padding: 0.3rem 0.5rem;
  margin-bottom: 0.3rem;
  border-radius: 0.2rem;
  font-family: monospace;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-entry.success {
  background-color: rgba(76, 175, 80, 0.2);
  border-left: 3px solid #4CAF50;
}

.log-entry.error {
  background-color: rgba(244, 67, 54, 0.2);
  border-left: 3px solid #F44336;
}

.log-line {
  font-weight: 500;
  min-width: 80px;
}

.log-message {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Модальное окно редактора макроса */
.macro-editor-modal {
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.editor-title-section {
  flex: 1;
}

.editor-body {
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  display: flex;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.3rem;
  overflow: hidden;
}

.line-numbers {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem 0.5rem;
  text-align: right;
  user-select: none;
  overflow-y: hidden;
}

.line-number {
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.5;
}

.editor-content {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: var(--text-light);
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: none;
  outline: none;
}

/* Панель справки */
.editor-help {
  width: 250px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  padding: 1rem;
  overflow-y: auto;
}

.editor-help h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.help-section {
  margin-bottom: 1.5rem;
}

.help-section h5 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.help-section code {
  display: block;
  padding: 0.2rem 0.4rem;
  margin-bottom: 0.3rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.2rem;
  font-size: 0.8rem;
}

/* Панель результатов выполнения */
.execution-results {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 200px;
  background-color: rgba(0, 0, 0, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.results-header {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.3);
}

.results-list {
  padding: 0.5rem 1rem;
  overflow-y: auto;
  max-height: 150px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-family: monospace;
  font-size: 0.85rem;
}

.result-status {
  width: 20px;
  text-align: center;
}

.result-item.success .result-status {
  color: #4CAF50;
}

.result-item.error .result-status {
  color: #F44336;
}

/* Селектор иконок */
.icon-selector {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.icon-option {
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.2s;
}

.icon-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon-option.selected {
  background-color: rgba(212, 17, 21, 0.3);
  border-color: var(--logo-color);
}

/* Адаптивность */
@media (max-width: 1200px) {
  .macro-editor-modal {
    width: 95%;
  }
  
  .editor-help {
    width: 200px;
  }
  
  .icon-selector {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (max-width: 992px) {
  .editor-body {
    flex-direction: column;
  }
  
  .editor-help {
    width: 100%;
    max-height: 200px;
    order: -1;
  }
  
  .help-section {
    display: inline-block;
    margin-right: 2rem;
  }
  
  .macro-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .navigation-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .editor-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .editor-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .macro-tile {
    min-height: 100px;
  }
  
  .macro-icon {
    font-size: 2rem;
  }
  
  .icon-selector {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .execution-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .execution-controls {
    width: 100%;
  }
  
  .execution-controls button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .macro-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-controls button {
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }
  
  .editor-actions {
    grid-template-columns: 1fr;
  }
  
  .line-numbers {
    padding: 1rem 0.3rem;
  }
  
  .editor-content {
    padding: 1rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .icon-selector {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .help-section {
    display: block;
    margin-right: 0;
  }
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.action-modal-overlay,
.editor-overlay {
  animation: fadeIn 0.2s ease-out;
}

.action-modal,
.editor-modal {
  animation: slideIn 0.3s ease-out;
}

.execute-button.executing {
  animation: pulse 1s infinite;
}

/* Улучшения для темной темы */
.macro-editor {
  color: var(--text-light);
}

.macro-editor input,
.macro-editor textarea,
.macro-editor select {
  background-color: var(--block-color-set);
  color: var(--text-light);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.macro-editor input:focus,
.macro-editor textarea:focus,
.macro-editor select:focus {
  outline: none;
  border-color: var(--logo-color);
  box-shadow: 0 0 0 2px rgba(212, 17, 21, 0.2);
}

/* Скроллбары */
.macro-editor ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.macro-editor ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.macro-editor ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.macro-editor ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Дополнительные улучшения UX */
.macro-tile.dir {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.dir-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0.5;
  font-size: 0.8rem;
}

.macro-info {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  padding: 0.5rem;
  margin: 0.5rem 0;
}

.macro-info h4 {
  margin: 0 0 0.3rem 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.macro-info p {
  margin: 0;
  font-size: 0.85rem;
}

/* Индикатор загрузки */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  font-size: 1.2rem;
  opacity: 0.7;
}

.loading-indicator::before {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--logo-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Сообщение об ошибке */
.error-message {
  background-color: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 0.3rem;
  padding: 1rem;
  margin: 1rem;
  color: #FF5252;
}

/* Пустая директория */
.empty-directory {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  opacity: 0.5;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-directory p {
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
}

.create-first-item {
  padding: 0.5rem 1.5rem;
  background-color: rgba(212, 17, 21, 0.2);
  border: 1px solid var(--logo-color);
  border-radius: 0.3rem;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
}

.create-first-item:hover {
  background-color: rgba(212, 17, 21, 0.3);
  transform: translateY(-2px);
}

/* Финальные штрихи */
.warning-text {
  color: #FFA726;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--block-color-set);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.3rem;
  color: var(--text-light);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.modal-button {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.modal-button.cancel {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

.modal-button.confirm {
  background-color: var(--logo-color);
  color: white;
}

.modal-button.delete {
  background-color: #F44336;
  color: white;
}

.modal-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.modal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Обеспечиваем правильное отображение контекстного меню */
.context-action.execute {
  background-color: rgba(212, 17, 21, 0.2);
  border: 1px solid var(--logo-color);
}

.context-action.execute:hover {
  background-color: rgba(212, 17, 21, 0.3);
}

/* Финальная полировка */
.macro-editor * {
  box-sizing: border-box;
}

.macro-editor button {
  font-family: inherit;
}

.macro-editor code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
`;

// Экспортируем стили вместе с компонентом
export { macroEditorStyles };