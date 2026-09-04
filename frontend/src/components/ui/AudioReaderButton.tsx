import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { toast } from 'sonner';

interface AudioReaderButtonProps {
  textToRead?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const AudioReaderButton: React.FC<AudioReaderButtonProps> = ({
  textToRead,
  className = '',
  size = 'sm',
}) => {
  const { language } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleAudio = () => {
    if (!isSupported) {
      toast.error(
        language === 'hi'
          ? 'इस ब्राउज़र में ऑडियो वाचन समर्थित नहीं है।'
          : 'Text-to-speech audio is not supported in this browser.'
      );
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const content =
      textToRead ||
      (language === 'hi'
        ? 'नगरसम एआई में आपका स्वागत है। सड़क की समस्या की फोटो अपलोड करें और नगर निगम द्वारा त्वरित समाधान पाएं।'
        : 'Welcome to NagarSam AI. AI-powered civic road infrastructure intelligence for reporting, detection, prioritization, and verified repair.');

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setIsPlaying(true);
      toast.info(
        language === 'hi'
          ? 'ऑडियो सुनाया जा रहा है...'
          : 'Playing audio overview...'
      );
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-xs';

  return (
    <button
      type="button"
      onClick={handleToggleAudio}
      aria-label={isPlaying ? 'Stop audio playback' : 'Listen to page audio summary'}
      aria-pressed={isPlaying}
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-semibold transition select-none ${
        isPlaying
          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
          : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
      } ${className}`}
      title={isPlaying ? 'Stop audio' : 'Listen to audio'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'रोकें' : 'Stop Audio'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'hi' ? 'ऑडियो सुनें' : 'Listen'}</span>
        </>
      )}
    </button>
  );
};
