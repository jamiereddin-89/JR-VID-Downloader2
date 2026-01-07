Perfect! I've thoroughly reviewed your app and researched yt-dlp. Now I understand what needs to be done. Let me create a comprehensive implementation plan for migrating from the current cobalt.tools/Firecrawl approach to a native yt-dlp implementation.

Plan: Migration to yt-dlp for Video Extraction and Download

1. Backend Infrastructure Setup

Install yt-dlp binary in the Bolt Database Edge Function environment (Deno runtime)
Configure yt-dlp with necessary dependencies (FFmpeg if needed for format conversion)
Set up cookie handling mechanism for authenticated video sites
Create configuration for yt-dlp options (quality preferences, format selection, output templates)
Add proper error handling and timeout management for yt-dlp subprocess calls
2. Bolt Database Edge Function Refactoring

Remove cobalt.tools API integration from extract-video function
Remove Firecrawl fallback extraction logic
Implement new yt-dlp command execution using Deno.Command API
Create function to call yt-dlp with JSON output flag to extract video metadata
Implement video URL extraction using yt-dlp's format selection
Add support for multiple quality options (720p, 1080p, best available)
Handle yt-dlp output parsing and error responses
Maintain SSRF protection and URL validation
Add support for age-restricted and cookie-protected content
3. Video Metadata Extraction

Use yt-dlp with dump-json flag to extract video information without downloading
Parse yt-dlp JSON response to extract: title, thumbnail, duration, available formats, direct video URLs
Handle both direct MP4 URLs and streaming formats (HLS/m3u8)
Extract video URL with authentication tokens when present
Store format information for quality selection
Implement fallback logic for sites with multiple format options
4. Download Implementation Enhancement

Implement server-side download using yt-dlp when user requests download
Create endpoint to handle actual video file downloads through yt-dlp
Support progress tracking for downloads
Handle large file downloads with proper streaming
Add option to download in different qualities
Implement filename sanitization based on video title
5. Database Schema Design

Create Bolt Database table for storing video metadata (id, user_id, title, url, source_url, thumbnail, duration, format_info, created_at)
Create table for tracking download jobs (id, video_id, status, progress, file_path, created_at)
Add indexes for efficient querying by user and date
Migrate from IndexedDB to Bolt Database for persistent storage
Set up Row Level Security policies for user data protection
6. Frontend Integration Updates

Update video-extract.ts API client to handle new yt-dlp response format
Modify DownloadsTab component to display quality options when multiple formats available
Update download flow to use new server-side download endpoint
Add progress indicators for extraction and download operations
Handle new error messages and states from yt-dlp
Update VideoPlayer component if needed for new URL formats
7. Cookie and Authentication Handling

Implement cookie import functionality for authenticated sites
Add UI for users to optionally provide cookies file
Store cookies securely in Bolt Database storage or encrypted database field
Use cookies with yt-dlp extraction calls when available
Add documentation for users on how to export cookies from browsers
8. Testing and Validation

Test with various video sites (YouTube, Vimeo, adult content sites as per user example)
Verify token and cookie extraction works correctly
Ensure video playback works with extracted URLs in library
Test download functionality with various file sizes
Validate error handling for unsupported sites
Test timeout scenarios and edge cases
9. Performance Optimization

Implement caching for frequently accessed video metadata
Add queue system for handling multiple simultaneous extraction requests
Optimize yt-dlp command parameters for faster extraction
Consider implementing background jobs for large downloads
Add rate limiting to prevent abuse
Key Clarification Questions:

Do you want to keep videos stored locally (IndexedDB) or migrate to Bolt Database for cloud storage and cross-device sync?

Should the app support user authentication, or remain as a single-user local application?

For the cookie/authentication handling - do you want users to manually upload cookie files, or implement automatic cookie extraction from their browser?

Summary:

This plan completely replaces the current cobalt.tools and Firecrawl extraction methods with a direct yt-dlp implementation. The approach uses yt-dlp's command-line interface called from the Bolt Database Edge Function (Deno runtime), extracting video metadata in JSON format without downloading, and providing direct video URLs with authentication tokens. This gives you full control over the extraction process, supports thousands of sites including adult content platforms, handles cookies and authentication properly, and ensures the library video player receives correctly formatted URLs for playback. The implementation maintains security through URL validation while providing robust error handling and progress tracking throughout the extraction and download pipeline.