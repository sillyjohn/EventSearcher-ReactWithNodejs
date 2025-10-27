import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

//Search Endpoint
app.get("/search", (req, res) => {
  res.send("this is submit!");
});

//Event Details Endpoint
app.get("/event/:id", (req, res) => {
  const eventId = req.params.id;
  res.send(`Event details for ID: ${eventId}`);
});

//Favorite Events Endpoint
app.get("/favorites", (req, res) => {
  res.send("List of favorite events");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
