import './Select.css';

function Select({ size = 'md', className = '', children, ...props }) {
  const classes = ['ui-select', `ui-select--${size}`, className].filter(Boolean).join(' ');
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
}

export default Select;
