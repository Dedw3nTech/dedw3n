import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Users, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function DatingNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dating', label: t('nav.dating.discover'), icon: Heart },
    { href: '/dating/matches', label: t('nav.dating.matches'), icon: Users },
    { href: '/dating/messages', label: t('nav.dating.messages'), icon: MessageCircle },
    { href: '/dating/premium', label: t('nav.dating.premium'), icon: Star },
  ];

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}