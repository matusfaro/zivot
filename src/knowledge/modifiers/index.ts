import { MortalityModifier } from '../../types/knowledge/mortalityModifier';

// Import all modifier JSON files
import dogOwnershipData from './social/dog_ownership.json';
import religiousAttendanceData from './social/religious_attendance.json';
import socialConnectionsData from './social/social_connections.json';
import volunteeringData from './social/volunteering.json';
import natureExposureData from './environmental/nature_exposure.json';
import creativeHobbiesData from './cultural/creative_hobbies.json';

/**
 * Load all mortality modifiers into a Map
 *
 * Modifiers are factors that affect overall mortality risk independently
 * of specific disease pathways (e.g., social connections, time in nature).
 *
 * @returns Promise resolving to Map of modifierId → MortalityModifier
 */
export async function loadModifierKB(): Promise<Map<string, MortalityModifier>> {
  const kb = new Map<string, MortalityModifier>();

  // Social modifiers
  kb.set('dog_ownership', dogOwnershipData as unknown as MortalityModifier);
  kb.set('religious_attendance', religiousAttendanceData as unknown as MortalityModifier);
  kb.set('social_connections', socialConnectionsData as unknown as MortalityModifier);
  kb.set('volunteering', volunteeringData as unknown as MortalityModifier);

  // Environmental modifiers
  kb.set('nature_exposure', natureExposureData as unknown as MortalityModifier);

  // Cultural modifiers
  kb.set('creative_hobbies', creativeHobbiesData as unknown as MortalityModifier);

  console.log(`[Modifier KB] Loaded ${kb.size} mortality modifiers`);
  return kb;
}

/**
 * Get a single modifier by ID
 *
 * @param modifierId ID of the modifier to retrieve
 * @returns MortalityModifier or null if not found
 */
export function getModifier(modifierId: string): MortalityModifier | null {
  switch (modifierId) {
    case 'dog_ownership':
      return dogOwnershipData as unknown as MortalityModifier;
    case 'religious_attendance':
      return religiousAttendanceData as unknown as MortalityModifier;
    case 'social_connections':
      return socialConnectionsData as unknown as MortalityModifier;
    case 'volunteering':
      return volunteeringData as unknown as MortalityModifier;
    case 'nature_exposure':
      return natureExposureData as unknown as MortalityModifier;
    case 'creative_hobbies':
      return creativeHobbiesData as unknown as MortalityModifier;
    default:
      return null;
  }
}

/**
 * Get all available modifier IDs
 *
 * @returns Array of modifier IDs
 */
export function getAvailableModifierIds(): string[] {
  return [
    'dog_ownership',
    'religious_attendance',
    'social_connections',
    'volunteering',
    'nature_exposure',
    'creative_hobbies',
  ];
}

/**
 * Get modifiers by category
 *
 * @param category Modifier category to filter by
 * @returns Array of modifiers in that category
 */
export async function getModifiersByCategory(category: string): Promise<MortalityModifier[]> {
  const allModifiers = await loadModifierKB();
  return Array.from(allModifiers.values()).filter(
    (modifier) => modifier.metadata.category === category
  );
}
