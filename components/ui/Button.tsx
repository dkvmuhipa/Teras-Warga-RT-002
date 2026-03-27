import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group';
  
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)]',
    secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50',
    danger: 'bg-rose-600 text-white shadow-[0_10px_20px_-5px_rgba(225,29,72,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(225,29,72,0.5)]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-[11px]',
    lg: 'px-8 py-4 text-xs'
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Premium Glow Effect for Primary/Danger */}
      {(variant === 'primary' || variant === 'danger') && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      )}
      
      {isLoading ? (
        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
      ) : null}
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
