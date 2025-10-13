import express from 'express'
import cors from 'cors'

import 'dotenv/config'

import routesImoveis from './routes/imoveis'
import routesLogin from './routes/login'
import routesClientes from './routes/clientes'
import routesPropostas from './routes/propostas'
import routesDashboard from './routes/dashboard'
import routesAdminLogin from './routes/adminLogin'
import routesAdmins from './routes/admins'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://aluga-aqui-front.vercel.app'
  ],
  credentials: true
}))

// Log para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`)
  next()
})

app.use("/imoveis", routesImoveis)
app.use("/clientes/login", routesLogin)
app.use("/clientes", routesClientes)
app.use("/propostas", routesPropostas)
app.use("/dashboard", routesDashboard)
app.use("/admins/login", routesAdminLogin)
app.use("/admins", routesAdmins)


app.get('/', (req, res) => {
  res.send('API: LM Alugueis')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})