import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; // centralized axios client
import { useAuth } from '../context/AuthContext';
import { Loader2, Command, ArrowRight, Check, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for backend errors
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Call your real backend API
      const res = await api.post('/api/auth/login', { email, password });

      // 2. If successful, update context and redirect
      // res.data contains { token, user } based on your backend code
      login(res.data.user, res.data.token);
      navigate('/dashboard');

    } catch (err) {
      // 3. Handle Errors
      // If the backend sends an error message (like "Invalid credentials"), show it
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to connect to the server. Is it running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // h-screen + overflow-hidden ensures NO SCROLLING
    <div className="flex h-screen w-full bg-gray-50/50 p-4 lg:p-6 overflow-hidden">
      
      {/* ================================================= */}
      {/* LEFT SECTION - Polished, Professional Form        */}
      {/* ================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-16 bg-white rounded-[2rem] lg:rounded-r-none shadow-sm lg:shadow-none border border-gray-100 lg:border-none h-full">
        
        <div className="max-w-md w-full mx-auto space-y-8">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white shadow-md shadow-black/20">
                    <Command className="h-4 w-4" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">Nexus.</span>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight mb-2">
                    Welcome back
                </h1>
                <p className="text-gray-500 text-lg">
                    Please enter your details to access.
                </p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">Email</label>
                    <input 
                        type="email" 
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black transition-all" />
                        <span className="text-sm text-gray-500 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
                    </label>
                    <a href="#" className="text-sm font-medium text-gray-900 hover:text-black hover:underline underline-offset-4 transition-all">Forgot password?</a>
                </div>

                <button 
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                    {!loading && <ArrowRight className="h-4 w-4 opacity-70" />}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-black hover:underline underline-offset-4">
                    Create account
                </Link>
            </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* RIGHT SECTION - Fixed Height Modern Visual        */}
      {/* ================================================= */}
      <div className="hidden lg:block w-1/2 relative ml-4 h-full">
        <div className="absolute inset-0 bg-gray-900 rounded-[2rem] overflow-hidden h-full">
            
            {/* Background Image: Clean, Minimal Architecture */}
            <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop" 
                alt="Modern Building" 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Floating Text Content */}
            <div className="absolute bottom-0 left-0 p-12 w-full">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-lg shadow-2xl">
                    <div className="flex gap-2 mb-6">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium uppercase tracking-wider border border-white/10">
                            Enterprise 2.0
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        Designed for the future of work.
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-gray-200">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">Real-time collaboration</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-200">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">Advanced analytics dashboard</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Login;