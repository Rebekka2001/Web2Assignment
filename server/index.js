// Importing
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");

//Importing weather data
const WeatherData = require("./models/weatherData");
const { log } = require("console");

const apiLink =
  "https://api.open-meteo.com/v1/forecast?latitude=55.3959&longitude=10.3883&forecast_days=1&current=temperature_2m,rain,wind_speed_10m&timezone=auto";

// Initializing
const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

const PORT = 5000;

//Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/weatherDB")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error with MongoDB-connection:", err));

//Remove everything from the database!
(async () => {
  try {
    await WeatherData.deleteMany({});
    console.log("All weather data deleted successfully!");
  } catch (error) {
    console.error("Error while deleting weather data:", error);
  }
})();

//Getting the data from the API
function getData() {
  fetch(apiLink)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data) => {
      console.log("Data received: ", data);
      await WeatherData.create({
        city: "Odense",
        temperature: data.current.temperature_2m,
        rain: data.current.rain,
        wind: data.current.wind_speed_10m,
        timestamp: data.current.timestamp,
      });
      //Emit the new data to all the connected clients
      io.emit("weatherUpdate");
    })
    .catch((error) => {
      console.error("Error trying to load weatherdata: ", error);
      setError("Failed to load data");
    });
}
//Get the data, the first time without delay
getData();

//Get the data every 5 minute
//link: https://www.npmjs.com/package/node-cron
cron.schedule("*/1 * * * *", () => {
  getData();
  console.log("Added new data");
});

// Make test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// POST-route
app.post("/api/weather", async (req, res) => {
  try {
    const { city, temperature, rain, wind } = req.body;
    const weatherData = new WeatherData({ city, temperature, rain, wind });
    await weatherData.save();
    res.status(201).json(weatherData);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Could not save Weather Data" });
  }
});

//GET-route
app.get("/api/weather", async (req, res) => {
  try {
    const weatherData = await WeatherData.find({});
    // .sort({ timeStamp: -1 })
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: `Could not get Weather Data: ${error}` });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`The server is running at http://localhost:${PORT}`);
});
