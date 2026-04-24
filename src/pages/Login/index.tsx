import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, Zap, Shield } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ email, password })
      toast.success('Connexion réussie')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email ou mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(222,47%,7%)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(185,65%,45%) 1px, transparent 1px), linear-gradient(90deg, hsl(185,65%,45%) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">GUYA FIBRE</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-xs text-white/50">Espace Administrateur</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8">
          {/* Top gradient line */}
          <div className="absolute top-0 left-8 right-8 h-px animated-gradient-border rounded-full opacity-60" style={{ position: 'relative', margin: '-33px -1px 28px' }} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@guyafibre.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          © {new Date().getFullYear()} GUYA FIBRE — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
