import React from 'react';
import { Heart } from 'lucide-react';
import Eventgrid from './Eventgrid';

const Favorites = ({ favorites, onEventClick, onFavoriteToggle }) => {
  if (favorites.length === 0) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Heart className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No favorite events yet</h2>
          <p className="text-gray-500">Start adding events to your favorites to see them here!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h2>
      <Eventgrid
        events={favorites}
        onEventClick={onEventClick}
        favorites={favorites.map(event => event.id)}
        onFavoriteToggle={onFavoriteToggle}
        hasSearched={true}
        isSearching={false}
        sortByDate={false}
      />
    </main>
  );
};

export default Favorites;
