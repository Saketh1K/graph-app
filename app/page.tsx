import GraphView from '@/components/GraphView';
import ChatInterface from '@/components/ChatInterface';
import { BarChart3, Share2, Settings, Download } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">SAP O2C <span className="text-blue-500">Explorer</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Graph Data System v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <Share2 className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <Download className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-2" />
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
          </button>
          <div className="flex items-center gap-3 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">Saket</p>
              <p className="text-[10px] text-slate-500">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10" />
          </div>
        </div>
      </nav>

      {/* Main Content Areas */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Side: Graph Explorer */}
        <section className="flex-[7] min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-300">Context Graph</h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20">LIVE DATA</span>
            </div>
            <div className="text-[10px] text-slate-500 italic">
              Drag to explore • Scroll to zoom • Click nodes for details
            </div>
          </div>
          <GraphView />
        </section>

        {/* Right Side: Chat Interface */}
        <aside className="flex-[3] min-w-[380px] h-full">
          <ChatInterface />
        </aside>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-10 border-t border-white/5 px-8 flex items-center justify-between bg-slate-900/80 text-[10px] font-medium text-slate-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>SQLite: graph.db (Connected)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>LLM: Gemini 1.5 Flash (Active)</span>
          </div>
        </div>
        <div>
          Last Ingestion: {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </main>
  );
}
