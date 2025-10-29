import React, { Component } from "react";
const deBugMode = true;
const debugURL = import.meta.env.VITE_BACKEND_URL;
const prodURL = "https://eventsearcher-backend.onrender.com";
const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
function validateKeyword() {
    const keywordInput = document.getElementById("keyword");
    const keywordLabel = document.getElementById("keyword-label");
    const keywordRequiredLabel = document.getElementById("keyword-required-label");
    if (keywordInput.value.trim() === "") {
        keywordRequiredLabel.hidden = false;
        keywordInput.className = "w-full h-10 border border-red-500 rounded-md px-2 py-1";
        keywordLabel.className = "text-red-600";
        return false;
    }
    keywordRequiredLabel.hidden = true;
    keywordInput.className = "w-full h-10 border border-gray-300 rounded-md px-2 py-1";
    keywordLabel.className = "text-gray-600";
    return true;
}

function validateLocation() {
    const locationLabel = document.getElementById("location-label");
    const locationInput = document.getElementById("location");
    const locationCheckbox = document.getElementById("auto-detect-checkbox");
    const locationRequiredLabel = document.getElementById("location-required-label");
    const locationCheckboxLabel = document.getElementById("location-checkbox-label");
    const autoDetectCheckbox = document.getElementById("auto-detect-checkbox");
    if (!autoDetectCheckbox.checked && locationInput.value.trim() === "") {
        locationRequiredLabel.hidden = false;
        locationInput.className = "w-full h-10 border border-red-500 rounded-md px-2 py-1";
        locationLabel.className = "text-red-600";
        locationCheckbox.className = "border-red-600 focus:ring-red-500";
        locationCheckboxLabel.className = "text-red-600 pl-1 text-sm";
        return false;
    }
    locationRequiredLabel.hidden = true;
    locationInput.className = "w-full h-10 border border-gray-300 rounded-md px-2 py-1";
    locationLabel.className = "text-gray-600";
    locationCheckbox.className = "border-gray-300";
    locationCheckboxLabel.className = "text-gray-600 text-sm pl-1";
    return true;
}

function validateDistance() {
    const distanceInput = document.getElementById("distance");
    const distanceLabel = document.getElementById("distance-label");
    const distanceRequiredLabel = document.getElementById("distance-required-label");
    if (distanceInput.value) {
        const distanceValue = parseInt(distanceInput.value, 10);
        if (isNaN(distanceValue) || distanceValue <= 0 || distanceValue > 100) {
            distanceRequiredLabel.hidden = false;
            distanceInput.className = "w-full h-10 border border-red-500 rounded-md px-2 py-1";
            distanceLabel.className = "text-red-600";
            return false;
        }
    }
    distanceRequiredLabel.hidden = true;
    distanceInput.className = "w-full h-10 border border-gray-300 rounded-md px-2 py-1";
    distanceLabel.className = "text-gray-600";  
    return true;
}

function autoDetectLocation() {
    const autoDetectCheckbox = document.getElementById("auto-detect-checkbox");
    const locationInput = document.getElementById("location");
    if (autoDetectCheckbox.checked) {
        locationInput.value = "Location will be auto-detected";
        locationInput.className = "w-full h-10 text-md text-gray-500 border border-gray-300 rounded-md bg-gray-100 px-2 py-1";
        locationInput.disabled = true;

        //IPinfo fetch
        getLocationByIP().then((loc) => {
            console.log("Detected location:", loc);
            locationInput.value = loc;
        });

    }else{
        locationInput.value = "";
        locationInput.className = "w-full h-10 border border-gray-300 rounded-md px-2 py-1";
        locationInput.disabled = false;
    }
}

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
async function handleSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    
    console.log("handleSubmit called");
    
    // Validate form fields
    const isKeywordValid = validateKeyword();
    const isLocationValid = validateLocation();
    const isDistanceValid = validateDistance();
    console.log("Validation results:", { isKeywordValid, isLocationValid, isDistanceValid });

    if (!isKeywordValid || !isLocationValid || !isDistanceValid) {
        console.log("Validation failed");
        return;
    }

    try {
        // Get form data
        const form = document.getElementById("searchform");
        const formData = new FormData(form);
        
        const keyword = formData.get("keyword");
        const category = formData.get("category");
        const distance = formData.get("distance") || "10";
        let location = formData.get("location");
        var latLng = "";
        // Check if auto-detect is enabled
        const autoDetectCheckbox = document.getElementById("auto-detect-checkbox");
        if (autoDetectCheckbox.checked) {
            // Get location from IP
            latLng = await getLocationByIP();
            console.log("Auto-detected location:", latLng);
        }else{
            // Convert location to lat,lng using Google Geocoding API
            latLng = await googleGeocode(location);
            console.log("Geocoded coordinates:", latLng);
        }
        
        // Build query parameters for GET request
        const queryParams = new URLSearchParams({
            keyword: keyword,
            category: category,
            distance: distance,
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
        
        // TODO: Handle the search results (display them in Eventgrid component)
        // You can emit an event or use state management to pass data to Eventgrid
        
    } catch (error) {
        console.error("Error during form submission:", error);
    }
}

export class Searchform extends Component {
    render() {
        return (
            <div>
                <form id="searchform" className="flex flex-row justify-between mt-8 mr-08 mb-8 ml-8 p-4  space-x-4">
                    <div class="keyword-container" className="flex flex-col w-full">
                        <div class="keyword-label-container" className="flex flex-row">
                            <label id="keyword-label" for="keyword">
                                Keyword:
                            </label>
                            <label
                                className="text-red-600 pl-1"
                                title="Please fill out this field"
                            >
                                *
                            </label>
                        </div>

                        <input
                            className="w-full h-10 border border-gray-300 rounded-md px-2 py-1"
                            type="text"
                            id="keyword"
                            name="keyword"
                            placeholder="Search for events..."
                            required
                        />
                        <label id="keyword-required-label" className="text-sm text-red-600 h-5" hidden>Keyword is required.</label>
                    </div>
                    <div class="catergory-container" className="flex flex-col w-full ">
                        <label id="category-label" for="category">
                            Category:
                        </label>
                        <select className="w-full h-10 border border-gray-300 rounded-md px-2 py-1" id="category-input" name="category">
                            <option value="all">All</option>
                            <option value="music">Music</option>
                            <option value="sport">Sport</option>
                            <option value="arts">Arts & Theatre</option>
                            <option value="film">Film</option>
                            <option value="miscell">Miscellaneous</option>
                        </select>
                        <div className="h-5"></div>
                    </div>
                    <div class="location-container" className="flex flex-col w-full ">
                        <div class="location-label-checkbox-container" className="flex flex-row justify-between">
                            <div class="location-label-container" className="flex flex-row">
                                <label id="location-label" for="location">
                                    Location:
                                </label>
                                <label
                                    className="text-red-600 pl-1"
                                    title="Please fill out this field"
                                >
                                    *
                                </label>
                            </div>
                            <div class="location-checkbox-container">
                                <label
                                    id="location-checkbox-label"
                                    for="location-checkbox"
                                    className="text-sm"
                                >
                                    Auto-Detect Location
                                </label>
                                <input
                                    onChange={autoDetectLocation}   
                                    type="checkbox"
                                    id="auto-detect-checkbox"
                                    name="auto-detect-checkbox"
                                />
                            </div>
                        </div>
                        <input
                            className="w-full h-10 border border-gray-300 rounded-md px-2 py-1"
                            type="text"
                            id="location"
                            name="location"
                            placeholder="Enter location"
                            required
                        />
                        <label id="location-required-label" className="text-sm text-red-600 h-5" hidden>Location is required if Auto-detect is not checked.</label>
                    </div>
                    <div class="distance-container" className="flex flex-col w-full ">
                        <label id="distance-label" for="distance">
                            Distance (miles):
                        </label>
                        <input
                            className="w-full h-10 border border-gray-300 rounded-md px-2 py-1"
                            type="number"
                            id="distance"
                            name="distance"
                            placeholder="10"
                            min="1"
                            max="100"
                        />
                        <label id="distance-required-label" className="text-sm text-red-600 h-5" hidden>Distance must be between 1 and 100 miles.</label>
                    </div>
                    <div class="submit-container" className="flex flex-col w-full">
                        <label className="invisible">Button:</label>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="w-full h-10 bg-black text-white rounded-md hover:bg-gray-800 flex items-center justify-center space-x-2"
                            style={{ backgroundColor: '#000000' }}
                        >
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
                            <span>Search Events</span>
                        </button>
                        <div className="h-5"></div>
                    </div>
                </form>
            </div>
        );
    }
}

export default Searchform;
