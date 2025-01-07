export const refreshFrequency = 600000; // Refresh every 10 minutes

export const command = `
  POINT=$(curl -s https://api.weather.gov/points/40.7851,-73.9683 | jq -r '.properties.forecastHourly');
  curl -s $POINT;
`;

export const className = `
  .weather-widget {
    position: absolute;
    top: 270px;
    left: 50px;
    color: white;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 15px;
    max-width: 700px;
  }

  .loading,
  .error {
    text-align: center;
  }

  .current-weather-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .current-weather {
    flex: 1;
    text-align: left;
  }

  .temperature {
    font-size: 48px;
    font-weight: 400;
    margin-left: 20px;
    margin-right: 20px;
  }
  .station {
    font-size: 12px;
    font-weight: 500;
    margin-left: 20px;
    margin-right: 20px;
  }
  .feels-like {
    font-size: 20px;
    font-weight: 200;
    font-style: italic;
    margin-left: 20px;
    margin-right: 20px;
    color: #cccccc;
  }

  .weather-details {
    flex: 2;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    text-align: center;
    font-weight: 200;
  }

  .tile {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 10px;
    font-size: 18px;
    font-weight: 200;
  }

  .tile .tile-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .tile .tile-value {
    font-size: 14px;
    font-weight: 300;
    color: #ffffff;
  }

  .hourly-forecast {
    display: flex;
    justify-content: space-between;
    text-align: center;
  }

  .hour-tile {
    flex: 1;
    padding: 5px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin: 0 5px;
    font-weight: 200;
  }
  
  .real-feel {
	font-family: 'Helvetica Neue', Arial, sans-serif;
	font-size: 14px; /* Adjust font size as needed */
  	font-weight: 300; /* Emphasize the value */
  	font-style: italic; /* Optional styling */
  	color: #ffcc00; /* Highlight color */
  	margin-top: 5px; /* Spacing from other elements */
	}

  .hour-tile img {
    width: 40px;
    height: 40px;
    margin-bottom: 5px;
  }

  .time {
    white-space: nowrap; /* Prevent line breaks */
    font-size: 14px; /* Adjust size as needed */
    font-weight: 400; /* Optional for emphasis */
    text-align: center; /* Center-align the text */
  }
`;

export const render = ({ output }) => {
  if (!output) {
    return (
      <div className="weather-widget loading">
        <div>Loading weather data...</div>
      </div>
    );
  }

  try {
    const forecastData = JSON.parse(output);
    const periods = forecastData.properties.periods;

    // Current weather
    const current = periods[0];
    const hourlyForecast = periods.slice(1, 6); // Show the next 5 hours

    // Calculate Real Feel
    const calculateRealFeel = (temperature, windSpeed, humidity) => {
      if (temperature === null) return null;

      const tempFahrenheit = parseFloat(temperature);
      const windSpeedMph = windSpeed ? parseFloat(windSpeed) : 0;
      const humidityPercent = humidity ? parseFloat(humidity) : 0;

      // Wind chill for cold conditions
      if (tempFahrenheit <= 50 && windSpeedMph >= 3) {
        return (
          35.74 +
          0.6215 * tempFahrenheit -
          35.75 * Math.pow(windSpeedMph, 0.16) +
          0.4275 * tempFahrenheit * Math.pow(windSpeedMph, 0.16)
        ).toFixed(1);
      }
      // Heat index for hot conditions
      else if (tempFahrenheit >= 80 && humidityPercent >= 40) {
        return (
          -42.379 +
          2.04901523 * tempFahrenheit +
          10.14333127 * humidityPercent -
          0.22475541 * tempFahrenheit * humidityPercent -
          0.00683783 * Math.pow(tempFahrenheit, 2) -
          0.05481717 * Math.pow(humidityPercent, 2) +
          0.00122874 * Math.pow(tempFahrenheit, 2) * humidityPercent +
          0.00085282 * tempFahrenheit * Math.pow(humidityPercent, 2) -
          0.00000199 * Math.pow(tempFahrenheit, 2) * Math.pow(humidityPercent, 2)
        ).toFixed(1);
      }

      // Default to temperature if no adjustments are needed
      return tempFahrenheit.toFixed(1);
    };

    const realFeel = calculateRealFeel(
      current.temperature,
      current.windSpeed,
      current.relativeHumidity?.value
    );

    return (
      <div className="weather-widget">
        {/* Main Row: Current Weather + Tiles */}
        <div className="current-weather-container">
          {/* Current Weather */}
          <div className="current-weather">
            <div className="temperature">{current.temperature}°F</div>
            <div className="feels-like">
              Real Feel: {realFeel || "N/A"}°F
            </div>
            <div className="station">KNYC</div>
          </div>

          {/* Weather Details Tiles */}
          <div className="weather-details">
            <div className="tile">
              <div className="tile-title">Short Forecast</div>
              <div className="tile-value">{current.shortForecast}</div>
            </div>
            <div className="tile">
              <div className="tile-title">Wind</div>
              <div className="tile-value">{current.windSpeed} {current.windDirection}</div>
            </div>
            <div className="tile">
              <div className="tile-title">Humidity</div>
              <div className="tile-value">{current.relativeHumidity?.value || 0}%</div>
            </div>
            <div className="tile">
              <div className="tile-title">Precipitation</div>
              <div className="tile-value">{current.probabilityOfPrecipitation?.value || 0}%</div>
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="hourly-forecast">
          {hourlyForecast.map((hour) => {
            const iconFilename = `${hour.shortForecast.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "")}.png`;
            const iconSrc = `weatherTV.widget/images/${iconFilename}`;
            const hourRealFeel = calculateRealFeel(
              hour.temperature,
              hour.windSpeed,
              hour.relativeHumidity?.value
            );
            return (
              <div key={hour.startTime} className="hour-tile">
                <img src={iconSrc} alt={hour.shortForecast} />
                <div className="time">
                  {new Date(hour.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div>{hour.temperature}°F</div>
                <div className="real-feel">{hourRealFeel || "N/A"}°F</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing forecast data:", error);
    return (
      <div className="weather-widget error">
        <div>Unable to fetch weather data.</div>
      </div>
    );
  }
};
