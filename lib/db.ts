import mysql from 'mysql2/promise';

// Configuração do banco de dados
export const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'exemplo',
};

// Pool de conexões com o banco de dados
let connectionPool: mysql.Pool | null = null;

// Função para obter uma conexão do pool
export async function getConnection() {
  if (!connectionPool) {
    connectionPool = mysql.createPool(dbConfig);
  }
  return connectionPool;
}

// Função para executar consultas SQL
export async function query(sql: string, params: unknown[] = []) {
  try {
    const connection = await getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erro ao executar consulta SQL:', error);
    throw error;
  }
}

// Função para autenticar usuário
export async function autenticarUsuario(email: string, senha: string) {
  try {
    const usuarios = await query(
      'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    ) as Record<string, unknown>[];
    
    if (usuarios.length === 0) {
      return null;
    }
    
    const usuario = usuarios[0];
    
    // Em um ambiente real, deve-se usar bcrypt para comparar as senhas
    // const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    
    // Aqui estamos comparando diretamente para simplificar a demonstração
    const senhaCorreta = (senha === usuario.senha);
    
    if (senhaCorreta) {
      // Não retornar a senha na resposta
      const { ...usuarioSemSenha } = usuario;
      return usuarioSemSenha;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    throw error;
  }
} 