import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { withDb } from "$/db/client.ts";
import DashboardUI from "$/components/DashboardUI.tsx";
import { State } from "./_middleware.ts";

interface DashboardData {
  exam: any;
  todayTask?: any;
  stats: {
    completed: number;
    total: number;
    daysLeft: number;
  };
}

export const handler: Handlers<DashboardData | null, State> = {
  async GET(req, ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.render(null);

    return await withDb(async (client) => {
      // 1. Get the most recent active exam for user
      const examRes = await client.queryObject`
        SELECT id, title, exam_date, target_pages 
        FROM exams 
        WHERE user_id = (SELECT id FROM users WHERE google_id = ${user.id})
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      if (examRes.rows.length === 0) {
        return ctx.render(null);
      }

      const exam: any = examRes.rows[0];

      // 2. Get today's task
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTaskRes = await client.queryObject`
        SELECT id, title, description, is_completed 
        FROM tasks 
        WHERE exam_id = ${exam.id} AND due_date = ${today}
        LIMIT 1
      `;

      // 3. Stats
      const statsRes = await client.queryObject`
        SELECT 
          COUNT(*) FILTER (WHERE is_completed) as completed,
          COUNT(*) as total
        FROM tasks 
        WHERE exam_id = ${exam.id}
      `;
      const statsData: any = statsRes.rows[0];

      const examDate = new Date(exam.exam_date);
      const diffTime = examDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return ctx.render({
        exam,
        todayTask: todayTaskRes.rows[0],
        stats: {
          completed: Number(statsData.completed),
          total: Number(statsData.total),
          daysLeft,
        },
      });
    });
  },
};

export default function Home({ data }: PageProps<DashboardData | null>) {
  return (
    <>
      <Head>
        <title>Dashboard - Gyakusan</title>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white border-b border-gray-200">
          <div class="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between">
            <h1 class="text-xl font-black text-primary tracking-tighter">GYAKUSAN</h1>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500 font-medium italic">Empowered Learning</span>
            </div>
          </div>
        </nav>

        <main class="py-8 px-4 max-w-screen-lg mx-auto">
          {data ? (
            <DashboardUI {...data} />
          ) : (
            <div class="max-w-md mx-auto mt-20 text-center">
              <div class="text-6xl mb-6">🎯</div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">合格への第一歩を踏み出そう</h2>
              <p class="text-gray-600 mb-8">試験日を設定して、あなた専用の逆算スケジュールを作成しましょう。</p>
              <a href="/exams/new" class="btn btn-primary btn-lg rounded-full px-12">
                プランを作成する
              </a>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
