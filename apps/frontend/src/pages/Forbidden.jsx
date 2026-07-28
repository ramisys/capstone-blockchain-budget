import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Forbidden() {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-code">403</div>
        <h1 className="error-title">Access Denied</h1>
        <p className="error-description">
          You do not have the required permissions to access this resource.
          If you believe this is an error, please contact your system administrator.
        </p>
        <div className="error-actions">
          <Link to="/dashboard">
            <Button variant="primary">Return to Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Sign In with Different Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
