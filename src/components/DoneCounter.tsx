import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function DoneCounter({ count }: { count: number }) {
  const prevCount = useRef(count);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (count > prevCount.current) {
      setPop(true);
      const id = window.setTimeout(() => setPop(false), 500);
      prevCount.current = count;
      return () => window.clearTimeout(id);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <motion.div
      animate={pop ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center gap-1 rounded-full bg-ucla-gold/20 px-2.5 py-1 text-xs font-bold text-ucla-blue-dark"
      title="Tasks done all-time"
    >
      <Trophy className="h-3.5 w-3.5" />
      {count}
    </motion.div>
  );
}
