import React, { useEffect, useRef } from 'react';
import { LogMessage, ConnectionState } from '../types';

interface StatusPanelProps {
  logs: LogMessage[];
  status: ConnectionState;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ logs, status }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/40 border border-cyan-900/50 rounded-sm overflow-hidden relative">
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-cyan-900/20 border-b border-cyan-900/30">
        <span className="text-[10px] text-cyan-500 font-tech tracking-wider">COMM_UPLINK</span>
        <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-tech text-xs space-y-2 terminal-scroll"
      >
        {logs.length === 0 && (
          <div className="text-cyan-900/50 italic opacity-50">
            > Waiting for connection...
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col animate-[fadeIn_0.3s_ease-out]">
             <div className="flex items-center space-x-2 opacity-60 text-[9px] mb-0.5 text-cyan-700">
                <span>[{log.timestamp.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                <span className="uppercase tracking-wider">{log.role === 'model' ? ':: AI_CORE' : log.role === 'system' ? ':: SYS' : ':: USER_INPUT'}</span>
             </div>
             <div className={`${
                 log.role === 'system' ? 'text-yellow-500' : 
                 log.role === 'user' ? 'text-cyan-100 pl-2 border-l-2 border-cyan-700' : 
                 'text-cyan-400'
             } break-words leading-relaxed`}>
                 <span className="mr-2">{log.role === 'user' ? '>' : '#'}</span>
                 {log.text}
             </div>
          </div>
        ))}
        
        {/* Blinking Cursor at bottom */}
        {status === ConnectionState.CONNECTED && (
            <div className="flex items-center text-cyan-500 animate-pulse mt-2">
                <span className="mr-2">></span>
                <div className="w-2 h-4 bg-cyan-500"></div>
            </div>
        )}
      </div>

      {/* Decorative Footer */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-900/0 via-cyan-500/20 to-cyan-900/0"></div>
    </div>
  );
};