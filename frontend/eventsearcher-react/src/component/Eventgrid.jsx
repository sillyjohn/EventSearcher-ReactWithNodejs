import React, { Component } from 'react'
import Eventcard from './Eventcard'

export class Eventgrid extends Component {
  render() {
    const { events = [], onEventClick, favorites = [], onFavoriteToggle, hasSearched = false, isSearching = false, sortByDate = true } = this.props;
    
    // Show loading spinner while searching
    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          {/* Loading Spinner */}
          <svg
            className="animate-spin h-32 w-32 text-gray-400 mb-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          
          {/* Loading Text */}
          <h3 
              id="eventgrid-title" 
              className="text-lg font-medium text-gray-500 text-center"
          >
              Searching for events...
          </h3>
        </div>
      );
    }
    
    // If no events and no search has been performed, show the search prompt
    if (!events || events.length === 0) {
      if (!hasSearched) {
        // Initial state: prompt user to search
        return (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Large Search Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-32 w-32 text-gray-300 mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            
            {/* Title Text */}
            <h3 
                id="eventgrid-title" 
                className="text-lg font-medium text-gray-500 text-center"
            >
                Enter search criteria and click the Search button to find events. 
            </h3>
          </div>
        );
      } else {
        // Search performed but no results found
        return (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Alert/Warning Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-32 w-32 text-red-300 mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            
            {/* No Results Message */}
            <h3 
                id="eventgrid-title" 
                className="text-lg font-medium text-red-500 text-center mb-2"
            >
                No results found
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Try adjusting your search criteria, selecting a different category, or expanding your search location.
            </p>
          </div>
        );
      }
    }

    // Sort events by local date/time in ascending order (only if sortByDate is true)
    const displayEvents = sortByDate 
      ? [...events].sort((a, b) => {
          const dateA = new Date(a.dates?.start?.localDate + 'T' + (a.dates?.start?.localTime || '00:00:00'));
          const dateB = new Date(b.dates?.start?.localDate + 'T' + (b.dates?.start?.localTime || '00:00:00'));
          return dateA - dateB;
        })
      : events;

    // Display event cards in a grid
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Search Results ({events.length} events found)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayEvents.map((event) => (
            <Eventcard
              key={event.id}
              event={event}
              onEventClick={onEventClick}
              isFavorite={favorites.includes(event.id)}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Eventgrid