import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login', { replace: true });
  };

  const roleBg = (() => {
    if (!user) return '#475569';
    if (user.role === 'admin') return '#2563EB';
    if (user.role === 'vet') return '#10B981';
    if (user.role === 'owner') return '#8B5CF6';
    return '#475569';
  })();

  const btnClass = 'px-4 py-2 rounded-full font-bold hover:opacity-90 transition';
  const btnStyle = { backgroundColor: '#F3F58B', color: '#000' };
  const brandHref = !user ? '/admin-login' : '/dashboard';

  return (
    <nav
      className="p-4 flex justify-between items-center"
      style={{ fontFamily: "'Cherry Bomb One', cursive", backgroundColor: roleBg }}
    >
      <Link
        to={brandHref}
        className="text-2xl font-bold"
        style={{ color: '#FFFFFF' }}
        title={!user ? 'goto page Admin Login' : 'go to Dashboard'}
      >
        Pet Clinic Management
      </Link>

      <div className="flex items-center space-x-3">
        {!user && (
          <>
            <Link to="/admin-login" className={btnClass} style={btnStyle}>
              Admin Sign in
            </Link>
            <Link to="/vet-login" className={btnClass} style={btnStyle}>
              Vet Sign in
            </Link>
            <Link to="/owner-login" className={btnClass} style={btnStyle}>
              Owner Sign in
            </Link>
            <Link to="/register" className={btnClass} style={btnStyle}>
              Register
            </Link>
          </>
        )}

        {user && (
          <>
            {user.role === 'owner' && (
              <>
                <Link to="/history" className={btnClass} style={btnStyle}>History</Link>
                <Link to="/appointments" className={btnClass} style={btnStyle}>Appointment</Link>
                <Link to="/pets" className={btnClass} style={btnStyle}>Add Pet</Link>
                <Link to="/owners" className={btnClass} style={btnStyle}>Add Owner</Link>
                <Link to="/profile" className={btnClass} style={btnStyle}>Profile</Link>
                <button onClick={handleLogout} className={btnClass} style={btnStyle}>Logout</button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link to="/admin-invoice" className={btnClass} style={btnStyle}>Admin Invoice</Link>
                <Link to="/admin-prescription" className={btnClass} style={btnStyle}>Admin Prescription</Link>
                <Link to="/appointments" className={btnClass} style={btnStyle}>Appointment</Link>
                <Link to="/dashboard" className={btnClass} style={btnStyle}>Dashboard</Link>
                <Link to="/history" className={btnClass} style={btnStyle}>History</Link>
                <Link to="/owners" className={btnClass} style={btnStyle}>Add Owner</Link>
                <Link to="/pets" className={btnClass} style={btnStyle}>Add Pet</Link>
                <Link to="/profile" className={btnClass} style={btnStyle}>Profile</Link>
                <button onClick={handleLogout} className={btnClass} style={btnStyle}>Logout</button>
              </>
            )}

            {user.role === 'vet' && (
              <>
                <Link to="/vet-dashboard" className={btnClass} style={btnStyle}>Vet Dashboard</Link>
                <Link to="/admin-invoice" className={btnClass} style={btnStyle}>Invoice</Link>
                <Link to="/admin-prescription" className={btnClass} style={btnStyle}>Prescription</Link>
                <Link to="/history" className={btnClass} style={btnStyle}>History</Link>
                <Link to="/appointments" className={btnClass} style={btnStyle}>Appointment</Link>
                <Link to="/pets" className={btnClass} style={btnStyle}>Add Pet</Link>
                <Link to="/owners" className={btnClass} style={btnStyle}>Add Owner</Link>
                <Link to="/profile" className={btnClass} style={btnStyle}>Profile</Link>
                <button onClick={handleLogout} className={btnClass} style={btnStyle}>Logout</button>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
