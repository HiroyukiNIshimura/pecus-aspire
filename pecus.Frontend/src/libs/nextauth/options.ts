import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSession } from "next-auth/react";

export const nextAuthOptions: NextAuthOptions = {
  secret: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Cygnet Credentials",
      credentials: {
        id: {
          label: "Id",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const client = createPecusApiClients();
        // WebAPIと連携して認証を行う
        try {

          const res = await client.entranceAuth.apiEntranceAuthLoginPost({
            loginRequest: {
              loginIdentifier: credentials?.id || "",
              password: credentials?.password || "",
            },
          });

          // ここでWebApiのレスポンス仕様に合わせてuser情報を返す
          return {
            id: String(res.data.userId ?? ""),
            accessToken: res.data.accessToken ?? "",
            refreshToken: res.data.refreshToken ?? "",
            name: res.data.username ?? "",
            email: res.data.email ?? ""
            // 必要に応じて他の情報も
          };
        } catch (e) {
          console.error("認証API通信エラー", e);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "refresh-token",
      name: "Refresh Token",
      credentials: {
        refreshToken: {
          label: "Refresh Token",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          const client = createPecusApiClients();
          const res = await client.refresh.apiEntranceRefreshPost({
            refreshRequest: {
              refreshToken: credentials?.refreshToken || "",
            },
          });

          // 現在のセッションを取得してユーザー情報を維持
          const session = await getSession();

          return {
            id: session?.user?.id || "",
            accessToken: res.data.accessToken || undefined,
            refreshToken: res.data.refreshToken || undefined,
            name: session?.user?.name || "",
            email: session?.user?.email || ""
          };
        } catch (e) {
          console.error("リフレッシュAPI通信エラー", e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ user, account, profile, credentials }) {
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // if (url === "signOut" && process.env.COGNITO_LOGOUT_ENDPOINT_URL) {
      //   // Sign out from auth provider
      //   const logoutEndpointUrl = process.env.COGNITO_LOGOUT_ENDPOINT_URL || "";
      //   const params = new URLSearchParams({
      //     client_id: process.env.COGNITO_CLIENT_ID || "",
      //     redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cognito`,
      //     response_type: "code",
      //   });
      //   return `${logoutEndpointUrl}?${params.toString()}`;
      // }
      if (url.startsWith("/")) {
        return new URL(url, baseUrl).toString();
      }
      return baseUrl;
    },
    jwt({ token, trigger, session, user }) {
      if (trigger === "update") {
        token.name = session?.user?.name;
      }
      return {
        ...user,
        ...token,
      };
    },
    session: ({ session, token, user }) => {
      return {
        ...session,
        ...token,
        user: {
          ...session.user,
          ...token,
          id: user.id,
        },
      };
    },
  },
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}
