import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name?: string | null;
    email?: string | null;
    roles?: any[];
  };
}

export class SessionManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  static async getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(this.ACCESS_TOKEN_KEY)?.value;
    const refreshToken = cookieStore.get(this.REFRESH_TOKEN_KEY)?.value;
    const userStr = cookieStore.get(this.USER_KEY)?.value;

    if (!accessToken || !refreshToken || !userStr) {
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      return { accessToken, refreshToken, user };
    } catch {
      return null;
    }
  }

  static async setSession(data: SessionData): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(this.ACCESS_TOKEN_KEY, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });
    cookieStore.set(this.REFRESH_TOKEN_KEY, data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    cookieStore.set(this.USER_KEY, JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  static async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.ACCESS_TOKEN_KEY);
    cookieStore.delete(this.REFRESH_TOKEN_KEY);
    cookieStore.delete(this.USER_KEY);
  }

  static async requireAuth(): Promise<SessionData> {
    const session = await this.getSession();
    if (!session) {
      redirect('/signin');
    }
    return session;
  }
}