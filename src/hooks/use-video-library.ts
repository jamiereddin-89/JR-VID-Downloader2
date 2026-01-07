import { useState, useEffect, useCallback } from "react";
import type { LibraryVideo } from "@/components/LibraryTab";

const DB_NAME = "stream-manager-db";
const DB_VERSION = 1;
const STORE_NAME = "videos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("dateAdded", "dateAdded", { unique: false });
      }
    };
  });
}

async function getAllVideos(): Promise<LibraryVideo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const videos = request.result.map((v: LibraryVideo) => ({
        ...v,
        dateAdded: new Date(v.dateAdded),
      }));
      // Sort by dateAdded descending
      videos.sort((a: LibraryVideo, b: LibraryVideo) => 
        b.dateAdded.getTime() - a.dateAdded.getTime()
      );
      resolve(videos);
    };
  });
}

async function addVideo(video: LibraryVideo): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      ...video,
      dateAdded: video.dateAdded.toISOString(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function updateVideo(id: string, updates: Partial<LibraryVideo>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const video = getRequest.result;
      if (!video) {
        reject(new Error("Video not found"));
        return;
      }

      const updatedVideo = { ...video, ...updates };
      if (updates.dateAdded) {
        updatedVideo.dateAdded = updates.dateAdded instanceof Date 
          ? updates.dateAdded.toISOString() 
          : updates.dateAdded;
      }

      const putRequest = store.put(updatedVideo);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
  });
}

async function deleteVideo(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function useVideoLibrary() {
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load videos from IndexedDB on mount
  useEffect(() => {
    getAllVideos()
      .then(setVideos)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const addVideoToLibrary = useCallback(async (video: Omit<LibraryVideo, "id" | "dateAdded">) => {
    const newVideo: LibraryVideo = {
      ...video,
      id: crypto.randomUUID(),
      dateAdded: new Date(),
      watchProgress: 0,
      tags: video.tags || [],
    };

    try {
      await addVideo(newVideo);
      setVideos((prev) => [newVideo, ...prev]);
      return newVideo;
    } catch (error) {
      console.error("Failed to add video:", error);
      throw error;
    }
  }, []);

  const updateVideoInLibrary = useCallback(async (id: string, updates: Partial<LibraryVideo>) => {
    try {
      await updateVideo(id, updates);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
    } catch (error) {
      console.error("Failed to update video:", error);
      throw error;
    }
  }, []);

  const deleteVideoFromLibrary = useCallback(async (id: string) => {
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Failed to delete video:", error);
      throw error;
    }
  }, []);

  return {
    videos,
    isLoading,
    addVideo: addVideoToLibrary,
    updateVideo: updateVideoInLibrary,
    deleteVideo: deleteVideoFromLibrary,
  };
}
