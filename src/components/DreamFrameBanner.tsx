import React from 'react';
import { motion } from 'motion/react';

const DreamFrameBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 mb-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }} />

        <motion.div
          className="absolute -bottom-10 -right-10 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }} />

        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "ease-in-out"
          }} />

      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) =>
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-white/30 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`
        }}
        animate={{
          y: [-20, -100, -20],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2
        }} />

      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4">

          {/* Main title with animated letters */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 tracking-wider"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.2,
              ease: "easeOut"
            }}>

            <motion.span
              className="inline-block"
              animate={{
                textShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 20px rgba(147,51,234,0.6)",
                "0 0 10px rgba(255,255,255,0.5)"]

              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "ease-in-out"
              }}>

              DREAM FRAME
            </motion.span>
            <br />
            <motion.span
              className="inline-block bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent"
              animate={{
                textShadow: [
                "0 0 10px rgba(255,255,255,0.3)",
                "0 0 15px rgba(251,191,36,0.6)",
                "0 0 10px rgba(255,255,255,0.3)"]

              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "ease-in-out",
                delay: 0.5
              }}>

              SERVICE
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-blue-100/90 font-medium tracking-wide max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}>

            Transforming Visions into Reality
          </motion.p>

          {/* Decorative line */}
          <motion.div
            className="flex justify-center items-center space-x-4 mt-6"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}>

            <motion.div
              className="h-0.5 w-16 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{
                scaleX: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "ease-in-out"
              }} />

            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "ease-in-out"
              }} />

            <motion.div
              className="h-0.5 w-16 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{
                scaleX: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "ease-in-out",
                delay: 1
              }} />

          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
    </div>);

};

export default DreamFrameBanner;