import { LineChartIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type LoadingProgressProps = {
  messages: string[];
  progress: number;
};

function LoadingProgress({ messages, progress }: LoadingProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    setMessageIndex(0);

    if (messages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((currentIndex) =>
        Math.min(currentIndex + 1, messages.length - 1),
      );
    }, 26_000);

    return () => window.clearInterval(interval);
  }, [messages]);

  return (
    <div className="mt-2 w-full rounded-lg border bg-muted/20 p-2">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
        <LineChartIcon className="size-3.5" />
        <AnimatePresence mode="wait">
          <motion.span
            key={messages[messageIndex]}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            {messages[messageIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.45,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}

export { LoadingProgress };
