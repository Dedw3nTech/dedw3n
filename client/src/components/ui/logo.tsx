import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import logoImage from '@assets/IMG_5583_1757246004523.jpeg';
// import transparentLogo from '@assets/transparent-logo.png';
// import blackLogo from '@assets/dedw3n-logo-black.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
  variant?: 'transparent' | 'black' | 'default';
}

const Logo: FC<LogoProps> = ({ size = 'md', withText = true, className = '', variant = 'default' }) => {
  const { t } = useTranslation();
  
  const sizeClass = {
    sm: 'h-10',    // small
    md: 'h-14',    // medium
    lg: 'h-20',    // large
    xl: 'h-21'     // extra large (1.5x medium)
  };

  // Select the appropriate logo based on variant
  const getLogoSource = () => {
    switch (variant) {
      case 'transparent':
        // TODO: Use actual transparent logo once import issues are resolved
        return logoImage; // Using existing logo for now
      case 'black':
        // TODO: Use actual black logo once import issues are resolved  
        return logoImage; // Using existing logo for now
      case 'default':
      default:
        return logoImage; // Keep using the current logo for all existing places
    }
  };

  return (
    <Link href="/">
      <div className={`flex items-center cursor-pointer ${className}`}>
        <img 
          src={getLogoSource()} 
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