/**
 * Authoritative 5-Class mapping verified with YOLO11m / YOLO11s RDD2022 checkpoint.
 *
 * 0: longitudinal crack -> Longitudinal Crack
 * 1: transverse crack   -> Transverse Crack
 * 2: alligator crack    -> Alligator Crack
 * 3: other corruption   -> Other Corruption
 * 4: pothole / Pothole  -> Pothole
 */

export const LOCKED_CLASS_MAPPING: Record<number, string> = {
  0: 'longitudinal crack',
  1: 'transverse crack',
  2: 'alligator crack',
  3: 'other corruption',
  4: 'pothole',
};

export const LOCKED_DISPLAY_LABELS: Record<number, string> = {
  0: 'Longitudinal Crack',
  1: 'Transverse Crack',
  2: 'Alligator Crack',
  3: 'Other Corruption',
  4: 'Pothole',
};

export function formatDefectClass(nameOrId: string | number | undefined | null): string {
  if (nameOrId === undefined || nameOrId === null || nameOrId === '') {
    return 'Road Defect';
  }

  if (typeof nameOrId === 'number') {
    return LOCKED_DISPLAY_LABELS[nameOrId] || `Class ${nameOrId}`;
  }

  const normalized = nameOrId.toLowerCase().trim();
  switch (normalized) {
    case '0':
    case 'longitudinal crack':
    case 'd00':
      return 'Longitudinal Crack';
    case '1':
    case 'transverse crack':
    case 'd10':
      return 'Transverse Crack';
    case '2':
    case 'alligator crack':
    case 'd20':
      return 'Alligator Crack';
    case '3':
    case 'other corruption':
    case 'd40':
    case 'other':
      return 'Other Corruption';
    case '4':
    case 'pothole':
      return 'Pothole';
    default:
      return nameOrId.charAt(0).toUpperCase() + nameOrId.slice(1);
  }
}

export function getDefectClassId(name: string): number {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes('longitudinal')) return 0;
  if (normalized.includes('transverse')) return 1;
  if (normalized.includes('alligator')) return 2;
  if (normalized.includes('corruption') || normalized.includes('other')) return 3;
  if (normalized.includes('pothole')) return 4;
  return 4; // fallback to 4
}
