/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Terminal, Cpu, Sparkles, Send, Play, Trash2, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Tab = 'search' | 'runner';

interface LogEntry {
  type: 'log' | 'error' | 'system';
  content: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [code, setCode] = useState<string>('// Paste your code here\nconst message = "System initialized.";\nconsole.log(message);\n\n// Try some math\nconst result = 2 + 2;\nconsole.log("2 + 2 =", result);');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults(null);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: searchQuery
      });
      setSearchResults(response.text || "No intelligence retrieved.");
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults('Error: Connection to Nexus intelligence failed. Check your network or API keys.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const executeCode = () => {
    const newLogs: LogEntry[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      newLogs.push({ type: 'log', content: msg });
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const msg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      newLogs.push({ type: 'error', content: msg });
      originalError.apply(console, args);
    };

    try {
      const runner = new Function(code);
      runner();
      if (newLogs.length === 0) {
        newLogs.push({ type: 'system', content: 'Execution complete. No console output.' });
      }
    } catch (err: any) {
      newLogs.push({ type: 'error', content: `Runtime Error: ${err.message}` });
    }

    setLogs(prev => [...prev, ...newLogs]);
    console.log = originalLog;
    console.error = originalError;
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-primary/40 to-transparent z-0"></div>

      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-nexus-primary/20 bg-nexus-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-12">
          <h1 className="text-4xl font-black tracking-widest text-white text-glow">VIYA</h1>
          <nav className="flex gap-2">
            {(['search', 'runner'] as Tab[]).map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 border transition-all duration-300 text-[10px] tracking-tighter uppercase cursor-pointer
                  ${activeTab === tab 
                    ? 'border-nexus-primary text-nexus-primary glow-cyan' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'}
                `}
              >
                0{idx + 1}_{tab === 'search' ? 'NEXUS_SEARCH' : 'CODE_RUNNER'}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-nexus-primary/60 uppercase tracking-widest font-bold">
          <span>STATUS: STABLE</span>
          <span className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse-cyan shadow-[0_0_8px_var(--color-nexus-primary)]"></span>
          <span className="text-white">V.2.4.9_ALPHA</span>
        </div>
      </header>

      <main className="relative z-10 flex flex-col flex-1 p-8 md:p-12 items-center">
        <div className="w-full max-w-4xl flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'search' ? (
              <motion.section
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center flex-1"
              >
                <div className="w-full mb-12">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-nexus-primary to-nexus-secondary rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative flex items-center bg-nexus-surface border border-nexus-primary/30 rounded-lg p-6 purple-glow">
                      <span className="text-nexus-primary mr-4 text-xl font-bold">λ</span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Query the deep network..." 
                        className="bg-transparent border-none outline-none text-white text-xl w-full placeholder-gray-600 font-mono"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-nexus-secondary/20 border border-nexus-secondary/50 px-3 py-1 rounded-full text-nexus-secondary font-bold tracking-widest uppercase">
                          Gemini_v2
                        </span>
                        <button 
                          onClick={handleSearch}
                          disabled={isSearching}
                          className="p-1 text-nexus-primary hover:scale-110 transition-transform disabled:opacity-50"
                        >
                          {isSearching ? <Cpu className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {[
                      { label: 'Signal Strength', value: '99.8', unit: '%', bar: 99, color: 'nexus-primary' },
                      { label: 'Nodes Active', value: '1,204', unit: '/ LOC', dots: 5, color: 'nexus-secondary' },
                      { label: 'Nexus Latency', value: '12', unit: 'ms', status: 'STABLE_CONNECTION_VERIFIED', color: 'nexus-primary' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-nexus-surface/60 border border-nexus-primary/10 p-5 rounded-md backdrop-blur-sm shadow-xl">
                        <div className="text-[10px] text-gray-500 uppercase mb-2 font-bold tracking-wider">{stat.label}</div>
                        <div className="text-2xl text-white font-black italic">
                          {stat.value}<span className={`text-${stat.color} text-sm ml-1`}>{stat.unit}</span>
                        </div>
                        <div className="mt-3">
                          {stat.bar && (
                            <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                              <div className="bg-nexus-primary h-full" style={{ width: `${stat.bar}%` }}></div>
                            </div>
                          )}
                          {stat.dots && (
                            <div className="flex gap-1">
                              {[...Array(stat.dots)].map((_, j) => (
                                <div key={j} className="w-1.5 h-2.5 bg-nexus-secondary" style={{ opacity: 1 - j * 0.2 }}></div>
                              ))}
                            </div>
                          )}
                          {stat.status && <div className="text-[9px] text-nexus-primary font-bold tracking-tight">{stat.status}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isSearching && (
                  <div className="flex flex-col items-center gap-4 text-nexus-primary opacity-80">
                    <Sparkles className="animate-pulse" />
                    <p className="animate-pulse tracking-[0.3em] text-[10px] font-bold">{'>'} ESTABLISHING NEURAL LINK...</p>
                  </div>
                )}

                {searchResults && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="w-full bg-nexus-surface/40 border border-nexus-primary/10 rounded-xl p-8 mb-12 shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-nexus-primary/30 to-transparent"></div>
                    <p className="text-nexus-primary mb-6 text-[10px] font-bold tracking-[0.2em] border-b border-nexus-primary/20 pb-2">
                      {'>'} ANALYTICS RETRIEVED:
                    </p>
                    <div className="text-nexus-text leading-relaxed whitespace-pre-wrap text-sm opacity-90 font-mono">
                      {searchResults}
                    </div>
                  </motion.div>
                )}
              </motion.section>
            ) : (
              <motion.section
                key="runner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[65vh] py-4"
              >
                <div className="flex flex-col bg-nexus-surface/90 border border-nexus-primary/30 rounded-lg overflow-hidden relative shadow-2xl">
                  <div className="px-4 py-3 bg-nexus-primary/10 border-b border-nexus-primary/20 flex justify-between items-center">
                    <span className="text-[10px] text-nexus-primary font-bold tracking-wider flex items-center gap-2">
                      <Terminal size={12} /> // 02_CODE_ENVIRONMENT
                    </span>
                    <button
                      onClick={executeCode}
                      className="flex items-center gap-2 text-[10px] font-black bg-nexus-primary text-nexus-bg px-4 py-1.5 rounded hover:scale-105 transition-all active:scale-95 glow-cyan"
                    >
                      <Play size={10} fill="currentColor" /> EXECUTE
                    </button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-transparent p-6 text-nexus-text/80 outline-none resize-none font-mono text-xs leading-relaxed focus:bg-white/5 transition-colors"
                  />
                </div>

                <div className="flex flex-col bg-nexus-surface/90 border border-nexus-primary/30 rounded-lg overflow-hidden relative shadow-2xl">
                  <div className="px-4 py-3 bg-nexus-primary/10 border-b border-nexus-primary/20 flex justify-between items-center">
                    <span className="text-[10px] text-nexus-primary font-bold tracking-wider flex items-center gap-2">
                      <ChevronRight size={12} /> {'>'} TERMINAL_OUTPUT
                    </span>
                    <button onClick={clearLogs} className="text-nexus-muted hover:text-white transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div ref={consoleRef} className="flex-1 p-6 overflow-y-auto font-mono text-xs scrollbar-hide">
                    {logs.length === 0 ? (
                      <p className="text-nexus-muted/40 italic text-[10px] tracking-tight">
                        // System idle. Waiting for instruction...
                      </p>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className={`mb-3 flex gap-3 ${log.type === 'error' ? 'text-red-500' : log.type === 'system' ? 'text-nexus-muted' : 'text-white'}`}>
                          <span className="opacity-30 shrink-0 font-bold leading-none mt-0.5">
                            {log.type === 'error' ? '!' : log.type === 'system' ? '#' : '>'}
                          </span>
                          <pre className="whitespace-pre-wrap font-mono m-0">{log.content}</pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          
          <div className="w-full mt-auto pt-12">
            <div className="border-t border-nexus-primary/10 pt-6 flex justify-between items-center">
              <div className="text-[10px] text-gray-600 flex flex-wrap gap-6 font-bold tracking-tight">
                <span>LAST_CMD: {activeTab === 'search' ? 'fetch --nexus-all' : 'exec --runtime-js'}</span>
                <span>IP: 192.168.1.NEXUS</span>
                <span>SECURITY: ENCRYPTED_AES_256</span>
              </div>
              <div className="flex gap-4 opacity-50">
                <div className="w-10 h-1 bg-nexus-primary/40"></div>
                <div className="w-10 h-1 bg-nexus-primary/20"></div>
                <div className="w-10 h-1 bg-nexus-primary/10"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-4 right-6 text-[9px] text-gray-700 tracking-[0.4em] uppercase font-bold pointer-events-none">
        Neural Link Protocol Enabled // VIYA_SYSTEMS
      </div>
    </div>
  );
}
