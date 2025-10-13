const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar admin padrão se não existir
  const adminExistente = await prisma.admin.findFirst({
    where: { email: 'admin@alugaaqui.com' }
  })

  if (!adminExistente) {
    const senhaHash = await bcrypt.hash('Admin@123', 12)
    
    await prisma.admin.create({
      data: {
        nome: 'Administrador Sistema',
        email: 'admin@alugaaqui.com',
        senha: senhaHash,
        nivel: 1
      }
    })
    console.log('✅ Admin padrão criado')
  }

  // Criar proprietário padrão se não existir
  const proprietarioExistente = await prisma.proprietario.findFirst({
    where: { email: 'admin@alugaaqui.com' }
  })

  if (!proprietarioExistente) {
    const senhaHash = await bcrypt.hash('Admin@123', 12)
    
    await prisma.proprietario.create({
      data: {
        nome: 'Administrador Sistema',
        email: 'admin@alugaaqui.com',
        senha: senhaHash,
        telefone: '(53) 99999-9999',
        cidade: 'Pelotas'
      }
    })
    console.log('✅ Proprietário padrão criado')
  }

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })