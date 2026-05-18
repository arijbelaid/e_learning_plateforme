'use client';
import Link from 'next/link';

const MY_COURSES = [
  { id: 1, title: 'Docker & Containerisation', progress: 75, lessons: 8, completed: 6, category: 'DevOps' },
  { id: 3, title: 'Python pour le DevOps', progress: 30, lessons: 10, completed: 3, category: 'Programmation' },
];

const RECENT_ACTIVITY = [
  { action: 'Leçon terminée', detail: 'Docker Compose', course: 'Docker & Containerisation', time: 'Il y a 2h' },
  { action: 'Quiz complété', detail: 'Score: 4/5', course: 'Python pour le DevOps', time: 'Hier' },
  { action: 'Inscription', detail: 'Nouveau cours', course: 'Python pour le DevOps', time: 'Il y a 3 jours' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">← Accueil</Link>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Alice Martin</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Cours inscrits', value: '2', color: 'blue' },
            { label: 'Leçons complétées', value: '9', color: 'green' },
            { label: 'Heures d\'apprentissage', value: '14h', color: 'purple' },
            { label: 'Quiz réussis', value: '3', color: 'orange' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`text-3xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Mes cours en cours</h2>
                <Link href="/courses" className="text-sm text-blue-600 hover:text-blue-700">Trouver d'autres cours</Link>
              </div>
              <div className="space-y-4">
                {MY_COURSES.map(course => (
                  <Link key={course.id} href={`/courses/${course.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.completed}/{course.lessons} leçons</div>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Tutor CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
              <div className="font-semibold mb-1">AI Tutor disponible</div>
              <p className="text-sm text-purple-200 mb-4">Posez vos questions sur vos cours en cours</p>
              <Link href="/ai-tutor" className="block w-full bg-white text-purple-700 text-center py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition">
                Ouvrir l'AI Tutor
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Activité récente</h2>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{act.action}: {act.detail}</div>
                      <div className="text-xs text-gray-500">{act.course} · {act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
