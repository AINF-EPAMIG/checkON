'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Login bem-sucedido
      console.log('Usuário autenticado:', data.usuario);
      
      // Redirecionar para a página inicial ou dashboard
      router.push('/');
    } catch (error: Error | unknown) {
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Entrar</h2>
      
      {erro && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {erro}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-epamig-secondary font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-epamig-accent-3 rounded-md focus:outline-none focus:ring-2 focus:ring-epamig-accent-1"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="senha" className="block text-epamig-secondary font-medium mb-2">
            Senha
          </label>
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full px-3 py-2 border border-epamig-accent-3 rounded-md focus:outline-none focus:ring-2 focus:ring-epamig-accent-1"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-epamig-primary text-white py-2 px-4 rounded-md hover:bg-epamig-secondary focus:outline-none focus:ring-2 focus:ring-epamig-accent-1 focus:ring-offset-2 disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
} 