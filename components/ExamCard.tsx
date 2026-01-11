export interface Exam {
  id: number;
  title: string;
  exam_date: Date;
  target_pages: number;
}

interface Props {
  exam: Exam;
  stats: {
    completed: number;
    total: number;
    daysLeft: number;
  };
}

export default function ExamCard({ exam, stats }: Props) {
  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <a href={`/exams/${exam.id}`} class="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all group">
      <div class="flex justify-between items-start mb-4">
        <div class="flex-grow">
          <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{exam.title}</h3>
          <p class="text-sm text-gray-400 font-medium tracking-tight">
            {new Date(exam.exam_date).toLocaleDateString('ja-JP')} ・ あと{stats.daysLeft}日
          </p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <div class="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">
            Active
          </div>
          <form method="POST" action={`/api/exams/${exam.id}/delete`} 
                onSubmit="return confirm('この資格プランを削除しますか？\n（カレンダーの予定は残りますが、アプリ上のデータは削除されます）')">
            <button type="submit" class="text-gray-300 hover:text-red-500 transition-colors p-1" title="削除">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between text-xs font-bold">
          <span class="text-gray-500 uppercase">Progress</span>
          <span class="text-primary">{Math.round(progress)}%</span>
        </div>
        <progress class="progress progress-primary w-full h-2" value={progress} max="100"></progress>
        <p class="text-[10px] text-gray-400 text-right">
          {stats.completed} / {stats.total} Tasks Completed
        </p>
      </div>
    </a>
  );
}
