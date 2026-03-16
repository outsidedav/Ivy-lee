import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createServiceClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false;

      const supabase = createServiceClient();

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email!)
        .single();

      if (!existingUser) {
        const { error } = await supabase.from("users").insert({
          email: user.email!,
          name: user.name,
          avatar_url: user.image,
        });
        if (error) {
          console.error("Error creating user:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email!)
          .single();

        if (data) {
          token.userId = data.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
