'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CustomSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: number;
}

export const CustomSidebar = ({
  isOpen,
  onClose,
  children,
  title = "Sidebar",
  width = 320
}: CustomSidebarProps) => {
  return (
    <div
      className={cn(
        "bg-background border-l border-border shadow-lg transition-all duration-300 ease-in-out flex flex-col h-full",
        isOpen ? "opacity-100" : "opacity-0"
      )}
      style={{ 
        width: isOpen ? `${width}px` : '0px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b min-h-[60px] shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X size={16} />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};