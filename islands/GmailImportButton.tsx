import { useState } from "preact/hooks";

export default function GmailImportButton() {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const scanGmail = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/gmail/scan");
      if (!resp.ok) throw new Error("Failed to scan");
      const data = await resp.json();
      setExams(data.exams);
      setIsOpen(true);
    } catch (e) {
      alert("Gmailのスキャンに失敗しました。OAuthの権限が不足している可能性があります。");
    } finally {
      setLoading(false);
    }
  };

  const selectExam = (exam: any) => {
    const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
    const dateInput = document.querySelector('input[name="exam_date"]') as HTMLInputElement;

    if (titleInput && exam.subject) {
      titleInput.value = exam.subject;
    }
    if (dateInput && exam.suggestedDate) {
      dateInput.value = exam.suggestedDate;
    }
    setIsOpen(false);
  };

  return (
    <div class="mb-4">
      <button
        type="button"
        onClick={scanGmail}
        class="btn btn-outline btn-sm gap-2 border-primary text-primary hover:bg-primary hover:text-white"
        disabled={loading}
      >
        {loading ? (
          <span class="loading loading-spinner loading-xs"></span>
        ) : (
          <span>📧</span>
        )}
        Gmailから試験情報を探す
      </button>

      {isOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="card w-full max-w-lg bg-base-100 shadow-2xl">
            <div class="card-body">
              <h2 class="card-title text-indigo-700">Gmail スキャン結果</h2>
              <p class="text-xs text-gray-500 mb-4">
                試験に関連しそうなメールが見つかりました。クリックしてフォームに入力します。
              </p>

              <div class="max-h-64 overflow-y-auto space-y-2">
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => selectExam(exam)}
                      class="w-full p-3 text-left bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-100 transition-colors group"
                    >
                      <div class="font-bold text-sm text-gray-800 group-hover:text-indigo-700 truncate">
                        {exam.subject}
                      </div>
                      <div class="text-xs text-gray-400 mt-1">
                        予測日: {exam.suggestedDate || "不明"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div class="text-center py-8 text-gray-400">
                    該当するメールが見つかりませんでした。
                  </div>
                )}
              </div>

              <div class="card-actions justify-end mt-4">
                <button onClick={() => setIsOpen(false)} class="btn btn-ghost btn-sm">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
