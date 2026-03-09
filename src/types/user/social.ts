import { DataPoint, TimeSeries } from '../common/datapoint';

/**
 * Social domain - Tracks social connections, relationships, and community engagement
 * These factors are associated with mortality through multiple pathways:
 * stress buffering, health behavior reinforcement, emotional support
 */
export interface Social {
  // Pet ownership
  petOwnership?: PetOwnership;

  // Social connections and relationships
  connections?: SocialConnections;

  // Religious/spiritual practice
  religiousAttendance?: DataPoint<ReligiousAttendanceFrequency>;

  // Volunteering and community service
  volunteering?: Volunteering;

  // Hobbies and creative activities
  hobbies?: Hobbies;
}

export interface PetOwnership {
  ownsDog?: DataPoint<boolean>;
  ownsCat?: DataPoint<boolean>;
  ownershipDurationYears?: DataPoint<number>; // How long owned current pet(s)
  otherPets?: DataPoint<string[]>; // e.g., ["bird", "fish"]
}

export interface SocialConnections {
  strength?: DataPoint<SocialConnectionStrength>;
  closeRelationshipsCount?: DataPoint<number>; // Number of people you can confide in
  socialActivityFrequency?: DataPoint<SocialActivityFrequency>;
  livesAlone?: DataPoint<boolean>;
  maritalStatus?: DataPoint<MaritalStatus>;
}

export type SocialConnectionStrength =
  | 'isolated' // Few or no social connections
  | 'weak' // Limited social network, infrequent contact
  | 'moderate' // Some close relationships, regular contact
  | 'strong' // Multiple close relationships, frequent contact
  | 'very_strong'; // Rich social network, daily engagement

export type SocialActivityFrequency =
  | 'rarely' // < 1 per month
  | 'monthly' // 1-3 times per month
  | 'weekly' // 1-2 times per week
  | 'multiple_weekly' // 3+ times per week
  | 'daily';

export type MaritalStatus =
  | 'never_married'
  | 'married'
  | 'partnered' // Unmarried but in committed relationship
  | 'separated'
  | 'divorced'
  | 'widowed';

export type ReligiousAttendanceFrequency =
  | 'never'
  | 'rarely' // Few times per year (holidays)
  | 'monthly' // 1-3 times per month
  | 'weekly' // Once per week
  | 'multiple_weekly' // Multiple times per week
  | 'daily';

export interface Volunteering {
  active?: DataPoint<boolean>; // Currently volunteers
  hoursPerMonth?: TimeSeries<number>; // Time spent volunteering
  organizationsCount?: DataPoint<number>; // Number of organizations involved with
  type?: DataPoint<VolunteeringType[]>; // Types of volunteer work
}

export type VolunteeringType =
  | 'community_service'
  | 'religious_organization'
  | 'educational'
  | 'health_care'
  | 'environmental'
  | 'arts_culture'
  | 'animal_welfare'
  | 'other';

export interface Hobbies {
  creative?: CreativeHobbies;
  physical?: PhysicalHobbies;
  social?: SocialHobbies;
  intellectual?: IntellectualHobbies;
}

export interface CreativeHobbies {
  engaged?: DataPoint<boolean>; // Regularly engages in creative activities
  types?: DataPoint<CreativeHobbyType[]>;
  hoursPerWeek?: TimeSeries<number>; // Time spent on creative hobbies
}

export type CreativeHobbyType =
  | 'music' // Playing instruments, singing
  | 'visual_arts' // Painting, drawing, sculpture
  | 'writing' // Creative writing, poetry
  | 'crafts' // Knitting, woodworking, etc.
  | 'photography'
  | 'cooking' // Culinary arts
  | 'gardening'
  | 'dance'
  | 'theater'
  | 'other';

export interface PhysicalHobbies {
  engaged?: DataPoint<boolean>;
  types?: DataPoint<PhysicalHobbyType[]>;
  // Note: Time spent is tracked in lifestyle.exercise
}

export type PhysicalHobbyType =
  | 'team_sports'
  | 'individual_sports'
  | 'outdoor_recreation' // Hiking, camping
  | 'martial_arts'
  | 'yoga'
  | 'dance'
  | 'other';

export interface SocialHobbies {
  engaged?: DataPoint<boolean>;
  types?: DataPoint<SocialHobbyType[]>;
}

export type SocialHobbyType =
  | 'clubs' // Book clubs, hobby clubs
  | 'classes' // Taking classes for enjoyment
  | 'group_activities' // Board game groups, etc.
  | 'cultural_events' // Attending concerts, theater, museums
  | 'social_groups' // Meetup groups, social organizations
  | 'other';

export interface IntellectualHobbies {
  engaged?: DataPoint<boolean>;
  types?: DataPoint<IntellectualHobbyType[]>;
}

export type IntellectualHobbyType =
  | 'reading'
  | 'puzzles' // Crosswords, Sudoku, etc.
  | 'learning' // Languages, skills
  | 'board_games' // Strategy games
  | 'collecting' // Stamps, coins, etc.
  | 'other';
