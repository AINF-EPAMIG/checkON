"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import GerenciadorFolgas from "@/components/GerenciadorFolgas"
import VisualizadorFolgas from "@/components/VisualizadorFolgas"

export default function AgendarFolgaClient() {
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false)
  const [modalVisualizarAberto, setModalVisualizarAberto] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-[#1e7b4f]">Agendar Folga</h1>
        <p className="mt-2 text-gray-600">
          Organize e registre as folgas programadas para a equipe utilizando as opções abaixo.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Realizar ou Editar Agendamentos</CardTitle>
            <CardDescription>
              Crie novas folgas ou atualize agendamentos existentes para os colaboradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Defina datas, motivos e responsáveis pela aprovação em um fluxo unificado para registro e ajustes.
            </p>
            <Button 
              className="bg-[#1e7b4f] hover:bg-[#165c3c]"
              onClick={() => setModalGerenciarAberto(true)}
            >
              Gerenciar agendamentos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualizar Folgas Programadas</CardTitle>
            <CardDescription>Consulte as folgas futuras e verifique conflitos de agenda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Analise os registros existentes e garanta a cobertura adequada da equipe.
            </p>
            <Button
              variant="outline"
              className="text-[#1e7b4f] border-[#1e7b4f] hover:bg-[#1e7b4f]/10"
              onClick={() => setModalVisualizarAberto(true)}
            >
              Ver calendário
            </Button>
          </CardContent>
        </Card>
      </section>

      <GerenciadorFolgas open={modalGerenciarAberto} onOpenChange={setModalGerenciarAberto} />
      <VisualizadorFolgas open={modalVisualizarAberto} onOpenChange={setModalVisualizarAberto} />
    </div>
  )
}

