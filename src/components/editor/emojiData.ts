/**
 * Shared emoji dataset + recents ($0, zero deps).
 * Each entry carries keywords so both the picker search and the
 * `:shortcode` autocomplete match on names, not just the glyph.
 */

export interface EmojiEntry {
  char: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: EmojiEntry[];
}

const e = (char: string, name: string, keywords: string[] = []): EmojiEntry => ({
  char,
  name,
  keywords: [name.replace(/_/g, ' '), ...keywords],
});

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    icon: '😀',
    emojis: [
      e('😀', 'grinning', ['happy', 'smile']),
      e('😃', 'smiley', ['happy', 'joy']),
      e('😄', 'smile', ['happy', 'laugh']),
      e('😁', 'grin', ['happy', 'teeth']),
      e('😅', 'sweat_smile', ['nervous', 'relief']),
      e('😂', 'joy', ['laugh', 'tears', 'lol']),
      e('🤣', 'rofl', ['laugh', 'rolling']),
      e('😊', 'blush', ['happy', 'shy']),
      e('😇', 'innocent', ['angel', 'halo']),
      e('🙂', 'slightly_smiling', ['ok']),
      e('😉', 'wink', ['flirt']),
      e('😌', 'relieved', ['calm', 'peace']),
      e('😍', 'heart_eyes', ['love', 'crush']),
      e('🥰', 'smiling_hearts', ['love', 'adore']),
      e('😘', 'kiss', ['love']),
      e('🤔', 'thinking', ['hmm', 'consider']),
      e('🤗', 'hugging', ['hug', 'care']),
      e('🤫', 'shushing', ['quiet', 'secret']),
      e('😐', 'neutral', ['meh']),
      e('😑', 'expressionless', ['blank']),
      e('😏', 'smirk', ['smug']),
      e('🙄', 'roll_eyes', ['annoyed']),
      e('😬', 'grimace', ['awkward']),
      e('😴', 'sleeping', ['tired', 'zzz']),
      e('🤯', 'exploding_head', ['mind_blown', 'wow']),
      e('🤠', 'cowboy', ['yeehaw']),
      e('🥳', 'partying', ['celebrate', 'birthday']),
      e('😎', 'sunglasses', ['cool']),
      e('🤓', 'nerd', ['geek', 'glasses']),
      e('😢', 'cry', ['sad', 'tears']),
      e('😭', 'sob', ['sad', 'bawl']),
      e('😤', 'triumph', ['frustrated', 'huff']),
      e('😡', 'rage', ['angry', 'mad']),
      e('🥺', 'pleading', ['puppy', 'please']),
      e('😱', 'scream', ['scared', 'shock']),
    ],
  },
  {
    id: 'gestures',
    label: 'Gestures',
    icon: '👍',
    emojis: [
      e('👍', 'thumbsup', ['like', 'approve', 'yes']),
      e('👎', 'thumbsdown', ['dislike', 'no']),
      e('👊', 'fist', ['punch', 'bump']),
      e('✊', 'raised_fist', ['power', 'solidarity']),
      e('👏', 'clap', ['applause', 'bravo']),
      e('🙌', 'raised_hands', ['hooray', 'praise']),
      e('🤝', 'handshake', ['deal', 'agree']),
      e('🙏', 'pray', ['thanks', 'please', 'namaste']),
      e('✌️', 'victory', ['peace', 'two']),
      e('🤘', 'rock_on', ['metal', 'horns']),
      e('👌', 'ok_hand', ['perfect']),
      e('✋', 'raised_hand', ['high_five', 'stop']),
      e('💪', 'muscle', ['strong', 'flex']),
      e('👀', 'eyes', ['look', 'watching']),
      e('🙈', 'see_no_evil', ['monkey']),
      e('🙉', 'hear_no_evil', ['monkey']),
      e('🙊', 'speak_no_evil', ['monkey']),
      e('💯', 'hundred', ['100', 'perfect', 'score']),
    ],
  },
  {
    id: 'hearts',
    label: 'Hearts',
    icon: '❤️',
    emojis: [
      e('❤️', 'heart', ['love', 'red']),
      e('🧡', 'orange_heart', ['love']),
      e('💛', 'yellow_heart', ['love']),
      e('💚', 'green_heart', ['love']),
      e('💙', 'blue_heart', ['love']),
      e('💜', 'purple_heart', ['love']),
      e('🖤', 'black_heart', ['love']),
      e('🤍', 'white_heart', ['love']),
      e('💔', 'broken_heart', ['heartbreak', 'sad']),
      e('💕', 'two_hearts', ['love']),
      e('💖', 'sparkling_heart', ['love']),
      e('🔥', 'fire', ['hot', 'lit', 'trending']),
      e('✨', 'sparkles', ['shine', 'new', 'magic']),
      e('⭐', 'star', ['favorite', 'rating']),
      e('🌟', 'glowing_star', ['shine']),
      e('💡', 'bulb', ['idea', 'light']),
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    icon: '📝',
    emojis: [
      e('📝', 'memo', ['note', 'write', 'pencil']),
      e('📎', 'paperclip', ['attach']),
      e('📌', 'pushpin', ['pin']),
      e('📍', 'round_pin', ['location', 'map']),
      e('📅', 'calendar', ['date', 'schedule']),
      e('⏰', 'alarm', ['time', 'wake', 'deadline']),
      e('⏳', 'hourglass', ['time', 'waiting']),
      e('💰', 'moneybag', ['cash', 'rich']),
      e('💳', 'credit_card', ['payment']),
      e('🔑', 'key', ['password', 'access']),
      e('🔒', 'lock', ['secure', 'private']),
      e('🔓', 'unlock', ['open', 'public']),
      e('🔔', 'bell', ['notification', 'alert']),
      e('🔕', 'no_bell', ['mute', 'silent']),
      e('✅', 'check', ['done', 'todo', 'correct']),
      e('❌', 'x', ['wrong', 'no', 'delete']),
      e('❗', 'exclamation', ['important', 'alert']),
      e('❓', 'question', ['help', 'confused']),
      e('💻', 'computer', ['laptop', 'code']),
      e('📱', 'phone', ['mobile', 'iphone']),
      e('📊', 'chart', ['graph', 'stats', 'data']),
      e('📈', 'chart_up', ['growth', 'trending']),
      e('🎯', 'target', ['goal', 'bullseye']),
      e('💾', 'floppy', ['save']),
      e('🗑️', 'trash', ['delete', 'bin']),
      e('♻️', 'recycle', ['reuse', 'green']),
    ],
  },
  {
    id: 'celebration',
    label: 'Fun',
    icon: '🎉',
    emojis: [
      e('🎉', 'party', ['celebrate', 'tada']),
      e('🎊', 'confetti', ['celebrate']),
      e('🎈', 'balloon', ['party']),
      e('🎁', 'gift', ['present', 'birthday']),
      e('🏆', 'trophy', ['win', 'champion']),
      e('🥇', 'gold_medal', ['first', 'win']),
      e('🚀', 'rocket', ['launch', 'ship', 'fast']),
      e('🌈', 'rainbow', ['colorful', 'pride']),
      e('☀️', 'sun', ['sunny', 'weather', 'morning']),
      e('🌙', 'moon', ['night']),
      e('☕', 'coffee', ['morning', 'break']),
      e('🍕', 'pizza', ['food', 'lunch']),
      e('✈️', 'airplane', ['travel', 'flight', 'trip']),
      e('🚗', 'car', ['drive', 'travel']),
      e('🏠', 'house', ['home']),
      e('⚽', 'soccer', ['sport', 'football']),
      e('🎵', 'music', ['song', 'note']),
      e('📚', 'books', ['read', 'study']),
    ],
  },
];

export const ALL_EMOJIS: EmojiEntry[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

/** Case-insensitive name/keyword search, most relevant first. */
export function searchEmojis(query: string, limit = 24): EmojiEntry[] {
  const q = query.trim().toLowerCase().replace(/^:/, '');
  if (!q) return ALL_EMOJIS.slice(0, limit);
  const starts: EmojiEntry[] = [];
  const contains: EmojiEntry[] = [];
  for (const emoji of ALL_EMOJIS) {
    const hay = emoji.keywords.join(' ');
    if (emoji.name.startsWith(q)) starts.push(emoji);
    else if (hay.includes(q)) contains.push(emoji);
    if (starts.length + contains.length >= limit * 2) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

// ── Recents (localStorage, per browser, $0) ────────────────────────────────

const RECENT_KEY = 'collabdocs-recent-emojis';
const RECENT_MAX = 16;

export function getRecentEmojis(): EmojiEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const chars = JSON.parse(raw) as string[];
    const byChar = new Map(ALL_EMOJIS.map((emoji) => [emoji.char, emoji]));
    return chars.map((c) => byChar.get(c)).filter((x): x is EmojiEntry => !!x);
  } catch {
    return [];
  }
}

export function recordRecentEmoji(char: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const chars = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [char, ...chars.filter((c) => c !== char)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — recents simply don't persist.
  }
}
