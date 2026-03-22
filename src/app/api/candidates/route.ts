import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, status, recruiter_note } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId required" },
        { status: 400 },
      );
    }

    const serviceClient = createServiceClient();

    // Verify candidate belongs to user's job
    const { data: candidate } = await serviceClient
      .from("candidates")
      .select("id, jobs(user_id)")
      .eq("id", candidateId)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (recruiter_note !== undefined)
      updateData.recruiter_note = recruiter_note;

    const { data: updated, error } = await serviceClient
      .from("candidates")
      .update(updateData)
      .eq("id", candidateId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ candidate: updated });
  } catch (error) {
    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 },
    );
  }
}
