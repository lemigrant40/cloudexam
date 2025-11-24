import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function Timer({ duration = 180, isPaused = false }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused) {
      return; // Don't run timer when paused
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const percentage = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 10;
  const isVeryLowTime = timeLeft <= 5;

  const getColor = () => {
    if (isPaused) return 'text-slate-400 bg-slate-700/50 border-slate-600';
    if (isVeryLowTime) return 'text-red-500 bg-red-500/10 border-red-500';
    if (isLowTime) return 'text-amber-500 bg-amber-500/10 border-amber-500';
    return 'text-blue-400 bg-blue-500/10 border-blue-500';
  };

  return (
    <div className={`flex items-center gap-3 border-2 rounded-lg px-4 py-2 transition-all ${getColor()} ${isVeryLowTime && !isPaused ? 'animate-pulse' : ''}`}>
      <Clock className="w-5 h-5" />
      <div className="flex flex-col items-center">
        <span className="font-mono font-bold text-lg leading-none">
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
        {isPaused ? (
          <span className="text-xs opacity-75">Paused</span>
        ) : isLowTime ? (
          <span className="text-xs opacity-75">Hurry!</span>
        ) : null}
      </div>
      {/* Progress bar */}
      <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isPaused ? 'bg-slate-500' : isVeryLowTime ? 'bg-red-500' : isLowTime ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Timer;
