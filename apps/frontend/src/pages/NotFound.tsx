import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-description">
          The page you are looking for does not exist or has been moved.
          Please verify the URL or navigate to a known page.
        </p>
        <div className="error-actions">
          <Link to="/dashboard">
            <Button variant="primary">Return to Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
