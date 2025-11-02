'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export const FloatingButton = ({ 
  onClick, 
  isOpen, 
  className 
}: FloatingButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-30",
        "w-14 h-14 bg-primary text-primary-foreground",
        "rounded-full shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-300 ease-in-out",
        "hover:scale-110 active:scale-95",
        "border-2 border-primary",
        isHovered && "bg-primary/90",
        className
      )}
    >
      <div className="relative">
        <Menu 
          size={24} 
          className={cn(
            "transition-all duration-300",
            isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          )} 
        />
        <X 
          size={24} 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          )} 
        />
      </div>
    </button>
  );
};