import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: userData } = await supabase
    .from("users")
    .select("credits_used, credits_limit, plan")
    .eq("id", user.id)
    .single();

  const creditsUsed = userData?.credits_used ?? 0;
  const creditsLimit = userData?.credits_limit ?? 30;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">HireWise</h1>
          <div className="flex items-center gap-6">
            {/* Credits indicator */}
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{creditsUsed}</span>
              {" / "}
              <span>{creditsLimit}</span>
              {" resumes screened"}
            </div>
            <span className="text-sm text-gray-400">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Your jobs</h2>

          <a
            href="/jobs/new"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + New job
          </a>
        </div>

        {/* Jobs list */}
        {!jobs || jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 text-sm">No jobs yet</p>
            <p className="text-gray-400 text-xs mt-1 mb-6">
              Create your first job to start screening resumes
            </p>
            <a
              href="/jobs/new"
              className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create your first job
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {jobs.map((job) => (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {job.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(job.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {job.total_candidates} resume
                    {job.total_candidates !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      job.status === "done"
                        ? "bg-green-50 text-green-700"
                        : job.status === "processing"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {job.status === "done"
                      ? "Screening complete"
                      : job.status === "processing"
                        ? `${job.processed_count}/${job.total_candidates} processed`
                        : "Draft"}
                  </span>
                  <span className="text-gray-300 text-sm">→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
