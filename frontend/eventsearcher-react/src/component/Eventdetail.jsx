import React, { Component } from 'react'
import ArtistTab from './ArtistTab'

export class Eventdetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'info',
      eventDetails: null,
      loading: true
    };
    this.abortController = null;
  }

  async componentDidMount() {
    await this.fetchEventDetails();
  }

  componentWillUnmount() {
    // Abort any pending fetch when component unmounts
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async fetchEventDetails() {
    const { event } = this.props;
    if (!event || !event.id) return;

    // Abort any previous fetch
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new AbortController for this fetch
    this.abortController = new AbortController();

    try {
      const debugMode = true; // Set to false for production
      const debugURL = import.meta.env.VITE_BACKEND_URL;
      const prodURL = "https://eventsearcher-backend.onrender.com";
      const baseURL = debugMode ? debugURL : prodURL;
      
      const response = await fetch(`${baseURL}/event/${event.id}`, {
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched event details:", data);
      this.setState({ eventDetails: data, loading: false });
    } catch (error) {
      // Don't log error if fetch was aborted
      if (error.name !== 'AbortError') {
        console.error('Error fetching event details:', error);
        this.setState({ loading: false });
      }
    }
  }

  formatDate(localDate, localTime) {
    if (!localDate) return 'N/A';
    const date = new Date(localDate + 'T' + (localTime || '00:00:00'));
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = localTime 
      ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : '';
    return `${dateStr}${timeStr ? ', ' + timeStr : ''}`;
  }

  getTicketStatusBadge(status) {
    if (!status) return null;
    
    const statusCode = status.code?.toLowerCase() || '';
    let bgColor = 'bg-gray-500';
    let text = status.code || 'Unknown';

    if (statusCode.includes('onsale')) {
      bgColor = 'bg-green-500';
      text = 'On Sale';
    } else if (statusCode.includes('offsale')) {
      bgColor = 'bg-red-500';
      text = 'Off Sale';
    } else if (statusCode.includes('canceled') || statusCode.includes('cancelled')) {
      bgColor = 'bg-black';
      text = 'Canceled';
    } else if (statusCode.includes('postponed')) {
      bgColor = 'bg-orange-500';
      text = 'Postponed';
    } else if (statusCode.includes('rescheduled')) {
      bgColor = 'bg-orange-500';
      text = 'Rescheduled';
    }

    return (
      <span className={`${bgColor} text-white px-3 py-1 rounded text-sm font-medium`}>
        {text}
      </span>
    );
  }

  renderInfoTab() {
    const { eventDetails } = this.state;
    if (!eventDetails) return <div>Loading...</div>;

    const event = eventDetails;
    const artists = event._embedded?.attractions || [];
    const venue = event._embedded?.venues?.[0];
    const genres = [];
    
    // Build genres array
    if (event.classifications && event.classifications[0]) {
      const c = event.classifications[0];
      if (c.segment?.name) genres.push(c.segment.name);
      if (c.genre?.name) genres.push(c.genre.name);
      if (c.subGenre?.name) genres.push(c.subGenre.name);
      if (c.type?.name) genres.push(c.type.name);
      if (c.subType?.name) genres.push(c.subType.name);
    }

    const seatmap = event.seatmap?.staticUrl;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Event Information */}
        <div className="space-y-6">
          {/* Date */}
          {event.dates?.start && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Date</div>
              <div className="text-base text-gray-900">
                {this.formatDate(event.dates.start.localDate, event.dates.start.localTime)}
              </div>
            </div>
          )}

          {/* Artist */}
          {artists.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Artist</div>
              <div className="text-base text-gray-900">
                {artists.map(a => a.name).join(', ')}
              </div>
            </div>
          )}

          {/* Venue */}
          {venue && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Venue</div>
              <div className="text-base text-gray-900">{venue.name}</div>
            </div>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Genres</div>
              <div className="text-base text-gray-900">{genres.join(', ')}</div>
            </div>
          )}

          {/* Ticket Status */}
          {event.dates?.status && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Ticket Status</div>
              <div className="text-base">
                {this.getTicketStatusBadge(event.dates.status)}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div>
            <div className="text-sm text-gray-500 mb-2">Share</div>
            <div className="flex gap-3">
              {/* Facebook Icon */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(event.url || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="Share on Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              {/* Twitter/X Icon */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check ${event.name} on Ticketmaster. ${event.url || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700"
                title="Share on Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column - Seat Map */}
        {seatmap && (
          <div>
            <div className="text-sm text-gray-500 mb-2">Seatmap</div>
            <div className="border rounded-lg overflow-hidden">
              <img src={seatmap} alt="Seat Map" className="w-full h-auto" />
            </div>
          </div>
        )}
      </div>
    );
  }

  renderArtistsTab() {
    return (
      <ArtistTab 
        eventDetails={this.state.eventDetails} 
        loading={this.state.loading}
      />
    );
  }

  renderVenueTab() {
    const { eventDetails } = this.state;
    if (!eventDetails) return <div>Loading...</div>;

    const venue = eventDetails._embedded?.venues?.[0];
    
    if (!venue) {
      return <div className="text-gray-500 py-8 text-center">No venue information available</div>;
    }

    // Build full address string
    const addressParts = [];
    if (venue.address?.line1) addressParts.push(venue.address.line1);
    if (venue.city?.name) addressParts.push(venue.city.name);
    if (venue.state?.stateCode) addressParts.push(venue.state.stateCode);
    const fullAddress = addressParts.join(', ');

    // Build Google Maps URL with coordinates
    const googleMapsUrl = venue.location?.latitude && venue.location?.longitude
      ? `https://www.google.com/maps?q=${venue.location.latitude},${venue.location.longitude}`
      : null;

    // Get venue image
    const venueImage = venue.images?.[0]?.url;

    return (
      <div className="space-y-8">
        {/* Venue Header with Image and Basic Info */}
        {/* 
          RESPONSIVE TECHNIQUE #1: Flexbox Direction Change
          - Default (mobile): flex-col (vertical stack)
          - Medium screens+: md:flex-row (horizontal layout)
          - This stacks image above content on mobile, side-by-side on desktop
        */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          {/* Venue Image/Logo */}
          {venueImage && (
            /* 
              RESPONSIVE TECHNIQUE #2: Width Control
              - Mobile: w-full (full width, centered)
              - Medium+: md:w-64 (fixed 256px width)
              - shrink-0 prevents image from shrinking below its size
            */
            <div className="shrink-0 w-full md:w-64 flex justify-center md:justify-start">
              <img
                src={venueImage}
                alt={venue.name}
                /* 
                  RESPONSIVE TECHNIQUE #3: Adaptive Sizing
                  - Mobile: max-w-xs (max 320px, prevents huge images)
                  - Medium+: w-64 h-64 (fixed square)
                  - object-contain preserves aspect ratio
                */
                className="w-full max-w-xs md:w-64 md:h-64 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Venue Info */}
          <div className="flex-1 space-y-4 md:space-y-6">
            {/* Venue Name */}
            <div>
              {/* 
                RESPONSIVE TECHNIQUE #4: Typography Scaling
                - Mobile: text-2xl (24px)
                - Medium+: md:text-3xl (30px)
                - Adjusts heading size for readability on different screens
              */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{venue.name}</h2>
              {fullAddress && (
                /* 
                  RESPONSIVE TECHNIQUE #5: Text Size & Line Breaking
                  - Mobile: text-sm (smaller for narrow screens)
                  - Medium+: md:text-base (normal size)
                  - break-words ensures long addresses wrap properly
                */
                <p className="text-sm md:text-base text-gray-600 mt-2 wrap-break-word">
                  {googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 hover:underline inline-flex items-center gap-1 flex-wrap"
                    >
                      {fullAddress}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ) : (
                    fullAddress
                  )}
                </p>
              )}
            </div>

            {/* See Events Button */}
            {venue.url && (
              <div>
                {/* 
                  RESPONSIVE TECHNIQUE #6: Button Width
                  - Mobile: w-full (full width for easy tapping)
                  - Medium+: md:w-auto (auto width, fits content)
                  - justify-center centers button content on mobile
                */}
                <a
                  href={venue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  See Events
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Venue Details Sections */}
        <div className="space-y-6">
          {/* Parking Info */}
          {venue.parkingDetail && (
            <div>
              {/* 
                RESPONSIVE TECHNIQUE #7: Consistent Text Sizing
                - Headings stay readable across all screen sizes
                - Mobile: text-base is sufficient for section headers
                - Medium+: md:text-lg for more visual hierarchy
              */}
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Parking</h3>
              {/* 
                RESPONSIVE TECHNIQUE #8: Text Wrapping & Line Height
                - text-sm on mobile for better fit
                - md:text-base on larger screens
                - leading-relaxed provides comfortable reading
                - whitespace-pre-wrap preserves formatting but allows wrapping
              */}
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{venue.parkingDetail}</p>
            </div>
          )}

          {/* General Rule */}
          {venue.generalInfo?.generalRule && (
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">General Rule</h3>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{venue.generalInfo.generalRule}</p>
            </div>
          )}

          {/* Child Rule */}
          {venue.generalInfo?.childRule && (
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Child Rule</h3>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{venue.generalInfo.childRule}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { event, onClose, isFavorite, onFavoriteToggle } = this.props;
    const { activeTab, loading, eventDetails } = this.state;

    if (!event) return null;

    // Check if segment is Music to show Artist tab
    const segment = eventDetails?.classifications?.[0]?.segment?.name;
    const showArtistTab = segment && segment.toLowerCase() === 'music';

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Section - Back button, Event name, Buy Tickets, Favorite */}
        {/* 
          RESPONSIVE TECHNIQUE: Adaptive Padding
          - Mobile: px-4 py-4 (smaller padding on narrow screens)
          - Medium+: md:px-8 md:py-6 (more spacious on larger screens)
        */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
          {/* Back to Search */}
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>

          {/* Event Name and Actions */}
          {/* 
            RESPONSIVE TECHNIQUE: Stacked Layout on Mobile
            - Mobile: flex-col (vertical stack)
            - Medium+: md:flex-row md:justify-between (horizontal with space-between)
            - gap-4 provides consistent spacing in both layouts
          */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* 
              RESPONSIVE TECHNIQUE: Typography Hierarchy
              - Mobile: text-xl (smaller heading for narrow screens)
              - Medium+: md:text-3xl (larger, more impactful)
              - pr-4 on mobile prevents text from touching edge when buttons wrap
            */}
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 pr-4 md:pr-0">{event.name}</h1>
            
            {/* 
              RESPONSIVE TECHNIQUE: Button Group Layout
              - Mobile: flex with gap-2 (buttons side by side with small gap)
              - Medium+: md:gap-3 (more breathing room)
              - shrink-0 prevents buttons from shrinking when title is long
            */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Buy Tickets Button */}
              {(eventDetails?.url || event.url) && (
                /* 
                  RESPONSIVE TECHNIQUE: Button Sizing & Text
                  - Mobile: px-3 py-1.5 text-sm (compact for small screens)
                  - Medium+: md:px-4 md:py-2 md:text-base (standard size)
                  - Maintains minimum 44x44px touch target on mobile
                  - "Buy Tickets" text hidden on very small screens, shows icon only
                */
                <a
                  href={eventDetails?.url || event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-1.5 md:gap-2 text-sm md:text-base whitespace-nowrap"
                >
                  <span className="hidden xs:inline">Buy Tickets</span>
                  <span className="inline xs:hidden">Buy</span>
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              
              {/* Favorite Button */}
              {/* 
                RESPONSIVE TECHNIQUE: Consistent Touch Target
                - Mobile: p-2 with w-5 h-5 icon (44x44px touch target)
                - Medium+: p-2 with w-6 h-6 icon (slightly larger)
                - Square button maintains same proportions across screen sizes
              */}
              <button
                onClick={() => onFavoriteToggle(event)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Toggle Favorite"
              >
                <svg 
                  className="w-5 h-5 md:w-6 md:h-6" 
                  fill={isFavorite ? "red" : "none"} 
                  stroke={isFavorite ? "red" : "currentColor"} 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* 
          RESPONSIVE TECHNIQUE: Tab Spacing
          - Mobile: px-4 (matches header padding)
          - Medium+: md:px-8 (more spacious)
        */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex px-4 md:px-8">
            {/* 
              RESPONSIVE TECHNIQUE: Tab Button Sizing
              - Mobile: px-3 py-2.5 text-sm (compact tabs)
              - Medium+: md:px-6 md:py-3 md:text-base (standard tabs)
            */}
            <button
              onClick={() => this.setState({ activeTab: 'info' })}
              className={`px-3 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Info
            </button>
            {showArtistTab && (
              <button
                onClick={() => this.setState({ activeTab: 'artists' })}
                className={`px-3 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors ${
                  activeTab === 'artists'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Artist
              </button>
            )}
            <button
              onClick={() => this.setState({ activeTab: 'venue' })}
              className={`px-3 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors ${
                activeTab === 'venue'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Venue
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {/* 
          RESPONSIVE TECHNIQUE: Content Padding
          - Mobile: px-4 py-4 (minimal padding for narrow screens)
          - Medium+: md:px-8 md:py-6 (comfortable spacing)
        */}
        <div className="px-4 md:px-8 py-4 md:py-6">
          {loading ? (
            <div className="text-center py-8 text-sm md:text-base">Loading event details...</div>
          ) : (
            /* 
              RESPONSIVE TECHNIQUE: Card Padding
              - Mobile: p-4 (compact)
              - Medium+: md:p-6 (spacious)
            */
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
                {this.renderInfoTab()}
              </div>
              <div style={{ display: activeTab === 'artists' ? 'block' : 'none' }}>
                {this.renderArtistsTab()}
              </div>
              <div style={{ display: activeTab === 'venue' ? 'block' : 'none' }}>
                {this.renderVenueTab()}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Eventdetail
