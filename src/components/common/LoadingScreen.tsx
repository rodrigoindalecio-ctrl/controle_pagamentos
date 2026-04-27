import React from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface LoadingScreenProps {
  logo?: string;
}

export const LoadingScreen = ({ logo }: LoadingScreenProps) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-[#FDF8F8] flex flex-col items-center justify-center"
  >
    <div className="relative">
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[#883545] rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.9, 1],
          boxShadow: [
            "0 0 20px rgba(136, 53, 69, 0.1)",
            "0 0 40px rgba(136, 53, 69, 0.2)",
            "0 0 20px rgba(136, 53, 69, 0.1)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="size-32 bg-white rounded-[2.8rem] flex items-center justify-center border border-[#883545]/5 overflow-hidden p-7"
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <Heart className="text-[#883545] w-12 h-12" />
        )}
      </motion.div>

      {/* Spinning Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-4 border-2 border-dashed border-[#883545]/10 rounded-[3.5rem]"
      />
    </div>

    <div className="mt-12 flex flex-col items-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[10px] font-black text-[#883545] uppercase tracking-[0.4em] mb-4"
      >
        Preparando Experiência
      </motion.p>
      <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className="h-full bg-[#883545]"
        />
      </div>
    </div>
  </motion.div>
);
