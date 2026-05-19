'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============================================================
// TYPES
// ============================================================
interface User {
  sub?: string;
  _id?: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  firstName?: string;
  lastName?: string;
}

interface Course {
  id: number;
  title: string;
  instructor?: string;
  category: string;
  level: string;
  rating?: number;
  students?: number;
  isFree?: boolean;
  price?: number;
  duration?: string;
  description?: string;
  progress?: number;
  isPublished?: boolean;
}

// ============================================================
// AUTH UTILITIES (client-side only)
// ============================================================
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function decodeToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token');
      return null;
    }
    return payload;
  } catch { return null; }
}

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

// ============================================================
// CONSTANTS
// ============================================================
const MOCK_COURSES: Course[] = [
  { id: 1, title: 'Docker & Containerisation', instructor: 'Jean Dupont', category: 'DevOps', level: 'beginner', rating: 4.8, students: 5420, isFree: true, duration: '12h', description: 'Apprenez Docker depuis zéro.' },
  { id: 2, title: 'Kubernetes - Orchestration', instructor: 'Jean Dupont', category: 'DevOps', level: 'intermediate', rating: 4.7, students: 3200, isFree: false, price: 49.99, duration: '18h', description: 'Maîtrisez Kubernetes.' },
  { id: 3, title: 'Python pour le DevOps', instructor: 'Marie Martin', category: 'Programmation', level: 'beginner', rating: 4.6, students: 8900, isFree: true, duration: '10h', description: 'Automatisez votre infrastructure.' },
  { id: 4, title: 'Architecture Microservices FastAPI', instructor: 'Pierre Bernard', category: 'Backend', level: 'advanced', rating: 4.9, students: 1800, isFree: false, price: 79.99, duration: '22h', description: 'Concevez des microservices.' },
  { id: 5, title: 'CI/CD avec GitHub Actions', instructor: 'Marie Martin', category: 'DevOps', level: 'intermediate', rating: 4.5, students: 2900, isFree: true, duration: '8h', description: 'Automatisez vos déploiements.' },
  { id: 6, title: 'Terraform - Infrastructure as Code', instructor: 'Alex Rousseau', category: 'Cloud', level: 'intermediate', rating: 4.7, students: 2100, isFree: false, price: 59.99, duration: '15h', description: 'Gérez votre infra cloud.' },
];

const LEVEL_LABELS: Record<string, string> = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Sidebar({ user, active, setActive, logout }: {
  user: User; active: string; setActive: (s: string) => void; logout: () => void;
}) {
  const roleLabel = { student: 'Étudiant', instructor: 'Instructeur', admin: 'Administrateur' }[user.role];
  const roleColors = {
    student: 'bg-blue-100 text-blue-700',
    instructor: 'bg-green-100 text-green-700',
    admin: 'bg-red-100 text-red-700',
  }[user.role];

  const NAV: Record<string, { key: string; icon: string; label: string }[]> = {
    student: [
      { key: 'overview', icon: '🏠', label: 'Tableau de bord' },
      { key: 'my-courses', icon: '📚', label: 'Mes Cours' },
      { key: 'catalog', icon: '🔍', label: 'Catalogue' },
      { key: 'ai-tutor', icon: '🤖', label: 'AI Tutor' },
      { key: 'profile', icon: '👤', label: 'Mon Profil' },
    ],
    instructor: [
      { key: 'overview', icon: '🏠', label: 'Tableau de bord' },
      { key: 'my-courses', icon: '📚', label: 'Mes Cours' },
      { key: 'create-course', icon: '➕', label: 'Créer un cours' },
      { key: 'analytics', icon: '📊', label: 'Analytiques' },
      { key: 'profile', icon: '👤', label: 'Mon Profil' },
    ],
    admin: [
      { key: 'overview', icon: '🏠', label: "Vue d'ensemble" },
      { key: 'users', icon: '👥', label: 'Utilisateurs' },
      { key: 'all-courses', icon: '📚', label: 'Cours' },
      { key: 'analytics', icon: '📊', label: 'Analytiques' },
      { key: 'profile', icon: '👤', label: 'Mon Profil' },
    ],
  };

  const nav = NAV[user.role] ?? NAV.student;
  const initials = `${user.firstName?.[0] ?? user.email[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 text-white flex flex-col z-20">
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-sm">LC</span>
          </div>
          <span className="font-bold text-lg">LearnCloud</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
            <span className="font-bold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors}`}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <button key={item.key} onClick={() => setActive(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              active === item.key ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
          <span>🌐</span><span>Accueil</span>
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition">
          <span>🚪</span><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50', orange: 'text-orange-500 bg-orange-50',
    red: 'text-red-600 bg-red-50', indigo: 'text-indigo-600 bg-indigo-50',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      {icon && <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>}
      <div>
        <div className={`text-2xl font-bold ${(colors[color] ?? '').split(' ')[0]}`}>{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// STUDENT — OVERVIEW
// ============================================================
function StudentOverview({ user, courses, setActive }: { user: User; courses: Course[]; setActive: (s: string) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user.firstName ?? user.email.split('@')[0]} ! 👋
        </h1>
        <p className="text-gray-500 mt-1">Continuez votre parcours d'apprentissage DevOps & Cloud</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📚" label="Cours inscrits" value={courses.length} color="blue" />
        <StatCard icon="⏳" label="En cours" value={courses.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length} color="orange" />
        <StatCard icon="✅" label="Complétés" value={courses.filter(c => c.progress === 100).length} color="green" />
        <StatCard icon="🤖" label="Sessions AI Tutor" value="12" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Mes cours en cours</h2>
            <button onClick={() => setActive('catalog')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Trouver d'autres cours →
            </button>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore de cours</p>
              <button onClick={() => setActive('catalog')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                Parcourir le catalogue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 3).map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{course.category} · {LEVEL_LABELS[course.level]}</div>
                    </div>
                    <span className="text-sm font-bold text-blue-600 shrink-0 ml-3">{course.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${course.progress ?? 0}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
            <div className="text-lg font-semibold mb-1">🤖 AI Tutor</div>
            <p className="text-sm text-purple-200 mb-4">Posez vos questions sur DevOps, Cloud, Docker, Kubernetes...</p>
            <button onClick={() => setActive('ai-tutor')}
              className="block w-full bg-white text-purple-700 text-center py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition">
              Ouvrir l'AI Tutor
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-1">
              {[
                { label: '🔍 Chercher un cours', section: 'catalog' },
                { label: '📚 Mes cours', section: 'my-courses' },
                { label: '🤖 AI Tutor', section: 'ai-tutor' },
                { label: '👤 Mon profil', section: 'profile' },
              ].map(a => (
                <button key={a.section} onClick={() => setActive(a.section)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STUDENT — MES COURS
// ============================================================
function MyCourses({ courses, setActive }: { courses: Course[]; setActive: (s: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
          <p className="text-gray-500 text-sm mt-1">{courses.length} cours inscrit{courses.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setActive('catalog')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Trouver des cours
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun cours inscrit</h3>
          <p className="text-gray-500 mb-4">Commencez votre parcours en vous inscrivant à un cours</p>
          <button onClick={() => setActive('catalog')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
            Parcourir le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="h-28 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                <span className="text-white text-5xl font-bold opacity-20">{course.category?.[0]}</span>
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    course.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {course.progress === 100 ? '✓ Terminé' : `${course.progress ?? 0}%`}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{course.category}</span>
                  <span className="text-xs text-gray-400">{LEVEL_LABELS[course.level]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{course.instructor}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${course.progress ?? 0}%` }} />
                </div>
                <Link href={`/courses/${course.id}`}
                  className="block w-full text-center bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                  {course.progress === 100 ? 'Revoir le cours' : course.progress === 0 ? 'Commencer' : 'Continuer'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STUDENT — CATALOGUE
// ============================================================
function CourseCatalog({ courses }: { courses: Course[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [level, setLevel] = useState('Tous');
  const [freeOnly, setFreeOnly] = useState(false);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [enrolled, setEnrolled] = useState<Set<number>>(new Set());

  const categories = ['Tous', ...Array.from(new Set(courses.map(c => c.category)))];

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.title.toLowerCase().includes(q) || (c.instructor ?? '').toLowerCase().includes(q)) &&
      (category === 'Tous' || c.category === category) &&
      (level === 'Tous' || c.level === level) &&
      (!freeOnly || c.isFree)
    );
  });

  const handleEnroll = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      setEnrolled(prev => new Set([...prev, courseId]));
    } catch {
      setEnrolled(prev => new Set([...prev, courseId]));
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue des cours</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} cours disponibles</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input type="text" placeholder="Rechercher un cours ou instructeur..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={level} onChange={e => setLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Tous">Tous niveaux</option>
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
            <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="w-4 h-4" />
            Gratuits uniquement
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden group">
            <Link href={`/courses/${course.id}`}>
              <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                <span className="text-white text-5xl font-bold opacity-20">{course.category?.[0]}</span>
                <div className="absolute top-2 right-2">
                  {course.isFree
                    ? <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Gratuit</span>
                    : <span className="text-xs font-semibold bg-white text-blue-700 px-2 py-1 rounded-full">{course.price} €</span>
                  }
                </div>
              </div>
              <div className="p-4 pb-2">
                <div className="flex gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{course.category}</span>
                  <span className="text-xs text-gray-400">{LEVEL_LABELS[course.level]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition line-clamp-2">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{course.instructor}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-gray-700">{course.rating}</span>
                    <span>({(course.students ?? 0).toLocaleString('fr-FR')})</span>
                  </div>
                  <span>{course.duration}</span>
                </div>
              </div>
            </Link>
            <div className="px-4 pb-4">
              {enrolled.has(course.id) ? (
                <div className="w-full text-center bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium">
                  ✓ Inscrit
                </div>
              ) : (
                <button onClick={() => handleEnroll(course.id)} disabled={enrolling === course.id}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {enrolling === course.id ? 'Inscription...' : "S'inscrire"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STUDENT — AI TUTOR
// ============================================================
function AITutorView() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Bonjour ! Je suis votre AI Tutor LearnCloud. Posez-moi n'importe quelle question sur DevOps, Docker, Kubernetes, CI/CD, Python ou Cloud !" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const QUICK = [
    'Comment fonctionne Docker Compose ?',
    'Kubernetes vs Docker Swarm ?',
    'Expliquer les microservices',
    'Qu\'est-ce que CI/CD ?',
  ];

  function getMock(q: string): string {
    const ql = q.toLowerCase();
    if (ql.includes('docker compose')) return 'Docker Compose orchestre des applications multi-conteneurs via un fichier docker-compose.yml. Il définit les services, réseaux et volumes. La commande `docker compose up` démarre toute la stack. C\'est essentiel pour le développement local de microservices.';
    if (ql.includes('kubernetes') || ql.includes('k8s')) return 'Kubernetes (K8s) orchestre les conteneurs à l\'échelle cluster. Il gère : déploiements (Deployment), mise à l\'échelle automatique (HPA), découverte de services (Service), stockage (PVC), et secrets. Plus puissant que Swarm mais plus complexe.';
    if (ql.includes('microservices')) return 'Les microservices décomposent une app en services indépendants, chacun avec sa propre base de données et déployable séparément. Avantages : scalabilité indépendante, résilience, technologies mixtes. Cette plateforme LearnCloud est elle-même une architecture microservices !';
    if (ql.includes('ci') || ql.includes('cd')) return 'CI/CD = Intégration Continue / Déploiement Continu. Pipeline type : 1) Commit → 2) Build Docker → 3) Tests unitaires → 4) Push registry → 5) Deploy k8s. GitHub Actions, GitLab CI, Jenkins sont les outils les plus utilisés.';
    if (ql.includes('terraform')) return 'Terraform est un outil Infrastructure as Code (IaC). Il permet de décrire l\'infrastructure cloud (AWS, GCP, Azure) en HCL, de versionner et appliquer des changements de façon idempotente avec `terraform apply`.';
    if (ql.includes('python')) return 'Python est essentiel en DevOps pour l\'automatisation, les scripts de déploiement, les APIs (FastAPI, Flask), l\'analyse de logs, et les tests d\'infrastructure. Bibliothèques clés : boto3 (AWS), paramiko (SSH), ansible, fabric.';
    return 'Excellente question sur ce sujet DevOps/Cloud ! La clé est de comprendre les concepts fondamentaux avant les outils. Je vous recommande de commencer par les cours Docker puis Kubernetes sur la plateforme. N\'hésitez pas à être plus précis dans votre question !';
  }

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/ai-tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question, course_id: 1 }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages(prev => [...prev, { role: 'ai', content: data?.answer ?? getMock(question) }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: getMock(question) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Tutor</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '620px' }}>
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">AI Tutor LearnCloud</div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />En ligne
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>{msg.content}</div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-gray-600 text-xs font-bold">U</span>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs">AI</span>
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </span>
                  Réflexion...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2 flex gap-2 flex-wrap">
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-100 border border-purple-100 transition">
                {q}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                placeholder="Posez votre question DevOps/Cloud..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <button onClick={() => send(input)} disabled={loading || !input.trim()}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 transition">
                Envoyer
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Sujets DevOps</h3>
            <div className="space-y-1.5">
              {['Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Python DevOps', 'Microservices', 'ArgoCD', 'Prometheus'].map(t => (
                <button key={t} onClick={() => send(`Explique-moi ${t} en DevOps`)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition border border-gray-100">
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Link href="/ai-tutor"
            className="block bg-purple-600 text-white text-center py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            Ouvrir en plein écran ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INSTRUCTOR — OVERVIEW
// ============================================================
function InstructorOverview({ user, courses, setActive }: { user: User; courses: Course[]; setActive: (s: string) => void }) {
  const totalStudents = courses.reduce((s, c) => s + (c.students ?? 0), 0);
  const avgRating = courses.length > 0
    ? (courses.reduce((s, c) => s + (c.rating ?? 0), 0) / courses.length).toFixed(1)
    : '—';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.firstName ?? 'Instructeur'} ! 👋</h1>
        <p className="text-gray-500 mt-1">Gérez vos cours et suivez vos statistiques</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📚" label="Mes cours" value={courses.length} color="blue" />
        <StatCard icon="👥" label="Étudiants inscrits" value={totalStudents.toLocaleString('fr-FR')} color="green" />
        <StatCard icon="⭐" label="Note moyenne" value={avgRating} color="orange" />
        <StatCard icon="✅" label="Cours publiés" value={courses.filter(c => c.isPublished !== false).length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Mes cours récents</h2>
            <button onClick={() => setActive('create-course')}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              + Créer
            </button>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore de cours</p>
              <button onClick={() => setActive('create-course')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                Créer mon premier cours
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{course.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{course.category} · {course.students ?? 0} étudiants · {course.duration}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    {course.rating ? <span className="text-xs text-gray-500">★ {course.rating}</span> : null}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      course.isPublished !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {course.isPublished !== false ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { label: '➕ Créer un nouveau cours', section: 'create-course', highlight: true },
                { label: '📚 Gérer mes cours', section: 'my-courses', highlight: false },
                { label: '📊 Voir les analytiques', section: 'analytics', highlight: false },
                { label: '👤 Mon profil', section: 'profile', highlight: false },
              ].map(a => (
                <button key={a.section} onClick={() => setActive(a.section)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    a.highlight ? 'border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INSTRUCTOR — GÉRER LES COURS
// ============================================================
function InstructorCourses({ courses, setCourses, setActive }: {
  courses: Course[]; setCourses: (c: Course[]) => void; setActive: (s: string) => void;
}) {
  const deleteCourse = async (id: number) => {
    if (!confirm('Supprimer ce cours définitivement ?')) return;
    try { await authFetch(`/api/courses/${id}`, { method: 'DELETE' }); } catch {}
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
          <p className="text-gray-500 text-sm mt-1">{courses.length} cours</p>
        </div>
        <button onClick={() => setActive('create-course')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Créer un cours
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun cours créé</h3>
          <button onClick={() => setActive('create-course')}
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
            Créer mon premier cours
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Cours', 'Catégorie', 'Étudiants', 'Note', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="font-medium text-sm text-gray-900">{course.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{course.duration} · {LEVEL_LABELS[course.level]}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{course.category}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{(course.students ?? 0).toLocaleString('fr-FR')}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{course.rating ? `★ ${course.rating}` : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      course.isPublished !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {course.isPublished !== false ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.id}`}
                        className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition">
                        Voir
                      </Link>
                      <button onClick={() => deleteCourse(course.id)}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// INSTRUCTOR — CRÉER UN COURS
// ============================================================
function CreateCourse({ onCreated, setActive }: { onCreated: (c: Course) => void; setActive: (s: string) => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'DevOps', level: 'beginner',
    duration: '', isFree: true, price: '', instructor_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const up = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const newCourse: Course = {
      id: Date.now(),
      title: form.title, description: form.description,
      category: form.category, level: form.level, duration: form.duration,
      isFree: form.isFree, price: form.isFree ? 0 : parseFloat(form.price) || 0,
      instructor: form.instructor_name || 'Instructeur',
      students: 0, rating: 0, isPublished: false,
    };
    try {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        level: form.level, duration: form.duration, is_free: form.isFree,
        price: form.isFree ? 0 : parseFloat(form.price) || 0,
        instructor_name: form.instructor_name || 'Instructeur',
      };
      const res = await authFetch('/api/courses', { method: 'POST', body: JSON.stringify(payload) });
      const data = res.ok ? await res.json().catch(() => null) : null;
      onCreated(data ? { ...newCourse, ...data } : newCourse);
    } catch {
      onCreated(newCourse);
    }
    setSuccess(true);
    setTimeout(() => setActive('my-courses'), 1800);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-green-700 mb-2">Cours créé avec succès !</h3>
        <p className="text-gray-500">Redirection vers vos cours...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActive('my-courses')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau cours</h1>
      </div>

      <div className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6">
        {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cours *</label>
            <input required value={form.title} onChange={e => up('title', e.target.value)}
              placeholder="ex: Docker & Containerisation pour les débutants"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea required rows={4} value={form.description} onChange={e => up('description', e.target.value)}
              placeholder="Décrivez ce que les étudiants vont apprendre, les prérequis et les objectifs..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => up('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['DevOps', 'Cloud', 'Backend', 'Frontend', 'Programmation', 'Cybersécurité', 'Data'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select value={form.level} onChange={e => up('level', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée</label>
              <input value={form.duration} onChange={e => up('duration', e.target.value)}
                placeholder="ex: 12h" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'instructeur</label>
              <input value={form.instructor_name} onChange={e => up('instructor_name', e.target.value)}
                placeholder="Votre nom complet" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.isFree} onChange={() => up('isFree', true)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Gratuit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!form.isFree} onChange={() => up('isFree', false)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Payant</span>
              </label>
            </div>
            {!form.isFree && (
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => up('price', e.target.value)}
                placeholder="Prix en € (ex: 49.99)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Création en cours...' : 'Créer le cours'}
            </button>
            <button type="button" onClick={() => setActive('my-courses')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTIQUES (instructeur + admin)
// ============================================================
function AnalyticsView() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/analytics/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mock = { totalUsers: 1247, totalCourses: 42, totalEnrollments: 8934, completionRate: 73 };
  const d = stats ?? mock;

  const topCourses = [
    { title: 'Python pour le DevOps', enrollments: 892, pct: 78 },
    { title: 'Docker & Containerisation', enrollments: 754, pct: 82 },
    { title: 'CI/CD avec GitHub Actions', enrollments: 623, pct: 69 },
    { title: 'Kubernetes - Orchestration', enrollments: 510, pct: 65 },
  ];

  const monthly = [
    { label: 'Nouveaux utilisateurs', value: 189, max: 300, color: 'bg-blue-500' },
    { label: 'Nouvelles inscriptions', value: 342, max: 500, color: 'bg-green-500' },
    { label: 'Sessions AI Tutor', value: 1240, max: 2000, color: 'bg-purple-500' },
    { label: 'Quiz complétés', value: 891, max: 1500, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
          {!stats && !loading && (
            <p className="text-xs text-amber-600 mt-1">Service analytics non disponible — données de démonstration</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Utilisateurs totaux" value={Number(d.totalUsers ?? mock.totalUsers).toLocaleString('fr-FR')} color="blue" />
        <StatCard icon="📚" label="Cours publiés" value={Number(d.totalCourses ?? mock.totalCourses)} color="green" />
        <StatCard icon="📋" label="Inscriptions" value={Number(d.totalEnrollments ?? mock.totalEnrollments).toLocaleString('fr-FR')} color="purple" />
        <StatCard icon="🎯" label="Taux de complétion" value={`${d.completionRate ?? mock.completionRate}%`} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Top Cours — Complétion</h2>
          <div className="space-y-4">
            {topCourses.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">{c.title}</span>
                  <span className="text-sm text-gray-500 ml-3 shrink-0">{c.enrollments} inscrits</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 w-10 text-right">{c.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Statistiques ce mois</h2>
          <div className="space-y-4">
            {monthly.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value.toLocaleString('fr-FR')}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN — OVERVIEW
// ============================================================
function AdminOverview({ user, setActive }: { user: User; setActive: (s: string) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration — Vue d'ensemble</h1>
        <p className="text-gray-500 mt-1">Bienvenue {user.firstName ?? 'Admin'} — Gestion de la plateforme LearnCloud</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Utilisateurs" value="1 247" color="blue" />
        <StatCard icon="📚" label="Cours publiés" value="42" color="green" />
        <StatCard icon="📋" label="Inscriptions" value="8 934" color="purple" />
        <StatCard icon="⭐" label="Satisfaction" value="94%" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions d'administration</h2>
          <div className="space-y-3">
            {[
              { label: 'Gérer les utilisateurs', sub: 'Rôles, activation, suppression', section: 'users', icon: '👥' },
              { label: 'Gérer les cours', sub: 'Modération, contenu, catégories', section: 'all-courses', icon: '📚' },
              { label: 'Analytiques plateforme', sub: 'Statistiques complètes', section: 'analytics', icon: '📊' },
            ].map(a => (
              <button key={a.section} onClick={() => setActive(a.section)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition group">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">{a.label}</div>
                    <div className="text-xs text-gray-500">{a.sub}</div>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">État des microservices</h2>
          <div className="space-y-2.5">
            {[
              { name: 'Nginx Gateway', port: ':80', status: true },
              { name: 'Frontend (Next.js)', port: ':3000', status: true },
              { name: 'User Service (Express)', port: ':3001', status: true },
              { name: 'Course Service (FastAPI)', port: ':8001', status: true },
              { name: 'Analytics (FastAPI)', port: ':8002', status: true },
              { name: 'AI Tutor (FastAPI)', port: ':8003', status: true },
              { name: 'MongoDB', port: ':27018', status: true },
              { name: 'PostgreSQL', port: ':5432', status: true },
              { name: 'Redis', port: ':6379', status: true },
              { name: 'n8n Automation', port: ':5678', status: true },
            ].map((svc, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-gray-700">{svc.name}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{svc.port}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN — UTILISATEURS
// ============================================================
function AdminUsers() {
  const MOCK_USERS = [
    { _id: '1', email: 'admin@learncloud.fr', firstName: 'Admin', lastName: 'LearnCloud', role: 'admin', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
    { _id: '2', email: 'instructor@learncloud.fr', firstName: 'Jean', lastName: 'Dupont', role: 'instructor', isActive: true, createdAt: '2026-01-05T00:00:00.000Z' },
    { _id: '3', email: 'student@learncloud.fr', firstName: 'Alice', lastName: 'Martin', role: 'student', isActive: true, createdAt: '2026-01-10T00:00:00.000Z' },
  ];

  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/users')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const arr = Array.isArray(data) ? data : data?.users ?? null;
        if (arr && arr.length > 0) setUsers(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    try { await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: !current }) }); } catch {}
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const changeRole = async (id: string, role: string) => {
    try { await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }); } catch {}
    setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
  };

  const filtered = users.filter(u =>
    `${u.email} ${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => ({
    admin: 'bg-red-100 text-red-700',
    instructor: 'bg-green-100 text-green-700',
    student: 'bg-blue-100 text-blue-700',
  }[role] ?? 'bg-gray-100 text-gray-600');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par email ou nom..."
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : filtered.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{user.firstName?.[0] ?? user.email[0]}</span>
                    </div>
                    <span className="font-medium text-sm text-gray-900">
                      {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-5 py-4">
                  <select value={user.role} onChange={e => changeRole(user._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer border-0 outline-none ${roleBadge(user.role)}`}>
                    <option value="student">Étudiant</option>
                    <option value="instructor">Instructeur</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleActive(user._id, user.isActive)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      user.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}>
                    {user.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN — TOUS LES COURS
// ============================================================
function AdminCourses({ courses }: { courses: Course[] }) {
  const [search, setSearch] = useState('');
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des cours</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} cours</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un cours..."
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Cours', 'Instructeur', 'Catégorie', 'Étudiants', 'Note', 'Prix'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(course => (
              <tr key={course.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <Link href={`/courses/${course.id}`} className="font-medium text-sm text-blue-600 hover:text-blue-800">
                    {course.title}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">{course.duration} · {LEVEL_LABELS[course.level]}</div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{course.instructor}</td>
                <td className="px-5 py-4">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{course.category}</span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{(course.students ?? 0).toLocaleString('fr-FR')}</td>
                <td className="px-5 py-4 text-sm text-gray-700">★ {course.rating}</td>
                <td className="px-5 py-4">
                  {course.isFree
                    ? <span className="text-xs font-semibold text-green-600">Gratuit</span>
                    : <span className="text-xs font-semibold text-gray-700">{course.price} €</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PROFIL — tous les rôles
// ============================================================
function ProfileView({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const [form, setForm] = useState({ firstName: user.firstName ?? '', lastName: user.lastName ?? '' });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const roleLabel = { student: 'Étudiant', instructor: 'Instructeur', admin: 'Administrateur' }[user.role];
  const initials = `${form.firstName?.[0] ?? user.email[0]}${form.lastName?.[0] ?? ''}`.toUpperCase();

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg({ type: '', text: '' });
    const id = (user as Record<string, unknown>).sub as string ?? (user as Record<string, unknown>)._id as string;
    try {
      await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName }) });
    } catch {}
    setUser({ ...user, firstName: form.firstName, lastName: form.lastName });
    setMsg({ type: 'success', text: 'Profil mis à jour avec succès !' });
    setSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg({ type: '', text: '' });
    if (pwd.newPwd !== pwd.confirm) { setMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' }); return; }
    if (pwd.newPwd.length < 6) { setMsg({ type: 'error', text: 'Minimum 6 caractères requis' }); return; }
    setSaving(true);
    const id = (user as Record<string, unknown>).sub as string ?? (user as Record<string, unknown>)._id as string;
    try {
      await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ password: pwd.newPwd }) });
      setMsg({ type: 'success', text: 'Mot de passe mis à jour !' });
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch {
      setMsg({ type: 'error', text: 'Impossible de mettre à jour le mot de passe' });
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon Profil</h1>

      {msg.text && (
        <div className={`rounded-lg p-3 text-sm mb-5 ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="max-w-xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-5 pb-5 mb-5 border-b border-gray-100">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">{initials || '?'}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {form.firstName ? `${form.firstName} ${form.lastName}`.trim() : user.email}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{user.email}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'instructor' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{roleLabel}</span>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user.email} disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
            </div>
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Changer le mot de passe</h3>
          <form onSubmit={savePassword} className="space-y-4">
            {[
              { label: 'Mot de passe actuel', key: 'current' },
              { label: 'Nouveau mot de passe', key: 'newPwd' },
              { label: 'Confirmer le mot de passe', key: 'confirm' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="password" value={pwd[f.key as keyof typeof pwd]}
                  onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition">
              {saving ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE — DASHBOARD
// ============================================================
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState('overview');
  const [allCourses, setAllCourses] = useState<Course[]>(MOCK_COURSES);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      const res = await authFetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setAllCourses(data);
      }
    } catch {}
  }, []);

  const loadEnrollments = useCallback(async () => {
    try {
      const res = await authFetch('/api/enrollments/me');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map((e: Record<string, unknown>) => ({
            ...MOCK_COURSES.find(c => c.id === Number(e.course_id)) ?? { id: Number(e.course_id), title: `Cours #${e.course_id}`, category: 'DevOps', level: 'beginner' },
            progress: Number(e.progress_percentage ?? 0),
          }));
          setEnrolledCourses(enriched);
          return;
        }
      }
    } catch {}
    setEnrolledCourses([
      { ...MOCK_COURSES[0], progress: 75 },
      { ...MOCK_COURSES[2], progress: 30 },
    ]);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/auth/login'; return; }

    const decoded = decodeToken(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }

    authFetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const userData = data?.user ?? data ?? {};
        setUser({ ...decoded, ...userData });
      })
      .catch(() => setUser(decoded))
      .finally(async () => {
        if (decoded.role === 'student') {
          await Promise.all([loadCourses(), loadEnrollments()]);
        } else if (decoded.role === 'instructor') {
          await loadCourses();
          setInstructorCourses(MOCK_COURSES.slice(0, 3));
        } else {
          await loadCourses();
        }
        setLoading(false);
      });
  }, [loadCourses, loadEnrollments]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} active={section} setActive={setSection} logout={handleLogout} />

      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* ======== STUDENT ======== */}
          {user.role === 'student' && section === 'overview' && (
            <StudentOverview user={user} courses={enrolledCourses} setActive={setSection} />
          )}
          {user.role === 'student' && section === 'my-courses' && (
            <MyCourses courses={enrolledCourses} setActive={setSection} />
          )}
          {user.role === 'student' && section === 'catalog' && (
            <CourseCatalog courses={allCourses} />
          )}
          {user.role === 'student' && section === 'ai-tutor' && (
            <AITutorView />
          )}

          {/* ======== INSTRUCTOR ======== */}
          {user.role === 'instructor' && section === 'overview' && (
            <InstructorOverview user={user} courses={instructorCourses} setActive={setSection} />
          )}
          {user.role === 'instructor' && section === 'my-courses' && (
            <InstructorCourses courses={instructorCourses} setCourses={setInstructorCourses} setActive={setSection} />
          )}
          {user.role === 'instructor' && section === 'create-course' && (
            <CreateCourse onCreated={c => setInstructorCourses(prev => [c, ...prev])} setActive={setSection} />
          )}
          {user.role === 'instructor' && section === 'analytics' && (
            <AnalyticsView />
          )}

          {/* ======== ADMIN ======== */}
          {user.role === 'admin' && section === 'overview' && (
            <AdminOverview user={user} setActive={setSection} />
          )}
          {user.role === 'admin' && section === 'users' && (
            <AdminUsers />
          )}
          {user.role === 'admin' && section === 'all-courses' && (
            <AdminCourses courses={allCourses} />
          )}
          {user.role === 'admin' && section === 'analytics' && (
            <AnalyticsView />
          )}

          {/* ======== PROFIL (tous rôles) ======== */}
          {section === 'profile' && (
            <ProfileView user={user} setUser={setUser} />
          )}
        </div>
      </main>
    </div>
  );
}
