import TaskCard from './TaskCard.jsx';

const COLUMNS = [
  { value: 'todo', label: 'Todo', tone: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', tone: 'bg-amber-100 text-amber-800' },
  { value: 'done', label: 'Done', tone: 'bg-emerald-100 text-emerald-800' },
];

export default function TaskBoard({ tasks, onEdit, onDelete, onMove }) {
  const grouped = COLUMNS.reduce((acc, c) => {
    acc[c.value] = tasks.filter((t) => t.stage === c.value);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <section
          key={col.value}
          className="bg-white/70 rounded-xl border border-slate-200 p-3 flex flex-col min-h-[300px]"
        >
          <header className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-700">{col.label}</h2>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${col.tone}`}
              >
                {grouped[col.value].length}
              </span>
            </div>
          </header>

          <div className="space-y-2 flex-1">
            {grouped[col.value].length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No tasks here yet
              </p>
            ) : (
              grouped[col.value].map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onMove}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
