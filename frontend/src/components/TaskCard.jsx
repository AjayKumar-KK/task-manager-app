const STAGES = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskCard({ task, onEdit, onDelete, onMove }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-800 text-sm leading-snug flex-1">
          {task.title}
        </h3>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="text-xs text-slate-500 hover:text-brand-600 px-1"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task)}
            className="text-xs text-slate-500 hover:text-red-600 px-1"
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>#{task.id}</span>
        <select
          value={task.stage}
          onChange={(e) => onMove(task, e.target.value)}
          className="border border-slate-200 rounded px-1 py-0.5 text-xs bg-slate-50 cursor-pointer hover:bg-white"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
