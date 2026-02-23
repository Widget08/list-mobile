export type ListPublicAccess = 'none' | 'members' | 'anyone';
export type ListMemberRole = 'view' | 'edit' | 'admin';
export type SortBy = 'manual' | 'votes' | 'ratings' | 'shuffle';

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  public_access_mode: ListPublicAccess;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  list_settings?: ListSettings;
}

export interface ListSettings {
  id: string;
  list_id: string;
  enable_status: boolean;
  enable_voting: boolean;
  enable_downvote: boolean;
  enable_rating: boolean;
  enable_shuffle: boolean;
  enable_ordering: boolean;
  enable_comments: boolean;
  allow_multiple_tags: boolean;
  sort_by: SortBy;
}

export interface ListStatus {
  id: string;
  list_id: string;
  name: string;
  position: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string | null;
  status: string | null;
  tags: string[];
  completed: boolean;
  position: number;
  upvotes: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields (populated by select queries)
  myVote?: 1 | -1 | null;
  myRating?: number | null;
  commentCount?: number;
}

export interface ListMember {
  id: string;
  list_id: string;
  user_id: string;
  role: ListMemberRole;
  invited_by: string | null;
  created_at: string;
  user_profiles?: UserProfile;
}

export interface ListItemComment {
  id: string;
  list_item_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
}

export interface ListRating {
  id: string;
  list_item_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ListVote {
  id: string;
  list_item_id: string;
  user_id: string;
  vote_type: 1 | -1;
  created_at: string;
}

export interface ListInviteLink {
  id: string;
  list_id: string;
  created_by: string;
  role: ListMemberRole;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}
