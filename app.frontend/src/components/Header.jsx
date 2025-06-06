import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const navigate = useNavigate();

  // Funcție pentru a extrage username-ul din token
  const getUsernameFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || payload.name || payload.sub || 'User';
    } catch (error) {
      console.error('Eroare la decodarea token-ului:', error);
      return null;
    }
  };

  // Funcție pentru deconectare
  const handleLogout = () => {
    // Șterge token-ul din localStorage
    localStorage.removeItem('token');
    
    // Opțional: șterge și alte date de autentificare dacă există
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirecționează către pagina de login sau home
    navigate('/login'); // sau navigate('/') dacă ai o pagină home
  };

  const username = getUsernameFromToken();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand (opțional) + Navigare */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">GitGud</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/teams" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Teams
              </Link>
              <Link 
                to="/projects" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Projects
              </Link>
            </nav>
          </div>
          
          {/* Username și buton de deconectare */}
          <div className="flex items-center space-x-3">
            {username ? (
              <>
               
                
                {/* Buton de deconectare */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded-full transition-colors duration-200 text-sm font-medium"
                  title="Deconectare"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Deconectare</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-full">
                <UserCircleIcon className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-red-600">
                  Neautentificat
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu mobil */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link 
            to="/teams" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            Teams
          </Link>
          <Link 
            to="/projects" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            Projects
          </Link>
          
          {/* Buton deconectare în menu mobil */}
          {username && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Deconectare</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;