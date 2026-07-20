export interface Team {
  id: number;
  name: string;
  leaderName: string;
  memberCount: number;
  createdAt: string;
}

export interface TeamMember {
  userId: number;
  fullName: string;
  email: string;
  role: string | number;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}