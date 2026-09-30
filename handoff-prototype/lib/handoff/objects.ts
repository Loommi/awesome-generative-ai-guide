/**
 * The catalog of persistent objects. Both screens render every object from the
 * start; only ids travel over the network. The mission layer supplies the content.
 */
import { MODULES, type ModuleSpec } from "@/lib/mission/modules";

export type ObjectSpec = ModuleSpec;
export const OBJECTS: ObjectSpec[] = MODULES;
export const OBJECT_IDS = OBJECTS.map((o) => o.id);
export const isKnownObject = (id: string) => OBJECT_IDS.includes(id);
