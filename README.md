# Weather Bot for Slack

A Slack bot that provides weather forecasts using the Open-Meteo API and OpenWeatherMap's geocoding service.

## Features

- Current weather conditions
- 4-day forecast
- Temperature and precipitation charts
- Location name lookup from coordinates
- Support for both space and comma-separated coordinates
- Direct message support
- Channel mention support
- Interactive help command

## Setup

1. Create a new Slack app at https://api.slack.com/apps
2. Under "Basic Information", scroll down to "Display Information" and set:
   - App Name
   - App Icon
   - App Description
3. Under "Basic Information", scroll down to "App-Level Tokens" and:
   - Click "Generate Token and Scopes"
   - Name it something like "weather-bot-token"
   - Add the `connections:write` scope
   - Copy the generated token
4. Under "OAuth & Permissions", add the following bot scopes:
   - `commands`
   - `chat:write`
   - `app_mentions:read`
   - `im:history`
   - `channels:history`
   - `groups:history`
   - `im:write` (for direct messages)
   - `chat:write.public` (for channel messages)
5. Under "Event Subscriptions":
   - Toggle "Enable Events" to On
   - Add your Request URL: `https://your-worker-url.workers.dev/slack/events`
   - Subscribe to the following bot events:
     - `message.im` (for direct messages)
     - `message.channels` (for public channels)
     - `message.groups` (for private channels)
6. Under "Interactivity & Shortcuts":
   - Toggle "Interactivity" to On
   - Add your Request URL: `https://your-worker-url.workers.dev/slack/events`
7. Under "Slash Commands":
   - Click "Create New Command"
   - Command: `/weather`
   - Request URL: `https://your-worker-url.workers.dev/slack/events`
   - Short Description: "Get weather forecast for coordinates"
   - Usage Hint: "[latitude] [longitude]"
8. Install the app to your workspace
9. Copy the signing secret and bot token
10. Note your bot's user ID (you can find this in the "Basic Information" section of your app settings)

## Environment Variables

The following secrets need to be set using Wrangler:

```bash
# Set Slack signing secret
wrangler secret put SLACK_SIGNING_SECRET

# Set OpenWeatherMap API key for geocoding
wrangler secret put OPENWEATHER_API_KEY

# Set Slack bot user ID
wrangler secret put SLACK_BOT_USER_ID
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

You can interact with the bot in three ways:

1. Use the `/weather` command with coordinates:
```
/weather 37.7749 -122.4194
```
or
```
/weather 37.7749,-122.4194
```

2. Direct message the bot with coordinates:
```
37.7749 -122.4194
```
or
```
37.7749,-122.4194
```

3. Mention the bot in a channel with coordinates:
```
@weatherbot 37.7749 -122.4194
```

The bot will respond with:
- Current weather conditions
- 4-day forecast
- Temperature and precipitation charts
- Location name (if available)

You can also type `help` in a direct message or after mentioning the bot to see a list of available commands and usage instructions.

## Troubleshooting

If the bot isn't responding to mentions or direct messages:

1. Make sure you've added all the required scopes
2. Verify that the bot has been invited to the channel where you're trying to mention it
3. Check that the bot's user ID is correctly set in the environment variables
4. Ensure all the event subscriptions are properly configured
5. Try reinstalling the app to your workspace after making any changes to scopes or events

## Future Features

- Integration with Summits on the Air (SOTA) locations
- Additional weather data points
- Weather alerts and notifications
- Customizable units (metric/imperial)
- Weather alerts for specific locations 