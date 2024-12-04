import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import io from "socket.io-client";

// Connect to the Socket.io
const socket = io("http://localhost:5000");

function WeatherData() {
  const [weatherData, setWeatherData] = useState([]);
  const [error, setError] = useState(null);

  //Prepping data for Google Charts
  const chartData = [
    ["City", "Temperature", "Rain (mm)", "Wind (m/s)"],
    ...weatherData.map((data) => [
      data.city,
      data.temperature,
      data.rain,
      data.wind,
    ]),
  ];

  useEffect(() => {
    // Fetch initial weather data when component mounts
    const fetchWeatherData = async () => {
      fetch("http://localhost:5000/api/weather")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Data received: ", data);
          setWeatherData(data);
        })
        .catch((error) => {
          console.error("Error trying to load weatherdata: ", error);
          setError("Failed to load data");
        });
    };

    // Listen for "weatherUpdate" event from the server
    socket.on("weatherUpdate", () => {
      console.log("New weather data received");
      fetchWeatherData();
    });

    fetchWeatherData();

    // Clean up the socket connection on component unmount
    return () => {
      socket.off("weatherUpdate");
    };
  }, []);

  const options = {
    title: "Weather Data for Odense",
    hAxis: { title: "City" },
    vAxis: { title: "Values" },
    seriesType: "bars",
    series: { 2: { type: "line" } },
  };

  return (
    <div>
      <h2>WeatherData</h2>
      {error && <p style={{ color: "red" }}>{error}</p>} {}
      {weatherData.length > 0 && (
        <Chart
          chartType="ComboChart"
          width="100%"
          height="400px"
          data={chartData}
          options={options}
        />
      )}
    </div>
  );
}

export default WeatherData;
