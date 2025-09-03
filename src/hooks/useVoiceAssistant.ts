import { useState, useCallback, useEffect } from 'react';

interface VoiceAssistantOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseVoiceAssistantReturn {
  isEnabled: boolean;
  isSupported: boolean;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  speak: (text: string, options?: VoiceAssistantOptions) => void;
  stop: () => void;
  toggle: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

export const useVoiceAssistant = (): UseVoiceAssistantReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Set default voice (prefer English voices)
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || availableVoices.find(voice => 
          voice.lang.startsWith('en')
        ) || availableVoices[0];
        
        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported, selectedVoice]);

  // Monitor speaking state
  useEffect(() => {
    if (!isSupported) return;

    const handleStart = () => setIsSpeaking(true);
    const handleEnd = () => setIsSpeaking(false);
    const handleError = () => setIsSpeaking(false);

    speechSynthesis.addEventListener('start', handleStart);
    speechSynthesis.addEventListener('end', handleEnd);
    speechSynthesis.addEventListener('error', handleError);

    return () => {
      speechSynthesis.removeEventListener('start', handleStart);
      speechSynthesis.removeEventListener('end', handleEnd);
      speechSynthesis.removeEventListener('error', handleError);
    };
  }, [isSupported]);

  const speak = useCallback((text: string, options: VoiceAssistantOptions = {}) => {
    if (!isSupported || !isEnabled || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.voice = options.voice ?? selectedVoice;

    // Add event listeners for this specific utterance
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [isSupported, isEnabled, selectedVoice]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsEnabled(prev => !prev);
  }, [isSpeaking, stop]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    isEnabled,
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    speak,
    stop,
    toggle,
    setVoice,
  };
};