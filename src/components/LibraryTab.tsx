import { useState } from "react";
import { Search, Grid, List, MoreVertical, Play, Trash2, Edit, FolderPlus, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoPlayer } from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
export interface LibraryVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  source?: string;
  dateAdded: Date;
  watchProgress?: number;
  tags?: string[];
  folderId?: string;
}

interface LibraryTabProps {
  videos: LibraryVideo[];
  onDeleteVideo?: (id: string) => void;
  onUpdateVideo?: (id: string, updates: Partial<LibraryVideo>) => void;
}

export function LibraryTab({ videos, onDeleteVideo, onUpdateVideo }: LibraryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleVideoClick = (videoId: string) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  const handleProgressUpdate = (videoId: string, progress: number) => {
    if (onUpdateVideo) {
      onUpdateVideo(videoId, { watchProgress: progress });
    }
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon">
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Continue Watching */}
      {videos.some((v) => v.watchProgress && v.watchProgress > 0 && v.watchProgress < 0.95) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Continue Watching</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {videos
              .filter((v) => v.watchProgress && v.watchProgress > 0 && v.watchProgress < 0.95)
              .map((video) => (
                <div
                  key={video.id}
                  className="flex-shrink-0 w-48 cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(video.watchProgress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs mt-1 truncate">{video.title}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Video Grid/List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {videos.length === 0
              ? "No videos in your library yet"
              : "No videos match your search"}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}
        >
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              {expandedVideoId === video.id ? (
                <VideoPlayer
                  src={video.url}
                  title={video.title}
                  initialProgress={video.watchProgress}
                  onClose={() => setExpandedVideoId(null)}
                  onProgressUpdate={(progress) =>
                    handleProgressUpdate(video.id, progress)
                  }
                />
              ) : (
                <CardContent
                  className={cn(
                    "p-0",
                    viewMode === "list" && "flex items-center gap-4"
                  )}
                >
                  {/* Thumbnail */}
                  <div
                    className={cn(
                      "relative cursor-pointer",
                      viewMode === "grid" ? "aspect-video" : "w-32 h-20 flex-shrink-0"
                    )}
                    onClick={() => handleVideoClick(video.id)}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-10 w-10" />
                    </div>
                    {video.watchProgress && video.watchProgress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${video.watchProgress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div
                    className={cn(
                      "flex items-start justify-between gap-2",
                      viewMode === "grid" ? "p-3" : "flex-1 py-2 pr-3"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {extractDomain(video.url)}
                      </p>
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {video.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-secondary px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            window.open(video.url, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Stream URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = video.url;
                            link.download = `${video.title || "video"}.mp4`;
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast({
                              title: "Download started",
                              description: "If download doesn't start, the video may be a stream that can't be downloaded directly.",
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Video
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDeleteVideo?.(video.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
