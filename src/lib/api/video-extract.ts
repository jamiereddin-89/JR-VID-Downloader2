import { supabase } from '@/integrations/supabase/client';

export interface ExtractedVideo {
  title: string;
  streamUrl?: string;
  downloadUrl?: string;
  thumbnail?: string;
  source: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ExtractResponse {
  success: boolean;
  error?: string;
  data?: ExtractedVideo;
}

export async function extractVideoFromUrl(url: string): Promise<ExtractResponse> {
  const { data, error } = await supabase.functions.invoke('extract-video', {
    body: { url },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}
