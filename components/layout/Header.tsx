
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOutIcon, UserIcon } from '../icons/Icons';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 shadow-md p-4 flex justify-between items-center z-10">
      <h1 className="text-xl font-bold text-white">Rilan Estoque</h1>
      {user && (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-right">
              <UserIcon className="h-8 w-8 text-slate-400 p-1 bg-slate-700 rounded-full" />
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition duration-200"
            aria-label="Logout"
          >
            <LogOutIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
