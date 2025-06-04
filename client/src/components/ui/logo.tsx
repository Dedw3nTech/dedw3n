import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import logoImage from '@assets/Dedw3n Logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 'md', withText = true, className = '' }) => {
  const { t } = useTranslation();
  
  const sizeClass = {
    sm: 'h-10',    // small
    md: 'h-14',    // medium
    lg: 'h-20'     // large
  };

  return (
    <Link href="/">
      <div className={`flex items-center cursor-pointer ${className}`}>
        <img 
          src={logoImage} 
          alt="Dedw3n" 
          className={`${sizeClass[size]} w-auto object-contain`}
        />
        {withText && (
          <div className="ml-2 flex items-center">
            <span className="font-bold text-black text-xl">
              Dedw3n
            </span>
            <button className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
              Button
            </button>
            <span className="ml-2 text-blue-500 text-sm font-medium">
              Beta Version
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;