export type UserInfo = {
  id: number;
  name: string;
  email: string;
  roles: {
    id: number;
    name?: string;
  }[];
  isAdmin: boolean;
};
