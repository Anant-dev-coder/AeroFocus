export const ROASTS = [
  'Your attention span just filed for early retirement.',
  'You came here for a quick check. Your thumb has other plans.',
  'That was one more scroll than your future self asked for.',
  'Somewhere, a book just sighed.',
  'Your brain called. It wants its last 12 seconds back.',
  'You are training your thumb for a sport nobody respects.',
  'That feed has seen more of you than your friends have today.',
  'Your screen time is developing a screen time problem.',
  'Blink twice if you remember what you opened this app for.',
  'This is not a personality. It is an algorithm with a pulse.',
  'Your dopamine budget is looking aggressively overdrawn.',
  'The next video is not going to fix the last 47 videos.',
  'You have scrolled past three chances to do literally anything else.',
  'Your brain is buffering. Try a thought with a longer runtime.',
  'A goldfish just heard about your focus and felt bad for you.',
  'You are one swipe away from forgetting why you have hands.',
  'The feed says stay. Your actual plans say hello.',
  'Your potential is still there. It is just under 900 short videos.',
  'That scroll was sponsored by absolutely no meaningful outcome.',
  'Your thumb is doing cardio. The rest of you is negotiating.',
  'You have consumed enough clips to qualify as a very small TV.',
  'The algorithm knows your bedtime better than you do.',
  'You are speed-running the day without unlocking any achievements.',
  'Your brain would like to unsubscribe from this meeting.',
  'That was not a break. That was a tiny hostage situation.',
  'Your attention span has entered airplane mode.',
  'The feed is infinite. Your evening is not.',
  'You have watched a lot of people do things. Your turn.',
  'Your screen is full. Your to-do list is still open.',
  'The scroll stops here. Your excuses can take a number.',
];

export const ROAST_THRESHOLDS = [10, 50, 100, 150, 200, 250, 300, 500];

export function getRoastAtThreshold(count: number): string {
  return ROASTS[Math.floor(count / 10) % ROASTS.length];
}
