export interface LogMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface VisualizerData {
  volume: number; // RMS/Overall amplitude (0-1)
  bass: number;   // Low frequencies (0-1)
  mid: number;    // Mid frequencies (0-1)
  treble: number; // High frequencies (0-1)
}