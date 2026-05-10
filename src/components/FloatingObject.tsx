import { motion } from "framer-motion";
import { GraduationCap, Book, Pencil } from "lucide-react";

export function FloatingObject() {
  return (
    <div className="relative h-64 w-64 md:h-80 md:w-80 flex items-center justify-center">
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Main Icon */}
        <div className="p-8 rounded-3xl bg-white shadow-[0_20px_50px_rgba(30,58,138,0.1)] border border-slate-100 flex items-center justify-center">
          <GraduationCap className="w-32 h-32 text-blue-900" strokeWidth={1} />
        </div>

        {/* Orbiting Elements */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -inset-10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 p-3 bg-white rounded-xl shadow-lg border border-slate-100 scale-75">
            <Book className="w-6 h-6 text-amber-600" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-3 bg-white rounded-xl shadow-lg border border-slate-100 scale-75">
            <Pencil className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>
        
        {/* Shadow */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-6 bg-blue-900/5 blur-xl rounded-full" />
      </motion.div>
    </div>
  );
}
