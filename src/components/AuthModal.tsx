import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { X, Eye, EyeOff, Mail, Lock, User, Shield, UserCheck, Sparkles, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'admin' | 'staff'>('student');
  const [adminPassword, setAdminPassword] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLogin) {
        // Signup validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Role-specific password validation
        if (role === 'admin' && adminPassword !== 'admin2025!') {
          throw new Error('Invalid admin password');
        }
        if (role === 'staff' && staffPassword !== 'staff2025!') {
          throw new Error('Invalid staff password');
        }

        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName,
          role,
          createdAt: new Date().toISOString()
        });
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      onClose();
      if (onSuccess) onSuccess();
      resetForm();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setRole('student');
    setAdminPassword('');
    setStaffPassword('');
    setError('');
    setStep(1);
  };

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'admin': return <Shield className="text-red-400" size={20} />;
      case 'staff': return <UserCheck className="text-blue-400" size={20} />;
      default: return <User className="text-green-400" size={20} />;
    }
  };

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'admin': return 'from-red-500 to-red-600';
      case 'staff': return 'from-blue-500 to-blue-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back!' : 'Join the 80s Party!'}
          </h2>
          <p className="text-gray-400 mt-2">
            {isLogin ? 'Sign in to continue your retro journey' : 'Create your account and step back in time'}
          </p>
        </div>

        {!isLogin && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-pink-400">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Mail size={16} className="mr-2 text-pink-400" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-pink-400"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Lock size={16} className="mr-2 text-purple-400" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12 transition-all duration-300 hover:border-purple-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Lock size={16} className="mr-2 text-purple-400" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <User size={16} className="mr-2 text-cyan-400" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  placeholder="Your awesome name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose Your Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['student', 'admin', 'staff'].map((roleType) => (
                    <button
                      key={roleType}
                      type="button"
                      onClick={() => setRole(roleType as 'student' | 'admin' | 'staff')}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        role === roleType
                          ? `border-pink-500 bg-gradient-to-r ${getRoleColor(roleType)} text-white`
                          : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        {getRoleIcon(roleType)}
                        <span className="text-xs font-medium capitalize">{roleType}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {role === 'admin' && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
                  <label className="block text-sm font-medium text-red-300 mb-2 flex items-center">
                    <Shield size={16} className="mr-2" />
                    Admin Access Code
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 bg-gray-800 border border-red-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300"
                    required
                  />
                  <p className="text-xs text-red-400 mt-2">🔐 Special access required for admin privileges</p>
                </div>
              )}

              {role === 'staff' && (
                <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-300 mb-2 flex items-center">
                    <UserCheck size={16} className="mr-2" />
                    Staff Access Code
                  </label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter staff password"
                    className="w-full px-4 py-3 bg-gray-800 border border-blue-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                    required
                  />
                  <p className="text-xs text-blue-400 mt-2">🎫 Staff credentials needed for event management</p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 flex items-center">
              <X className="text-red-400 mr-2" size={16} />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center space-x-2 transform hover:scale-105"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              resetForm();
            }}
            className="text-pink-400 hover:text-pink-300 transition-colors duration-300 flex items-center justify-center space-x-2 mx-auto"
          >
            <Sparkles size={16} />
            <span>
              {isLogin ? "Don't have an account? Join the party!" : "Already have an account? Welcome back!"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;