import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, jd_text } = await request.json();

    if (!title || !jd_text) {
      return NextResponse.json(
        { error: "Title and job description are required" },
        { status: 400 },
      );
    }

    // Check user credits
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from("users")
      .select("credits_used, credits_limit")
      .eq("id", user.id)
      .single();

    if (userData && userData.credits_used >= userData.credits_limit) {
      return NextResponse.json(
        { error: "Credit limit reached. Please upgrade your plan." },
        { status: 403 },
      );
    }

    const { data: job, error } = await serviceClient
      .from("jobs")
      .insert({ user_id: user.id, title, jd_text, status: "draft" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}
