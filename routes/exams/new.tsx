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
              <span class="label-text text-lg font-bold">基本情報</span>
            </label>
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">試験名</span>
                </label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder="e.g. AWS Solution Architect" 
                  class="input input-bordered w-full font-bold" 
                  required 
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">試験日</span>
                </label>
                <input 
                  type="date" 
                  name="exam_date" 
                  class="input input-bordered w-full" 
                  required 
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">目標量 (合計)</span>
                  <span class="label-text-alt text-gray-400">ページ数、時間、問題数など</span>
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
            </div>
          </div>

          <div class="divider text-gray-400 text-sm">重要日程 (任意)</div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">出願開始日</span>
              </label>
              <input type="date" name="registration_start_date" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">出願締切日</span>
              </label>
              <input type="date" name="registration_end_date" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">支払期限</span>
              </label>
              <input type="date" name="payment_deadline" class="input input-bordered w-full" />
            </div>
          </div>

          <div class="pt-6">
            <button type="submit" class="btn btn-primary w-full text-lg shadow-lg">
              逆算プランを生成する
            </button>
            <a href="/" class="btn btn-ghost w-full mt-2 text-gray-500">
              キャンセル
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
