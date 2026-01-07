Plan
Video Stream Manager - Full MVP
A clean, minimal web app for extracting, storing, and playing video streams from URLs.

🗂️ Tab 1: Downloads
URL Input Section

Text input field for pasting URLs
"Paste from Clipboard" button for quick mobile/desktop pasting
"Send" button to submit the URL
Processing Display

After submitting a URL, a card appears showing:
The submitted URL
"Fetch" button → extracts the m3u8 stream URL and metadata
"Save" button → downloads the full video to your device
Status Bar

Loading/progress indicator during fetch
Download progress bar with speed and ETA for full downloads
Success/error status messages
📚 Tab 2: Library
Video Grid

Clean grid of saved videos with thumbnails
Each card shows: thumbnail, title/filename, source URL
Inline Player

Click any video → it expands inline with an HLS.js player
Plays m3u8 streams directly (no stored video files)
Click again or close button to collapse
Video Management

Drag to reorder videos in the list
Delete individual videos with confirmation
Edit title/notes for each video
🔐 Optional Account System
App works immediately without login (data in browser)
Optional sign-up to sync library across devices
Uses Supabase Auth for secure login
💾 Data Storage
Browser (IndexedDB/localStorage)

Stream URLs, thumbnails, cookies, metadata
Persists across sessions
Cloud Sync (when logged in)

Supabase database for synced library
Thumbnails stored in Supabase Storage
🔧 Technical Approach
Video URL Extraction

Lovable Cloud edge function calls video extraction APIs
Supports common video platforms via Firecrawl or similar services
Video Playback

HLS.js library for m3u8 stream playback
No video files stored - streams play live from source
Full Downloads

Browser-based download of video files to user's device