import React from 'react';
import { Button, Tooltip } from "@nextui-org/react";

interface DocumentCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
}

export function DocumentCollapseButton({ 
  isCollapsed, 
  onToggle,
  position = 'right'
}: DocumentCollapseButtonProps) {
  // Icon and tooltip content based on collapsed state
  const icon = isCollapsed ? (
    position === 'left' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 4l-5 8 5 8"></path>
        <path d="M21 12H4"></path>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path 
          fillRule="evenodd" 
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
          clipRule="evenodd" 
        />
      </svg>
    )
  ) : (
    position === 'left' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4l5 8-5 8"></path>
        <path d="M4 12h16"></path>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path 
          fillRule="evenodd" 
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" 
          clipRule="evenodd" 
        />
      </svg>
    )
  );

  const tooltipContent = isCollapsed 
    ? `Expand ${position === 'left' ? 'Chats' : 'Documents'} Panel` 
    : `Collapse ${position === 'left' ? 'Chats' : 'Documents'} Panel`;

  const tooltipPlacement = position === 'left' ? 'right' : 'left';

  return (
    <Tooltip content={tooltipContent} placement={tooltipPlacement}>
      <Button 
        isIconOnly 
        variant="light" 
        size="sm"
        onClick={onToggle}
        className="ml-auto"
      >
        {icon}
      </Button>
    </Tooltip>
  );
}
