-- 1. Add linked_user_id to chatbots
ALTER TABLE public.chatbots ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

-- 2. Function to automatically mirror messages between real people
CREATE OR REPLACE FUNCTION public.mirror_real_person_message()
RETURNS trigger AS $$
DECLARE
  v_sender_bot record;
  v_sender_profile record;
  v_target_bot_id uuid;
BEGIN
  -- We ONLY care about messages sent BY a real user TO the interface
  IF NEW.role != 'user' THEN
    RETURN NEW;
  END IF;

  -- Verify this message was sent to a "Real Person"
  SELECT * INTO v_sender_bot FROM public.chatbots WHERE id = NEW.chatbot_id AND role = 'Real Person';
  
  -- If not a Real Person chat, do nothing
  IF v_sender_bot IS NULL OR v_sender_bot.linked_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the mirror chatbot (belonging to the target user, pointing back at the sender)
  SELECT id INTO v_target_bot_id FROM public.chatbots 
  WHERE user_id = v_sender_bot.linked_user_id 
    AND linked_user_id = v_sender_bot.user_id 
    AND role = 'Real Person' LIMIT 1;

  -- If target user doesn't have a chat with sender yet, auto-create it!
  IF v_target_bot_id IS NULL THEN
    SELECT * INTO v_sender_profile FROM public.profiles WHERE id = v_sender_bot.user_id;
    
    INSERT INTO public.chatbots (user_id, linked_user_id, name, role, specifications, avatar_url, mood_level)
    VALUES (
      v_sender_bot.linked_user_id,  -- belongs to receiving user
      v_sender_bot.user_id,         -- points back to sender
      COALESCE(v_sender_profile.name, 'Real Person'),
      'Real Person', 
      'Real user chat', 
      v_sender_profile.avatar_url, 
      50
    ) RETURNING id INTO v_target_bot_id;
  END IF;

  -- Insert the mirrored message! 
  -- We give it role 'bot' because to the receiving person, the message came from the "other side"
  INSERT INTO public.messages (chatbot_id, user_id, role, content, created_at)
  VALUES (v_target_bot_id, v_sender_bot.linked_user_id, 'bot', NEW.content, NEW.created_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the trigger to messages
DROP TRIGGER IF EXISTS tr_mirror_real_person_message ON public.messages;
CREATE TRIGGER tr_mirror_real_person_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.mirror_real_person_message();
