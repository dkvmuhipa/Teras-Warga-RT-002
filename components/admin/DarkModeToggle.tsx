import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className }) => {
  const [dark, setDark] = React.useState<boolean>(
    document.documentElement.classList.contains('dark')
  );

  const toggle = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDark(!dark);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`p-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors backdrop-blur-md ${className || ''}`}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default DarkModeToggle;
