export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  session_date: string;
  created_at: string;
}

export interface ReviewSummary {
  average: string | null;
  count: number;
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
  session_date: string;
}

export interface UpdateReviewInput {
  rating: number;
  comment?: string;
}
