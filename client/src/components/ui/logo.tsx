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
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <Link href="/">
      <div className={`flex items-center space-x-2 cursor-pointer ${className}`}>
        <div className={`${sizeClass[size]} flex-shrink-0 rounded-full shadow-sm overflow-hidden`}>
          <img 
            src="/images/dedwen-logo.svg" 
            alt="Dedwen Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        {withText && (
          <div className="flex flex-col">
            <h1 className={`font-bold bg-gradient-to-r from-blue-700 to-teal-500 bg-clip-text text-transparent ${
              size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
            }`}>
              {t('app.name')}
            </h1>
            <p className="text-xs text-gray-500 -mt-1">
              {t('app.slogan')}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;