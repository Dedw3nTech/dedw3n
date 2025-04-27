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
    sm: 'w-32 h-14',    // 128px × 56px
    md: 'w-60 h-24',    // 240px × 96px 
    lg: 'w-80 h-[132px]'  // 320px × 132px (exact dimensions requested)
  };

  return (
    <Link href="/">
      <div className={`flex items-center space-x-2 cursor-pointer ${className}`}>
        <div className="flex flex-col">
          <h1 className={`font-extrabold text-[#3B83BD] ${
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
          }`}>
            Dedw3n
          </h1>
        </div>
      </div>
    </Link>
  );
};

export default Logo;