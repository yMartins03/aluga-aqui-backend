import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express'

type TokenType = {
  userLogadoId?: number
  userLogadoNome?: string
  userLogadoNivel?: number
  adminLogadoId?: string
  adminLogadoNome?: string
  adminLogadoNivel?: number
}

// Acrescenta na interface Request (de forma global) os novos atributos (TypeScript)
declare global {
  namespace Express {
    interface Request {
      userLogadoId?: string
      userLogadoNome?: string
      userLogadoNivel?: number
      adminLogadoId?: string
      adminLogadoNome?: string
      adminLogadoNivel?: number
    }
  }
}

export function verificaToken(req: Request | any, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {
    res.status(401).json({ error: "Token não informado" })
    return
  }

  const token = authorization.split(" ")[1]

  try {
    const decode = jwt.verify(token, process.env.JWT_KEY as string)
    // console.log(decode)
    const tokenData = decode as TokenType

    // Suporte a tokens de cliente e admin
    if (tokenData.userLogadoId) {
      req.userLogadoId = tokenData.userLogadoId
      req.userLogadoNome = tokenData.userLogadoNome
      req.userLogadoNivel = tokenData.userLogadoNivel
    } else if (tokenData.adminLogadoId) {
      req.adminLogadoId = tokenData.adminLogadoId
      req.adminLogadoNome = tokenData.adminLogadoNome
      req.adminLogadoNivel = tokenData.adminLogadoNivel
      // Para compatibilidade, também define como user
      req.userLogadoId = tokenData.adminLogadoId
      req.userLogadoNome = tokenData.adminLogadoNome
      req.userLogadoNivel = tokenData.adminLogadoNivel
    }

    next()
  } catch (error) {
    res.status(401).json({ error: "Token inválido" })
  }
}