const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testarEdicao() {
  try {
    console.log('🔐 Fazendo login de admin...');
    
    // Login de admin
    const loginResponse = await axios.post(`${API_URL}/admins/login`, {
      email: 'admin@teste.com',
      senha: 'Teste@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Listar imóveis
    console.log('\n📋 Listando imóveis...');
    const imoveisResponse = await axios.get(`${API_URL}/imoveis`);
    const imoveis = imoveisResponse.data;
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado para testar');
      return;
    }
    
    const imovel = imoveis[0];
    console.log('✅ Imóvel encontrado:', imovel.id, '-', imovel.titulo);
    
    // Tentar editar o primeiro imóvel
    console.log('\n✏️ Tentando editar imóvel...');
    
    const dadosEdicao = {
      titulo: 'TÍTULO EDITADO - TESTE',
      endereco: imovel.endereco,
      cidade: imovel.cidade,
      tipo: imovel.tipo,
      aluguelMensal: parseFloat(imovel.aluguelMensal) + 100,
      descricao: 'Descrição editada via teste'
    };
    
    console.log('Dados de edição:', dadosEdicao);
    
    const edicaoResponse = await axios.put(`${API_URL}/imoveis/${imovel.id}`, dadosEdicao, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Imóvel editado com sucesso!');
    console.log('Novo título:', edicaoResponse.data.titulo);
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testarEdicao();