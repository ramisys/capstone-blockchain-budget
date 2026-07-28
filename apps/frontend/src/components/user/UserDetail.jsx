import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { USER_STATUS } from '../../constants/status';
import api from '../../api/apiClient';

export function UserDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is admin or viewing own profile
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;
  const isOwnProfile = user?.id === userId;
  const canView = isAdmin || isOwnProfile;

  useEffect(() => {
    if (!canView) {
      setError('Access denied. You do not have permission to view this user.');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/users/${userId}`);
        setUserData(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user details');
        console.error('Error fetching user details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, canView]);

  if (!canView) {
    return (
      <div className="p-6">
        <Alert variant="warning">Access denied. You do not have permission to view this user.</Alert>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6">
        <Alert variant="info">No user data available</Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">User Details</h1>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/users')}>
            Back to List
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/users/${userId}/edit`)}
                className="mr-2"
              >
                Edit User
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this user?')) {
                    // Handle deletion
                  }
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete User
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                {userData.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <h2 className="text-xl font-bold mb-2">{userData.fullName}</h2>
              <p className="text-gray-600 mb-4">{userData.email}</p>

              <div className="flex flex-wrap gap-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  Role: {userData.role}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  userData.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  Status: {userData.status}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Created: {new Date(userData.createdAt).toLocaleDateString()}
                </p>
                {userData.updatedAt && (
                  <p className="text-sm text-gray-500">
                    Last Updated: {new Date(userData.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}