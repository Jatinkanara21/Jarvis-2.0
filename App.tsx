import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArcReactor } from './components/ArcReactor';
import { StatusPanel } from './components/StatusPanel';
import { GeminiLiveService } from './services/geminiLiveService';
import { ConnectionState, LogMessage, VisualizerData } from './types';

// Random number generator for diagnostics
const randomMetric = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [visualizerData, setVisualizerData] = useState<VisualizerData>({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const [booted, setBooted] = useState(false);
  
  // Simulated System Metrics
  const [metrics, setMetrics] = useState({
    cpu: 12,
    memory: 40,
    network: 240,
    temp: 45
  });

  const serviceRef = useRef<GeminiLiveService | null>(null);

  // Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => {
        setBooted(true);
    }, 100); // Start immediately but allow React to render initial frame
    return () => clearTimeout(timer);
  }, []);

  // Diagnostic Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: randomMetric(10, 60),
        memory: randomMetric(30, 45),
        network: randomMetric(200, 900),
        temp: randomMetric(40, 65)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((role: 'user' | 'model' | 'system', text: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        role,
        text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleToggleSystem = async () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      if (serviceRef.current) {
        await serviceRef.current.disconnect();
      }
    } else {
      if (!serviceRef.current) {
        serviceRef.current = new GeminiLiveService(
          (status) => setConnectionState(status),
          (role, text) => addLog(role, text),
          (data) => setVisualizerData(data)
        );
      }
      await serviceRef.current.connect();
    }
  };

  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isError = connectionState === ConnectionState.ERROR;

  return (
    <div className="relative h-screen w-full flex flex-col p-2 sm:p-4 lg:p-6 z-10 overflow-y-auto lg:overflow-hidden">
      
      {/* VFX: 3D Grid Background */}
      <div className="perspective-grid-container fixed inset-0">
        <div className="perspective-grid opacity-30"></div>
      </div>

      {/* Main Content Container with Startup Animation */}
      <div className={`relative z-20 flex flex-col min-h-full transition-opacity duration-1000 ${booted ? 'animate-power-on opacity-100' : 'opacity-0'}`}>
        
        {/* Top Header Bar */}
        <header className="flex justify-between items-end border-b border-cyan-500/30 pb-2 mb-4 bg-black/20 backdrop-blur-sm shrink-0">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-[0.2em] text-cyan-400 glitch" data-text="J.A.R.V.I.S.">J.A.R.V.I.S.</h1>
            <span className="text-[10px] sm:text-xs text-cyan-600 tracking-widest font-tech mt-1">JUST A RATHER VERY INTELLIGENT SYSTEM // V.2.0.4</span>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center space-x-2 mb-1">
               <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-[0_0_5px_currentColor] ${isConnected ? 'bg-cyan-400 animate-pulse text-cyan-400' : 'bg-red-900 text-red-900'}`}></div>
               <span className="text-[10px] sm:text-xs font-tech text-cyan-400 text-glow hidden sm:inline">SERVER: US-CENTRAL-1</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-cyan-700 font-tech">SECURE_CONNECTION_Verified</span>
          </div>
        </header>

        {/* Responsive Grid Layout */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-0">
          
          {/* LEFT COLUMN: Diagnostics */}
          {/* Mobile: Order 2 (Below Reactor), Grid layout. Desktop: Order 1, Column Layout */}
          <div className="order-2 lg:order-1 col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4 lg:border-r border-cyan-900/30 lg:pr-4">
            
            {/* System Integrity Panel */}
            <div className="box-glow bg-black/40 p-3 sm:p-4 rounded-sm relative overflow-hidden group border border-cyan-500/20">
              <div className="absolute top-0 right-0 p-1">
                  <div className="w-3 h-3 border-t-2 border-r-2 border-cyan-500/50"></div>
              </div>
              <h3 className="text-xs sm:text-sm text-cyan-400 mb-4 tracking-widest font-bold border-b border-cyan-500/20 pb-1">SYSTEM INTEGRITY</h3>
              <div className="space-y-4 font-tech text-xs">
                {/* CPU */}
                <div className="flex justify-between items-center group">
                  <span className="text-cyan-700 group-hover:text-cyan-400 transition-colors">CPU</span>
                  <div className="w-24 sm:w-32 h-2 bg-cyan-900/30 skew-x-[-12deg] overflow-hidden">
                    <div className="h-full bg-cyan-500 shadow-[0_0_5px_cyan] transition-all duration-1000" style={{width: `${metrics.cpu}%`}}></div>
                  </div>
                  <span className="text-cyan-400 w-8 text-right">{metrics.cpu}%</span>
                </div>
                {/* MEMORY */}
                <div className="flex justify-between items-center group">
                  <span className="text-cyan-700 group-hover:text-cyan-400 transition-colors">MEM</span>
                  <div className="w-24 sm:w-32 h-2 bg-cyan-900/30 skew-x-[-12deg] overflow-hidden">
                    <div className="h-full bg-cyan-400 shadow-[0_0_5px_cyan] transition-all duration-1000" style={{width: `${metrics.memory}%`}}></div>
                  </div>
                  <span className="text-cyan-400 w-8 text-right">{metrics.memory}%</span>
                </div>
                {/* TEMP */}
                <div className="flex justify-between items-center group">
                  <span className="text-cyan-700 group-hover:text-cyan-400 transition-colors">TEMP</span>
                  <div className="w-24 sm:w-32 h-2 bg-cyan-900/30 skew-x-[-12deg] overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${metrics.temp > 80 ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-cyan-600 shadow-[0_0_5px_cyan]'}`} style={{width: `${metrics.temp}%`}}></div>
                  </div>
                  <span className="text-cyan-400 w-8 text-right">{metrics.temp}°C</span>
                </div>
              </div>
            </div>

            {/* Network Panel */}
            <div className="flex-1 box-glow bg-black/40 p-3 sm:p-4 rounded-sm relative border border-cyan-500/20">
               <h3 className="text-xs sm:text-sm text-cyan-400 mb-2 tracking-widest font-bold border-b border-cyan-500/20 pb-1">NETWORK TELEMETRY</h3>
               <div className="grid grid-cols-2 gap-3 text-center mt-4">
                   <div className="bg-cyan-900/10 p-2 border border-cyan-500/30 relative">
                       <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-400"></div>
                       <div className="text-[10px] text-cyan-600 tracking-wider">UPLINK</div>
                       <div className="font-tech text-cyan-300 text-sm sm:text-lg text-glow">{metrics.network} <span className="text-[10px]">Mb/s</span></div>
                   </div>
                   <div className="bg-cyan-900/10 p-2 border border-cyan-500/30 relative">
                       <div className="absolute bottom-0 right-0 w-1 h-1 bg-cyan-400"></div>
                       <div className="text-[10px] text-cyan-600 tracking-wider">LATENCY</div>
                       <div className="font-tech text-cyan-300 text-sm sm:text-lg text-glow">12 <span className="text-[10px]">ms</span></div>
                   </div>
               </div>
               
               {/* Visualizer - Hex Dump */}
               <div className="mt-4 sm:mt-6 p-2 bg-black/60 border border-cyan-900/30 rounded font-tech text-[9px] text-cyan-500/50 leading-tight overflow-hidden h-32 sm:h-48 break-all relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></div>
                 {Array.from({length: 20}).map((_, i) => (
                    <div key={i} className="opacity-70">{
                        Array.from({length: 12}).map(() => Math.floor(Math.random()*255).toString(16).padStart(2,'0').toUpperCase()).join(' ')
                    }</div>
                 ))}
               </div>
            </div>
          </div>

          {/* CENTER COLUMN: Reactor & Controls */}
          {/* Order 1 on Mobile */}
          <div className="order-1 lg:order-2 col-span-1 lg:col-span-6 flex flex-col items-center justify-start lg:justify-center relative py-4 lg:py-10">
            
            {/* Holographic Brackets (Hidden on mobile to save space, or scaled) */}
            <div className="absolute inset-0 pointer-events-none hidden sm:block">
                <div className="absolute top-0 left-4 w-16 sm:w-24 h-16 sm:h-24 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-3xl opacity-50"></div>
                <div className="absolute top-0 right-4 w-16 sm:w-24 h-16 sm:h-24 border-r-2 border-t-2 border-cyan-500/50 rounded-tr-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-4 w-16 sm:w-24 h-16 sm:h-24 border-l-2 border-b-2 border-cyan-500/50 rounded-bl-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-4 w-16 sm:w-24 h-16 sm:h-24 border-r-2 border-b-2 border-cyan-500/50 rounded-br-3xl opacity-50"></div>
            </div>

            <div className="mb-8 lg:mb-16 relative z-10 lg:scale-110">
               <ArcReactor state={connectionState} data={visualizerData} />
            </div>
            
            {/* Main Control Button */}
            <button
                onClick={handleToggleSystem}
                disabled={isConnecting}
                className={`
                    group relative px-8 sm:px-12 py-3 sm:py-5 overflow-hidden border font-tech text-base sm:text-xl tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-300 clip-path-slant
                    ${isConnected 
                        ? 'border-red-500 text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_50px_rgba(255,0,0,0.6)]' 
                        : isError 
                          ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'
                          : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:shadow-[0_0_50px_rgba(0,255,255,0.6)]'
                    }
                    ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
                <span className={`relative z-10 font-bold ${isConnected || isError ? 'text-glow' : ''}`}>
                    {isConnecting ? 'INITIALIZING...' : isConnected ? 'DISENGAGE' : isError ? 'SYSTEM FAILURE' : 'INITIALIZE'}
                </span>
            </button>
            
            <div className="mt-4 sm:mt-8 flex items-center space-x-2 opacity-70">
                <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse"></div>
                <span className="text-cyan-600 font-tech text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-center">
                  Gemini Multimodal Live API
                </span>
                <div className="w-1.5 h-1.5 bg-cyan-500 animate-pulse"></div>
            </div>

          </div>

          {/* RIGHT COLUMN: Logs */}
          {/* Order 3, flexible height on mobile */}
          <div className="order-3 lg:order-3 col-span-1 lg:col-span-3 flex flex-col h-64 lg:h-auto lg:border-l border-cyan-900/30 lg:pl-4">
             <StatusPanel logs={logs} status={connectionState} />
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;