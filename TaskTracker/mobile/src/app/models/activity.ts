export interface Activity {

  id: number;

  teamId: number;

  taskId: number | null;

  description: string;

  userName: string;

  type: number;

  createdAt: string;

}