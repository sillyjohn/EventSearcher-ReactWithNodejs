import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Events Around</h2>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-4">
          {/* Search Button */}
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="font-medium">Search</span>
            </button>

            {/* Favorites Button */}
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="font-medium">Favorites</span>
            </button>
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
