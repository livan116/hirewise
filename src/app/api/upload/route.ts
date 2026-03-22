import { createClient, createServiceClient } from "@/lib/supabase/server";
import { inngest } from "@/inngest/client";
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobId = formData.get("jobId") as string;

    if (!file || !jobId) {
      return NextResponse.json(
        { error: "File and jobId are required" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 },
      );
    }

    const serviceClient = createServiceClient();

    // Verify the job belongs to this user
    const { data: job } = await serviceClient
      .from("jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const filePath = `${user.id}/${jobId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await serviceClient.storage
      .from("resumes")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create candidate record in DB
    const { data: candidate, error: dbError } = await serviceClient
      .from("candidates")
      .insert({
        job_id: jobId,
        file_url: filePath,
        file_name: file.name,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Increment job's total_candidates count
    await serviceClient
      .from("jobs")
      .update({
        total_candidates: job ? undefined : 0,
        status: "processing",
      })
      .eq("id", jobId);

    await serviceClient.rpc("increment_total_candidates", { job_id: jobId });

    // Fire Inngest event to trigger AI screening
    await inngest.send({
      name: "resume/uploaded",
      data: {
        candidateId: candidate.id,
        jobId: jobId,
        userId: user.id,
      },
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
