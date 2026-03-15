export type StackType = "graveyard";

export type StackMeta = {
  type: StackType;
  // Shape IDs ordered bottom (index 0) to top (last index) — mirrors z-order intent
  cardOrder: string[];
};

const stackRegistry = new Map<string, StackMeta>();
let graveyardGroupId: string | null = null;

export function registerStack(groupId: string, meta: StackMeta): void {
  stackRegistry.set(groupId, meta);
}

export function getStack(groupId: string): StackMeta | undefined {
  return stackRegistry.get(groupId);
}

export function removeStack(groupId: string): void {
  if (graveyardGroupId === groupId) {
    graveyardGroupId = null;
  }
  stackRegistry.delete(groupId);
}

export function hasGraveyard(): boolean {
  return graveyardGroupId !== null;
}

export function getGraveyardGroupId(): string | null {
  return graveyardGroupId;
}

export function setGraveyard(groupId: string): void {
  graveyardGroupId = groupId;
}

/** Returns the group shape ID for the stack this card belongs to, or null. */
export function getStackForCard(cardShapeId: string): string | null {
  for (const [groupId, meta] of stackRegistry) {
    if (meta.cardOrder.includes(cardShapeId)) return groupId;
  }
  return null;
}

/** Iterate all registered stacks — used for undo/redo sync. */
export function getAllStackIds(): string[] {
  return Array.from(stackRegistry.keys());
}
