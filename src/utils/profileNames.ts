/**
 * Friendly default profile names in the form "green-falcon-40" —
 * adjective-animal-age, so an auto-created profile is still recognizable.
 */

const ADJECTIVES = [
  'green', 'swift', 'calm', 'brave', 'bright', 'quiet', 'lucky', 'wild',
  'gentle', 'bold', 'clever', 'sunny', 'silver', 'golden', 'cosmic', 'merry',
];

const ANIMALS = [
  'falcon', 'otter', 'panda', 'tiger', 'heron', 'badger', 'dolphin', 'lynx',
  'raven', 'ibex', 'koala', 'marmot', 'osprey', 'puffin', 'wombat', 'yak',
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** e.g. generateProfileName(40) -> "green-falcon-40" */
export function generateProfileName(age: number): string {
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${age}`;
}

/**
 * Swap the trailing age segment when the age slider moves, preserving the
 * adjective-animal part (only when the name still looks auto-generated).
 */
export function withUpdatedAge(name: string, age: number): string {
  const match = name.match(/^([a-z]+-[a-z]+)-\d+$/);
  return match ? `${match[1]}-${age}` : name;
}
