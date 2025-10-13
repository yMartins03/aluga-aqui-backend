import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const imovelSchema = z.object({
  titulo: z.string().min(3).max(100),
  descricao: z.string().min(1).optional(), // Permite descrição de 1+ caracteres
  endereco: z.string().min(3).max(255), // Reduzido para 3 caracteres mínimos
  cidade: z.string().min(2).max(60),
  bairro: z.string().min(1).optional(), // Permite bairro de 1+ caracteres
  cep: z.string().min(1).optional(), // Permite CEP de 1+ caracteres
  tipo: z.enum([
    'CASA', 
    'APARTAMENTO', 
    'KITNET', 
    'STUDIO', 
    'COBERTURA', 
    'SOBRADO', 
    'COMERCIAL', 
    'SALA_COMERCIAL', 
    'LOJA', 
    'GALPAO', 
    'TERRENO', 
    'CHACARA'
  ]),
  aluguelMensal: z.union([z.number().positive(), z.string().transform(val => parseFloat(val))]),
  disponivel: z.boolean().optional(),
  fotos: z.string().optional()
  // Removido proprietarioId e adminId - serão preenchidos automaticamente
})

router.get("/", async (req, res) => {
  try {
    const imoveis = await prisma.imovel.findMany({
      where: { disponivel: true },
      include: { proprietario: true },
      orderBy: { id: 'desc' }
    })
    res.status(200).json(imoveis)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/destaques", async (req, res) => {
  try {
    const imoveis = await prisma.imovel.findMany({
      where: { disponivel: true },
      include: { proprietario: true },
      orderBy: { id: 'desc' },
      take: 6
    })
    res.status(200).json(imoveis)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const imovel = await prisma.imovel.findUnique({
      where: { id: Number(id) },
      include: { proprietario: true }
    })
    res.status(200).json(imovel)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", verificaToken, async (req: any, res) => {
  const valida = imovelSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  
  try {
    // Buscar o admin logado para usar como proprietário
    const adminId = req.userLogadoId || req.adminLogadoId
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    })
    
    if (!admin) {
      res.status(401).json({ erro: "Admin não encontrado" })
      return
    }
    
    // Verificar se o admin já tem um proprietário associado ou criar um
    let proprietario = await prisma.proprietario.findFirst({
      where: { email: admin.email }
    })
    
    if (!proprietario) {
      // Criar proprietário automaticamente baseado no admin
      proprietario = await prisma.proprietario.create({
        data: {
          nome: admin.nome,
          email: admin.email,
          senha: admin.senha,
          telefone: null,
          cidade: null
        }
      })
    }
    
    // Criar imóvel com proprietário automático
    console.log('Dados para criar imóvel:', {
      ...valida.data,
      proprietarioId: proprietario.id,
      adminId: admin.id
    })
    
    const imovel = await prisma.imovel.create({ 
      data: {
        ...valida.data,
        proprietarioId: proprietario.id,
        adminId: admin.id
      }
    })
    
    res.status(201).json(imovel)
  } catch (error) {
    console.error('Erro detalhado:', error)
    res.status(400).json({ 
      erro: error instanceof Error ? error.message : String(error),
      detalhes: error instanceof Error ? error.stack : 'Sem stack trace'
    })
  }
})

router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params
  const valida = imovelSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  try {
    const imovel = await prisma.imovel.update({
      where: { id: Number(id) },
      data: valida.data
    })
    res.status(200).json(imovel)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params
  try {
    const imovel = await prisma.imovel.update({
      where: { id: Number(id) },
      data: { disponivel: false }
    })
    const adminId = req.userLogadoId as string
    const adminNome = req.userLogadoNome as string
    const descricao = `Exclusão de: ${imovel.titulo}`
    const complemento = `Admin: ${adminNome}`
    await prisma.log.create({ data: { descricao, complemento, adminId } })
    res.status(200).json(imovel)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params
  const termoNumero = Number(termo)
  if (isNaN(termoNumero)) {
    try {
      const imoveis = await prisma.imovel.findMany({
        where: {
          disponivel: true,
          OR: [
            { titulo: { contains: termo, mode: "insensitive" } },
            { cidade: { contains: termo, mode: "insensitive" } },
            { proprietario: { nome: { contains: termo, mode: "insensitive" } } }
          ]
        },
        include: { proprietario: true }
      })
      res.status(200).json(imoveis)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    try {
      const imoveis = await prisma.imovel.findMany({
        where: { disponivel: true, aluguelMensal: { lte: termoNumero } },
        include: { proprietario: true }
      })
      res.status(200).json(imoveis)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  }
})

export default router
