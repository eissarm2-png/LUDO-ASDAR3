-- Migration: 20260905050000_admin_transfer_with_notifications.sql
-- Enables atomic points transfer by admins with instant notification creation and real-time support.

-- 1. Allow admins to insert/update notifications for any user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins can manage all notifications'
  ) THEN
    CREATE POLICY "Admins can manage all notifications"
    ON public.notifications FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 2. Enhanced atomic transfer function
CREATE OR REPLACE FUNCTION public.admin_transfer_points(
  _receiver_id UUID,
  _gold INT DEFAULT 0,
  _diamonds INT DEFAULT 0,
  _xp INT DEFAULT 0,
  _points INT DEFAULT 0,
  _note TEXT DEFAULT 'تحويل إداري'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _admin_id UUID := auth.uid();
  _p public.profiles%ROWTYPE;
  _notif_id UUID;
  _title TEXT := 'تم استلام نقاط جديدة 🎉';
  _body TEXT;
  _parts TEXT[] := ARRAY[]::TEXT[];
BEGIN
  PERFORM public.require_admin();

  -- 1. Check receiver exists
  SELECT * INTO _p FROM public.profiles WHERE id = _receiver_id;
  IF _p.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'recipient_not_found');
  END IF;

  -- 2. Atomic update via grant_rewards
  PERFORM public.grant_rewards(
    _receiver_id,
    'admin_transfer',
    COALESCE(_gold, 0),
    COALESCE(_diamonds, 0),
    COALESCE(_xp, 0),
    jsonb_build_object(
      'note', COALESCE(_note, ''),
      'sender_id', _admin_id,
      'is_self', (_admin_id = _receiver_id)
    )
  );

  -- 3. Update points if specified
  IF COALESCE(_points, 0) <> 0 THEN
    UPDATE public.profiles
    SET points = GREATEST(points + _points, 0),
        updated_at = now()
    WHERE id = _receiver_id;
  END IF;

  -- 4. Log admin audit action
  PERFORM public.log_admin(
    'transfer_points',
    _receiver_id,
    jsonb_build_object(
      'gold', _gold,
      'diamonds', _diamonds,
      'xp', _xp,
      'points', _points,
      'note', COALESCE(_note, ''),
      'self_transfer', (_admin_id = _receiver_id)
    )
  );

  -- 5. Build localized notification description
  IF COALESCE(_gold, 0) > 0 THEN
    _parts := array_append(_parts, '+' || _gold || ' ذهب');
  END IF;
  IF COALESCE(_diamonds, 0) > 0 THEN
    _parts := array_append(_parts, '+' || _diamonds || ' ألماس');
  END IF;
  IF COALESCE(_points, 0) > 0 THEN
    _parts := array_append(_parts, '+' || _points || ' نقطة');
  END IF;
  IF COALESCE(_xp, 0) > 0 THEN
    _parts := array_append(_parts, '+' || _xp || ' XP');
  END IF;

  IF array_length(_parts, 1) IS NULL THEN
    _body := 'تم تحديث رصيدك من قبل الإدارة';
  ELSE
    _body := 'تم إضافة ' || array_to_string(_parts, ' و ') || ' إلى رصيدك';
  END IF;

  IF _note IS NOT NULL AND btrim(_note) <> '' AND _note <> 'تحويل إداري' AND _note <> 'تعديل إداري' THEN
    _body := _body || ' (' || _note || ')';
  END IF;

  -- 6. Insert in-app notification (works for both self and any other user because SECURITY DEFINER)
  INSERT INTO public.notifications (user_id, kind, title, body, created_at)
  VALUES (_receiver_id, 'points_transfer', _title, _body, now())
  RETURNING id INTO _notif_id;

  -- 7. Get fresh profile state
  SELECT * INTO _p FROM public.profiles WHERE id = _receiver_id;

  RETURN jsonb_build_object(
    'ok', true,
    'notification_id', _notif_id,
    'title', _title,
    'body', _body,
    'profile', jsonb_build_object(
      'id', _p.id,
      'gold', _p.gold,
      'diamonds', _p.diamonds,
      'points', _p.points,
      'xp', _p.xp,
      'level', _p.level
    )
  );
END; $$;

-- 3. Also enhance admin_adjust_economy so legacy calls also create notifications
CREATE OR REPLACE FUNCTION public.admin_adjust_economy(_uid uuid, _gold integer, _diamonds integer, _xp integer, _note text DEFAULT NULL)
RETURNS TABLE(gold integer, diamonds integer, xp integer, level integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _parts TEXT[] := ARRAY[]::TEXT[];
  _body TEXT;
BEGIN
  PERFORM public.require_admin();
  PERFORM public.grant_rewards(_uid, 'admin', COALESCE(_gold,0), COALESCE(_diamonds,0), COALESCE(_xp,0),
    jsonb_build_object('note', COALESCE(_note,''), 'by', auth.uid()));
  PERFORM public.log_admin('adjust_economy', _uid,
    jsonb_build_object('gold',_gold,'diamonds',_diamonds,'xp',_xp,'note',COALESCE(_note,'')));

  -- Build notification
  IF COALESCE(_gold, 0) > 0 THEN _parts := array_append(_parts, '+' || _gold || ' ذهب'); END IF;
  IF COALESCE(_diamonds, 0) > 0 THEN _parts := array_append(_parts, '+' || _diamonds || ' ألماس'); END IF;
  IF COALESCE(_xp, 0) > 0 THEN _parts := array_append(_parts, '+' || _xp || ' XP'); END IF;

  IF array_length(_parts, 1) IS NOT NULL THEN
    _body := 'تم إضافة ' || array_to_string(_parts, ' و ') || ' إلى رصيدك';
    IF _note IS NOT NULL AND btrim(_note) <> '' AND _note <> 'تعديل إداري' THEN
      _body := _body || ' (' || _note || ')';
    END IF;
    INSERT INTO public.notifications (user_id, kind, title, body, created_at)
    VALUES (_uid, 'points_transfer', 'تم استلام نقاط جديدة 🎉', _body, now());
  END IF;

  RETURN QUERY SELECT p.gold, p.diamonds, p.xp, p.level FROM public.profiles p WHERE p.id = _uid;
END; $$;
