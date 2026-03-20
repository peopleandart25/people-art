"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Target, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AboutDirectSystemProps {
  data: {
    badge: string
    title: string
    description: string
    subDescription: string
    ctaButton: {
      text: string
      link: string
    }
    highlight: string
  }
}

export function AboutDirectSystem({ data }: AboutDirectSystemProps) {
  return (
    <section className="relative py-20 lg:py-28 bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 127, 0, 0.08) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: 3D Icon Card */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="relative mx-auto w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 p-8 flex items-center justify-center"
              style={{
                boxShadow:
                  "0 40px 80px -20px rgba(255, 127, 0, 0.2), 0 20px 40px -15px rgba(255, 127, 0, 0.1), inset 0 -8px 16px rgba(0,0,0,0.03), inset 0 8px 16px rgba(255,255,255,0.8)",
              }}
            >
              {/* 3D Target Icon */}
              <motion.div
                className="relative"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div
                  className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center"
                  style={{
                    boxShadow:
                      "0 25px 50px -12px rgba(255, 127, 0, 0.4), 0 12px 24px -8px rgba(255, 127, 0, 0.3), inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.3)",
                    transform: "perspective(500px) rotateX(5deg) rotateY(-5deg)",
                  }}
                >
                  <Target className="w-20 h-20 text-white" />
                </div>
              </motion.div>

              {/* Floating decorative elements */}
              <motion.div
                className="absolute top-8 right-8 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-orange-200"
                style={{
                  boxShadow: "0 8px 16px -4px rgba(255, 127, 0, 0.2), inset 0 -2px 4px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.5)",
                }}
                animate={{
                  rotate: [0, 15, 0],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-12 left-8 w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-amber-300"
                style={{
                  boxShadow: "0 6px 12px -3px rgba(255, 127, 0, 0.2), inset 0 -1px 2px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,0.5)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  y: [0, 5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 text-primary px-4 py-1.5 text-sm font-medium"
            >
              {data.badge}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {data.title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {data.description}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              {data.subDescription}
            </p>

            {/* Highlight Card */}
            <div
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-orange-100/50 px-6 py-4 border border-primary/20"
              style={{
                boxShadow: "0 8px 16px -4px rgba(255, 127, 0, 0.1)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">
                {data.highlight}
              </span>
            </div>

            <div className="pt-4">
              <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                <Link href={data?.ctaButton?.link ? data.ctaButton.link : "#"}>
                  {data?.ctaButton?.text ? data.ctaButton.text : "자세히 보기"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
