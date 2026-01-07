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
Video Grid/List

Clean grid of saved videos with thumbnails
Toggle between grid and list view
Each card shows: thumbnail, title, source domain
Sort by: date added, title, recently played
Inline Expandable Player

Click any video → expands inline with HLS.js player
Remembers playback position
Click again to collapse
Organization

Create folders/collections for organizing videos
Add custom tags to videos
Search by title, source, or tags
Drag to reorder within folders
Management

Batch select for bulk delete/move
Delete with confirmation
Edit title and add notes
Export library as backup
🔐 Optional Account System
App works immediately without login (browser storage)
Optional sign-up to sync library across devices
Supabase Auth for secure authentication
💾 Data Storage
Local (IndexedDB)

Stream URLs, thumbnails, cookies, metadata
Watch progress and preferences
Persists across sessions
Cloud Sync (when logged in)

Supabase database for synced library
Thumbnails in Supabase Storage
🎨 Design
Clean & minimal aesthetic
Light/dark mode support
Mobile-responsive layout
Smooth animations and transitions
🔧 Technical Stack
Frontend: React + Tailwind CSS
Video Player: HLS.js for m3u8 playback
Backend: Lovable Cloud edge functions
URL Extraction: Firecrawl for scraping video pages
Database: Supabase (for cloud sync)
Local Storage: IndexedDB via idb library