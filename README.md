# Weather Bot for Slack

A Slack bot that provides weather forecasts using the Open-Meteo API and OpenWeatherMap's geocoding service.

## Features

- Current weather conditions
- 4-day forecast
- Temperature and precipitation charts
- Location name lookup from coordinates
- Support for both space and comma-separated coordinates

## Setup

1. Create a new Slack app at https://api.slack.com/apps
2. Add the following bot scopes:
   - `commands`
3. Install the app to your workspace
4. Copy the signing secret and bot token

## Environment Variables

The following secrets need to be set using Wrangler:

```bash
# Set Slack signing secret
wrangler secret put SLACK_SIGNING_SECRET

# Set OpenWeatherMap API key for geocoding
wrangler secret put OPENWEATHER_API_KEY
```

You can get an OpenWeatherMap API key by:
1. Creating an account at https://openweathermap.org/
2. Going to your account page
3. Generating a new API key

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Usage

Use the `/weather` command in Slack with latitude and longitude coordinates:

```
/weather 37.7749 -122.4194
```

or

```
/weather 37.7749,-122.4194
```

The bot will respond with:
- Current weather conditions
- 4-day forecast
- Temperature and precipitation charts
- Location name (if available)

## Future Features

- Integration with Summits on the Air (SOTA) locations
- Additional weather data points
- Weather alerts and notifications 