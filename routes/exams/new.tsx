import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import CreateExamForm from "$/islands/CreateExamForm.tsx";

export default function NewExam({ url }: PageProps) {
  const query = url.searchParams;
  const replaceId = query.get("replace_id") || "";
  const title = query.get("title") || "";
  const examDate = query.get("exam_date") || "";
  const targetPages = query.get("target_pages") || "";
  const startDate = query.get("start_date") || "";
  const regStart = query.get("registration_start_date") || "";
  const regEnd = query.get("registration_end_date") || "";
  const paymentDeadline = query.get("payment_deadline") || "";

  return (
    <>
      <Head>
        <title>Create New Plan - Gyakusan</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-3xl font-bold mb-6">Create New Plan</h1>
        
        <CreateExamForm
          replaceId={replaceId}
          title={title}
          examDate={examDate}
          targetPages={targetPages}
          startDate={startDate}
          regStart={regStart}
          regEnd={regEnd}
          paymentDeadline={paymentDeadline}
        />
      </div>
    </>
  );
}
