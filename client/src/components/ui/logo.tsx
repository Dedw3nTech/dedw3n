import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
// Use server-served static asset path for production compatibility
const logoImage = '/dedw3n-main-logo.png';

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

            <span className="ml-2 text-sm font-medium text-[#cf0000]">Under Maintenance</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;