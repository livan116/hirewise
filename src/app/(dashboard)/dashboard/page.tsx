import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Your jobs</h1>
            <a
              href="/jobs/new"
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {" "}
              + New job
            </a>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No jobs yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first job to start screening resumes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
