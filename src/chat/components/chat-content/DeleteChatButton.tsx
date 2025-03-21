import React from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { deleteChat } from 'wasp/client/operations';

type DeleteChatButtonProps = {
  chatId: string;
  onDelete?: () => void;
};

export function DeleteChatButton({ chatId, onDelete }: DeleteChatButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteChat({ chatId });
      
      // Verificamos si estamos actualmente viendo el chat que se está borrando
      const currentPath = location.pathname;
      const isCurrentChat = currentPath.includes(`/chat/${chatId}`);
      
      // Solo redireccionamos si el chat borrado es el que se está viendo actualmente
      if (isCurrentChat) {
        navigate('/chat');
      }
      
      // Llamamos al callback onDelete si existe
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Popover 
      placement="bottom" 
      isOpen={isOpen} 
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger>
        <Button 
          isIconOnly 
          size="sm" 
          variant="light" 
          className="text-default-400 hover:text-danger"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent onClick={(e) => e.stopPropagation()}>
        <div className="px-1 py-2">
          <div className="text-small font-bold mb-2">Are you sure?</div>
          <p className="text-tiny text-default-500 mb-2">
            This action cannot be undone and all messages in the chat will be deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="flat"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              color="danger" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              isLoading={isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
