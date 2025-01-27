import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-zinc-800 text-zinc-200 py-6 md:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
          <div className="flex justify-center md:justify-start">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/epamig_logo-2vMg7oM4pTh8E3aN8ywr6xeKCiKxLh.svg"
              alt="EPAMIG Logo"
              width={100}
              height={42}
              className="brightness-0 invert"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-sm">
              © Todos os direitos reservados - EPAMIG - Empresa de Pesquisa Agropecuária de Minas Gerais
            </p>
            <p className="text-xs md:text-sm mt-2">Desenvolvimento: AINF - Assessoria de Informática</p>
          </div>
          <div className="text-xs md:text-sm text-center md:text-right">
            <p className="font-semibold">Contato:</p>
            <p>Email: contato@epamig.br</p>
            <p>Telefone: (31) 3489-5000</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

