import { MortalityModifier } from '../../types/knowledge/mortalityModifier';

/**
 * Mortality-modifier knowledge base.
 *
 * Modifiers are all-cause mortality factors that act independently of
 * specific disease pathways (e.g., social connections, time in nature).
 * Every JSON file under this directory is auto-discovered and registered
 * under its metadata.id.
 */
const modifierModules = import.meta.glob('./*/*.json', { eager: true }) as Record<
  string,
  { default: unknown }
>;

const modifierKB = new Map<string, MortalityModifier>();

for (const [path, module] of Object.entries(modifierModules)) {
  const modifier = module.default as MortalityModifier;
  if (!modifier?.metadata?.id) {
    throw new Error(`Mortality modifier ${path} is missing metadata.id`);
  }
  if (modifierKB.has(modifier.metadata.id)) {
    throw new Error(`Duplicate modifier id "${modifier.metadata.id}" in ${path}`);
  }
  modifierKB.set(modifier.metadata.id, modifier);
}

/**
 * Load all mortality modifiers into a Map keyed by modifier ID.
 * (Async for historical API compatibility; modifiers are bundled statically.)
 */
export async function loadModifierKB(): Promise<Map<string, MortalityModifier>> {
  return new Map(modifierKB);
}

/**
 * Get a single modifier by ID
 */
export function getModifier(modifierId: string): MortalityModifier | null {
  return modifierKB.get(modifierId) ?? null;
}

/**
 * Get all available modifier IDs
 */
export function getAvailableModifierIds(): string[] {
  return Array.from(modifierKB.keys());
}

/**
 * Get modifiers by category
 */
export async function getModifiersByCategory(category: string): Promise<MortalityModifier[]> {
  return Array.from(modifierKB.values()).filter(m => m.metadata.category === category);
}
