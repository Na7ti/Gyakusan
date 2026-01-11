import { useSignal } from "@preact/signals";

interface TaskCheckboxProps {
  taskId: number;
  initialCompleted: boolean;
}

export default function TaskCheckbox({ taskId, initialCompleted }: TaskCheckboxProps) {
  const isCompleted = useSignal(initialCompleted);
  const isLoading = useSignal(false);

  const toggle = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    
    try {
      const resp = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "POST",
        body: JSON.stringify({ is_completed: !isCompleted.value }),
      });
      
      if (resp.ok) {
        isCompleted.value = !isCompleted.value;
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <input
      type="checkbox"
      checked={isCompleted.value}
      onChange={toggle}
      disabled={isLoading.value}
      class="checkbox checkbox-primary"
    />
  );
}
