'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'exercise';
  isFree?: boolean;
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
  lessons?: Lesson[];
}

const LEVEL_LABELS: Record<string, string> = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };

const MOCK_COURSES: Record<number, Course> = {
  1: {
    id: 1, title: 'Docker & Containerisation - Master DevOps', instructor: 'Jean Dupont',
    category: 'DevOps', level: 'beginner', rating: 4.8, students: 5420, isFree: true, duration: '12h',
    description: 'Maîtrisez Docker de zéro : images, conteneurs, réseaux, volumes et Docker Compose. Vous apprendrez à conteneuriser des applications réelles et à les déployer en production.',
    lessons: [
      { id: 1, title: 'Introduction à Docker et aux conteneurs', duration: '12min', type: 'video', isFree: true },
      { id: 2, title: 'Installation et premiers pas', duration: '8min', type: 'video', isFree: true },
      { id: 3, title: 'Images Docker — créer et gérer', duration: '18min', type: 'video' },
      { id: 4, title: 'Quiz : Bases de Docker', duration: '5min', type: 'quiz' },
      { id: 5, title: 'Volumes et persistance des données', duration: '14min', type: 'video' },
      { id: 6, title: 'Réseaux Docker', duration: '16min', type: 'video' },
      { id: 7, title: 'Docker Compose — applications multi-conteneurs', duration: '22min', type: 'video' },
      { id: 8, title: 'Exercice pratique : Stack complète', duration: '30min', type: 'exercise' },
    ]
  },
  2: {
    id: 2, title: 'Kubernetes - Orchestration de Conteneurs', instructor: 'Jean Dupont',
    category: 'DevOps', level: 'intermediate', rating: 4.7, students: 3200, isFree: false, price: 49.99, duration: '18h',
    description: 'Orchestrez vos conteneurs à grande échelle avec Kubernetes. Deployments, Services, Ingress, HPA, secrets et gestion d\'un cluster de production.',
    lessons: [
      { id: 1, title: 'Architecture Kubernetes', duration: '20min', type: 'video', isFree: true },
      { id: 2, title: 'Pods, ReplicaSets, Deployments', duration: '25min', type: 'video' },
      { id: 3, title: 'Services et Ingress', duration: '18min', type: 'video' },
      { id: 4, title: 'ConfigMaps et Secrets', duration: '15min', type: 'video' },
      { id: 5, title: 'Mise à l\'échelle automatique (HPA)', duration: '20min', type: 'video' },
      { id: 6, title: 'Quiz : Kubernetes', duration: '8min', type: 'quiz' },
    ]
  },
  3: {
    id: 3, title: 'Python pour le DevOps', instructor: 'Marie Martin',
    category: 'Programmation', level: 'beginner', rating: 4.6, students: 8900, isFree: true, duration: '10h',
    description: 'Apprenez Python pour automatiser votre infrastructure, écrire des scripts de déploiement et créer des APIs avec FastAPI.',
    lessons: [
      { id: 1, title: 'Python — bases et syntaxe', duration: '15min', type: 'video', isFree: true },
      { id: 2, title: 'Scripts d\'automatisation', duration: '20min', type: 'video' },
      { id: 3, title: 'Gestion des fichiers et processus', duration: '18min', type: 'video' },
      { id: 4, title: 'APIs avec FastAPI', duration: '25min', type: 'video' },
      { id: 5, title: 'Exercice : Automatisation complète', duration: '35min', type: 'exercise' },
    ]
  },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authFetch(url: string, options: RequestInit = {}) {
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

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string, 10);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());

    authFetch(`/api/courses/${courseId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setCourse(data);
        else setCourse(MOCK_COURSES[courseId] ?? null);
      })
      .catch(() => setCourse(MOCK_COURSES[courseId] ?? null))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    setEnrolling(true);
    try {
      await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
    } catch {}
    setEnrolled(true);
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cours introuvable</h2>
          <Link href="/courses" className="text-blue-600 hover:underline">← Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  const typeIcon = { video: '▶', quiz: '📝', exercise: '💻' };
  const typeLabel = { video: 'Vidéo', quiz: 'Quiz', exercise: 'Exercice' };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">LC</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">LearnCloud</span>
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/courses" className="text-blue-600 hover:text-blue-700 text-sm">Catalogue</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm truncate max-w-xs">{course.title}</span>
          <div className="ml-auto flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Mon espace →</Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 text-sm">Connexion</Link>
                <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">{course.category}</span>
              <span className="text-xs text-gray-500">{LEVEL_LABELS[course.level]}</span>
              <div className="flex items-center gap-1 text-sm ml-1">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-gray-800">{course.rating}</span>
                <span className="text-gray-400">({(course.students ?? 0).toLocaleString('fr-FR')} étudiants)</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            <p className="text-gray-600 leading-relaxed mb-6">{course.description}</p>

            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <span>👨‍🏫</span><span><strong>Instructeur :</strong> {course.instructor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⏱</span><span><strong>Durée :</strong> {course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📋</span><span><strong>Leçons :</strong> {course.lessons?.length ?? 0}</span>
              </div>
            </div>

            {course.lessons && course.lessons.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Contenu du cours</h2>
                  <p className="text-sm text-gray-500 mt-1">{course.lessons.length} leçons · {course.duration} de contenu</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {course.lessons.map((lesson, i) => (
                    <div key={lesson.id} className={`flex items-center justify-between px-5 py-3.5 ${lesson.isFree ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-75'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{typeIcon[lesson.type]}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{lesson.title}</div>
                          <div className="text-xs text-gray-400">{typeLabel[lesson.type]} · {lesson.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.isFree && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Gratuit</span>
                        )}
                        {!lesson.isFree && !enrolled && (
                          <span className="text-gray-300 text-lg">🔒</span>
                        )}
                        {enrolled && (
                          <span className="text-blue-600 text-sm">▶ Voir</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
              <div className="h-36 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-5">
                <span className="text-white text-6xl font-bold opacity-30">{course.category?.[0]}</span>
              </div>

              <div className="text-center mb-5">
                {course.isFree ? (
                  <div className="text-3xl font-bold text-green-600">Gratuit</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">{course.price} €</div>
                )}
              </div>

              {enrolled ? (
                <div className="space-y-3">
                  <div className="w-full bg-green-100 text-green-700 py-3 rounded-lg text-center font-semibold text-sm">
                    ✓ Vous êtes inscrit
                  </div>
                  <Link href="/dashboard"
                    className="block w-full bg-blue-600 text-white py-3 rounded-lg text-center font-semibold text-sm hover:bg-blue-700 transition">
                    Accéder au cours →
                  </Link>
                </div>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition mb-3">
                  {enrolling ? 'Inscription...' : isLoggedIn ? "S'inscrire maintenant" : 'Se connecter pour s\'inscrire'}
                </button>
              )}

              <div className="space-y-2.5 mt-5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>✅</span><span>Accès à vie</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span><span>Accessible sur tous appareils</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏆</span><span>Certificat de complétion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🤖</span><span>Accès à l'AI Tutor</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
                  ← Mon espace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
