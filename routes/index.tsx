import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { withDb } from "$/db/client.ts";
import { State } from "./_middleware.ts";
import ExamCard, { Exam } from "$/components/ExamCard.tsx";

interface ExamWithStats extends Exam {
  stats: {
    completed: number;
    total: number;
    daysLeft: number;
  };
}

interface IndexData {
  exams: ExamWithStats[];
}

export const handler: Handlers<IndexData | null, State> = {
  async GET(_req: Request, ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.render(null);

    return await withDb(async (client) => {
      // 1. Get all exams for user
      const examsRes = await client.queryObject<Exam>`
        SELECT id, title, exam_date, target_pages 
        FROM exams 
        WHERE user_id = (SELECT id FROM users WHERE google_id = ${user.id})
        ORDER BY created_at DESC
      `;

      const examsWithStats: ExamWithStats[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const exam of examsRes.rows) {
        // Stats for each exam
        const statsRes = await client.queryObject<{ completed: string; total: string }>`
          SELECT 
            COUNT(*) FILTER (WHERE is_completed) as completed,
            COUNT(*) as total
          FROM tasks 
          WHERE exam_id = ${exam.id}
        `;
        const statsData = statsRes.rows[0];

        const examDate = new Date(exam.exam_date);
        const diffTime = examDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        examsWithStats.push({
          ...exam,
          stats: {
            completed: Number(statsData.completed),
            total: Number(statsData.total),
            daysLeft,
          }
        });
      }

      return ctx.render({ exams: examsWithStats });
    });
  },
};

export default function Home({ data }: PageProps<IndexData | null>) {
  return (
    <>
      <Head>
        <title>目標資格一覧 - Gyakusan</title>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-white border-b border-gray-200">
          <div class="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between">
            <h1 class="text-xl font-black text-primary tracking-tighter">GYAKUSAN</h1>
            <div class="flex items-center gap-4">
              <a href="/exams/new" class="btn btn-primary btn-sm rounded-full px-6 font-bold">
                新規作成
              </a>
            </div>
          </div>
        </nav>

        <main class="py-12 px-4 max-w-screen-lg mx-auto">
          <div class="mb-12">
            <h2 class="text-4xl font-black text-gray-900 tracking-tight mb-2">目標資格一覧</h2>
            <p class="text-gray-500 font-medium">現在挑戦中の資格プランを管理しましょう。</p>
          </div>

          {data && data.exams.length > 0 ? (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} stats={exam.stats} />
              ))}
            </div>
          ) : (
            <div class="max-w-md mx-auto mt-20 text-center">
              <div class="text-6xl mb-6">🎯</div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">合格への第一歩を踏み出そう</h2>
              <p class="text-gray-600 mb-8">試験日を設定して、あなた専用の逆算スケジュールを作成しましょう。</p>
              <a href="/exams/new" class="btn btn-primary btn-lg rounded-full px-12 font-bold shadow-xl shadow-primary/20">
                プランを作成する
              </a>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

