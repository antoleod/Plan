import './Input.css';

function Input({ size = 'md', className = '', ...props }) {
  const classes = ['ui-input', `ui-input--${size}`, className].filter(Boolean).join(' ');
  return <input className={classes} {...props} />;
}

export default Input;
