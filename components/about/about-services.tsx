"use client"

import { motion } from "framer-motion"
import { Send, FileText, Mail, Film, Users } from "lucide-react"

interface ServiceItem {
  id: string
  number: string
  iconType: string
  title: string
  subtitle: string
  description: string
}

interface AboutServicesProps {
  data: {
    title: string
    items: ServiceItem[]
  }
}

const iconMap: Record<string, React.ElementType> = {
  send: Send,
  document: FileText,
  mail: Mail,
  film: Film,
  users: Users,
}

const cardColors = [
  { bg: "from-orange-100 to-amber-50", icon: "from-primary to-orange-500" },
  { bg: "from-amber-100 to-yellow-50", icon: "from-amber-500 to-yellow-500" },
  { bg: "from-rose-100 to-orange-50", icon: "from-rose-500 to-orange-500" },
  { bg: "from-teal-100 to-emerald-50", icon: "from-teal-500 to-emerald-500" },
  { bg: "from-violet-100 to-purple-50", icon: "from-violet-500 to-purple-500" },
]

export function AboutServices({ data }: AboutServicesProps) {
  return (
    <section className="relative py-20 lg:py-28 bg-gradient-to-b from-background via-orange-50/30 to-background overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-orange-100/40 to-amber-100/40"
          style={{
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-amber-100/40 to-orange-100/40"
          style={{
            filter: "blur(50px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {data.title}
          </h2>
        </motion.div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((service, index) => {
            const Icon = iconMap[service.iconType] || Send
            const colors = cardColors[index % cardColors.length]

            return (
              <motion.div
                key={service.id}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className={`relative h-full rounded-3xl bg-gradient-to-br ${colors.bg} p-6 lg:p-8 transition-transform duration-300 group-hover:-translate-y-2`}
                  style={{
                    boxShadow:
                      "0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 8px 16px -8px rgba(0, 0, 0, 0.04), inset 0 -4px 8px rgba(0,0,0,0.02), inset 0 4px 8px rgba(255,255,255,0.8)",
                  }}
                >
                  {/* Service Number */}
                  <span className="absolute top-4 right-4 text-4xl font-bold text-foreground/10">
                    {service.number}
                  </span>

                  {/* 3D Icon */}
                  <motion.div
                    className="mb-5"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div
                      className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.icon} items-center justify-center`}
                      style={{
                        boxShadow:
                          "0 12px 24px -6px rgba(255, 127, 0, 0.3), 0 6px 12px -4px rgba(255, 127, 0, 0.2), inset 0 -3px 6px rgba(0,0,0,0.1), inset 0 3px 6px rgba(255,255,255,0.3)",
                        transform: "perspective(300px) rotateX(5deg)",
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-3">
                    {service.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
