import Link from "next/link";
import { FiPlay, FiCpu, FiZap, FiGrid, FiArrowRight, FiCode, FiActivity } from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-6xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FiCpu className="text-white" size={18} />
            </div>
            <span className="font-semibold text-[var(--text-primary)]">RTL Copilot</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="https://github.com" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
            <a href="/docs" className="hover:text-[var(--text-primary)] transition-colors">Docs</a>
          </div>
          <Link
            href="/editor"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FiPlay size={14} />
            Launch IDE
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="badge badge-info">
              <FiZap size={12} />
              Powered by AI
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-center text-[var(--text-primary)] mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Design Hardware with
            <span className="block bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] bg-clip-text text-transparent">
              Visual Intelligence
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] text-center max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Professional Verilog IDE with visual FSM editor, real-time code generation,
            and waveform simulation. Build RTL faster than ever.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/editor"
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base animate-pulse-glow"
            >
              <FiPlay size={16} />
              Start Building
              <FiArrowRight size={16} />
            </Link>
            <a
              href="https://github.com"
              className="btn-secondary flex items-center gap-2 px-6 py-3 text-base"
            >
              <FiCode size={16} />
              View on GitHub
            </a>
          </div>

          {/* Preview Image Placeholder */}
          <div className="relative max-w-4xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="glass rounded-2xl p-1 shadow-lg">
              <div className="bg-[var(--surface)] rounded-xl aspect-video flex items-center justify-center border border-[var(--border-subtle)]">
                <div className="text-center text-[var(--text-muted)]">
                  <FiGrid size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">IDE Preview</p>
                </div>
              </div>
            </div>
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)] opacity-20 blur-3xl -z-10 rounded-3xl" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--text-primary)] mb-4">
            Everything You Need for RTL Design
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-xl mx-auto">
            A complete development environment designed for hardware engineers.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-subtle rounded-xl p-6 hover-lift cursor-pointer group">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
                <FiGrid className="text-[var(--accent-primary)]" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Visual FSM Editor</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Drag-and-drop state machine design with automatic Verilog generation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-subtle rounded-xl p-6 hover-lift cursor-pointer group">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-secondary)]/20 transition-colors">
                <FiCode className="text-[var(--accent-secondary)]" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Intelligent Code Editor</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Syntax highlighting, auto-completion, and real-time linting for Verilog.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-subtle rounded-xl p-6 hover-lift cursor-pointer group">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-tertiary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-tertiary)]/20 transition-colors">
                <FiActivity className="text-[var(--accent-tertiary)]" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Waveform Viewer</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Simulate your designs and visualize signals with an interactive waveform viewer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <FiCpu size={16} />
            <span>RTL Copilot</span>
          </div>
          <p>Built for hardware engineers. Open source.</p>
        </div>
      </footer>
    </div>
  );
}
