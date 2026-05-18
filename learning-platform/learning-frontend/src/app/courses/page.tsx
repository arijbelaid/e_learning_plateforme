'use client';
import { useState } from 'react';
import Link from 'next/link';

const COURSES = [
  { id: 1, title: 'Docker & Containerisation - Master DevOps', instructor: 'Jean Dupont', category: 'DevOps', level: 'beginner', rating: 4.8, students: 5420, isFree: true, duration: '12h', description: 'Apprenez Docker depuis zéro jusqu\'à la maîtrise complète.' },
  { id: 2, title: 'Kubernetes - Orchestration de Conteneurs', instructor: 'Jean Dupont', category: 'DevOps', level: 'intermediate', rating: 4.7, students: 3200, isFree: false, price: 49.99, duration: '18h', description: 'Maîtrisez Kubernetes pour orchestrer vos applications.' },
  { id: 3, title: 'Python pour le DevOps', instructor: 'Marie Martin', category: 'Programmation', level: 'beginner', rating: 4.6, students: 8900, isFree: true, duration: '10h', description: 'Automatisez votre infrastructure avec Python.' },
  { id: 4, title: 'Architecture Microservices avec FastAPI', instructor: 'Pierre Bernard', category: 'Backend', level: 'advanced', rating: 4.9, students: 1800, isFree: false, price: 79.99, duration: '22h', description: 'Concevez une architecture microservices moderne.' },
  { id: 5, title: 'CI/CD avec GitHub Actions', instructor: 'Marie Martin', category: 'DevOps', level: 'intermediate', rating: 4.5, students: 2900, isFree: true, duration: '8h', description: 'Automatisez vos déploiements avec GitHub Actions.' },
  { id: 6, title: 'Infrastructure as Code avec Terraform', instructor: 'Alex Rousseau', category: 'Cloud', level: 'intermediate', rating: 4.7, students: 2100, isFree: false, price: 59.99, duration: '15h', description: 'Gérez votre infrastructure cloud avec Terraform.' },
];

const CATEGORIES = ['Tous', 'DevOps', 'Cloud', 'Backend', 'Programmation'];
const LEVELS = ['Tous', 'beginner', 'intermediate', 'advanced'];
const LEVEL_LABELS: Record<string, string> = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [level, setLevel] = useState('Tous');
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = COURSES.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || c.category === category;
    const matchLevel = level === 'Tous' || c.level === level;
    const matchFree = !freeOnly || c.isFree;
    return matchSearch && matchCat && matchLevel && matchFree;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">← Accueil</Link>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue des cours</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Rechercher un cours ou un instructeur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {LEVELS.map(l => <option key={l} value={l}>{l === 'Tous' ? 'Tous niveaux' : LEVEL_LABELS[l]}</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="w-4 h-4" />
              <span className="text-gray-700 whitespace-nowrap">Gratuits uniquement</span>
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">{filtered.length} cours trouvés</div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden group">
              <div className="h-36 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                <span className="text-white text-5xl font-bold opacity-20">{course.category[0]}</span>
                <div className="absolute top-3 right-3 flex gap-2">
                  {course.isFree
                    ? <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Gratuit</span>
                    : <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{course.price} €</span>
                  }
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{course.category}</span>
                  <span className="text-xs text-gray-400">{LEVEL_LABELS[course.level]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{course.instructor}</p>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium">{course.rating}</span>
                    <span className="text-gray-400">({course.students.toLocaleString('fr-FR')})</span>
                  </div>
                  <span className="text-gray-400">{course.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-5xl mb-4">🔍</div>
            <p className="text-gray-600 font-medium">Aucun cours trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
}
