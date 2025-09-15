import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/Dashboard" className="text-2xl font-bold">
        Pet Clinic Management
      </Link>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link to="/appointments" className="hover:text-gray-200">Appointment</Link>
            <Link to="/Dashboard" className="hover:text-gray-200">Dashboard</Link>
            <Link to="/history">History</Link>
            <Link to="/owners" className="hover:text-gray-200">Owner</Link>
            <Link to="/pets" className="hover:text-gray-200">Pet</Link>
            <Link to="/profile" className="hover:text-gray-200">Profile</Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-200">Login</Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
