import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLogin.css';

const DashboardLogin: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(credentials.username, credentials.password);
      
      if (!success) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  if (isLoading) {
    return (
      <div className="dashboard-login">
        <div className="login-loading">
          <div className="loading-spinner"></div>
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-login">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1>Đăng nhập Admin</h1>
          <p>Truy cập bảng điều khiển Uside Shop</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-grouplg">
            <label htmlFor="username">
              <i className="fas fa-user"></i>
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grouplg">
            <label htmlFor="password">
              <i className="fas fa-lock"></i>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting || !credentials.username || !credentials.password}
          >
            {isSubmitting ? (
              <>
                <div className="button-spinner"></div>
                Đang đăng nhập...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="back-to-site">
            <i className="fas fa-arrow-left"></i>
            Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardLogin;