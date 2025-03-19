import React from 'react';
import { logout, useAuth, googleSignInUrl as signInUrl } from 'wasp/client/auth';
import { Button } from '@nextui-org/react';
import { Link } from 'react-router-dom';

export function UserStatus() {
  const { data: user } = useAuth();

  if (!user) {
    return (
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        <Button 
          as="a"
          href={signInUrl}
          color="primary" 
          variant="flat"
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
          </svg>
          Login with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          <span className="text-sm font-medium">
            {(user.email?.[0] || 'U').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.email ? user.email.split('@')[0] : 'User'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email || ''}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
