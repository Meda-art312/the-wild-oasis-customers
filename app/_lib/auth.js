import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { getCustomerGuest, getOrCreateGuest } from "./data-service";
export const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
const nextAuth = NextAuth({
  trustHost: true,
  providers: googleConfigured ? [Google] : [],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        account?.provider !== "google" ||
        profile?.email_verified !== true ||
        !user.email
      )
        return false;
      try {
        await getOrCreateGuest(user, profile.sub);
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, account }) {
      if (account?.provider === "google")
        token.googleSubject = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (!session.user?.email || !token.googleSubject) return null;
      const guest = await getCustomerGuest(token.googleSubject);
      if (!guest) return null;
      session.user.guestId = guest.id;
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
export const { auth, signIn, signOut } = nextAuth;
export const { GET, POST } = nextAuth.handlers;
export async function requireGuest() {
  const session = await auth();
  if (!session?.user?.guestId) redirect("/login");
  return session.user;
}
