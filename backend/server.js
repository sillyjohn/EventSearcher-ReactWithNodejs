import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import geohash from 'ngeohash';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db_pw = process.env.db_password;
const uri = `mongodb+srv://sillyjohn:0000@hw3.mrvkten.mongodb.net/?appName=HW3`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let db;
let favoritesCollection;

async function connectDB() {
    await client.connect();
    db = client.db("HW3");
    favoritesCollection = db.collection("Favorites");
    console.log("✅ Successfully connected to MongoDB!");
}


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
    console.log(`Received search request: keyword=${keyword}, category=${category}, distance=${distance}, location=${location}`);

    try {
        // Call Ticketmaster search function
        const segmentId = getSegmentId(category);
        const geoHash = geohashing(location);
        console.log("Computed Segment ID:", segmentId);
        console.log("Computed GeoHash:", geoHash);
        
        const results = await ticketmasterSearch({ keyword, segmentId, distance, geoHash });
        console.log("Ticketmaster search results:", results);
        
        // Send only ONE response
        return res.json(results);
    } catch (error) {
        console.error("Error in search endpoint:", error);
        return res.status(500).json({ error: "Failed to fetch search results" });
    }
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
    const response = await fetch(url);
    const result = await response.json();
    return result;
}

//Event Details Endpoint
app.get("/event/:id", async (req, res) => {
  const eventId = req.params.id;
  console.log(`Received event details request for ID: ${eventId}`);

  try {
    const eventDetails = await ticketmasterEventDetails(eventId);
    console.log("Ticketmaster event details:", eventDetails);
    return res.json(eventDetails);
  } catch (error) {
    console.error("Error in event details endpoint:", error);
    return res.status(500).json({ error: "Failed to fetch event details" });
  }
});

async function ticketmasterEventDetails(eventId) {
  const url = `${TICKETMASTER_EVENT_DETAILS_URL}${eventId}.json?apikey=${process.env.TICKETMASTER_API_KEY}`;
  console.log("Ticketmaster Event Details URL:", url);
  const response = await fetch(url);
  const result = await response.json();
  return result;
}


app.get("/suggest", async (req, res) => {
  const { keyword } = req.query;
  console.log(`Received suggest request for keyword: ${keyword}`);

  try {
    const suggestions = await ticketmasterSuggest(keyword);
    console.log("Ticketmaster suggestions:", suggestions);
    return res.json(suggestions);
  } catch (error) {
    console.error("Error in suggest endpoint:", error);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

async function ticketmasterSuggest(keyword) {
  const url = new URL(TICKETMASTER_SUGGEST_URL);
  const searchParams = new URLSearchParams(
    { apikey: process.env.TICKETMASTER_API_KEY,
      keyword: keyword
    });
  url.search = searchParams.toString();
  console.log("Ticketmaster Suggest URL:", url.toString());
  const response = await fetch(url);
  const result = await response.json();
  return result;
}

//Favorite Events Endpoint - Get all favorites
app.get("/favorites", async (req, res) => {
  try {
    const favorites = await favoritesCollection.find({}).toArray();
    // Return array of simplified event objects
    return res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Add favorite - GET method with URL parameters
app.get("/favorites/add", async (req, res) => {
  try {
    const { id, name, date, time, genre, venue, imageUrl, url } = req.query;
    
    if (!id || !name) {
      return res.status(400).json({ error: "Missing required fields: id and name" });
    }
    
    // Check if already exists
    const existing = await favoritesCollection.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: "Event already in favorites" });
    }
    
    // Create simplified event object
    const simplifiedEvent = {
      id,
      name,
      url: url || null,
      dates: {
        start: {
          localDate: date || null,
          localTime: time || null
        }
      },
      classifications: genre ? [{
        segment: {
          name: genre
        }
      }] : [],
      _embedded: {
        venues: venue ? [{
          name: venue
        }] : []
      },
      images: imageUrl ? [{
        url: imageUrl
      }] : [],
      createdAt: new Date()
    };
    
    const result = await favoritesCollection.insertOne(simplifiedEvent);
    
    return res.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove favorite - GET method
app.get("/favorites/remove", async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: "Missing event id" });
    }
    
    const result = await favoritesCollection.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Start server after connecting to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(error => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down gracefully...');
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
