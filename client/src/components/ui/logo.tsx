import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import logoImage from '@assets/Copy of Eternal snake  (3)_1757232015602.png';

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
          <div className="ml-2 flex items-center -mt-1">
            <span className="font-bold text-white text-xl">
              Dedw3n
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;