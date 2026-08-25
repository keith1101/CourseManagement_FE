import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountdownProps {
  initialSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export const useCountdown = ({
  initialSeconds,
  onExpire,
  autoStart = true,
}: UseCountdownProps) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(
    (newSeconds?: number) => {
      setSecondsLeft(newSeconds !== undefined ? newSeconds : initialSeconds);
      setIsRunning(autoStart);
    },
    [initialSeconds, autoStart]
  );

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formattedTime =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = secondsLeft > 0 && secondsLeft <= 300; // Under 5 minutes
  const isUrgent = secondsLeft > 0 && secondsLeft <= 60; // Under 1 minute

  return {
    secondsLeft,
    formattedTime,
    hours,
    minutes,
    seconds,
    isRunning,
    isWarning,
    isUrgent,
    start,
    pause,
    reset,
  };
};
