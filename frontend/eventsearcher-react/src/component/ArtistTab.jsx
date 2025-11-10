import React, { Component } from "react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export class ArtistTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spotifyData: null,
      loadingSpotify: false,
      spotifyError: null,
      fetchedArtist: null // Track which artist we've already fetched
    };
  }

  async componentDidMount() {
    // Call fetchArtistData when component mounts
    const { eventDetails } = this.props;
    const artistName = eventDetails?._embedded?.attractions?.[0]?.name;
    
    if (artistName && artistName !== this.state.fetchedArtist) {
      await this.fetchArtistData(artistName);
    }
  }

  async componentDidUpdate(prevProps) {
    // Call fetchArtistData if the artist changes
    const prevArtist = prevProps.eventDetails?._embedded?.attractions?.[0]?.name;
    const currentArtist = this.props.eventDetails?._embedded?.attractions?.[0]?.name;
    
    // Only fetch if artist changed AND we haven't already fetched this artist
    if (prevArtist !== currentArtist && currentArtist && currentArtist !== this.state.fetchedArtist) {
      await this.fetchArtistData(currentArtist);
    }
  }

  async fetchArtistData(name) {
    this.setState({ loadingSpotify: true, spotifyError: null });
    
    try {
      const sdk = SpotifyApi.withClientCredentials("ac5386a7a76f4f048912104064402279", "74936a9241d4402a89972f40b0a32dca");
      const items = await sdk.search(name, ["artist", "album"]);
      console.log("Spotify artist data:", items);
      
      this.setState({ 
        spotifyData: items,
        loadingSpotify: false,
        fetchedArtist: name // Store which artist we fetched
      });
    } catch (error) {
      console.error("Error fetching Spotify data:", error);
      this.setState({ 
        spotifyError: error.message,
        loadingSpotify: false,
        fetchedArtist: name // Even on error, mark as fetched to avoid retrying
      });
    }
  }

  formatFollowers(num) {
    if (!num) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  render() {
    const { eventDetails, loading } = this.props;
    const { spotifyData, loadingSpotify, spotifyError } = this.state;

    if (loading || !eventDetails) {
      return <div className="text-center py-8">Loading...</div>;
    }

    const artists = eventDetails._embedded?.attractions || [];

    if (artists.length === 0) {
      return (
        <div className="text-gray-500 py-8 text-center">
          No artist information available
        </div>
      );
    }

    // Get first artist from Spotify data
    const spotifyArtist = spotifyData?.artists?.items?.[0];

    return (
      <div className="space-y-6">
        {/* Artist Information Section */}
        {loadingSpotify ? (
          <div className="text-center py-8">Loading Spotify data...</div>
        ) : spotifyError ? (
          <div className="text-center py-8 text-red-500">
            Error loading Spotify data: {spotifyError}
          </div>
        ) : spotifyArtist ? (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-6">
              {/* Artist Image */}
              {spotifyArtist.images && spotifyArtist.images[0] && (
                <img
                  src={spotifyArtist.images[0].url}
                  alt={spotifyArtist.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              )}

              {/* Artist Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">{spotifyArtist.name}</h2>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Followers: </span>
                    <span>{this.formatFollowers(spotifyArtist.followers?.total)}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Popularity: </span>
                    <span>{spotifyArtist.popularity}%</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Genres: </span>
                    <span>{spotifyArtist.genres?.join(', ') || 'N/A'}</span>
                  </div>
                </div>

                {/* Open in Spotify Button */}
                {spotifyArtist.external_urls?.spotify && (
                  <a
                    href={spotifyArtist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                  >
                    Open in Spotify
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No Spotify data available for this artist
          </div>
        )}

        {/* Albums Section */}
        {spotifyData?.albums?.items && spotifyData.albums.items.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Albums</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {spotifyData.albums.items.map((album, index) => (
                <a
                  key={album.id || index}
                  href={album.external_urls?.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-transform hover:scale-105"
                >
                  <Card className="overflow-hidden h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Album Cover */}
                      {album.images && album.images[0] ? (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-square bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                      
                      {/* Album Info */}
                      <div className="p-3">
                        <h4 className="font-semibold text-sm mb-1 truncate" title={album.name}>
                          {album.name}
                        </h4>
                        <p className="text-xs text-gray-500">{album.release_date}</p>
                        <p className="text-xs text-gray-500">{album.total_tracks} tracks</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ArtistTab;
