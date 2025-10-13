import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const imoveis = await prisma.imovel.count()
    const propostas = await prisma.proposta.count()

    res.status(200).json({ clientes, imoveis, propostas })
  } catch (error) {
    res.status(400).json(error)
  }
})

type TipoGroupByNome = {
  nome: string
  _count: {
    imoveis: number
  }
}

router.get("/imoveisTipo", async (req, res) => {
  try {
    const tipos = await prisma.imovel.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true
      }
    })

    const tipos2 = tipos.map((item) => ({
      tipo: item.tipo,
      num: item._count.tipo
    }))

    res.status(200).json(tipos2)
  } catch (error) {
    res.status(400).json(error)
  }
})


router.get("/clientesCidade", async (req, res) => {
  try {
    const clientes = await prisma.cliente.groupBy({
      by: ['cidade'],
      _count: {
        cidade: true,
      },
    })

    const clientes2 = clientes
      .filter(cliente => cliente.cidade !== null)
      .map((cliente) => ({
        cidade: cliente.cidade as string,
        num: cliente._count.cidade
      }))

    res.status(200).json(clientes2)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
