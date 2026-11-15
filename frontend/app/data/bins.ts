export type Bin = {
  id: string;
  building: string;
  floor: number;
  description: string;
  name?: string;
  status: 'full' | 'not full';
  fullSince: string | null;
};

// Fixed timestamps make the mock collection queue reproducible.
export const demoTime = new Date('2026-11-14T15:30:00-05:00');
export const demoBin: Bin = {
  id: 'SRT-DEMO', name: 'Demo bin', building: 'TTC', floor: 2,
  description: 'Room 208.', status: 'not full', fullSince: null,
};

export const bins: Bin[] = [
  { id: 'SRT-001', building: 'Tisch Library', floor: 2, description: 'Behind room 223, on the left beside the study lounge entrance.', status: 'full', fullSince: '2026-11-14T13:05:00-05:00' },
  { id: 'SRT-002', building: 'Campus Center', floor: 1, description: 'Next to the info, opposite the east entrance.', status: 'full', fullSince: '2026-11-14T14:18:00-05:00' },
  { id: 'SRT-003', building: 'Science Hall', floor: 3, description: 'Outside lab 310, at the end of the corridor near the elevators.', status: 'full', fullSince: '2026-11-14T15:02:00-05:00' },
  { id: 'SRT-004', building: 'Campus Center', floor: 2, description: 'Next to Hotung Cafe, to the right of the vending machines.', status: 'not full', fullSince: null },
  { id: 'SRT-005', building: 'Tisch Library', floor: 1, description: 'Past the front desk, beside the ground-floor printing station.', status: 'not full', fullSince: null },
  { id: 'SRT-006', building: 'JCC', floor: 1, description: 'In the main lobby, underneath the notice board by the stairs.', status: 'not full', fullSince: null },
  { id: 'SRT-007', building: 'Tisch Library', floor: 3, description: 'Beside the quiet reading area, across from room 305.', status: 'not full', fullSince: null },
  { id: 'SRT-008', building: 'Campus Center', floor: 0, description: 'At the bottom of the west staircase, next to the courtyard doors.', status: 'not full', fullSince: null },
];

export function sortBins(items: Bin[]) {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'full' ? -1 : 1;
    // Keep the physical demo bin visible at the top when it needs collection.
    if (a.status === 'full') {
      if (a.id === demoBin.id) return -1;
      if (b.id === demoBin.id) return 1;
    }
    if (a.fullSince && b.fullSince) return Date.parse(a.fullSince) - Date.parse(b.fullSince);
    if (a.fullSince) return -1;
    if (b.fullSince) return 1;
    return a.id.localeCompare(b.id);
  });
}
