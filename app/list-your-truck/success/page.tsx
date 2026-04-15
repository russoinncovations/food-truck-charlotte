import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Application Submitted | FoodTruck CLT",
  description: "Your vendor application has been submitted successfully.",
}

export default function VendorApplicationSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="pt-12 pb-10 px-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="font-display text-3xl font-bold text-foreground mb-4">
                Application Submitted!
              </h1>
              
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Thanks for applying to join FoodTruck CLT. We review applications 
                within 2-3 business days and will reach out via email.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Check your inbox for a confirmation email</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/">
                    Back to Home
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/trucks">Browse Trucks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
