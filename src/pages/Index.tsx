import { Download, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DownloadsTab } from "@/components/DownloadsTab";
import { LibraryTab } from "@/components/LibraryTab";
import { useVideoLibrary } from "@/hooks/use-video-library";

const Index = () => {
  const { videos, isLoading, addVideo, updateVideo, deleteVideo } = useVideoLibrary();

  const handleVideoReady = async (video: { url: string; title: string; thumbnail?: string }) => {
    try {
      await addVideo({
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail,
        tags: [],
      });
    } catch (error) {
      console.error("Failed to save video:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Stream Manager</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Library {!isLoading && videos.length > 0 && `(${videos.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="downloads">
            <DownloadsTab onVideoReady={handleVideoReady} />
          </TabsContent>

          <TabsContent value="library">
            <LibraryTab
              videos={videos}
              onDeleteVideo={deleteVideo}
              onUpdateVideo={updateVideo}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
