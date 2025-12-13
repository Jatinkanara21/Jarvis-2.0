import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, VisualizerData } from '../types';
import { base64ToBytes, decodeAudioData, float32To16BitPCM } from './audioUtils';

// Audio Context constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  
  private outputNode: GainNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  
  private nextStartTime = 0;
  private animationFrameId: number | null = null;
  
  private currentInputTranscription = '';
  private currentOutputTranscription = '';
  
  private statusCallback: (status: ConnectionState) => void;
  private logCallback: (role: 'user' | 'model' | 'system', text: string) => void;
  private visualizerCallback: (data: VisualizerData) => void;

  constructor(
    statusCallback: (status: ConnectionState) => void,
    logCallback: (role: 'user' | 'model' | 'system', text: string) => void,
    visualizerCallback: (data: VisualizerData) => void
  ) {
    this.statusCallback = statusCallback;
    this.logCallback = logCallback;
    this.visualizerCallback = visualizerCallback;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  public async connect() {
    this.statusCallback(ConnectionState.CONNECTING);
    this.logCallback('system', 'Initializing J.A.R.V.I.S. protocols...');

    try {
      // Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });

      // Setup Output Chain: Source -> Gain -> Analyser -> Destination
      this.outputNode = this.outputAudioContext.createGain();
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 512;
      this.outputAnalyser.smoothingTimeConstant = 0.5;
      
      this.outputNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioContext.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are J.A.R.V.I.S., a highly intelligent, sophisticated AI assistant with a British accent. Keep your responses concise, witty, and helpful. Do not mention you are a Google model. Address the user as "Sir" or "Boss". You are capable of conversing in any language the user speaks.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Deep British-like voice
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            this.statusCallback(ConnectionState.CONNECTED);
            this.logCallback('system', 'Connection established. Audio uplink secure.');
            this.startAudioInput(stream);
            this.startVisualizerLoop();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              await this.playAudio(audioData);
            }
            
            // Handle Transcription
            if (message.serverContent?.inputTranscription?.text) {
               this.currentInputTranscription += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription?.text) {
               this.currentOutputTranscription += message.serverContent.outputTranscription.text;
            }

            // Handle Turn Completion
            if (message.serverContent?.turnComplete) {
               if (this.currentInputTranscription.trim()) {
                   this.logCallback('user', this.currentInputTranscription.trim());
                   this.currentInputTranscription = '';
               }
               if (this.currentOutputTranscription.trim()) {
                   this.logCallback('model', this.currentOutputTranscription.trim());
                   this.currentOutputTranscription = '';
               }
            }
            
            // Handle interruption signal
             if (message.serverContent?.interrupted) {
                this.logCallback('system', 'Interruption detected.');
                this.stopAudioPlayback();
                this.currentInputTranscription = '';
                this.currentOutputTranscription = '';
            }
          },
          onclose: () => {
             this.disconnect();
          },
          onerror: (err) => {
            console.error('Gemini Live Error:', err);
            this.logCallback('system', `Error: ${err.message || 'Unknown error'}`);
            this.disconnect();
          },
        },
      });

    } catch (error) {
      console.error('Connection failed:', error);
      this.logCallback('system', 'Failed to initialize protocols.');
      this.statusCallback(ConnectionState.ERROR);
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.inputAnalyser = this.inputAudioContext.createAnalyser();
    this.inputAnalyser.fftSize = 512;
    this.inputAnalyser.smoothingTimeConstant = 0.5;

    // Buffer size 4096 is a good balance for ScriptProcessor
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert to PCM and send
      const pcmData = float32To16BitPCM(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: pcmData.mimeType,
            data: pcmData.data
          }
        });
      });
    };

    // Chain: Source -> Analyser -> Processor -> Destination
    this.inputSource.connect(this.inputAnalyser);
    this.inputAnalyser.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private startVisualizerLoop() {
    const updateVisualizer = () => {
      if (!this.inputAnalyser && !this.outputAnalyser) return;

      const data: VisualizerData = { volume: 0, bass: 0, mid: 0, treble: 0 };
      
      // Helper to process analyser data
      const processFreq = (analyser: AnalyserNode | null) => {
        if (!analyser) return { vol: 0, bass: 0, mid: 0, treble: 0 };
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Calculate Average Volume (RMS-ish)
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;

        // Calculate Bands (approximate indices for 512 FFT)
        // Bass: 0-10, Mid: 11-100, Treble: 101-255
        const getAvgRange = (start: number, end: number) => {
           let s = 0;
           for(let i=start; i<end; i++) s += dataArray[i];
           return s / (end - start);
        };

        return {
          vol: avg / 255,
          bass: getAvgRange(0, 10) / 255,
          mid: getAvgRange(11, 100) / 255,
          treble: getAvgRange(101, 200) / 255
        };
      };

      const inputMetrics = processFreq(this.inputAnalyser);
      const outputMetrics = processFreq(this.outputAnalyser);

      // Merge metrics (take max to visualize whoever is speaking louder)
      data.volume = Math.max(inputMetrics.vol, outputMetrics.vol);
      data.bass = Math.max(inputMetrics.bass, outputMetrics.bass);
      data.mid = Math.max(inputMetrics.mid, outputMetrics.mid);
      data.treble = Math.max(inputMetrics.treble, outputMetrics.treble);

      this.visualizerCallback(data);
      this.animationFrameId = requestAnimationFrame(updateVisualizer);
    };

    updateVisualizer();
  }

  private async playAudio(base64Data: string) {
    if (!this.outputAudioContext || !this.outputNode) return;

    const audioBytes = base64ToBytes(base64Data);
    const audioBuffer = await decodeAudioData(audioBytes, this.outputAudioContext, OUTPUT_SAMPLE_RATE);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);

    // Schedule playback
    const currentTime = this.outputAudioContext.currentTime;
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  private stopAudioPlayback() {
      if (this.outputAudioContext) {
          this.nextStartTime = this.outputAudioContext.currentTime;
      }
  }

  public async disconnect() {
    this.statusCallback(ConnectionState.DISCONNECTED);
    this.logCallback('system', 'Systems powering down.');
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputAnalyser) {
       this.inputAnalyser.disconnect();
       this.inputAnalyser = null;
    }
    
    if (this.outputAnalyser) {
       this.outputAnalyser.disconnect();
       this.outputAnalyser = null;
    }

    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
    this.sessionPromise = null;
  }
}