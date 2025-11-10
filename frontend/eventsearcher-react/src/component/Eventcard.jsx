import React, { Component } from 'react'

export class Eventcard extends Component {
  // Helper function to format date
  formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }

  // Helper function to format time
  formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }

  handleCardClick = () => {
    const { event, onEventClick } = this.props;
    if (onEventClick && event) {
      onEventClick(event);
    }
  }

  handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking favorite
    const { event, onFavoriteToggle } = this.props;
    if (onFavoriteToggle && event) {
      onFavoriteToggle(event);
    }
  }

  render() {
    const { event, isFavorite = false } = this.props;

    // Parse event data from API response
    const eventName = event?.name || "Event Name";
    const eventDate = event?.dates?.start?.localDate 
      ? this.formatDate(event.dates.start.localDate) 
      : "Date TBD";
    const eventTime = event?.dates?.start?.localTime 
      ? this.formatTime(event.dates.start.localTime) 
      : "";
    const genre = event?.classifications?.[0]?.segment?.name || "Event";
    const venueName = event?._embedded?.venues?.[0]?.name || "Venue TBD";
    const imageUrl = event?.images?.[0]?.url || "https://via.placeholder.com/540x300/8B0000/FFFFFF?text=EVENT+IMAGE";

    return (
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 max-w-md cursor-pointer"
        onClick={this.handleCardClick}
      >
        {/* Event Image Container */}
        <div className="relative">
          {/* Image */}
          <img 
            src={imageUrl} 
            alt={eventName}
            className="w-full h-48 object-cover"
          />
          
          {/* Genre Label - Top Left */}
          <div className="absolute top-3 left-3">
            <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
              {genre}
            </span>
          </div>
          
          {/* Date & Time - Top Right */}
          <div className="absolute top-3 right-3">
            <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
              {eventDate}{eventTime && `, ${eventTime}`}
            </span>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Event Name */}
              <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                {eventName}
              </h3>
              
              {/* Venue/Location */}
              <p className="text-sm text-gray-500">
                {venueName}
              </p>
            </div>

            {/* Favorite Button */}
            <button 
              className="ml-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={this.handleFavoriteClick}
              aria-label="Add to favorites"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`}
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
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Eventcard