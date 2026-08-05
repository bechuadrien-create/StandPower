/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { composeCodes, ComposeFile } from '../data/composeCodes';
import { Copy, Check, FileCode, Terminal, HelpCircle } from 'lucide-react';

interface ComposeCodeViewerProps {
  activeScreenCodeKey: string;
}

export default function ComposeCodeViewer({ activeScreenCodeKey }: ComposeCodeViewerProps) {
  const [activeTab, setActiveTab] = useState<string>(activeScreenCodeKey);
  const [copied, setCopied] = useState(false);

  // Sync activeTab when the simulated screen changes
  useEffect(() => {
    if (composeCodes[activeScreenCodeKey]) {
      setActiveTab(activeScreenCodeKey);
    }
  }, [activeScreenCodeKey]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTabLabel = (key: string) => {
    return composeCodes[key]?.name || key;
  };

  const currentFile: ComposeFile = composeCodes[activeTab] || composeCodes.theme;

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden font-sans">
      {/* Android Studio IDE Style Header Bar */}
      <div className="flex items-center justify-between bg-white/5 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-xs font-mono text-white/50 font-medium">Jetpack Compose Sync Controller</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60"></span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-transparent overflow-x-auto border-b border-white/5 scrollbar-none">
        {Object.keys(composeCodes).map((key) => {
          const isSelected = activeTab === key;
          const isCurrentScreen = activeScreenCodeKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-r border-white/5 transition-all whitespace-nowrap focus:outline-none ${
                isSelected
                  ? 'bg-white/5 text-emerald-400 border-b-2 border-b-emerald-400 font-semibold'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCode size={13} className={isCurrentScreen ? 'text-emerald-400' : 'text-white/30'} />
              <span>{getTabLabel(key)}</span>
              {isCurrentScreen && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* File Description Bar */}
      <div className="flex items-start gap-2 bg-white/5 px-5 py-3 border-b border-white/5 text-xs">
        <HelpCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-white/80 font-medium">{currentFile.name}: </span>
          <span className="text-white/50">{currentFile.description}</span>
        </div>
      </div>

      {/* Code Text Area */}
      <div className="relative flex-1 bg-black/40 overflow-auto group">
        <button
          onClick={() => handleCopy(currentFile.code)}
          className="absolute right-4 top-4 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg transition shadow-md border border-white/10 focus:outline-none opacity-90 group-hover:opacity-100"
          id="copy-code-btn"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Kotlin</span>
            </>
          )}
        </button>

        <pre className="p-6 font-mono text-xs sm:text-[11px] md:text-xs text-white/80 leading-relaxed overflow-x-auto selection:bg-emerald-500/20 selection:text-white">
          <code className="block">{currentFile.code}</code>
        </pre>
      </div>

      {/* Bottom status indicator bar */}
      <div className="flex items-center gap-4 bg-black/50 px-4 py-2 border-t border-white/10 font-mono text-[10px] text-white/40">
        <div>Language: <span className="text-emerald-400">Kotlin (Jetpack Compose)</span></div>
        <div className="text-white/10">|</div>
        <div>UTF-8</div>
        <div className="text-white/10">|</div>
        <div>Target SDK: <span className="text-white/60">Android 34 (Material 3)</span></div>
      </div>
    </div>
  );
}
