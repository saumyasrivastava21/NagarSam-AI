import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../../i18n';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

// Augment window for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  size = 'md',
}) => {
  const { language } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const paddingClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript);
          toast.success(
            language === 'hi'
              ? `आवाज़ दर्ज हुई: "${transcript}"`
              : `Voice captured: "${transcript}"`
          );
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error(
            language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग में अनुमति दें।'
              : 'Microphone access blocked. Please allow permissions in browser.'
          );
        } else {
          toast.error(
            language === 'hi'
              ? 'आवाज़ रिकॉर्ड नहीं हो सकी। आप टाइप कर सकते हैं।'
              : 'Voice recognition stopped. You can type instead.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error(
        language === 'hi'
          ? 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। आप लिखकर विवरण दर्ज कर सकते हैं।'
          : 'Voice input is not supported in this browser. You can type your description instead.'
      );
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch {
        // if already started or active
        setIsListening(true);
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        onClick={() =>
          toast.info(
            language === 'hi'
              ? 'वॉयस इनपुट समर्थित नहीं है। कृपया कीबोर्ड का उपयोग करें।'
              : 'Voice typing is not supported on this browser. Please type your notes.'
          )
        }
        title="Voice input not supported"
        aria-label="Voice input not supported"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed ${className}`}
      >
        <MicOff className="w-3.5 h-3.5" />
        <span className="text-[11px]">{language === 'hi' ? 'बोलें' : 'Speak'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      aria-label={isListening ? 'Stop listening to microphone' : 'Start voice input via microphone'}
      aria-pressed={isListening}
      className={`inline-flex items-center gap-1.5 ${paddingClass} rounded-xl font-bold transition-all select-none ${
        isListening
          ? 'bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse ring-2 ring-red-300'
          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-slate-800 dark:text-primary-300 dark:hover:bg-slate-700 border border-primary-200 dark:border-slate-700'
      } ${className}`}
    >
      <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : 'text-primary-600 dark:text-primary-400'}`} />
      <span>
        {isListening
          ? language === 'hi'
            ? 'सुन रहे हैं...'
            : 'Listening...'
          : language === 'hi'
          ? 'बोलकर लिखें'
          : 'Speak Notes'}
      </span>
    </button>
  );
};
