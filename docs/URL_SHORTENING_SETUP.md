# URL Shortening Setup Guide

## Overview
This project now includes URL shortening functionality for the QB Rankings share feature, using Redis Cloud through Vercel's KV store integration.

## Setup Steps

### 1. Environment Variables
Add the following environment variable to your Vercel project:

```
REDIS_URL=redis://default:your-password@your-redis-host:port
```

You can find this URL in your Vercel Dashboard:
1. Go to your project
2. Navigate to Settings > Environment Variables
3. The `REDIS_URL` should already be set if you configured Redis Cloud integration

### 2. API Routes Created

#### `/api/shorten.js`
- **Purpose**: Creates short URLs from long QB rankings URLs
- **Method**: POST
- **Body**: `{ "url": "https://qbrankings.vercel.app/..." }`
- **Response**: `{ "shortUrl": "https://domain.com/s/abc123", "shortId": "abc123", "originalUrl": "...", "expiresIn": "30 days" }`

#### `/api/s/[id].js`
- **Purpose**: Handles redirects from short URLs to original URLs
- **Method**: GET
- **URL**: `/s/abc123`
- **Response**: 302 redirect to original URL

### 3. Integration with Share Feature

The URL shortening is now integrated with your existing share functionality:

- **Quick Share**: Uses URL shortening for base64 encoded URLs over 100 characters
- **Full Detail Share**: Always uses URL shortening due to longer URLs
- **Fallback**: If shortening fails, falls back to original URL
- **Analytics**: Tracks click counts for shortened URLs

### 4. How It Works

1. User clicks "Share Settings" (Quick or Full Detail)
2. App creates the full URL with base64 encoded settings
3. If URL is long enough, sends it to `/api/shorten` to create short ID
4. Stores the mapping in Redis Cloud with 30-day expiration
5. Returns short URL like `yoursite.com/s/abc123`
6. When someone visits the short URL, `/api/s/[id]` looks up original URL and redirects
7. Optional: Tracks analytics (click counts)

### 5. Features

- **Collision Detection**: Ensures unique short IDs
- **Expiration**: URLs expire after 30 days
- **Analytics**: Tracks click counts per short URL
- **Error Handling**: Graceful fallback to original URLs
- **Validation**: Only allows URLs from your domain

### 6. Testing

1. Deploy the API routes to Vercel
2. Set up Redis Cloud integration
3. Try the share functionality in your app
4. Check that short URLs redirect properly

### 7. Monitoring

You can monitor your Redis usage in the Vercel dashboard under Storage > Redis Cloud.

## Technical Details

- **Redis Key Pattern**: `short:{id}` for URL mappings
- **Click Tracking**: `clicks:{id}` for analytics
- **Expiration**: 30 days (2,592,000 seconds)
- **Short ID Length**: 6 characters (expandable to 8 on collisions)
- **Character Set**: alphanumeric (a-z, A-Z, 0-9) 