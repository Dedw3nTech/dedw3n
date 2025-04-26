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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <Link href="/">
      <div className={`flex items-center space-x-2 cursor-pointer ${className}`}>
        <div className={`${sizeClass[size]} flex-shrink-0`}>
          <img 
            src="/images/dedwen-logo.svg" 
            alt="Dedwen Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        {withText && (
          <h1 className={`font-bold text-gray-800 ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
            {t('app.name')}
          </h1>
        )}
      </div>
    </Link>
  );
};

export default Logo;