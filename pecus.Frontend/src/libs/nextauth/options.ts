import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
            // 必要に応じて他の情報も
          };
        } catch (e) {
          console.error("認証API通信エラー", e);
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
    idToken?: string;
  }

  interface User {
    accessToken?: string;
    idToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
  }
}
