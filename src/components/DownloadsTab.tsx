import { useState } from "react";
import { Clipboard, Send, Loader2, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { extractVideoFromUrl } from "@/lib/api/video-extract";

interface ProcessedUrl {
  id: string;
  originalUrl: string;
  status: "pending" | "fetching" | "ready" | "downloading" | "error";
  streamUrl?: string;
  downloadUrl?: string;
  title?: string;
  thumbnail?: string;
  error?: string;
  downloadProgress?: number;
}

interface DownloadsTabProps {
  onVideoReady?: (video: { url: string; title: string; thumbnail?: string }) => void;
}

export function DownloadsTab({ onVideoReady }: DownloadsTabProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [processedUrls, setProcessedUrls] = useState<ProcessedUrl[]>([]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputUrl(text);
      toast({
        title: "Pasted from clipboard",
        description: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
      });
    } catch (error) {
      toast({
        title: "Failed to paste",
        description: "Please allow clipboard access or paste manually",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!inputUrl.trim()) return;

    const newEntry: ProcessedUrl = {
      id: crypto.randomUUID(),
      originalUrl: inputUrl.trim(),
      status: "pending",
    };

    setProcessedUrls((prev) => [newEntry, ...prev]);
    setInputUrl("");
  };

  const handleFetch = async (id: string) => {
    const item = processedUrls.find((p) => p.id === id);
    if (!item) return;

    setProcessedUrls((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "fetching", error: undefined } : p
      )
    );

    try {
      const result = await extractVideoFromUrl(item.originalUrl);

      if (result.success && (result.data?.streamUrl || result.data?.downloadUrl)) {
        setProcessedUrls((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "ready",
                  title: result.data?.title || "Untitled Video",
                  streamUrl: result.data?.streamUrl,
                  downloadUrl: result.data?.downloadUrl,
                  thumbnail: result.data?.thumbnail,
                }
              : p
          )
        );
        toast({
          title: "Video extracted successfully",
          description: result.data?.title || "Video is ready to play or download",
        });
      } else {
        setProcessedUrls((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "error",
                  error: result.error || "Could not find video stream",
                }
              : p
          )
        );
        toast({
          title: "Extraction failed",
          description: result.error || "Could not find video stream on this page",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Extraction error:", error);
      setProcessedUrls((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "error",
                error: "Failed to extract video. Please try again.",
              }
            : p
        )
      );
      toast({
        title: "Error",
        description: "Failed to extract video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveToLibrary = (item: ProcessedUrl) => {
    if (item.streamUrl && onVideoReady) {
      onVideoReady({
        url: item.streamUrl,
        title: item.title || "Untitled Video",
        thumbnail: item.thumbnail,
      });
      toast({
        title: "Saved to Library",
        description: item.title || "Video added to your library",
      });
    }
  };

  const handleDownload = async (item: ProcessedUrl) => {
    const downloadUrl = item.downloadUrl || item.streamUrl;

    if (!downloadUrl) {
      toast({
        title: "Download failed",
        description: "No download URL available for this video",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set downloading status
      setProcessedUrls((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "downloading", downloadProgress: 0 } : p
        )
      );

      toast({
        title: "Download started",
        description: "Fetching video file...",
      });

      // Fetch the video
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename from title or URL
      const filename = item.title
        ? `${item.title.replace(/[^a-z0-9]/gi, '_')}.mp4`
        : `video_${Date.now()}.mp4`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      // Reset status
      setProcessedUrls((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "ready", downloadProgress: undefined } : p
        )
      );

      toast({
        title: "Download complete",
        description: `${item.title || "Video"} has been downloaded`,
      });
    } catch (error) {
      console.error("Download error:", error);

      // Reset status on error
      setProcessedUrls((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "ready", downloadProgress: undefined } : p
        )
      );

      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Video URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste video URL here..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePasteFromClipboard}
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button onClick={handleSubmit} disabled={!inputUrl.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {processedUrls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Processing Queue
          </h3>
          {processedUrls.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.title || item.originalUrl}
                    </p>
                    {item.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.originalUrl}
                      </p>
                    )}
                    {item.error && (
                      <p className="text-xs text-destructive mt-1">
                        {item.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "pending" && (
                      <Button size="sm" onClick={() => handleFetch(item.id)}>
                        Fetch
                      </Button>
                    )}
                    {item.status === "fetching" && (
                      <Button size="sm" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Fetching...
                      </Button>
                    )}
                    {item.status === "downloading" && (
                      <Button size="sm" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Downloading...
                      </Button>
                    )}
                    {item.status === "ready" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveToLibrary(item)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    {item.status === "error" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleFetch(item.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
