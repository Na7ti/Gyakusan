import { useState } from "preact/hooks";

interface Props {
  examId: number;
  initialRoadmap: string | null;
}

export default function RoadmapSection({ examId, initialRoadmap }: Props) {
  const [roadmap, setRoadmap] = useState<string | null>(initialRoadmap);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/exams/${examId}/roadmap`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate roadmap");
      const data = await response.json();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError("AIロードマップの生成に失敗しました。後でもう一度お試しください。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="card bg-base-100 shadow-xl border border-primary/20">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-indigo-700 flex items-center gap-2">
            <span class="text-2xl">🤖</span> AI学習ロードマップ
          </h2>
          {!roadmap && !loading && (
            <button
              onClick={generateRoadmap}
              class="btn btn-primary btn-sm"
              disabled={loading}
            >
              アドバイスを生成
            </button>
          )}
        </div>

        {loading && (
          <div class="flex flex-col items-center py-8 gap-4">
            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm text-gray-500">AIが最適な学習順序を考えています...</p>
          </div>
        )}

        {error && (
          <div class="alert alert-error shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {roadmap ? (
          <div class="prose max-w-none">
            <div class="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 whitespace-pre-wrap text-gray-800 leading-relaxed">
              {roadmap}
            </div>
            <div class="mt-4 flex justify-end">
              <button
                onClick={generateRoadmap}
                class="btn btn-ghost btn-xs text-gray-400 hover:text-primary"
                disabled={loading}
              >
                ロードマップを再生成
              </button>
            </div>
          </div>
        ) : !loading && (
          <div class="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p class="text-gray-500 mb-2">まだアドバイスがありません。</p>
            <p class="text-xs text-gray-400">「アドバイスを生成」ボタンを押すと、AIが試験に向けた学習戦略を提案します。</p>
          </div>
        )}
      </div>
    </div>
  );
}
