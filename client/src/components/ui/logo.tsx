import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 'md', withText = true, className = '' }) => {
  const { t } = useTranslation();
  
  const sizeClass = {
    sm: 'w-16 h-7',  // 64px × 28px
    md: 'w-24 h-10', // 96px × 40px
    lg: 'w-32 h-14'  // 128px × 56px (exact dimensions from the image)
  };

  return (
    <Link href="/">
      <div className={`flex items-center space-x-2 cursor-pointer ${className}`}>
        <div className={`${sizeClass[size]} flex-shrink-0 overflow-hidden`}>
          <img 
            src="/images/dedwen-logo.svg" 
            alt="Dedwen Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        {withText && (
          <div className="flex flex-col">
            <h1 className={`font-extrabold text-[#3B83BD] ${
              size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
            }`}>
              Dedw3n
            </h1>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;