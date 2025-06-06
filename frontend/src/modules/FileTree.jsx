export function FileTree({ data, onSelect, onNavigate }) {
  const renderTree = (items, level = 0) => (
    <ul 
      className="tree-view"
      style={{ marginLeft: `${level * 20}px` }}
    >
      {items.map((item) => (
        <li key={item.name}>
          <div
            className={`tree-item ${item.isDir ? 'directory' : 'file'}`}
            onClick={() => {
              if (item.isDir) {
                onNavigate(item.name);
              } else {
                onSelect(item.name);
              }
            }}
          >
            <span className="icon">
              {item.isDir ? '📁' : '📄'}
            </span>
            <span className="name">{item.name}</span>
            
            {item.isDir && (
              <span className="meta">
                {item.children?.length || 0} items
              </span>
            )}
            
            {!item.isDir && (
              <span className="meta">
                {item.size} • {item.modified}
              </span>
            )}
          </div>
          
          {item.isDir && item.children && (
            renderTree(item.children, level + 1)
          )}
        </li>
      ))}
    </ul>
  );

  return renderTree(data);
}