import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Reader",
    price: "Free",
    description: "Perfect for casual readers",
    features: [
      "Unlimited reading",
      "Bookmark novels",
      "Reading history",
      "Follow favorite authors",
    ],
  },
  {
    name: "Writer",
    price: "Free",
    description: "For aspiring and established writers",
    features: [
      "All Reader features",
      "Unlimited novel publishing",
      "Writer Studio access",
      "Analytics dashboard",
      "Community support",
    ],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For serious writers",
    features: [
      "All Writer features",
      "Advanced analytics",
      "Priority support",
      "Custom author page",
      "Early access features",
      "Ad-free experience",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Simple Pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start reading and writing for free. Upgrade when you need more.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-8 ${
                    plan.highlighted
                      ? "border-primary bg-card shadow-lg"
                      : "border-border bg-card"
                  }`}
                >
                  <h2 className="font-serif text-xl font-medium text-foreground">
                    {plan.name}
                  </h2>
                  <div className="mt-4">
                    <span className="font-serif text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <a href="/sign-in">Get Started</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
