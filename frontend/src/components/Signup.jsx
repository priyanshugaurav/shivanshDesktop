import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; // centralized axios client
import { Loader2, Command, ArrowRight, Check, AlertCircle, ChevronDown } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' // Default role
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Call real backend API
      await api.post('/api/auth/signup', formData);

      // 2. On success, redirect to login
      alert('Account created successfully! Please sign in.');
      navigate('/login');

    } catch (err) {
      // 3. Handle Errors
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // h-screen + overflow-hidden ensures NO SCROLLING
    <div className="flex h-screen w-full bg-gray-50/50 p-4 lg:p-6 overflow-hidden">
      
      {/* ================================================= */}
      {/* LEFT SECTION - Form Container                     */}
      {/* ================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-12 bg-white rounded-[2rem] lg:rounded-r-none shadow-sm lg:shadow-none border border-gray-100 lg:border-none h-full overflow-y-auto">
        
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
                    Create an account
                </h1>
                <p className="text-gray-500 text-lg">
                    Start your 30-day free trial today.
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
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">Username</label>
                    <input 
                        type="text" 
                        name="username"
                        placeholder="johndoe"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">Email</label>
                    <input 
                        type="email" 
                        name="email"
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">I am a...</label>
                    <div className="relative">
                        <select 
                            name="role"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none cursor-pointer"
                            onChange={handleChange}
                            value={formData.role}
                        >
                            <option value="user">Regular User</option>
                            <option value="admin">Administrator</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-900 block">Password</label>
                    <input 
                        type="password" 
                        name="password"
                        placeholder="Create a password"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        onChange={handleChange}
                        required
                    />
                    <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
                </div>

                <button 
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
                    {!loading && <ArrowRight className="h-4 w-4 opacity-70" />}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-black hover:underline underline-offset-4">
                    Sign in
                </Link>
            </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* RIGHT SECTION - Modern Visual (Different Image)   */}
      {/* ================================================= */}
      <div className="hidden lg:block w-1/2 relative ml-4 h-full">
        <div className="absolute inset-0 bg-gray-900 rounded-[2rem] overflow-hidden h-full">
            
            {/* Background Image: A different perspective/image than Login to distinguish pages */}
            <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
                alt="Modern Architecture Interior" 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Floating Text Content */}
            <div className="absolute bottom-0 left-0 p-12 w-full">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-lg shadow-2xl">
                    <div className="flex gap-2 mb-6">
                         {/* Changed tag to "Join Us" */}
                        <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium uppercase tracking-wider border border-white/10">
                            Join the team
                        </span>
                    </div>
                    {/* Changed text slightly */}
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        Build faster, scale smarter.
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-gray-200">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">Enterprise-grade security</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-200">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium">99.9% Uptime SLA</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Signup;