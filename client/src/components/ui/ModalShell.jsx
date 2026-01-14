import './ModalShell.css';
import Button from './Button';

function ModalShell({ title, children, footer, onClose, size = 'md', className = '' }) {
  const classes = ['ui-modal', `ui-modal--${size}`, className].filter(Boolean).join(' ');

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className={classes} onClick={(event) => event.stopPropagation()}>
        <header className="ui-modal-header">
          <h3>{title}</h3>
          <button type="button" className="ui-modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="ui-modal-body">{children}</div>

        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default ModalShell;
