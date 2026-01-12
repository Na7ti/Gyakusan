import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { withDb } from "$/db/client.ts";
import DashboardUI from "$/components/DashboardUI.tsx";
import { State } from "../_middleware.ts";

interface DashboardData {
  exam: {
    id: number;
    title: string;
    exam_date: Date;
    target_pages: number;
    registration_start_date?: Date;
    registration_end_date?: Date;
    payment_deadline?: Date;
    roadmap: string | null;
  };
  todayTask?: {
    id: number;
    title: string;
    description: string;
    is_completed: boolean;
  };
  stats: {
    completed: number;
    total: number;
    daysLeft: number;
  };
}

export const handler: Handlers<DashboardData | null, State> = {
  async GET(_req: Request, ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.render(null);

    const examId = ctx.params.id;

    return await withDb(async (client) => {
      // 1. Get the specific exam
      const examRes = await client.queryObject<{ 
        id: number; title: string; exam_date: Date; target_pages: number;
        registration_start_date?: Date; registration_end_date?: Date; payment_deadline?: Date;
        roadmap: string | null;
      }>`
        SELECT id, title, exam_date, target_pages, registration_start_date, registration_end_date, payment_deadline, roadmap
        FROM exams 
        WHERE id = ${examId} AND user_id = (SELECT id FROM users WHERE google_id = ${user.id})
      `;

      if (examRes.rows.length === 0) {
        return new Response("Exam not found", { status: 404 });
      }

      const exam = examRes.rows[0];

      // 2. Get today's task (Convert UTC to JST for correct date matching)
      const now = new Date();
      const jstOffset = 9 * 60; // JST is UTC+9
      const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
      const todayStr = jstTime.toISOString().split('T')[0];
      
      const todayTaskRes = await client.queryObject<{ id: number; title: string; description: string; is_completed: boolean }>`
        SELECT id, title, description, is_completed 
        FROM tasks 
        WHERE exam_id = ${exam.id} AND due_date::date = ${todayStr}::date
        LIMIT 1
      `;

      // 3. Stats
      const statsRes = await client.queryObject<{ completed: string; total: string }>`
        SELECT 
          COUNT(*) FILTER (WHERE is_completed) as completed,
          COUNT(*) as total
        FROM tasks 
        WHERE exam_id = ${exam.id}
      `;
      const statsData = statsRes.rows[0];

      // 4. Get the earliest task date as start_date
      const startDateRes = await client.queryObject<{ due_date: Date }>`
        SELECT due_date FROM tasks WHERE exam_id = ${exam.id}
        ORDER BY due_date ASC LIMIT 1
      `;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const examDate = new Date(exam.exam_date);
      const diffTime = examDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return ctx.render({
        exam: {
          ...exam,
          start_date: startDateRes.rows[0]?.due_date || null,
        },
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

export default function ExamDashboard({ data }: PageProps<DashboardData | null>) {
  if (!data) return <div>Unauthorized</div>;

  return (
    <>
      <Head>
        <title>{data.exam.title} - Dashboard</title>
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
          <DashboardUI {...data} />
        </main>
      </div>
    </>
  );
}
