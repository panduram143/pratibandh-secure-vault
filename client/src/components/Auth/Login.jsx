import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(formData.email, formData.password);
    setLoading(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-primary text-white px-6 py-3 rounded-lg mb-4">
            <h1 className="text-2xl font-bold tracking-wider">PRATIBANDH</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Secure Document Management System
          </h2>
          <p className="text-sm text-gray-500">Government of India | Ministry of Home Affairs</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Officer Login</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="officer@gov.in"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New officer?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This system is for authorized personnel only.<br />
            Unauthorized access is prohibited and will be prosecuted.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
