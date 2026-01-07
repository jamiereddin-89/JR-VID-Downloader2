const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedVideo {
  title: string;
  streamUrl?: string;
  downloadUrl?: string;
  thumbnail?: string;
  source: string;
  duration?: number;
  formats?: VideoFormat[];
  metadata?: Record<string, unknown>;
}

interface VideoFormat {
  format_id: string;
  url: string;
  ext: string;
  quality: string;
  filesize?: number;
  format_note?: string;
}

// URL validation function to prevent SSRF attacks
function isValidVideoUrl(url: string): { valid: boolean; error?: string } {
  // Check length
  if (url.length > 2048) {
    return { valid: false, error: 'URL too long' };
  }

  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }
    
    // Block private/internal IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
      /^\[::1\]$/,
      /^0\.0\.0\.0$/,
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'Internal/private URLs are not allowed' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // NOTE: Authentication is disabled for now since there's no auth UI
    // Once authentication is added, uncomment the JWT validation below
    // const authHeader = req.headers.get('Authorization');
    // if (!authHeader) { ... }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL to prevent SSRF
    const validation = isValidVideoUrl(url);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Extracting video from URL using yt-dlp:', formattedUrl);

    // Use yt-dlp via cobalt.tools API (free, no API key needed)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      // Try cobalt.tools first - it's a free API wrapper for yt-dlp
      const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          vQuality: 'max', // Get best quality
          aFormat: 'best',
          filenamePattern: 'basic',
          isAudioOnly: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (cobaltResponse.ok) {
        const cobaltData = await cobaltResponse.json();

        if (cobaltData.status === 'error') {
          console.error('Cobalt API error:', cobaltData.text);
          throw new Error(cobaltData.text || 'Failed to extract video');
        }

        // Parse cobalt response
        const extractedVideo = parseCobaltResponse(cobaltData, formattedUrl);

        if (extractedVideo.streamUrl || extractedVideo.downloadUrl) {
          console.log('Video extracted successfully via cobalt.tools');
          return new Response(
            JSON.stringify({ success: true, data: extractedVideo }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // If cobalt fails, try direct extraction as fallback
      console.log('Cobalt failed, trying direct extraction...');
      const fallbackVideo = await extractDirectVideo(formattedUrl, controller.signal);

      if (fallbackVideo.streamUrl || fallbackVideo.downloadUrl) {
        console.log('Video extracted via fallback method');
        return new Response(
          JSON.stringify({ success: true, data: fallbackVideo }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If everything fails
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not extract video. The site may not be supported, require authentication, or the video format is not compatible.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error extracting video:', error);
    const errorMessage = error instanceof Error ? 
      (error.name === 'AbortError' ? 'Request timed out' : error.message) : 
      'Failed to extract video';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCobaltResponse(cobaltData: any, sourceUrl: string): ExtractedVideo {
  const result: ExtractedVideo = {
    title: 'Extracted Video',
    source: sourceUrl,
  };

  // Cobalt returns different status types
  if (cobaltData.status === 'stream' || cobaltData.status === 'success') {
    // Direct video URL
    result.downloadUrl = cobaltData.url;
    result.streamUrl = cobaltData.url;
  } else if (cobaltData.status === 'redirect') {
    // Redirect to video
    result.downloadUrl = cobaltData.url;
    result.streamUrl = cobaltData.url;
  } else if (cobaltData.status === 'picker') {
    // Multiple formats available
    if (cobaltData.picker && cobaltData.picker.length > 0) {
      // Get the best quality
      const bestFormat = cobaltData.picker[0];
      result.downloadUrl = bestFormat.url;
      result.streamUrl = bestFormat.url;
      result.thumbnail = bestFormat.thumb;
    }
  }

  // Extract metadata if available
  if (cobaltData.filename) {
    result.title = cobaltData.filename.replace(/\.[^/.]+$/, ''); // Remove extension
  }

  return result;
}

async function extractDirectVideo(url: string, signal: AbortSignal): Promise<ExtractedVideo> {
  const result: ExtractedVideo = {
    title: 'Extracted Video',
    source: url,
  };

  // Use Firecrawl as fallback with better extraction
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    return result;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['html', 'links'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
      signal,
    });

    if (!response.ok) {
      return result;
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    const links = data.data?.links || data.links || [];
    const metadata = data.data?.metadata || data.metadata || {};

    result.title = (metadata.title as string) || result.title;

    // Look for m3u8 streams first (best for streaming)
    const m3u8Patterns = [
      /["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      /src=["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      /file:\s*["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
      /source:\s*["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*?)["']/gi,
    ];

    for (const pattern of m3u8Patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          result.streamUrl = decodeURI(match[1].replace(/\\/g, ''));
          break;
        }
      }
      if (result.streamUrl) break;
    }

    // Check links for m3u8
    if (!result.streamUrl) {
      for (const link of links) {
        if (link.includes('.m3u8')) {
          result.streamUrl = link;
          break;
        }
      }
    }

    // Look for MP4 (good for downloading)
    const mp4Patterns = [
      /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*?)["']/gi,
      /src=["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*?)["']/gi,
    ];

    const skipPatterns = ['thumbnail', 'preview', '/gifs/', '/gif/', 'poster', 'thumb', '_small', '_preview'];
    const foundMp4s: string[] = [];

    for (const pattern of mp4Patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const url = decodeURI(match[1].replace(/\\/g, ''));
          const isPreview = skipPatterns.some(p => url.toLowerCase().includes(p));
          if (!isPreview) {
            foundMp4s.push(url);
          }
        }
      }
    }

    if (foundMp4s.length > 0) {
      const qualityIndicators = ['1080', '720', '480', 'hd', 'high'];
      const sorted = foundMp4s.sort((a, b) => {
        const aHasQuality = qualityIndicators.some(q => a.toLowerCase().includes(q));
        const bHasQuality = qualityIndicators.some(q => b.toLowerCase().includes(q));
        if (aHasQuality && !bHasQuality) return -1;
        if (!aHasQuality && bHasQuality) return 1;
        return b.length - a.length;
      });

      if (!result.streamUrl) {
        result.streamUrl = sorted[0];
      }
      result.downloadUrl = sorted[0];
    }

    // Extract thumbnail
    const thumbnailPatterns = [
      /poster=["'](https?:\/\/[^"'\s]+?)["']/gi,
      /thumbnail["']?\s*[:=]\s*["'](https?:\/\/[^"'\s]+?)["']/gi,
      /og:image["']?\s*content=["'](https?:\/\/[^"'\s]+?)["']/gi,
    ];

    for (const pattern of thumbnailPatterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        result.thumbnail = match[1];
        break;
      }
    }

  } catch (error) {
    console.error('Fallback extraction error:', error);
  }

  return result;
}
