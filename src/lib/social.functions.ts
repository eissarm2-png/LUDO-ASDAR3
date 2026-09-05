import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FriendRow = {
  friendship_id: string;
  user_id: string;
  display_name: string;
  avatar: string;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
  created_at: string;
};

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** قائمة الأصدقاء وطلبات الصداقة */
export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FriendRow[]> => {
    const { data, error } = await context.supabase.rpc("list_friends" as never);
    if (error) throw new Error(error.message);
    return (data as unknown as FriendRow[]) ?? [];
  });

/** إرسال طلب صداقة باسم اللاعب */
export const addFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("send_friend_request", {
      _name: data.name,
    } as never);
    if (error) throw new Error(error.message);
    return (res as unknown as { ok: boolean; reason?: string }) ?? { ok: false, reason: "unknown" };
  });

/** قبول أو رفض طلب صداقة */
export const respondFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; accept: boolean }) => data)
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("respond_friend_request", {
      _id: data.id,
      _accept: data.accept,
    } as never);
    if (error) throw new Error(error.message);
    return (res as unknown as { ok: boolean; reason?: string }) ?? { ok: false, reason: "unknown" };
  });

/** إشعارات اللاعب */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationRow[]> => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return (data as unknown as NotificationRow[]) ?? [];
  });

/** تعليم إشعار واحد أو كل الإشعارات كمقروء */
export const readNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id?: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("mark_notifications_read", {
      _id: data.id ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type LivePlayerRow = {
  room_id: string;
  user_id: string;
  display_name: string;
  avatar: string;
  mode: string;
  started_at: string;
};

/** قائمة اللاعبين الذين يلعبون حالياً */
export const listLivePlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LivePlayerRow[]> => {
    const { data, error } = await context.supabase
      .from("room_members")
      .select(
        `
        room_id,
        user_id,
        display_name,
        avatar,
        rooms!inner ( mode, started_at )
      `,
      )
      .eq("rooms.status", "playing")
      .not("rooms.started_at", "is", null)
      .order("joined_at", { ascending: false })
      .limit(20);

    if (error) return [];

    return data.map(
      (d: {
        room_id: string;
        user_id: string;
        display_name: string;
        avatar: string;
        rooms: { mode: string; started_at: string };
      }) => ({
        room_id: d.room_id,
        user_id: d.user_id,
        display_name: d.display_name,
        avatar: d.avatar,
        mode: d.rooms.mode,
        started_at: d.rooms.started_at,
      }),
    );
  });
