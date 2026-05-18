'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; message?: string; token?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Réponse non-JSON (502 HTML) — serveur pas encore prêt
        setError('Le serveur est en cours de démarrage, veuillez patienter 30 secondes et réessayer.');
        return;
      }

      if (res.ok) {
        localStorage.setItem('token', data.token || '');
        window.location.href = '/dashboard';
      } else {
        setError(data.error || `Erreur ${res.status} — veuillez réessayer.`);
      }
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">LC</span>
            </div>
            <span className="font-bold text-xl text-gray-900">LearnCloud</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-1">Accédez à vos cours et à l'IA Tutor</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium mb-2">Comptes de test (cliquez pour remplir) :</p>
          <div className="space-y-1">
            <button onClick={() => fillDemo('admin@learncloud.fr')}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:underline py-0.5">
              Admin — admin@learncloud.fr
            </button>
            <button onClick={() => fillDemo('instructor@learncloud.fr')}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:underline py-0.5">
              Instructeur — instructor@learncloud.fr
            </button>
            <button onClick={() => fillDemo('student@learncloud.fr')}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:underline py-0.5">
              Étudiant — student@learncloud.fr
            </button>
            <p className="text-xs text-gray-400 mt-1">Mot de passe : Admin@1234</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-blue-600 font-medium hover:text-blue-700">S'inscrire gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
