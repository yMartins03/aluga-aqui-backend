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

router.put("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params
  
  console.log('PUT /imoveis/:id chamado com ID:', id)
  console.log('Body recebido:', req.body)
  
  // Validar se o ID é um número válido
  const imovelId = Number(id)
  if (isNaN(imovelId)) {
    console.log('ID inválido:', id)
    res.status(400).json({ erro: "ID do imóvel inválido" })
    return
  }
  
  const valida = imovelSchema.safeParse(req.body)
  if (!valida.success) {
    console.log('Erro de validação:', valida.error)
    res.status(400).json({ erro: valida.error })
    return
  }
  
  console.log('Dados validados:', valida.data)
  
  try {
    // Verificar se o imóvel existe
    const imovelExistente = await prisma.imovel.findUnique({
      where: { id: imovelId },
      include: { admin: true }
    })
    
    if (!imovelExistente) {
      res.status(404).json({ erro: "Imóvel não encontrado" })
      return
    }
    
    // Verificar se o admin tem permissão (qualquer admin pode editar por enquanto)
    const adminId = req.userLogadoId || req.adminLogadoId
    console.log('Admin logado:', adminId)
    console.log('Admin do imóvel:', imovelExistente.adminId)
    
    // Por enquanto, qualquer admin pode editar qualquer imóvel
    // if (imovelExistente.adminId && imovelExistente.adminId !== adminId) {
    //   res.status(403).json({ erro: "Sem permissão para editar este imóvel" })
    //   return
    // }
    
    // Atualizar apenas os campos permitidos (não atualiza proprietário/admin)
    const { aluguelMensal, ...outrosDados } = valida.data
    
    const imovel = await prisma.imovel.update({
      where: { id: imovelId },
      data: {
        ...outrosDados,
        aluguelMensal: typeof aluguelMensal === 'string' ? parseFloat(aluguelMensal) : aluguelMensal
      },
      include: { proprietario: true }
    })
    
    res.status(200).json(imovel)
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error)
    res.status(400).json({ 
      erro: error instanceof Error ? error.message : String(error),
      detalhes: error instanceof Error ? error.stack : 'Sem stack trace'
    })
  }
})

router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params
  
  const imovelId = Number(id)
  if (isNaN(imovelId)) {
    res.status(400).json({ erro: "ID do imóvel inválido" })
    return
  }
  
  try {
    // Verificar se o imóvel existe
    const imovelExistente = await prisma.imovel.findUnique({
      where: { id: imovelId }
    })
    
    if (!imovelExistente) {
      res.status(404).json({ erro: "Imóvel não encontrado" })
      return
    }
    
    // Verificar permissão (temporariamente desabilitado - qualquer admin pode remover)
    const adminId = req.userLogadoId || req.adminLogadoId
    console.log('Admin removendo:', adminId)
    
    // if (imovelExistente.adminId && imovelExistente.adminId !== adminId) {
    //   res.status(403).json({ erro: "Sem permissão para remover este imóvel" })
    //   return
    // }
    
    const imovel = await prisma.imovel.update({
      where: { id: imovelId },
      data: { disponivel: false }
    })
    
    const adminNome = req.userLogadoNome || req.adminLogadoNome
    const descricao = `Exclusão de: ${imovel.titulo}`
    const complemento = `Admin: ${adminNome}`
    
    await prisma.log.create({ 
      data: { 
        descricao, 
        complemento, 
        adminId: adminId 
      } 
    })
    
    res.status(200).json(imovel)
  } catch (error) {
    console.error('Erro ao remover imóvel:', error)
    res.status(400).json({ 
      erro: error instanceof Error ? error.message : String(error)
    })
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
