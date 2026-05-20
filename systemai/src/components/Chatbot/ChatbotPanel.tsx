import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { useChatbotStore } from '../../stores/chatbotStore';

const suggestions = ['Analyze thermal throttling risk', 'Preview hardening actions', 'Summarize security posture'];

/** Chatbot interface with message threading and action approval workflow. */
export const ChatbotPanel = (): JSX.Element => {
  const { history, pendingPreview, isExecuting, sendUserMessage, previewAction, approveAction, denyAction } = useChatbotStore();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const latest = useMemo(() => history.slice(-80), [history]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }
    await sendUserMessage(input.trim());
    if (input.toLowerCase().includes('preview')) {
      previewAction({
        what: 'Tune background service priorities',
        why: 'Reduce sustained CPU pressure',
        risk: 'medium',
        impact: 'Potential short service latency blip',
        rollback: 'snapshot_2026_01'
      });
    }
    setInput('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <section className="flex h-full flex-col rounded bg-slate-900 p-4">
      <div className="mb-3 text-sm text-slate-300">SYSTEMAI Assistant</div>
      <div className="mb-3 flex-1 space-y-2 overflow-y-auto rounded border border-slate-800 p-3">
        {latest.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded p-2 text-sm ${msg.type === 'user' ? 'bg-cyan-900/40 text-cyan-100' : 'bg-slate-800 text-slate-100'}`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        {suggestions.map((s) => (
          <button key={s} className="rounded bg-slate-800 px-2 py-1 text-slate-300" onClick={() => setInput(s)}>
            {s}
          </button>
        ))}
      </div>

      {pendingPreview && (
        <div className="mb-3 rounded border border-amber-700 bg-amber-900/20 p-3 text-sm text-amber-100">
          <p><strong>What:</strong> {pendingPreview.what}</p>
          <p><strong>Why:</strong> {pendingPreview.why}</p>
          <p><strong>Risk:</strong> {pendingPreview.risk}</p>
          <p><strong>Impact:</strong> {pendingPreview.impact}</p>
          <p><strong>Rollback:</strong> {pendingPreview.rollback}</p>
          <div className="mt-2 flex gap-2">
            <button className="rounded bg-emerald-700 px-2 py-1" onClick={approveAction}>Approve</button>
            <button className="rounded bg-red-700 px-2 py-1" onClick={denyAction}>Deny</button>
            <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setInput(`Modify action: ${pendingPreview.what}`)}>Modify</button>
          </div>
        </div>
      )}

      {isExecuting && (
        <div className="mb-2 rounded bg-cyan-900/20 px-3 py-2 text-xs text-cyan-200">Execution in progress… Verify phase pending.</div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SYSTEMAI..."
        />
        <button className="rounded bg-cyan-700 px-3 py-2 text-sm font-medium text-white" type="submit">
          Send
        </button>
      </form>
    </section>
  );
};
