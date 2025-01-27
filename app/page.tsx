import Image from "next/image"
import { GoogleLoginButton } from "@/components/GoogleLoginButton"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Image */}
      <div className="lg:w-4/5 relative h-[40vh] lg:h-screen">
        <Image
          src="/50AnosEpamig.png"
          alt="Decorative background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Logo and login */}
      <div className="lg:w-1/5 flex flex-col items-center justify-center p-8 h-[60vh] lg:h-screen bg-white">
        <div className="w-full max-w-[200px] lg:max-w-[240px] aspect-[280/120] relative mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/epamig_logo-2vMg7oM4pTh8E3aN8ywr6xeKCiKxLh.svg"
            alt="EPAMIG Logo"
            fill
            priority
            style={{ objectFit: "contain" }}
          />
        </div>
        <GoogleLoginButton />
      </div>
    </main>
  )
}

