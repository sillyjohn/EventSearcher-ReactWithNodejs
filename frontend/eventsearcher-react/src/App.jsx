import { Component } from 'react'
import Navbar from './component/Navbar'
import './App.css'
import Searchform from './component/Searchform'
import Eventgrid from './component/Eventgrid'
import Eventdetail from './component/Eventdetail'
import Favorites from './component/Favorites'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { CheckCircle2, Info } from 'lucide-react'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [], // Store search results from handleSubmit
      selectedEvent: null, // Event to show in detail modal
      favorites: [], // Array of favorite event IDs
      favoriteEvents: [], // Array of full event objects
      hasSearched: false, // Track if user has performed a search
      isSearching: false, // Track if search is in progress
      currentPage: 'search', // Track current page: 'search' or 'favorites'
    };
  }

  // Fetch favorites from MongoDB when component mounts
  componentDidMount() {
    this.fetchFavorites();
  }

  // Fetch favorites from backend
  fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:5000/favorites');
      const favorites = await response.json();
      
      // Extract IDs and store full event objects
      const favoriteIds = favorites.map(event => event.id);
      this.setState({
        favorites: favoriteIds,
        favoriteEvents: favorites
      });
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  }

  // Helper function to extract simplified event data
  extractEventData = (event) => {
    return {
      id: event.id,
      name: event.name,
      url: event.url || '',
      date: event.dates?.start?.localDate || '',
      time: event.dates?.start?.localTime || '',
      genre: event.classifications?.[0]?.segment?.name || '',
      venue: event._embedded?.venues?.[0]?.name || '',
      imageUrl: event.images?.[0]?.url || ''
    };
  }

  // Handle search start
  handleSearchStart = () => {
    this.setState({ isSearching: true });
  }

  // Handle search results from Searchform
  handleSearchResults = (results) => {
    // Parse the API response
    // Assuming results._embedded.events contains the array of events
    const events = results?._embedded?.events || [];
    this.setState({ 
      events,
      hasSearched: true,
      isSearching: false
    });
  }

  // Handle event card click to show details
  handleEventClick = (event) => {
    this.setState({ selectedEvent: event });
  }

  // Close event detail modal
  handleCloseDetail = () => {
    this.setState({ selectedEvent: null });
  }

  // Toggle favorite status
  handleFavoriteToggle = async (event) => {
    const { favorites, favoriteEvents } = this.state;
    const eventId = event.id;
    const eventName = event.name;
    
    if (favorites.includes(eventId)) {
      // Remove from favorites
      try {
        const response = await fetch(`http://localhost:5000/favorites/remove?id=${encodeURIComponent(eventId)}`);
        const result = await response.json();
        
        if (response.ok) {
          const newFavorites = favorites.filter(id => id !== eventId);
          const newFavoriteEvents = favoriteEvents.filter(e => e.id !== eventId);
          
          // Update state first
          this.setState({ 
            favorites: newFavorites,
            favoriteEvents: newFavoriteEvents
          });
          
          // Then show remove notification with undo button
          toast.custom((t) => (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[350px]">
              <div className="shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{eventName} removed from favorites!</div>
              </div>
              <button
                onClick={async () => {
                  // Re-add to favorites
                  const eventData = this.extractEventData(event);
                  const addResponse = await fetch(
                    `http://localhost:5000/favorites/add?${new URLSearchParams(eventData).toString()}`
                  );
                  if (addResponse.ok) {
                    this.fetchFavorites();
                  }
                  toast.dismiss(t);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                Undo
              </button>
            </div>
          ), {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
      }
    } else {
      // Add to favorites
      try {
        const eventData = this.extractEventData(event);
        const response = await fetch(
          `http://localhost:5000/favorites/add?${new URLSearchParams(eventData).toString()}`
        );
        const result = await response.json();
        
        if (response.ok) {
          // Fetch updated favorites from server
          await this.fetchFavorites();
          
          // Then show add notification
          toast.custom((t) => (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[350px]">
              <div className="shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{eventName} added to favorites!</div>
                <div className="text-sm text-gray-500 mt-0.5">You can view it in the Favorites page.</div>
              </div>
            </div>
          ), {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error adding favorite:", error);
      }
    }
  }

  // Navigate to search page
  handleSearchClick = () => {
    this.setState({ currentPage: 'search', selectedEvent: null });
  }

  // Navigate to favorites page
  handleFavoritesClick = () => {
    this.setState({ currentPage: 'favorites', selectedEvent: null });
  }

  render() {
    const { events, selectedEvent, favorites, favoriteEvents, hasSearched, isSearching, currentPage } = this.state;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          onSearchClick={this.handleSearchClick}
          onFavoritesClick={this.handleFavoritesClick}
          currentPage={currentPage}
        />
        <Toaster position="top-right" />

        {/* Add padding-top to account for fixed navbar */}
        <div className="pt-16">
          {/* Conditional rendering: Show detail page, favorites page, or search page */}
          {selectedEvent ? (
            <Eventdetail 
              event={selectedEvent}
              onClose={this.handleCloseDetail}
              isFavorite={favorites.includes(selectedEvent.id)}
              onFavoriteToggle={this.handleFavoriteToggle}
            />
          ) : currentPage === 'favorites' ? (
            <Favorites
              favorites={favoriteEvents}
              onEventClick={this.handleEventClick}
              onFavoriteToggle={this.handleFavoriteToggle}
            />
          ) : (
            <>
              <Searchform 
                onSearchResults={this.handleSearchResults}
                onSearchStart={this.handleSearchStart}
              />
              <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <Eventgrid 
                  events={events}
                  onEventClick={this.handleEventClick}
                  favorites={favorites}
                  onFavoriteToggle={this.handleFavoriteToggle}
                  hasSearched={hasSearched}
                  isSearching={isSearching}
                />
              </main>
            </>
          )}
        </div>
      </div>
    )
  }
}

export default App
