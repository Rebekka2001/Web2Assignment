const mongoose = require("mongoose");

const weatherDataSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  rain: Number,
  wind: Number,
  timestamp: String,
});

module.exports = mongoose.model("WeatherData", weatherDataSchema);
