import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import TaskBoard from '../components/TaskBoard.jsx';
import TaskModal from '../components/TaskModal.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listTasks();
      setTasks(data);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.updateTask(editing.id, data);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await api.createTask(data);
        setTasks((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.id !== task.id)); // optimistic
    try {
      await api.deleteTask(task.id);
    } catch (err) {
      setTasks(prev);
      setError(err.message);
    }
  };

  const handleMove = async (task, newStage) => {
    if (task.stage === newStage) return;
    const prev = tasks;
    setTasks((cur) =>
      cur.map((t) => (t.id === task.id ? { ...t, stage: newStage } : t))
    ); // optimistic
    try {
      const updated = await api.updateTask(task.id, { stage: newStage });
      setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setTasks(prev);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Task Manager</h1>
            <p className="text-xs text-slate-500">Signed in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-md"
            >
              + New Task
            </button>
            <button
              onClick={logout}
              className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {loading ? (
          <div className="py-10 flex justify-center">
            <Spinner label="Loading your tasks…" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-600 mb-3">No tasks yet.</p>
            <button
              onClick={openCreate}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Create your first task
            </button>
          </div>
        ) : (
          <TaskBoard
            tasks={tasks}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        )}
      </main>

      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        submitting={saving}
      />
    </div>
  );
}
