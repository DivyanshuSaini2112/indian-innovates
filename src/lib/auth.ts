import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Import supabase lazily inside callbacks to avoid crashes at module init
async function upsertUser(email: string, name?: string | null, image?: string | null) {
  try {
    const { supabase } = await import("@/lib/supabase");
    await supabase.from("users").upsert(
      { email, name, avatar_url: image },
      { onConflict: "email" }
    );
  } catch {
    // Supabase not configured — skip silently
  }
}

async function getSupabaseUser(email: string) {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("users")
      .select("id, role, state, onboarding_complete")
      .eq("email", email)
      .single();
    return data;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-please-change",
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        await upsertUser(user.email, user.name, user.image);
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const data = await getSupabaseUser(session.user.email);
        if (data) {
          const u = session.user as typeof session.user & { id: string; role: string };
          u.id   = data.id;
          u.role = data.role ?? "Citizen";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
