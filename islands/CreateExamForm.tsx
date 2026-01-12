import { useState } from "preact/hooks";
import GmailImportButton from "./GmailImportButton.tsx";

interface Props {
  replaceId?: string;
  title?: string;
  examDate?: string;
  targetPages?: string;
  startDate?: string;
  regStart?: string;
  regEnd?: string;
  paymentDeadline?: string;
}

export default function CreateExamForm(props: Props) {
  const [isLoading, setIsLoading] = useState(false);

  // Helper to ensure YYYY-MM-DD format
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
        // If it's already YYYY-MM-DD, strict check?
        // Just parse and format.
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split('T')[0];
    } catch {
        return "";
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Add replace_id if provided
    if (props.replaceId) {
      formData.append("replace_id", props.replaceId);
    }

    try {
      const response = await fetch("/api/exams/create", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Redirect to home page on success
        window.location.href = "/";
      } else {
        const error = await response.text();
        alert(`エラー: ${error}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Form submission error:", err);
      alert("プランの作成に失敗しました。もう一度お試しください。");
      setIsLoading(false);
    }
  };

  return (
    <form
      class="flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text text-lg font-bold">基本情報</span>
        </label>
        
        <GmailImportButton />

        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">試験名</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={props.title}
              placeholder="e.g. AWS Solution Architect"
              class="input input-bordered w-full font-bold"
              required
              disabled={isLoading}
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">試験日</span>
            </label>
            <input
              type="date"
              name="exam_date"
              defaultValue={formatDate(props.examDate)}
              class="input input-bordered w-full"
              required
              disabled={isLoading}
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">勉強開始日</span>
              <span class="label-text-alt text-gray-400">空欄の場合は今日から開始</span>
            </label>
            <input
              type="date"
              name="start_date"
              defaultValue={formatDate(props.startDate)}
              class="input input-bordered w-full"
              disabled={isLoading}
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
              defaultValue={props.targetPages}
              placeholder="e.g. 500"
              class="input input-bordered w-full"
              min="1"
              required
              disabled={isLoading}
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
          <input
            type="date"
            name="registration_start_date"
            defaultValue={formatDate(props.regStart)}
            class="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">出願締切日</span>
          </label>
          <input
            type="date"
            name="registration_end_date"
            defaultValue={formatDate(props.regEnd)}
            class="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">支払期限</span>
          </label>
          <input
            type="date"
            name="payment_deadline"
            defaultValue={formatDate(props.paymentDeadline)}
            class="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>
      </div>

      <div class="pt-6">
        <button
          type="submit"
          class="btn btn-primary w-full text-lg shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              処理中...
            </>
          ) : (
            "逆算プランを生成する"
          )}
        </button>
        <a href="/" class="btn btn-ghost w-full mt-2 text-gray-500">
          キャンセル
        </a>
      </div>
    </form>
  );
}

