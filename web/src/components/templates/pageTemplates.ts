export interface PageTemplate {
  id: number
  name: string
  slots: number[]
}

export const pageTemplates: PageTemplate[] = [
  {
    id: 0,
    name: '3\u2011Up (Row of 3)',
    slots: [0, 1, 2], // CSS: .slot1, .slot2, .slot3
  },
  {
    id: 1,
    name: '2\u2011Up (Side-by-Side)',
    slots: [3, 4], // CSS: .slot4, .slot5
  },
  {
    id: 2,
    name: '4\u2011Up (Grid 2\u00d72)',
    slots: [5, 6, 7, 8], // CSS: .slot6, .slot7, .slot8, .slot9
  },
  {
    id: 3,
    name: '1\u2011Up (Full-Bleed)',
    slots: [9], // CSS: .slot10
  },
  // Add more templates as needed
]
