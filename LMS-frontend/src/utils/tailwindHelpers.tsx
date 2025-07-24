import React, { ReactNode } from 'react';

// Button component
interface ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'inherit';
  size?: 'small' | 'medium' | 'large';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
  className?: string;
}

export const Button = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  startIcon,
  endIcon,
  fullWidth,
  disabled,
  onClick,
  type = 'button',
  children,
  className = '',
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors duration-200';
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };
  
  const variantClasses = {
    contained: {
      primary: 'bg-primary-main text-white hover:bg-primary-dark',
      secondary: 'bg-secondary-main text-white hover:bg-secondary-dark',
      error: 'bg-error-main text-white hover:bg-error-dark',
      warning: 'bg-warning-main text-warning-contrastText hover:bg-warning-dark',
      success: 'bg-success-main text-success-contrastText hover:bg-success-dark',
      inherit: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    },
    outlined: {
      primary: 'border border-primary-main text-primary-main hover:bg-primary-light/10',
      secondary: 'border border-secondary-main text-secondary-main hover:bg-secondary-light/10',
      error: 'border border-error-main text-error-main hover:bg-error-light/10',
      warning: 'border border-warning-main text-warning-main hover:bg-warning-light/10',
      success: 'border border-success-main text-success-main hover:bg-success-light/10',
      inherit: 'border border-gray-300 text-gray-800 hover:bg-gray-100',
    },
    text: {
      primary: 'text-primary-main hover:bg-primary-light/10',
      secondary: 'text-secondary-main hover:bg-secondary-light/10',
      error: 'text-error-main hover:bg-error-light/10',
      warning: 'text-warning-main hover:bg-warning-light/10',
      success: 'text-success-main hover:bg-success-light/10',
      inherit: 'text-gray-800 hover:bg-gray-100',
    },
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const fullWidthClasses = 'w-full';
  
  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant][color],
    disabled ? disabledClasses : '',
    fullWidth ? fullWidthClasses : '',
    className,
  ].join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

// Typography component
interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline';
  component?: React.ElementType;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'text.primary' | 'text.secondary' | 'inherit';
  align?: 'left' | 'center' | 'right' | 'justify';
  gutterBottom?: boolean;
  noWrap?: boolean;
  paragraph?: boolean;
  children: ReactNode;
  className?: string;
}

export const Typography = ({
  variant = 'body1',
  component,
  color = 'text.primary',
  align = 'left',
  gutterBottom = false,
  noWrap = false,
  paragraph = false,
  children,
  className = '',
}: TypographyProps) => {
  const variantClasses = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-bold',
    h5: 'text-lg font-bold',
    h6: 'text-base font-bold',
    subtitle1: 'text-lg',
    subtitle2: 'text-base font-medium',
    body1: 'text-base',
    body2: 'text-sm',
    caption: 'text-xs',
    overline: 'text-xs uppercase tracking-wider',
  };
  
  const colorClasses = {
    'primary': 'text-primary-main',
    'secondary': 'text-secondary-main',
    'error': 'text-error-main',
    'warning': 'text-warning-main',
    'success': 'text-success-main',
    'text.primary': 'text-text-primary',
    'text.secondary': 'text-text-secondary',
    'inherit': 'text-inherit',
  };
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };
  
  const classes = [
    variantClasses[variant],
    colorClasses[color],
    alignClasses[align],
    gutterBottom ? 'mb-4' : '',
    noWrap ? 'whitespace-nowrap overflow-hidden text-ellipsis' : '',
    paragraph ? 'mb-4' : '',
    className,
  ].join(' ');
  
  const Component = component || (paragraph ? 'p' : variant.match(/^h[1-6]$/) ? variant : 'span');
  
  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

// Paper component
interface PaperProps {
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  square?: boolean;
  children: ReactNode;
  className?: string;
}

export const Paper = ({
  elevation = 1,
  variant = 'elevation',
  square = false,
  children,
  className = '',
}: PaperProps) => {
  const baseClasses = 'bg-white';
  
  const elevationClasses = {
    0: '',
    1: 'shadow-sm',
    2: 'shadow',
    3: 'shadow-md',
    4: 'shadow-lg',
    5: 'shadow-xl',
  };
  
  const variantClasses = {
    elevation: elevationClasses[Math.min(elevation, 5)],
    outlined: 'border border-gray-300',
  };
  
  const roundedClasses = square ? '' : 'rounded-lg';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    roundedClasses,
    className,
  ].join(' ');
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// Container component
interface ContainerProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fixed?: boolean;
  children: ReactNode;
  className?: string;
}

export const Container = ({
  maxWidth = 'lg',
  fixed = false,
  children,
  className = '',
}: ContainerProps) => {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    false: '',
  };
  
  const classes = [
    'mx-auto px-4',
    maxWidth !== false ? maxWidthClasses[maxWidth] : '',
    fixed ? 'w-full' : '',
    className,
  ].join(' ');
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// TextField component
interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  error = false,
  disabled = false,
  required = false,
  fullWidth = false,
  multiline = false,
  rows = 1,
  type = 'text',
  className = '',
  id,
  name,
}: TextFieldProps) => {
  const inputClasses = [
    'block px-3 py-2 border rounded focus:outline-none focus:ring-2',
    error ? 'border-error-main focus:border-error-main focus:ring-error-light/50' : 'border-gray-300 focus:border-primary-main focus:ring-primary-light/50',
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');
  
  const labelId = id ? `${id}-label` : undefined;
  
  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id} 
          id={labelId}
          className={`block mb-1 text-sm font-medium ${error ? 'text-error-main' : 'text-gray-700'}`}
        >
          {label}
          {required && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={inputClasses}
          aria-labelledby={labelId}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-labelledby={labelId}
        />
      )}
      
      {helperText && (
        <p className={`mt-1 text-xs ${error ? 'text-error-main' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// Grid system
interface GridProps {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  children: ReactNode;
  className?: string;
}

export const Grid = ({
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing = 0,
  children,
  className = '',
}: GridProps) => {
  const containerClasses = container ? 'grid grid-cols-12 gap-4' : '';
  
  const spacingClasses = container ? {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
  }[spacing] : '';
  
  const getColSpan = (size: number | undefined) => {
    return size ? `col-span-${size}` : '';
  };
  
  const itemClasses = item ? [
    getColSpan(xs),
    sm ? `sm:${getColSpan(sm)}` : '',
    md ? `md:${getColSpan(md)}` : '',
    lg ? `lg:${getColSpan(lg)}` : '',
    xl ? `xl:${getColSpan(xl)}` : '',
  ].join(' ') : '';
  
  const classes = [
    container ? containerClasses : '',
    container ? spacingClasses : '',
    item ? itemClasses : '',
    className,
  ].join(' ');
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

// Box component (div with styling)
interface BoxProps {
  component?: React.ElementType;
  children: ReactNode;
  className?: string;
}

export const Box = ({
  component: Component = 'div',
  children,
  className = '',
}: BoxProps) => {
  return (
    <Component className={className}>
      {children}
    </Component>
  );
};

// Alert component
interface AlertProps {
  severity?: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
  className?: string;
}

export const Alert = ({
  severity = 'info',
  children,
  className = '',
}: AlertProps) => {
  const severityClasses = {
    error: 'bg-error-light text-error-dark border-error-main',
    warning: 'bg-warning-light text-warning-dark border-warning-main',
    info: 'bg-blue-100 text-blue-800 border-blue-500',
    success: 'bg-success-light text-success-dark border-success-main',
  };
  
  const classes = [
    'p-4 rounded-md border-l-4',
    severityClasses[severity],
    className,
  ].join(' ');
  
  return (
    <div className={classes} role="alert">
      {children}
    </div>
  );
};

// Divider component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider = ({
  orientation = 'horizontal',
  className = '',
}: DividerProps) => {
  const orientationClasses = {
    horizontal: 'w-full border-t border-gray-200 my-4',
    vertical: 'h-full border-l border-gray-200 mx-4',
  };
  
  const classes = [
    orientationClasses[orientation],
    className,
  ].join(' ');
  
  return <hr className={classes} />;
};

// IconButton component
interface IconButtonProps {
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'default';
  disabled?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
  className?: string;
}

export const IconButton = ({
  color = 'default',
  disabled = false,
  onClick,
  size = 'medium',
  children,
  className = '',
}: IconButtonProps) => {
  const colorClasses = {
    primary: 'text-primary-main hover:bg-primary-light/10',
    secondary: 'text-secondary-main hover:bg-secondary-light/10',
    error: 'text-error-main hover:bg-error-light/10',
    warning: 'text-warning-main hover:bg-warning-light/10',
    success: 'text-success-main hover:bg-success-light/10',
    default: 'text-gray-700 hover:bg-gray-100',
  };
  
  const sizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3',
  };
  
  const classes = [
    'inline-flex items-center justify-center rounded-full transition-colors duration-200',
    colorClasses[color],
    sizeClasses[size],
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className,
  ].join(' ');
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

// Chip component
interface ChipProps {
  label: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'default';
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  onDelete?: () => void;
  className?: string;
}

export const Chip = ({
  label,
  color = 'default',
  variant = 'filled',
  size = 'medium',
  onDelete,
  className = '',
}: ChipProps) => {
  const variantClasses = {
    filled: {
      primary: 'bg-primary-main text-white',
      secondary: 'bg-secondary-main text-white',
      error: 'bg-error-main text-white',
      warning: 'bg-warning-main text-warning-contrastText',
      success: 'bg-success-main text-success-contrastText',
      default: 'bg-gray-200 text-gray-700',
    },
    outlined: {
      primary: 'bg-transparent border border-primary-main text-primary-main',
      secondary: 'bg-transparent border border-secondary-main text-secondary-main',
      error: 'bg-transparent border border-error-main text-error-main',
      warning: 'bg-transparent border border-warning-main text-warning-main',
      success: 'bg-transparent border border-success-main text-success-main',
      default: 'bg-transparent border border-gray-300 text-gray-700',
    },
  };
  
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
  };
  
  const classes = [
    'inline-flex items-center rounded-full',
    variantClasses[variant][color],
    sizeClasses[size],
    className,
  ].join(' ');
  
  return (
    <div className={classes}>
      <span>{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Badge component
interface BadgeProps {
  badgeContent: ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'default';
  children: ReactNode;
  max?: number;
  showZero?: boolean;
  className?: string;
}

export const Badge = ({
  badgeContent,
  color = 'primary',
  children,
  max = 99,
  showZero = false,
  className = '',
}: BadgeProps) => {
  const colorClasses = {
    primary: 'bg-primary-main text-white',
    secondary: 'bg-secondary-main text-white',
    error: 'bg-error-main text-white',
    warning: 'bg-warning-main text-warning-contrastText',
    success: 'bg-success-main text-success-contrastText',
    default: 'bg-gray-500 text-white',
  };
  
  const content = typeof badgeContent === 'number' && badgeContent > max ? `${max}+` : badgeContent;
  
  const shouldDisplay = showZero || badgeContent !== 0;
  
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      {shouldDisplay && (
        <div className={`absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center rounded-full text-xs px-1.5 ${colorClasses[color]}`}>
          {content}
        </div>
      )}
    </div>
  );
};

// Card components
interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className = '' }: CardContentProps) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardActionsProps {
  children: ReactNode;
  className?: string;
}

export const CardActions = ({ children, className = '' }: CardActionsProps) => {
  return (
    <div className={`px-4 py-2 flex items-center ${className}`}>
      {children}
    </div>
  );
};

interface CardMediaProps {
  component?: 'img' | 'video' | 'audio';
  image: string;
  alt?: string;
  height?: number | string;
  className?: string;
}

export const CardMedia = ({
  component = 'img',
  image,
  alt = '',
  height,
  className = '',
}: CardMediaProps) => {
  const style = height ? { height: typeof height === 'number' ? `${height}px` : height } : {};
  
  if (component === 'img') {
    return (
      <img
        src={image}
        alt={alt}
        style={style}
        className={`w-full object-cover ${className}`}
      />
    );
  }
  
  if (component === 'video') {
    return (
      <video
        src={image}
        style={style}
        className={`w-full object-cover ${className}`}
        controls
      />
    );
  }
  
  if (component === 'audio') {
    return (
      <audio
        src={image}
        className={className}
        controls
      />
    );
  }
  
  return null;
};

// FormControl components
interface FormControlProps {
  fullWidth?: boolean;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormControl = ({
  fullWidth = false,
  required = false,
  error = false,
  disabled = false,
  children,
  className = '',
}: FormControlProps) => {
  const classes = [
    'mb-4',
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');
  
  return (
    <div className={classes} aria-required={required} aria-disabled={disabled} aria-invalid={error}>
      {children}
    </div>
  );
};

interface SelectProps {
  id?: string;
  name?: string;
  value: string | string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  multiple?: boolean;
  children: ReactNode;
  className?: string;
}

export const Select = ({
  id,
  name,
  value,
  onChange,
  label,
  placeholder,
  helperText,
  error = false,
  disabled = false,
  required = false,
  fullWidth = false,
  multiple = false,
  children,
  className = '',
}: SelectProps) => {
  const selectClasses = [
    'block px-3 py-2 border rounded focus:outline-none focus:ring-2',
    error ? 'border-error-main focus:border-error-main focus:ring-error-light/50' : 'border-gray-300 focus:border-primary-main focus:ring-primary-light/50',
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');
  
  const labelId = id ? `${id}-label` : undefined;
  
  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id} 
          id={labelId}
          className={`block mb-1 text-sm font-medium ${error ? 'text-error-main' : 'text-gray-700'}`}
        >
          {label}
          {required && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        multiple={multiple}
        className={selectClasses}
        aria-labelledby={labelId}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      
      {helperText && (
        <p className={`mt-1 text-xs ${error ? 'text-error-main' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export const MenuItem = ({ children, value, disabled = false }: { children: ReactNode, value: string, disabled?: boolean }) => {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );
}; 

// CircularProgress component
interface CircularProgressProps {
  size?: number | string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  className?: string;
}

export const CircularProgress = ({
  size = 24,
  color = 'primary',
  className = '',
}: CircularProgressProps) => {
  const sizeStyle = typeof size === 'number' ? `${size}px` : size;
  
  const colorClasses = {
    primary: 'text-primary-main',
    secondary: 'text-secondary-main',
    error: 'text-error-main',
    warning: 'text-warning-main',
    success: 'text-success-main',
  };
  
  const classes = [
    'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
    colorClasses[color],
    className,
  ].join(' ');
  
  return (
    <div
      className={classes}
      style={{
        width: sizeStyle,
        height: sizeStyle,
      }}
      role="progressbar"
    />
  );
}; 