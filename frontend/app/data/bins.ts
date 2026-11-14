export type Bin = {
  id: string;
  building: string;
  floor: number;
  description: string;
  fillLevel: number;
  fullSince: string | null;
};

// Fixed timestamps make the mock collection queue reproducible.
export const demoTime = new Date('2026-11-14T15:30:00-05:00');
export const bins: Bin[] = [
  { id: 'SRT-001', building: 'Tisch Library', floor: 2, description: 'Behind room 223, on the left beside the study lounge entrance.', fillLevel: 100, fullSince: '2026-11-14T13:05:00-05:00' },
  { id: 'SRT-002', building: 'Campus Center', floor: 1, description: 'Next to the main café, opposite the east entrance.', fillLevel: 100, fullSince: '2026-11-14T14:18:00-05:00' },
  { id: 'SRT-003', building: 'Science Hall', floor: 3, description: 'Outside lab 310, at the end of the corridor near the elevators.', fillLevel: 100, fullSince: '2026-11-14T15:02:00-05:00' },
  { id: 'SRT-004', building: 'Campus Center', floor: 2, description: 'Inside the student lounge, to the right of the vending machines.', fillLevel: 87, fullSince: null },
  { id: 'SRT-005', building: 'Tisch Library', floor: 1, description: 'Past the front desk, beside the ground-floor printing station.', fillLevel: 74, fullSince: null },
  { id: 'SRT-006', building: 'Science Hall', floor: 1, description: 'In the main lobby, underneath the notice board by the stairs.', fillLevel: 52, fullSince: null },
  { id: 'SRT-007', building: 'Tisch Library', floor: 3, description: 'Beside the quiet reading area, across from room 305.', fillLevel: 31, fullSince: null },
  { id: 'SRT-008', building: 'Campus Center', floor: 0, description: 'At the bottom of the west staircase, next to the courtyard doors.', fillLevel: 18, fullSince: null },
];

export function sortBins(items: Bin[]) {
  return [...items].sort((a, b) => {
    if (a.fullSince && b.fullSince) return Date.parse(a.fullSince) - Date.parse(b.fullSince);
    if (a.fullSince) return -1;
    if (b.fullSince) return 1;
    return b.fillLevel - a.fillLevel || a.id.localeCompare(b.id);
  });
}
