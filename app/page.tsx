import Image from "next/image";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function Home() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg_checkon.png"
          alt="Decorative background"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Glass Card Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg">
        <div className="backdrop-blur-md bg-white/30 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
          {/* Logo Container */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] flex flex-col gap-2 mb-6 sm:mb-8 md:mb-10">
            {/* CHECK ON Logo */}
            <div className="relative aspect-[280/120] scale-125 sm:scale-150 md:scale-[1.75]">
              <Image
                src="/logo_checkon.svg"
                alt="CHECK ON Logo"
                fill
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
            {/* EPAMIG Logo */}
            <div className="relative aspect-[280/120] md:scale-[1.25]">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/epamig_logo-2vMg7oM4pTh8E3aN8ywr6xeKCiKxLh.svg"
                alt="EPAMIG Logo"
                fill
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <div className="w-full flex justify-center transform scale-100 sm:scale-110 md:scale-125">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </main>
  );
}
