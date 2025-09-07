import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
// Logo paths for different variants
const logoImages = {
  transparent: "/dedw3n-logo-transparent.png",
  black: "/dedw3n-logo-black.png",
  navigation: "/dedw3n-navigation-logo.png",
  default: "/dedw3n-main-logo.png"
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
  variant?: 'transparent' | 'black' | 'navigation' | 'default';
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
        return logoImages.transparent;
      case 'black':
        return logoImages.black;
      case 'navigation':
        return logoImages.navigation;
      case 'default':
      default:
        return logoImages.default;
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