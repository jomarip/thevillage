/**
 * Volunteer Activity Types
 * Shared constant for activity definitions across the application
 */

export interface Activity {
  id: number;
  name: string;
  description: string;
}

export const ACTIVITIES: Activity[] = [
  { id: 1, name: "Tutoring", description: "Academic tutoring and homework help" },
  { id: 2, name: "Mentoring", description: "Youth mentorship and guidance" },
  { id: 3, name: "Community Service", description: "General volunteer work" },
  { id: 4, name: "Home Repair", description: "Helping with home maintenance" },
  { id: 5, name: "Food Distribution", description: "Food bank and meal prep" },
  { id: 6, name: "Transportation", description: "Driving community members" },
  { id: 7, name: "Administrative", description: "Office and organizational support" },
  { id: 8, name: "Event Support", description: "Helping with community events" },
  { id: 9, name: "Other", description: "Other volunteer activities" },
];

/**
 * Get activity name by ID
 */
export function getActivityName(activityId: number): string {
  const activity = ACTIVITIES.find((a) => a.id === activityId);
  return activity?.name || "Unknown Activity";
}

/**
 * Get activity by ID
 */
export function getActivity(activityId: number): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === activityId);
}
