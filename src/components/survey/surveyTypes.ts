import { UserProfile } from '../../types/user';

export type DetailedInputType =
  | { type: 'slider'; min: number; max: number; step: number; unit: string }
  | { type: 'number'; min?: number; max?: number; step?: number; unit: string }
  | { type: 'select'; options: Array<{ value: string; label: string }> };

export interface SwipeQuestion {
  id: string;
  /** Optional gate: hide the question for profiles it cannot apply to */
  applicableTo?: (profile: UserProfile) => boolean;
  question: string;
  category: string;
  leftOption: {
    label: string;
    emoji: string;
    profileUpdate: (profile: UserProfile) => UserProfile;
  };
  rightOption: {
    label: string;
    emoji: string;
    profileUpdate: (profile: UserProfile) => UserProfile;
  };
  detailedInput?: {
    inputType: DetailedInputType;
    label: string;
    getCurrentValue: (profile: UserProfile) => any;
    profileUpdate: (profile: UserProfile, value: any) => UserProfile;
    formatDisplay?: (value: any) => string;
  };
}
