import { FC } from 'react';
import logoImage from "@assets/transparent logo_1762919206444.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withText?: boolean;
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 'md', withText = true, className = '' }) => {
  const sizeClass = {
    sm: 'h-20',
    md: 'h-35',
    lg: 'h-40',
    xl: 'h-40',
    '2xl': 'h-80'
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/';
  };

  return (
    <button 
      className={`flex items-center cursor-pointer border-none bg-transparent p-0 ${className}`}
      onClick={handleLogoClick}
      data-testid="logo-button"
      type="button"
    >
      <img 
        src={logoImage} 
        alt="Dedw3n - Go to home page" 
        className={`${sizeClass[size]} w-auto object-contain`}
        data-testid="logo-image"
      />
      {withText && (
        <div className="ml-2 flex items-center -mt-1">
          <span className="font-bold text-white text-xl">
            Dedw3n
          </span>
        </div>
      )}
    </button>
  );
};

export default Logo;
