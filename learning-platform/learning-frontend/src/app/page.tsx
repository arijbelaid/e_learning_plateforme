'use client';
import Link from 'next/link';

const featuredCourses = [
  { id: 1, title: 'Docker & Containerisation', instructor: 'Jean Dupont', category: 'DevOps', level: 'Débutant', rating: 4.8, students: 5420, isFree: true },
  { id: 2, title: 'Kubernetes - Orchestration', instructor: 'Jean Dupont', category: 'DevOps', level: 'Intermédiaire', rating: 4.7, students: 3200, isFree: false },
  { id: 3, title: 'Python pour le DevOps', instructor: 'Marie Martin', category: 'Programmation', level: 'Débutant', rating: 4.6, students: 8900, isFree: true },
  { id: 4, title: 'Architecture Microservices FastAPI', instructor: 'Pierre Bernard', category: 'Backend', level: 'Avancé', rating: 4.9, students: 1800, isFree: false },
  { id: 5, title: 'CI/CD avec GitHub Actions', instructor: 'Marie Martin', category: 'DevOps', level: 'Intermédiaire', rating: 4.5, students: 2900, isFree: true },
];

const stats = [
  { label: 'Apprenants', value: '25 000+' },
  { label: 'Cours disponibles', value: '150+' },
  { label: 'Instructeurs experts', value: '45+' },
  { label: 'Taux de complétion', value: '89%' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LC</span>
              </div>
              <span className="font-bold text-xl text-gray-900">LearnCloud</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/courses" className="text-gray-600 hover:text-blue-600 font-medium">Cours</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Tableau de bord</Link>
              <Link href="/ai-tutor" className="text-gray-600 hover:text-blue-600 font-medium">AI Tutor</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 font-medium">Connexion</Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                S'inscrire gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-blue-200 text-sm font-medium">Master DevOps & Cloud 2026</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Maîtrisez le DevOps et le Cloud avec des experts
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Apprenez Docker, Kubernetes, CI/CD, microservices et plus encore. 
              Accédez à l'IA Tutor pour des réponses personnalisées à vos questions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                Explorer les cours
              </Link>
              <Link href="/auth/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Cours populaires</h2>
              <p className="text-gray-600 mt-2">Les formations les plus appréciées par notre communauté</p>
            </div>
            <Link href="/courses" className="text-blue-600 font-medium hover:text-blue-700">
              Voir tous les cours →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold opacity-30">{course.category[0]}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{course.category}</span>
                    <span className="text-xs text-gray-500">{course.level}</span>
                    {course.isFree && (
                      <span className="text-xs font-medium bg-green-50 text-green-600 px-2 py-1 rounded-full ml-auto">Gratuit</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{course.instructor}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium">{course.rating}</span>
                    </div>
                    <span className="text-gray-500">{course.students.toLocaleString('fr-FR')} étudiants</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tutor Banner */}
      <section className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="text-purple-300 font-medium mb-3">Powered by AI</div>
              <h2 className="text-3xl font-bold mb-4">Votre Tuteur IA Personnel</h2>
              <p className="text-indigo-200 text-lg mb-6">
                Posez des questions sur n'importe quel cours, obtenez des recommandations personnalisées
                et générez des quiz pour tester vos connaissances.
              </p>
              <Link href="/ai-tutor" className="inline-block bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition">
                Essayer l'IA Tutor
              </Link>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
                  <div className="bg-white/20 rounded-lg p-3 text-sm text-white">
                    Bonjour ! Je suis votre AI Tutor. Comment puis-je vous aider dans votre apprentissage DevOps ?
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-purple-500 rounded-lg p-3 text-sm text-white max-w-xs">
                    Explique-moi comment fonctionne Docker Compose
                  </div>
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">U</div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
                  <div className="bg-white/20 rounded-lg p-3 text-sm text-white">
                    Docker Compose orchestre plusieurs conteneurs via un fichier YAML. Il définit les services, réseaux et volumes...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LC</span>
                </div>
                <span className="font-bold text-white text-lg">LearnCloud</span>
              </div>
              <p className="text-sm">Plateforme d'apprentissage Master DevOps & Cloud 2026</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>Course Service (FastAPI :8001)</li>
                <li>User Service (Express :3001)</li>
                <li>Analytics (FastAPI :8002)</li>
                <li>AI Tutor (FastAPI :8003)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Infrastructure</h4>
              <ul className="space-y-2 text-sm">
                <li>PostgreSQL :5432</li>
                <li>MongoDB :27017</li>
                <li>Redis :6379</li>
                <li>MinIO :9000 / :9001</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Liens rapides</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="hover:text-white">Catalogue des cours</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Connexion</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Tableau de bord</Link></li>
                <li><a href="http://localhost:5678" target="_blank" className="hover:text-white">n8n Automation</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>LearnCloud Platform — Master DevOps & Cloud M1 — Projet d'intégration 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
