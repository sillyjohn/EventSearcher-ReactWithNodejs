import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import geohash from 'ngeohash';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//Segment ID
const SEGMENT_ID = {
    "music": "KZFzniwnSyZfZ7v7nJ",
    "sport": "KZFzniwnSyZfZ7v7nE",
    "arts&theatre": "KZFzniwnSyZfZ7v7na",
    "film": "KZFzniwnSyZfZ7v7nn",
    "miscell": "KZFzniwnSyZfZ7v7n1",
};

//TIcketmaster URLs
const TICKETMASTER_SEARCH_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const TICKETMASTER_EVENT_DETAILS_URL = "https://app.ticketmaster.com/discovery/v2/events/";
const TICKETMASTER_SUGGEST_URL = "https://app.ticketmaster.com/discovery/v2/suggest";

app.get("/", (req, res) => {
  res.send("Backend is running!");
});



//Search Endpoint
app.get("/search", async (req, res) => {
    const { keyword, category, distance, location } = req.query;
    res.send(`Search results for keyword: ${keyword}, category: ${category}, distance: ${distance}, location: ${location}`);
    console.log(`Received search request: keyword=${keyword}, category=${category}, distance=${distance}, location=${location}`);

    // Call Ticketmaster search function
    const segmentId = getSegmentId(category);
    const geoHash = geohashing(location);
    console.log("Computed Segment ID:", segmentId);
    console.log("Computed GeoHash:", geoHash);
    const results = await ticketmasterSearch({ keyword, segmentId, distance, geoHash });
    console.log("Ticketmaster search results:", results);
    return res.json(results);
});

function getSegmentId(category) {
    category = category.toLowerCase();
    return SEGMENT_ID[category] || "";
}

function geohashing(location){
    var lat = location.split(",")[0];
    var lng = location.split(",")[1];
    return geohash.encode(lat, lng);
}

async function ticketmasterSearch(params) {
    const url = new URL(TICKETMASTER_SEARCH_URL);
    const searchParams = new URLSearchParams(
        { apikey: process.env.TICKETMASTER_API_KEY,
        keyword: params.keyword,
        segmentId: params.segmentId,
        radius: params.distance,
        unit: "miles",
        geoPoint: params.geoHash 

    });
    url.search = searchParams.toString();
    console.log("Ticketmaster Search URL:", url.toString());
    // const response = await
    fetch(url)
    return null ;//Replace with actual fetch and response parsing
}

//Event Details Endpoint
app.get("/event/:id", (req, res) => {
  const eventId = req.params.id;
  res.send(`Event details for ID: ${eventId}`);
});

//Favorite Events Endpoint
app.get("/favorites", (req, res) => {
  res.send("List of favorite events");
});

//Ticketmaster search endpoint
//Ticketmaster event details endpoint



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
