import { useState } from "preact/hooks";

interface Props {
  examId: number;
  examTitle: string;
}

export default function DeleteExamButton({ examId, examTitle }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDeleteClick = (e: Event) => {
    e.preventDefault();
    setShowModal(true);
  };

  const executeDelete = async () => {
    setIsLoading(true);
    // Modal will stay open showing loading state or close immediately?
    // Let's keep it open with loading state or minimal interaction.
    
    try {
      const response = await fetch(`/api/exams/${examId}/delete`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.location.href = "/";
      } else {
        alert(`削除に失敗しました: ${result.error || "Unknown error"}`);
        setIsLoading(false);
        setShowModal(false);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("削除に失敗しました。ネットワーク接続を確認してください。");
      setIsLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        class="btn btn-ghost btn-circle btn-sm text-gray-300 hover:text-red-500 transition-all"
        title="削除"
        disabled={isLoading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      {showModal && (
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-scale-in">
            <h3 class="font-bold text-lg text-gray-900 mb-2">資格プランの削除</h3>
            <p class="text-sm text-gray-500 mb-6">
              本当に「{examTitle}」を削除しますか？<br/>
              カレンダーからも関連する学習イベントが削除されます。この操作は取り消せません。
            </p>
            <div class="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                class="btn btn-ghost btn-sm"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                onClick={executeDelete}
                class="btn btn-error btn-sm text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span class="loading loading-spinner loading-xs mr-2"></span>
                    削除中...
                  </>
                ) : (
                  "削除する"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
