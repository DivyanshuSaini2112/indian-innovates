import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user from Supabase
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ districts: [] });

  const { data: districts } = await supabase
    .from("user_districts")
    .select("*")
    .eq("user_id", user.id)
    .order("pinned_order");

  return NextResponse.json({ districts: districts ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { district_name, district_state } = body;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get current count for ordering
  const { count } = await supabase
    .from("user_districts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data, error } = await supabase
    .from("user_districts")
    .upsert({
      user_id: user.id,
      district_name,
      district_state,
      pinned_order: count ?? 0,
    }, { onConflict: "user_id,district_name" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ district: data });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const districtName = searchParams.get("district");

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await supabase
    .from("user_districts")
    .delete()
    .eq("user_id", user.id)
    .eq("district_name", districtName);

  return NextResponse.json({ success: true });
}
