import { Router } from 'itty-router';

const router = Router();

// Middleware to verify Slack request signatures
const verifySlackRequest = async (request, env) => {
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');
  
  if (!signature || !timestamp) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Clone the request to read the body
  const clonedRequest = request.clone();
  const body = await clonedRequest.text();
  const isValid = verifyRequestSignature(
    env.SLACK_SIGNING_SECRET,
    signature,
    timestamp,
    body
  );

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  return null;
};

// Function to verify Slack request signature
function verifyRequestSignature(signingSecret, signature, timestamp, body) {
  const [version, hash] = signature.split('=');
  if (version !== 'v0') return false;

  const timestampedBody = `${version}:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = encoder.encode(signingSecret);
  const message = encoder.encode(timestampedBody);
  
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => {
    return crypto.subtle.sign('HMAC', key, message);
  }).then(signature => {
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === hash;
  });
}

// Function to parse form-urlencoded data
function parseFormData(body) {
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
}

// Function to fetch weather data from Open-Meteo
async function getWeatherData(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max,weather_code&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Weather data fetch failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

// Function to get location name from coordinates
async function getLocationName(lat, lon, env) {
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${env.OPENWEATHER_API_KEY}`;
  console.log('Fetching location data from:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Geocoding API response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error('No results found in geocoding response');
      return null;
    }
    
    const location = data[0];
    console.log('First location result:', JSON.stringify(location, null, 2));
    
    const parts = [];
    if (location.name) parts.push(location.name);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    const locationString = parts.join(', ');
    console.log('Formatted location string:', locationString);
    return locationString;
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
}

// Function to create temperature chart URL
function createTemperatureChartUrl(daily) {
  const chartConfig = {
    type: 'line',
    data: {
      labels: daily.time.slice(0, 4).map(date => 
        new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      ),
      datasets: [
        {
          label: 'High',
          data: daily.temperature_2m_max.slice(0, 4),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        },
        {
          label: 'Low',
          data: daily.temperature_2m_min.slice(0, 4),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '4-Day Temperature Forecast'
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Temperature (°F)'
          }
        }
      }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=800&height=300`;
}

// Function to create precipitation chart URL
function createPrecipitationChartUrl(daily) {
  const chartConfig = {
    type: 'line',
    data: {
      labels: daily.time.slice(0, 4).map(date => 
        new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      ),
      datasets: [
        {
          label: 'Precipitation Chance',
          data: daily.precipitation_probability_max.slice(0, 4),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '4-Day Precipitation Forecast'
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Precipitation Chance (%)'
          }
        }
      }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=800&height=300`;
}

// Function to get weather description from weather code
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'Unknown weather condition';
}

// Handle Slack command requests
router.post('/slack/events', async (request, env) => {
  const verification = await verifySlackRequest(request, env);
  if (verification) return verification;

  const body = await request.text();
  const data = parseFormData(body);
  
  // Handle URL verification
  if (data.type === 'url_verification') {
    return new Response(JSON.stringify({ challenge: data.challenge }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle command requests
  if (data.command === '/weather') {
    const text = data.text.trim();
    // Split by either space or comma, and clean up any extra spaces
    const coords = text.split(/[,\s]+/).map(coord => coord.trim());
    const [lat, lon] = coords.map(Number);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || 
        lat < -90 || lat > 90 || 
        lon < -180 || lon > 180) {
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: 'Please provide valid latitude and longitude coordinates. Example: /weather 37.7749 -122.4194 or /weather 37.7749,-122.4194'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const weatherData = await getWeatherData(lat, lon);
      const locationName = await getLocationName(lat, lon, env);
      
      const current = weatherData.current;
      const daily = weatherData.daily;
      
      // Current conditions
      const elevationMeters = weatherData.elevation;
      const elevationFeet = Math.round(elevationMeters * 3.28084);
      const currentConditions = `*Weather for ${locationName || `${lat}, ${lon}`}* (Elevation: ${elevationMeters} meters / ${elevationFeet} feet)\n\n` +
        `*Current Weather Conditions*\n` +
        `• Temperature: ${current.temperature_2m}°F\n` +
        `• Relative Humidity: ${current.relative_humidity_2m}%\n` +
        `• Wind Speed: ${current.wind_speed_10m} mph\n` +
        `• Wind Gusts: ${current.wind_gusts_10m} mph\n` +
        `• Conditions: ${getWeatherDescription(current.weather_code)}\n`;

      // Four-day forecast
      const forecast = `\n*4-Day Forecast*\n` +
        daily.time.slice(0, 4).map((date, i) => {
          const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
          return `${day}:\n` +
            `• High: ${daily.temperature_2m_max[i]}°F\n` +
            `• Low: ${daily.temperature_2m_min[i]}°F\n` +
            `• Precipitation Chance: ${daily.precipitation_probability_max[i]}%\n` +
            `• Max Wind Gusts: ${daily.wind_gusts_10m_max[i]} mph\n` +
            `• Conditions: ${getWeatherDescription(daily.weather_code[i])}`;
        }).join('\n\n');

      try {
        // Generate chart URLs
        const tempChartUrl = createTemperatureChartUrl(daily);
        const precipChartUrl = createPrecipitationChartUrl(daily);

        const weatherInfo = currentConditions + forecast + 
          `\n\n*Temperature Forecast*\n<${tempChartUrl}|View Temperature Chart>\n\n` +
          `*Precipitation Forecast*\n<${precipChartUrl}|View Precipitation Chart>`;

        return new Response(JSON.stringify({
          response_type: 'in_channel',
          text: weatherInfo
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (chartError) {
        console.error('Error generating charts:', chartError);
        // If chart generation fails, still return the text forecast
        const weatherInfo = currentConditions + forecast;
        return new Response(JSON.stringify({
          response_type: 'in_channel',
          text: weatherInfo
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return new Response(JSON.stringify({
        response_type: 'ephemeral',
        text: 'Sorry, I encountered an error while fetching the weather data. Please try again later.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Command not recognized', { status: 400 });
});

// Handle 404s
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
}; 