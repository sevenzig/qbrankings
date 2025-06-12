/**
 * URL Shortener utility for QB Rankings
 * Integrates with Vercel API routes and Redis KV store
 */

export class URLShortener {
  static async shortenUrl(longUrl) {
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: longUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to shorten URL');
      }

      const data = await response.json();
      return {
        success: true,
        shortUrl: data.shortUrl,
        shortId: data.shortId,
        originalUrl: data.originalUrl,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      console.error('URL shortening failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackUrl: longUrl, // Return original URL as fallback
      };
    }
  }

  /**
   * Enhanced share function with URL shortening
   * @param {string} baseUrl - The base URL (window.location.origin + pathname)
   * @param {string} encodedSettings - The encoded settings string
   * @param {string} preset - The preset name (if any)
   * @param {boolean} useShortening - Whether to use URL shortening
   */
  static async generateShareLink(baseUrl, encodedSettings, preset = '', useShortening = true) {
    // Create the full URL
    const presetParam = preset !== 'custom' && preset ? `&preset=${preset}` : '';
    const fullUrl = `${baseUrl}?s=${encodedSettings}${presetParam}`;

    // If URL shortening is disabled or URL is already short, return as-is
    if (!useShortening || fullUrl.length < 100) {
      return {
        success: true,
        url: fullUrl,
        isShortened: false,
        originalLength: fullUrl.length,
      };
    }

    // Attempt to shorten the URL
    const shortenResult = await this.shortenUrl(fullUrl);

    if (shortenResult.success) {
      return {
        success: true,
        url: shortenResult.shortUrl,
        isShortened: true,
        originalUrl: fullUrl,
        originalLength: fullUrl.length,
        shortenedLength: shortenResult.shortUrl.length,
        shortId: shortenResult.shortId,
        expiresIn: shortenResult.expiresIn,
      };
    } else {
      // Fallback to original URL if shortening fails
      return {
        success: true,
        url: fullUrl,
        isShortened: false,
        originalLength: fullUrl.length,
        error: shortenResult.error,
        fallbackUsed: true,
      };
    }
  }

  /**
   * Analytics helper to track shortened URL usage
   */
  static async trackAnalytics(shortId, event = 'created') {
    try {
      // Optional: Send analytics data to your backend
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortId,
          event,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      // Silently fail analytics - don't break main functionality
      console.warn('Analytics tracking failed:', error);
    }
  }
}

export default URLShortener; 