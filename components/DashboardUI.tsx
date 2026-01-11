import TaskCheckbox from "../islands/TaskCheckbox.tsx";

interface Props {
  exam: {
    title: string;
    exam_date: Date;
    target_pages: number;
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

export default function DashboardUI({ exam, todayTask, stats }: Props) {
  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div class="space-y-8">
      <header class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div class="flex justify-between items-center mb-4">
          <a href="/" class="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            <span>←</span> 一覧に戻る
          </a>
        </div>
        <div class="flex justify-between items-end">
          <div>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">目標試験</h2>
            <h1 class="text-3xl font-black text-gray-900 leading-none">{exam.title}</h1>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 font-bold uppercase tracking-widest">試験まで</p>
            <p class="text-4xl font-black text-primary leading-none">あと{stats.daysLeft}日</p>
          </div>
        </div>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-gradient-to-br from-primary to-secondary p-1 rounded-2xl shadow-lg">
          <div class="bg-white p-6 rounded-[calc(1rem-1px)] h-full">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="text-2xl">🔥</span> 今日のノルマ
            </h2>
            {todayTask ? (
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <TaskCheckbox taskId={todayTask.id} initialCompleted={todayTask.is_completed} />
                <div>
                  <h3 class="font-bold text-lg">{todayTask.title}</h3>
                  <p class="text-gray-600">{todayTask.description}</p>
                </div>
              </div>
            ) : (
              <p class="text-gray-500 italic">今日のタスクはありません。しっかり休みましょう！</p>
            )}
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold mb-4">現在の進捗</h2>
          <div class="text-center mb-4">
            <div class="text-4xl font-black text-primary">{Math.round(progress)}%</div>
            <p class="text-xs text-gray-500">{stats.completed} / {stats.total} タスク完了</p>
          </div>
          <progress class="progress progress-primary w-full h-3" value={progress} max="100"></progress>
        </div>
      </section>

      <div class="flex justify-center pt-4">
        <a href="/exams/new" class="btn btn-ghost btn-sm text-gray-400 hover:text-primary transition-colors">
          試験プランを再作成する
        </a>
      </div>
    </div>
  );
}
