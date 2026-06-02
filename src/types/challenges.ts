export const CHALLENGE_FORMATS = ["OU", "UU", "NU", "LC", "Doubles"] as const;
export type ChallengeFormat = (typeof CHALLENGE_FORMATS)[number];

export type ChallengeStatus = "pendiente" | "aceptado" | "completado" | "cancelado" | "disputa";

export type DisputeReason = "result_mismatch" | "non_payment";

export interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  format: ChallengeFormat;
  prize_pd: number;
  status: ChallengeStatus;
  meet_day: string | null;
  meet_time: string | null;
  meet_timezone: string | null;
  meet_channel: string | null;
  meet_city: string | null;
  meet_confirmed_at: string | null;
  meet_at: string | null;
  challenger_result_winner_id: string | null;
  opponent_result_winner_id: string | null;
  winner_id: string | null;
  loser_id: string | null;
  counts_for_ranking: boolean;
  dispute_reason: DisputeReason | null;
  dispute_proof_path: string | null;
  dispute_reported_by: string | null;
  dispute_resolved_at: string | null;
  dispute_resolved_by: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeProfile {
  user_id: string;
  username: string;
  pokemmo_nick: string | null;
  avatar_url: string | null;
  wins: number;
  losses: number;
}

export interface ChallengeWithProfiles extends ChallengeRow {
  challenger?: ChallengeProfile;
  opponent?: ChallengeProfile | null;
}

export interface ChallengeMessageRow {
  id: string;
  challenge_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { username: string; avatar_url: string | null };
}

export interface RankingRow {
  user_id: string;
  username: string;
  pokemmo_nick: string | null;
  avatar_url: string | null;
  wins: number;
  losses: number;
  win_rate: number;
}
