import React, { useEffect, useState } from 'react';
import { ConnectionState, VisualizerData } from '../types';

interface ArcReactorProps {
  state: ConnectionState;
  data: VisualizerData;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ state, data }) => {
  const isConnected = state === ConnectionState.CONNECTED;
  const isConnecting = state === ConnectionState.CONNECTING;
  const isError = state === ConnectionState.ERROR;

  // Colors
  const mainColor = isError ? '#ef4444' : isConnecting ? '#eab308' : '#06b6d4'; // Red, Yellow, Cyan
  const glowColor = isError ? 'rgba(239, 68, 68, 0.5)' : isConnecting ? 'rgba(234, 179, 8, 0.5)' : 'rgba(6, 182, 212, 0.5)';

  // Visualizer Data
  const bass = isConnected ? data.bass : 0;
  const mid = isConnected ? data.mid : 0;
  const treble = isConnected ? data.treble : 0;
  const volume = isConnected ? data.volume : 0;
  
  // Random HUD Numbers for VFX
  const [hudNumbers, setHudNumbers] = useState<number[]>([0,0,0,0]);
  useEffect(() => {
      const interval = setInterval(() => {
          setHudNumbers(prev => prev.map(() => Math.floor(Math.random() * 99)));
      }, 200);
      return () => clearInterval(interval);
  }, []);

  return (
    /* Responsive Container: Scales with parent width/height */
    <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] lg:w-[380px] lg:h-[380px] flex justify-center items-center transition-all duration-300">
      
      {/* Background Hex Pattern (Static) */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
        <pattern id="hex" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke={mainColor} strokeWidth="0.5"/>
        </pattern>
        <rect x="0" y="0" width="100" height="100" fill="url(#hex)" />
      </svg>

      {/* Orbiting Particles System */}
      <div className={`absolute inset-0 animate-[spin_8s_linear_infinite] ${isConnected ? 'opacity-100' : 'opacity-20'}`}>
          <div className="absolute top-[10%] left-[50%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
          <div className="absolute bottom-[10%] left-[50%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
          <div className="absolute top-[50%] left-[10%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
      </div>
      <div className={`absolute inset-0 animate-[spin_12s_linear_infinite_reverse] ${isConnected ? 'opacity-100' : 'opacity-20'}`}>
          <div className="absolute top-[15%] left-[80%] w-1 h-1 bg-cyan-200 rounded-full"></div>
          <div className="absolute bottom-[15%] left-[20%] w-1 h-1 bg-cyan-200 rounded-full"></div>
      </div>

      {/* Outer Scale Ring (Static with Bass Pulse) */}
      <div 
        className="absolute inset-0 rounded-full border border-cyan-900/40"
        style={{ transform: `scale(${1 + bass * 0.05})`, transition: 'transform 0.05s' }}
      >
         <svg className="w-full h-full p-2" viewBox="0 0 100 100">
            {/* Dashed Outer Ring */}
            <circle cx="50" cy="50" r="48" fill="none" stroke={mainColor} strokeWidth="0.3" strokeOpacity="0.4" strokeDasharray="4 2" />
            
            {/* Dynamic Arcs */}
            <path d="M50 2 A 48 48 0 0 1 90 25" fill="none" stroke={mainColor} strokeWidth="1" strokeOpacity="0.8" className="animate-pulse" />
            <path d="M50 98 A 48 48 0 0 1 10 75" fill="none" stroke={mainColor} strokeWidth="1" strokeOpacity="0.8" className="animate-pulse" />
            
            {/* Ticks */}
            {Array.from({ length: 36 }).map((_, i) => (
                <line 
                    key={i}
                    x1="50" y1="4" x2="50" y2="7" 
                    transform={`rotate(${i * 10} 50 50)`} 
                    stroke={mainColor} 
                    strokeWidth="0.5"
                    strokeOpacity={0.6}
                />
            ))}
         </svg>
      </div>

      {/* HUD Numbers Ring */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="absolute top-[10%] font-tech text-[10px] text-cyan-500">{hudNumbers[0]}</div>
          <div className="absolute bottom-[10%] font-tech text-[10px] text-cyan-500">{hudNumbers[1]}</div>
          <div className="absolute left-[10%] font-tech text-[10px] text-cyan-500">{hudNumbers[2]}</div>
          <div className="absolute right-[10%] font-tech text-[10px] text-cyan-500">{hudNumbers[3]}</div>
      </div>

      {/* Rotating Mechanical Ring 1 (Mids) - 75% size */}
      <div 
        className="absolute w-[75%] h-[75%] rounded-full border border-cyan-500/20"
        style={{ 
            animation: `spin-slow ${20 - (mid * 10)}s linear infinite`,
            boxShadow: `0 0 ${30 * volume}px ${glowColor}`
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-current shadow-[0_0_10px_currentColor]" style={{color: mainColor}}></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-current shadow-[0_0_10px_currentColor]" style={{color: mainColor}}></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-current shadow-[0_0_10px_currentColor]" style={{color: mainColor}}></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-current shadow-[0_0_10px_currentColor]" style={{color: mainColor}}></div>
      </div>

      {/* Rotating Mechanical Ring 2 (Counter-Rotate) - 65% size */}
      <div 
        className="absolute w-[65%] h-[65%] rounded-full border-2 border-dashed border-cyan-500/20"
        style={{ 
            animation: `spin-reverse-slow ${15 - (bass * 5)}s linear infinite` 
        }}
      >
          {/* Inner segments */}
           <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
               <path d="M50 10 A 40 40 0 0 1 90 50" fill="none" stroke={mainColor} strokeWidth="0.5" strokeOpacity="0.5" />
               <path d="M50 90 A 40 40 0 0 1 10 50" fill="none" stroke={mainColor} strokeWidth="0.5" strokeOpacity="0.5" />
           </svg>
      </div>

      {/* Inner Energy Ring (Treble Jitter) - 45% size */}
      <div 
         className="absolute w-[45%] h-[45%] rounded-full border-t-2 border-b-2 border-transparent"
         style={{
             borderColor: isConnected ? mainColor : 'rgba(21, 94, 117, 0.3)',
             borderLeftColor: 'transparent',
             borderRightColor: 'transparent',
             transform: `rotate(${Date.now() / 10}deg) scale(${1 + treble * 0.15})`,
             opacity: 0.9,
             boxShadow: `inset 0 0 20px ${glowColor}`
         }}
      ></div>

      {/* The Core - 30% size */}
      <div 
        className="absolute w-[30%] h-[30%] rounded-full flex justify-center items-center backdrop-blur-md border border-white/20"
        style={{
            background: `radial-gradient(circle, ${mainColor} 0%, transparent 80%)`,
            boxShadow: `0 0 ${40 + (volume * 60)}px ${mainColor}`,
            opacity: isConnected ? 1 : 0.4
        }}
      >
        <div className="absolute inset-0 rounded-full border border-white/30 animate-ping opacity-20"></div>
        <div className="w-[80%] h-[80%] bg-white/90 rounded-full blur-md animate-pulse"></div>
        
        {/* Core Detail */}
        <div className="absolute w-full h-full animate-[spin_3s_linear_infinite]">
             <div className="absolute top-2 left-1/2 w-0.5 h-2 bg-white/50"></div>
             <div className="absolute bottom-2 left-1/2 w-0.5 h-2 bg-white/50"></div>
        </div>
      </div>
      
      {/* Status Overlay */}
      <div className="absolute bottom-[-40px] font-tech text-[10px] sm:text-xs tracking-[0.3em] text-cyan-400/80 bg-black/50 px-3 py-1 border border-cyan-500/30 rounded whitespace-nowrap">
          {isError ? 'CRITICAL ERROR' : isConnecting ? 'SYNCING...' : isConnected ? 'SYSTEM ONLINE' : 'STANDBY MODE'}
      </div>

    </div>
  );
};