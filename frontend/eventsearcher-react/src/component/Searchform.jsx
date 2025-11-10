import React, { Component } from "react";
import { Input } from "../../components/ui/input.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Switch } from "../../components/ui/switch.jsx";

const deBugMode = true;
const debugURL = import.meta.env.VITE_BACKEND_URL;
const prodURL = "https://eventsearcher-backend.onrender.com";
const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const ipinfo_url_with_token = "https://ipinfo.io/?token=d8eeb3713deeb3";

async function getLocationByIP() {
    const response = await fetch(ipinfo_url_with_token);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    const json = await response.json();
    console.log("IP Info:", json);
    let lat = json.loc.split(",")[0];
    let lng = json.loc.split(",")[1];
    return `${lat},${lng}`;
}

async function googleGeocode(location) {
    location = new URLSearchParams({ address: location, key: GoogleKey });
    const googleGeocodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    const response = await fetch(googleGeocodeUrl + location.toString());
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    const json = await response.json();
    console.log("Google Geocode Response:", json);
    if (json.status === "OK" && json.results.length > 0) {
        const latLng = json.results[0].geometry.location;
        return `${latLng.lat},${latLng.lng}`;
    } else {
        throw new Error("Geocoding failed");
    }
}

export class Searchform extends Component {
    constructor(props) {
        super(props);
        this.state = {
            keyword: '',
            category: 'all',
            location: '',
            distance: '10',
            autoDetect: false,
            suggestions: [],
            lastSuggestions: [], // Store the last fetched suggestions
            showSuggestions: false,
            isSearching: false, // Track if search is in progress
            errors: {
                keyword: '',
                location: '',
                distance: ''
            }
        };
        this.suggestionsTimeoutId = null;
    }

    componentDidMount() {
        // Set up the callback so handleSubmit can access it
        window.onSearchResults = this.props.onSearchResults;
        // Add click listener for closing suggestions
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        // Clean up the callback when component unmounts
        delete window.onSearchResults;
        // Remove click listener
        document.removeEventListener('mousedown', this.handleClickOutside);
        // Clear timeout
        if (this.suggestionsTimeoutId) {
            clearTimeout(this.suggestionsTimeoutId);
        }
    }

    validateForm = () => {
        const errors = {
            keyword: '',
            location: '',
            distance: ''
        };
        let isValid = true;

        // Validate keyword
        if (!this.state.keyword.trim()) {
            errors.keyword = 'Keyword is required.';
            isValid = false;
        }

        // Validate location
        if (!this.state.autoDetect && !this.state.location.trim()) {
            errors.location = 'Location is required if Auto-detect is not checked.';
            isValid = false;
        }

        // Validate distance
        const dist = parseInt(this.state.distance, 10);
        if (!this.state.distance || isNaN(dist) || dist < 1 || dist > 100) {
            errors.distance = 'Distance must be between 1 and 100 miles.';
            isValid = false;
        }

        this.setState({ errors });
        return isValid;
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        // Set loading state to true
        this.setState({ isSearching: true });
        
        // Notify parent that search is starting
        if (this.props.onSearchStart) {
            this.props.onSearchStart();
        }

        try {
            const { keyword, category, distance, location, autoDetect } = this.state;
            let latLng = "";

            // Get location
            if (autoDetect) {
                latLng = await getLocationByIP();
                console.log("Auto-detected location:", latLng);
            } else {
                latLng = await googleGeocode(location);
                console.log("Geocoded coordinates:", latLng);
            }

            // Build query parameters for GET request
            const queryParams = new URLSearchParams({
                keyword: keyword,
                category: category,
                distance: distance || "10",
                location: latLng
            });

            // Choose URL based on debug mode
            const baseURL = deBugMode ? debugURL : prodURL;
            const searchURL = `${baseURL}/search?${queryParams.toString()}`;

            console.log("Fetching from:", searchURL);

            // Make AJAX GET request to backend
            const response = await fetch(searchURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Search results:", data);

            // Call the onSearchResults callback to pass data to parent (App.jsx)
            if (window.onSearchResults) {
                window.onSearchResults(data);
            }

        } catch (error) {
            console.error("Error during form submission:", error);
        } finally {
            // Set loading state to false
            this.setState({ isSearching: false });
        }
    }

    handleAutoDetectChange = (checked) => {
        this.setState({ 
            autoDetect: checked,
            location: checked ? '' : this.state.location,

            errors: { ...this.state.errors, location: '' }
        });
    }

    handleKeywordChange = async (e) => {
        const value = e.target.value;
        this.setState({ 
            keyword: value, 
            errors: { ...this.state.errors, keyword: '' }
        });

        // Clear previous timeout
        if (this.suggestionsTimeoutId) {
            clearTimeout(this.suggestionsTimeoutId);
        }

        // If input is empty, hide suggestions
        if (!value.trim()) {
            this.setState({ suggestions: [], showSuggestions: false });
            return;
        }

        // Debounce the API call
        this.suggestionsTimeoutId = setTimeout(async () => {
            try {
                const suggestions = await this.keywordSuggestion(value);
                this.setState({ 
                    suggestions: suggestions || [],
                    lastSuggestions: suggestions || [], // Store last suggestions
                    showSuggestions: true 
                });
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                this.setState({ suggestions: [], showSuggestions: false });
            }
        }, 300); // Wait 300ms after user stops typing
    }

    handleSuggestionClick = (suggestion) => {
        this.setState({ 
            keyword: suggestion, 
            showSuggestions: false
        });
    }

    handleToggleSuggestions = () => {
        // Toggle the suggestions dropdown, show last suggestions if available
        this.setState(prevState => ({
            showSuggestions: !prevState.showSuggestions,
            suggestions: prevState.lastSuggestions
        }));
    }

    handleClearKeyword = () => {
        this.setState({ 
            keyword: '', 
            suggestions: [],
            showSuggestions: false,
            errors: { ...this.state.errors, keyword: '' }
        });
    }

    handleClickOutside = (e) => {
        // Close suggestions when clicking outside
        if (!e.target.closest('.keyword-autocomplete-container')) {
            this.setState({ showSuggestions: false });
        }
    }

    //Keyword suggestion
    keywordSuggestion = async (input) => {
        const queryParams = new URLSearchParams({ keyword: input });
        // Choose URL based on debug mode
        const baseURL = deBugMode ? debugURL : prodURL;
        const searchURL = `${baseURL}/suggest?${queryParams.toString()}`;

        try {
            const response = await fetch(searchURL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Keyword suggestions:", data);
            
            // Extract event names from the response
            if (data._embedded && data._embedded.attractions) {
                return data._embedded.attractions.map(event => event.name);
            }
            
            return [];
        } catch (error) {
            console.error("Error fetching keyword suggestions:", error);
            return [];
        }
    }

    render() {
        const { keyword, category, location, distance, autoDetect, errors, suggestions, showSuggestions, lastSuggestions, isSearching } = this.state;

        return (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
                <form onSubmit={this.handleSubmit} className="max-w-7xl mx-auto" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* Keyword Field */}
                        <div className="flex flex-col">
                            <Label htmlFor="keyword" className={`text-sm font-medium mb-2 ${errors.keyword ? "text-red-600" : "text-gray-700"}`}>
                                Keyword <span className="text-red-600">*</span>
                            </Label>
                            <div className="relative keyword-autocomplete-container">
                                <Input
                                    id="keyword"
                                    name="keyword"
                                    type="text"
                                    placeholder="Search for events..."
                                    value={keyword}
                                    onChange={this.handleKeywordChange}
                                    className={`pr-16 ${errors.keyword ? "border-red-500" : ""}`}
                                    autoComplete="off"
                                />
                                
                                {/* Clear Button */}
                                {keyword && (
                                    <button
                                        type="button"
                                        onClick={this.handleClearKeyword}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Clear"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                )}
                                
                                {/* Dropdown Arrow Button */}
                                <button
                                    type="button"
                                    onClick={this.handleToggleSuggestions}
                                    disabled={lastSuggestions.length === 0}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
                                        lastSuggestions.length === 0 
                                            ? 'text-gray-300 cursor-not-allowed' 
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                    aria-label="Toggle suggestions"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-4 w-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                                
                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto z-50">
                                        {suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                                                onClick={() => this.handleSuggestionClick(suggestion)}
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="h-5 mt-1">
                                {errors.keyword && (
                                    <p className="text-xs text-red-600">{errors.keyword}</p>
                                )}
                            </div>
                        </div>

                        {/* Category Field */}
                        <div className="flex flex-col">
                            <Label htmlFor="category" className="text-sm font-medium mb-2 text-gray-700">
                                Category <span className="text-red-600">*</span>
                            </Label>
                            <Select
                                value={category}
                                onValueChange={(value) => this.setState({ category: value })}
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="music">Music</SelectItem>
                                    <SelectItem value="sport">Sports</SelectItem>
                                    <SelectItem value="arts">Arts & Theatre</SelectItem>
                                    <SelectItem value="film">Film</SelectItem>
                                    <SelectItem value="miscell">Miscellaneous</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="h-5 mt-1"></div>
                        </div>

                        {/* Location Field */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="location" className={`text-sm font-medium ${errors.location ? "text-red-600" : "text-gray-700"}`}>
                                    Location <span className="text-red-600">*</span>
                                </Label>
                                <div className="flex items-center gap-1">
                                    <Switch
                                        id="auto-detect"
                                        checked={autoDetect}
                                        onCheckedChange={this.handleAutoDetectChange}
                                    />
                                    <Label htmlFor="auto-detect" className="text-xs font-normal cursor-pointer text-gray-700">
                                        Auto-detect
                                    </Label>
                                </div>
                            </div>
                            <Input
                                id="location"
                                name="location"
                                type="text"
                                placeholder={autoDetect ? "Location will be auto detected..." : "Enter city, district or street..."}
                                value={location}
                                onChange={(e) => this.setState({ location: e.target.value, errors: { ...errors, location: '' } })}
                                disabled={autoDetect}
                                className={errors.location ? "border-red-500" : ""}
                            />
                            <div className="h-5 mt-1">
                                {errors.location && (
                                    <p className="text-xs text-red-600">{errors.location}</p>
                                )}
                            </div>
                        </div>

                        {/* Distance Field */}
                        <div className="flex flex-col">
                            <Label htmlFor="distance" className={`text-sm font-medium mb-2 ${errors.distance ? "text-red-600" : "text-gray-700"}`}>
                                Distance <span className="text-red-600">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="distance"
                                    name="distance"
                                    type="number"
                                    placeholder="10"
                                    min="1"
                                    max="100"
                                    value={distance}
                                    onChange={(e) => this.setState({ distance: e.target.value, errors: { ...errors, distance: '' } })}
                                    className={`pr-16 ${errors.distance ? "border-red-500" : ""}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                                    miles
                                </span>
                            </div>
                            <div className="h-5 mt-1">
                                {errors.distance && (
                                    <p className="text-xs text-red-600">{errors.distance}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col justify-end">
                            <Button
                                type="submit"
                                className="w-full bg-black hover:bg-gray-800 text-white h-10 "
                                disabled={isSearching}
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 mr-2"
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
                                        Search Events
                                    </>
                                )}
                            </Button>
                            <div className="h-5 mt-1"></div>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default Searchform;
