/**
 * Audio Waveform Visualizer
 * Shows animated bars that respond to microphone input in real-time
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  isRecording: boolean;
  barCount?: number;
};

export default function AudioWaveform({ isRecording, barCount = 20 }: Props) {
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0.1));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isRecording) {
      // Reset levels when not recording
      setLevels(Array(barCount).fill(0.1));
      return;
    }

    let mounted = true;

    async function startAnalyser() {
      try {
        // Get microphone stream for visualization only
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Create audio context and analyser
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Start animation loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function animate() {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Convert frequency data to bar levels
          const newLevels: number[] = [];
          const step = Math.floor(dataArray.length / barCount);

          for (let i = 0; i < barCount; i++) {
            // Get average of frequency range for this bar
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[i * step + j] || 0;
            }
            const avg = sum / step;
            // Normalize to 0.1-1 range (keep minimum height)
            const normalized = Math.max(0.1, avg / 255);
            newLevels.push(normalized);
          }

          setLevels(newLevels);
          animationRef.current = requestAnimationFrame(animate);
        }

        animate();
      } catch (error) {
        console.error("[AudioWaveform] Error accessing microphone:", error);
        // Fallback to random animation
        startFallbackAnimation();
      }
    }

    function startFallbackAnimation() {
      function animate() {
        if (!mounted) return;

        setLevels((prev) =>
          prev.map((level) => {
            const change = (Math.random() - 0.5) * 0.3;
            return Math.max(0.1, Math.min(1, level + change));
          })
        );
        animationRef.current = requestAnimationFrame(animate);
      }
      animate();
    }

    startAnalyser();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, barCount]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {levels.map((level, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-violet-500 transition-all duration-75"
          style={{
            height: `${level * 100}%`,
            opacity: 0.6 + level * 0.4,
          }}
        />
      ))}
    </div>
  );
}
