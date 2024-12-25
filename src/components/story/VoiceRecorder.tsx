import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';
import { transcriptionService } from '../../services/transcription.service';
import { PROMPT_TEMPLATES } from '../../config/ai.config';
import { aiService } from '../../services/ai.service';
import type { TranscriptionProgress } from '../../types';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  className?: string;
}

export function VoiceRecorder({ onTranscription, className = '' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleProgress = useCallback((progress: TranscriptionProgress) => {
    if (progress.status === 'error') {
      const errorMessage = progress.error || 'Transcription failed';
      console.error('Transcription error:', errorMessage);
      setError(errorMessage);
      setIsProcessing(false);
    } else if (progress.status === 'completed') {
      setIsProcessing(false);
      setProgress(0);
    } else {
      setProgress(progress.progress || 0);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
        try {
          setIsProcessing(true);
          setError(null);

          // Step 1: Transcribe audio
          const result = await transcriptionService.transcribeLongAudio(
            audioBlob,
            { language: 'en' },
            handleProgress
          );
          
          // Step 2: Clean transcription
          setIsAnalyzing(true);
          const cleaned = await aiService.cleanTranscription(result);
          if (!cleaned.success) {
            throw new Error(cleaned.error || 'Failed to clean transcription');
          }
          
          // Step 3: Get story prompts
          const enhanced = await aiService.editText(cleaned.text, {
            temperature: 0.7
          });

          // Step 4: Present results
          const finalText = enhanced.success
            ? `${cleaned.text}\n\n${enhanced.text}`
            : cleaned.text;

          onTranscription(finalText);
        } catch (error: any) {
          const errorMessage = error.message?.includes('API key')
            ? 'Voice recording is currently unavailable'
            : error.message || 'Failed to transcribe audio';
          setError(errorMessage);
        } finally {
          setIsProcessing(false);
          setIsAnalyzing(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access to record.'
        : 'Could not access microphone';
      setError(errorMessage);
    }
  }, [handleProgress, onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      try {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => !isProcessing && (isRecording ? stopRecording() : startRecording())}
        disabled={isProcessing}
        className={`p-3 rounded-full transition-colors ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-[#3b19e6] hover:bg-[#2f14b8] disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>

      {isProcessing && progress > 0 && (
        <div className="text-[#a29db8] text-sm">
          {isAnalyzing ? 'Analyzing and enhancing content...' : `Transcribing... ${progress}%`}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm break-words max-w-[300px]">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
