import React, { useState } from 'react';
import { 
  Button, 
  Popover, 
  PopoverTrigger, 
  PopoverContent,
  Textarea 
} from '@nextui-org/react';

type PromptTemplateEditorProps = {
  systemPrompt: string;
  defaultSystemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
};

export function PromptTemplateEditor({ 
  systemPrompt, 
  defaultSystemPrompt,
  onSystemPromptChange 
}: PromptTemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(systemPrompt || defaultSystemPrompt);
  const [isDefault, setIsDefault] = useState(!systemPrompt);

  const handleSave = () => {
    if (isDefault) {
      onSystemPromptChange('');
    } else {
      onSystemPromptChange(localPrompt);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalPrompt(defaultSystemPrompt);
    setIsDefault(true);
    onSystemPromptChange('');
    setIsOpen(false);
  };

  const handleUseCustom = () => {
    setIsDefault(false);
  };

  return (
    <Popover 
      placement="bottom-end" 
      isOpen={isOpen} 
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-default-500 hover:text-primary"
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 7v6" />
            <path d="M9 10h6" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="px-1 py-2">
          <div className="text-small font-bold mb-2">System Prompt</div>
          <p className="text-tiny text-default-500 mb-2">
            Customize the system instructions for the AI. Leave empty to use the default prompt.
          </p>
          
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="radio" 
                id="default-prompt" 
                checked={isDefault}
                onChange={() => setIsDefault(true)}
                className="text-blue-600"
              />
              <label htmlFor="default-prompt" className="text-small">
                Use default prompt
              </label>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="radio" 
                id="custom-prompt" 
                checked={!isDefault}
                onChange={handleUseCustom}
                className="text-blue-600"
              />
              <label htmlFor="custom-prompt" className="text-small">
                Use custom prompt
              </label>
            </div>
          </div>
          
          {!isDefault && (
            <Textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              placeholder="Enter custom system prompt..."
              className="mb-3 w-full"
              rows={5}
            />
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="flat"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              color="danger" 
              onClick={handleReset}
            >
              Reset to Default
            </Button>
            <Button 
              size="sm" 
              color="primary" 
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
