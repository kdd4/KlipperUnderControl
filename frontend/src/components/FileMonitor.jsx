import { useState } from 'preact/hooks';

export function FileMonitor() {
  const [items] = useState([
    {
      id: 1,
      name: 'Модели',
      type: 'folder',
      itemCount: 2,
      lastModified: '2 дня назад',
      items: [
        { id: 11, name: 'benchy.gcode', type: 'file', size: '2.4 MB', printTime: '1ч 30м', thumbnail: null },
        { id: 12, name: 'cube_test.gcode', type: 'file', size: '1.1 MB', printTime: '45м', thumbnail: '/api/placeholder/80/80' },
      ]
    },
    {
      id: 2,
      name: 'Калибровка',
      type: 'folder',
      itemCount: 2,
      lastModified: 'Вчера',
      items: [
        { id: 21, name: 'temp_tower.gcode', type: 'file', size: '3.2 MB', printTime: '2ч 15м', thumbnail: '/api/placeholder/80/80' },
        { id: 22, name: 'flow_test.gcode', type: 'file', size: '0.8 MB', printTime: '30м', thumbnail: null },
      ]
    },
    { id: 3, name: 'vase_mode.gcode', type: 'file', size: '5.6 MB', printTime: '3ч 45м', thumbnail: '/api/placeholder/80/80' },
    { id: 4, name: 'phone_stand.gcode', type: 'file', size: '4.2 MB', printTime: '2ч 30м', thumbnail: null },
  ]);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleItemClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.type === 'folder') {
      setCurrentFolder(item);
      setSelectedItem(null);
      setShowContextMenu(false);
    } else {
      setSelectedItem(item);
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setShowContextMenu(true);
    }
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
    setSelectedItem(null);
    setShowContextMenu(false);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
    setSelectedItem(null);
  };

  const displayItems = currentFolder ? currentFolder.items : items;

  return (
    <div className="module file-monitor">
      <div className="module-header">
        <div className="header-navigation">
          {currentFolder && (
            <button className="back-button" onClick={handleBackClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
          )}
          <h3 className="module-title">
            {currentFolder ? currentFolder.name : 'Файлы'}
          </h3>
        </div>
        <div className="file-actions">
          <button className="action-button" title="Обновить">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button className="action-button" title="Загрузить файл">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="widget-grid">
        {displayItems.map(item => (
          <div 
            key={item.id} 
            className={`widget-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
            onClick={(e) => handleItemClick(e, item)}
          >
            <div className="widget-icon">
              {item.type === 'folder' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
              ) : item.thumbnail ? (
                <img src={item.thumbnail} alt={item.name} />
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              )}
            </div>
            <div className="widget-name">{item.name}</div>
            <div className="widget-info">
              {item.type === 'folder' ? (
                <span>{item.itemCount} файлов</span>
              ) : (
                <span>{item.size}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showContextMenu && selectedItem && (
        <>
          <div className="context-overlay" onClick={closeContextMenu} />
          <div 
            className="context-menu"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`
            }}
          >
            <div className="context-header">
              <div className="context-icon">
                {selectedItem.thumbnail ? (
                  <img src={selectedItem.thumbnail} alt={selectedItem.name} />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                )}
              </div>
              <div className="context-info">
                <div className="context-name">{selectedItem.name}</div>
                <div className="context-details">
                  <span>{selectedItem.size}</span>
                  <span>•</span>
                  <span>{selectedItem.printTime}</span>
                </div>
              </div>
            </div>
            <div className="context-actions">
              <button className="context-action print">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Печать
              </button>
              <button className="context-action">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Переименовать
              </button>
              <button className="context-action delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Удалить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}