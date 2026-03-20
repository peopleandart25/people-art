"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AboutCtaProps {
  data: {
    title: string
    subtitle: string
    button: {
      text: string
      link: string
    }
  }
}

export function AboutCta({ data }: AboutCtaProps) {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-500">
        {/* Overlay pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* 3D Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-24 h-24 rounded-2xl bg-white/10"
          style={{
            boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.1), inset 0 3px 6px rgba(255,255,255,0.2)",
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-20 right-20 w-16 h-16 rounded-full bg-white/15"
          style={{
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)",
          }}
          animate={{
            y: [0, 10, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-20 h-20 rounded-3xl bg-white/10"
          style={{
            transform: "rotate(15deg)",
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)",
          }}
          animate={{
            y: [0, -10, 0],
            rotate: [15, 25, 15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-10 right-1/3 w-12 h-12 rounded-full bg-white/20"
          style={{
            boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.2)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            y: [0, 8, 0],
          }}
          transition={{
            duration: 3,
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
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {data.title}
          </h2>
          <p className="mt-4 text-2xl font-semibold text-white/90 sm:text-3xl lg:text-4xl">
            {data.subtitle}
          </p>
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              asChild
              size="lg"
              className="gap-2 bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-2xl font-semibold"
              style={{
                boxShadow:
                  "0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Link href={data?.button?.link ? data.button.link : "#"}>
                {data?.button?.text ? data.button.text : "바로가기"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
