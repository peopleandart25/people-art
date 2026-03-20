"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface AboutHeroProps {
  data: {
    badge: string
    title: string
    description: string
  }
}

export function AboutHero({ data }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-background py-24 lg:py-32">
      {/* 3D Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating 3D Shapes */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-orange-300/20 backdrop-blur-sm"
          style={{
            transform: "rotate(-15deg)",
            boxShadow: "0 25px 50px -12px rgba(255, 127, 0, 0.15), inset 0 -4px 8px rgba(0,0,0,0.05), inset 0 4px 8px rgba(255,255,255,0.5)",
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-15, -10, -15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/40"
          style={{
            boxShadow: "0 20px 40px -10px rgba(255, 127, 0, 0.1), inset 0 -3px 6px rgba(0,0,0,0.05), inset 0 3px 6px rgba(255,255,255,0.5)",
          }}
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100/50 to-amber-100/50"
          style={{
            transform: "rotate(30deg)",
            boxShadow: "0 15px 30px -8px rgba(255, 127, 0, 0.1), inset 0 -2px 4px rgba(0,0,0,0.03), inset 0 2px 4px rgba(255,255,255,0.5)",
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [30, 35, 30],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 right-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-primary/15 to-orange-400/15"
          style={{
            boxShadow: "0 12px 24px -6px rgba(255, 127, 0, 0.1), inset 0 -2px 4px rgba(0,0,0,0.03), inset 0 2px 4px rgba(255,255,255,0.5)",
          }}
          animate={{
            y: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 border-primary/30 bg-primary/5 text-primary px-4 py-1.5 text-sm font-medium"
          >
            {data.badge}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            {data.title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground lg:text-xl leading-relaxed">
            {data.description}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
