export interface FeedbackItem {
  id: string;
  content: string;
  teacher: { first_name: string };
  created_at: string;
}

export interface MyFeedbackItem extends FeedbackItem {
  class_name: string;
  class_id: string;
  enrollment_id: string;
}

export interface SendFeedbackInput {
  content: string;
}
