export function stripEmojis(str) {
  if (!str) return '';
  // Basic regex to remove common emoji ranges.
  // This covers most standard emojis but may not be exhaustive.
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${display}:${String(m).padStart(2,'0')} ${period}`;
}
