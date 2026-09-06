import { useEffect, useState, useCallback } from "react";
import { AVATAR_FRAMES, getUnseenStoreFramesCount, markAllFramesSeen } from "@/lib/avatar-frames";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useFrameStore() {
  const { profile, user } = useAuth();
  const [ownedFrameCodes, setOwnedFrameCodes] = useState<Set<string>>(new Set(["frame_default"]));
  const [newFramesCount, setNewFramesCount] = useState(0);

  const checkOwned = useCallback(async () => {
    const owned = new Set<string>(["frame_default"]);
    if (profile?.frame) {
      owned.add(profile.frame);
    }

    if (user?.id) {
      try {
        const { data } = await supabase
          .from("user_items")
          .select("code")
          .eq("user_id", user.id)
          .eq("kind", "frame");

        if (data) {
          data.forEach((item) => owned.add(item.code));
        }
      } catch {
        // use local
      }
    }

    // Also check local storage for offline / guest
    try {
      const localOwned = localStorage.getItem("ludo_local_owned_frames");
      if (localOwned) {
        const parsed: string[] = JSON.parse(localOwned);
        parsed.forEach((c) => owned.add(c));
      }
    } catch {
      // ignore
    }

    setOwnedFrameCodes(owned);
    const count = getUnseenStoreFramesCount(owned);
    setNewFramesCount(count);
  }, [profile?.frame, user?.id]);

  useEffect(() => {
    void checkOwned();
  }, [checkOwned]);

  const markSeen = useCallback(() => {
    markAllFramesSeen();
    setNewFramesCount(0);
  }, []);

  const addOwnedLocal = useCallback((code: string) => {
    try {
      const localOwned = localStorage.getItem("ludo_local_owned_frames");
      const list: string[] = localOwned ? JSON.parse(localOwned) : [];
      if (!list.includes(code)) {
        list.push(code);
        localStorage.setItem("ludo_local_owned_frames", JSON.stringify(list));
      }
    } catch {
      // ignore
    }
    setOwnedFrameCodes((prev) => new Set([...prev, code]));
  }, []);

  return {
    allFrames: AVATAR_FRAMES,
    ownedFrameCodes,
    hasNewFrames: newFramesCount > 0,
    newFramesCount,
    markSeen,
    addOwnedLocal,
    refresh: checkOwned,
  };
}
