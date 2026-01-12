import DeleteExamButton from "$/islands/DeleteExamButton.tsx";

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
    <div class="relative group">
      <a href={`/exams/${exam.id}`} class="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-grow pr-8">
            <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{exam.title}</h3>
            <p class="text-sm text-gray-400 font-medium tracking-tight">
              {new Date(exam.exam_date).toLocaleDateString('ja-JP')} ・ あと{stats.daysLeft}日
            </p>
          </div>
          <div class="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">
            Active
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
    </div>
  );
}
