'use client';
import { useState } from 'react';
import Link from 'next/link';

type Message = { role: 'user' | 'ai'; content: string; timestamp: Date };

const SAMPLE_QUESTIONS = [
  'Comment fonctionne Docker Compose ?',
  'Quelle est la différence entre Docker et Kubernetes ?',
  'Explique-moi les microservices',
  'Comment configurer un pipeline CI/CD ?',
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Bonjour ! Je suis votre AI Tutor. Je suis là pour répondre à toutes vos questions sur DevOps, Cloud, Docker, Kubernetes et plus encore. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'recommend'>('chat');

  const askQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, course_id: 1 }),
      });

      let answer = '';
      if (response.ok) {
        const data = await response.json();
        answer = data.answer;
      } else {
        answer = getMockAnswer(question);
      }

      setMessages(prev => [...prev, { role: 'ai', content: answer, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: getMockAnswer(question), timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">← Accueil</Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Tutor</h1>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">LLM Mock</span>
            </div>
          </div>
          <div className="flex gap-2">
            {(['chat', 'quiz', 'recommend'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab === 'chat' ? 'Chat Q&A' : tab === 'quiz' ? 'Générer Quiz' : 'Recommandations'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-gray-600 text-xs font-bold">U</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
                    Réflexion en cours...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="border-t border-gray-100 px-6 py-3">
              <div className="flex gap-2 flex-wrap">
                {SAMPLE_QUESTIONS.map(q => (
                  <button key={q} onClick={() => askQuestion(q)}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100 transition border border-purple-100">
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askQuestion(input)}
                  placeholder="Posez votre question..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button onClick={() => askQuestion(input)} disabled={loading || !input.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && <QuizTab />}
        {activeTab === 'recommend' && <RecommendTab />}
      </div>
    </div>
  );
}

function QuizTab() {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await fetch('/api/ai-tutor/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: 1, num_questions: 4, difficulty: 'medium' }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      } else {
        setQuiz(MOCK_QUIZ);
      }
    } catch {
      setQuiz(MOCK_QUIZ);
    } finally {
      setLoading(false);
    }
  };

  const score = quiz ? quiz.questions.filter((q: any, i: number) => answers[i] === q.correct_answer).length : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Générateur de Quiz</h2>
          <p className="text-gray-500 text-sm">Testez vos connaissances avec l'IA</p>
        </div>
        <button onClick={generateQuiz} disabled={loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
          {loading ? 'Génération...' : 'Générer un quiz'}
        </button>
      </div>

      {quiz && (
        <div className="space-y-6">
          {quiz.questions.map((q: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.question}</p>
              {q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: string) => {
                    const isSelected = answers[i] === opt;
                    const isCorrect = submitted && opt === q.correct_answer;
                    const isWrong = submitted && isSelected && opt !== q.correct_answer;
                    return (
                      <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${
                        isCorrect ? 'bg-green-50 border-green-300' :
                        isWrong ? 'bg-red-50 border-red-300' :
                        isSelected ? 'bg-purple-50 border-purple-300' :
                        'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input type="radio" name={`q${i}`} value={opt} checked={isSelected}
                          onChange={() => !submitted && setAnswers(prev => ({ ...prev, [i]: opt }))} className="w-4 h-4" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {submitted && (
                <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-2 rounded">{q.explanation}</p>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            {submitted ? (
              <div className="text-lg font-semibold text-gray-900">
                Score : <span className={score >= quiz.questions.length / 2 ? 'text-green-600' : 'text-red-600'}>
                  {score}/{quiz.questions.length}
                </span>
              </div>
            ) : (
              <div />
            )}
            <button onClick={() => setSubmitted(true)} disabled={submitted || Object.keys(answers).length < quiz.questions.length}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
              {submitted ? 'Quiz soumis' : 'Soumettre'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Recommandations Personnalisées</h2>
      <p className="text-gray-500 text-sm mb-6">Basées sur votre profil d'apprentissage</p>
      <div className="space-y-3">
        {[
          { title: 'Terraform - Infrastructure as Code', reason: 'Suite naturelle après Docker & Kubernetes', score: '95%' },
          { title: 'GitOps avec ArgoCD', reason: 'Complémente votre apprentissage CI/CD', score: '88%' },
          { title: 'Monitoring avec Prometheus & Grafana', reason: 'Essentiel pour la production DevOps', score: '82%' },
        ].map((rec, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition">
            <div>
              <p className="font-medium text-gray-900">{rec.title}</p>
              <p className="text-sm text-gray-500">{rec.reason}</p>
            </div>
            <div className="text-right">
              <div className="text-purple-600 font-semibold">{rec.score}</div>
              <div className="text-xs text-gray-400">correspondance</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMockAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('docker compose')) return 'Docker Compose est un outil qui permet de définir et gérer des applications multi-conteneurs. Via un fichier YAML (docker-compose.yml), vous définissez les services, réseaux et volumes. La commande "docker compose up" démarre tous les services ensemble.';
  if (q.includes('kubernetes')) return 'Kubernetes (K8s) est une plateforme d\'orchestration de conteneurs. Il gère automatiquement le déploiement, la mise à l\'échelle et la haute disponibilité de vos applications. Il diffère de Docker en ce qu\'il opère au niveau cluster plutôt que machine individuelle.';
  if (q.includes('microservices')) return 'Les microservices décomposent une application en petits services indépendants, chacun avec sa propre base de données et déployable séparément. Ils communiquent via des APIs REST ou des messages. Les avantages incluent la scalabilité indépendante et la résilience.';
  if (q.includes('ci/cd') || q.includes('cicd')) return 'CI/CD (Intégration Continue / Déploiement Continu) automatise les phases de build, test et déploiement. CI s\'assure que le code est toujours intégrable. CD livre automatiquement les changements en production après validation des tests.';
  return 'Excellente question ! Ce concept est fondamental en DevOps. Je vous recommande d\'explorer les leçons correspondantes dans le cours pour une explication détaillée avec des exemples pratiques. N\'hésitez pas à reformuler votre question si vous souhaitez plus de précisions.';
}

const MOCK_QUIZ = {
  course_id: 1,
  questions: [
    { question: 'Quel est le rôle principal de Docker ?', type: 'mcq', options: ['Conteneurisation d\'applications', 'Gestion de bases de données', 'Compilation de code', 'Surveillance réseau'], correct_answer: 'Conteneurisation d\'applications', explanation: 'Docker permet de packager une application et ses dépendances dans un conteneur portable.' },
    { question: 'Kubernetes peut automatiquement scaler les applications.', type: 'true_false', options: ['True', 'False'], correct_answer: 'True', explanation: 'Kubernetes HPA (Horizontal Pod Autoscaler) scale les pods selon CPU, mémoire ou métriques personnalisées.' },
    { question: 'Quelle commande démarre tous les services Docker Compose ?', type: 'mcq', options: ['docker compose up', 'docker start all', 'docker run', 'docker compose start'], correct_answer: 'docker compose up', explanation: '"docker compose up" construit et démarre tous les conteneurs définis dans docker-compose.yml.' },
    { question: 'Dans une architecture microservices, les services partagent la même base de données.', type: 'true_false', options: ['True', 'False'], correct_answer: 'False', explanation: 'Le pattern "Database per Service" préconise une base de données indépendante par microservice.' },
  ],
};
