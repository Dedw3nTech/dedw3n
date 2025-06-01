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
          <span className="ml-2 font-bold text-black text-xl">
            Dedw3n
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;