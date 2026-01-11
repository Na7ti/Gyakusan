import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

export default function NewExam() {
  return (
    <>
      <Head>
        <title>Create New Plan - Gyakusan</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-3xl font-bold mb-6">Create New Plan</h1>
        
        <form action="/api/exams/create" method="POST" class="flex flex-col gap-4">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Exam Title</span>
            </label>
            <input 
              type="text" 
              name="title" 
              placeholder="e.g. AWS Solution Architect" 
              class="input input-bordered w-full" 
              required 
            />
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Exam Date</span>
            </label>
            <input 
              type="date" 
              name="exam_date" 
              class="input input-bordered w-full" 
              required 
            />
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Goal (Total Amount)</span>
              <span class="label-text-alt">Pages, Hours, Questions, etc.</span>
            </label>
            <input 
              type="number" 
              name="target_pages" 
              placeholder="e.g. 500" 
              class="input input-bordered w-full" 
              min="1"
              required 
            />
          </div>

          <button type="submit" class="btn btn-primary mt-4">
            Generate Plan
          </button>
        </form>
      </div>
    </>
  );
}
