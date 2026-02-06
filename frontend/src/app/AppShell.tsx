import { ReactNode } from 'react';
import { HealthBadge } from '../features/health/components/HealthBadge';
import { useHealth } from '../features/health/hooks/useHealth';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { healthStatus, healthError } = useHealth({ intervalMs: 30000 });

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="top-nav">
          <div className="brand">
            <span className="brand-mark" />
            <span>Audio2Video Studio</span>
          </div>
          <nav className="nav-links" aria-label="Primary">
            <a href="#services">Services</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#booking">Booking</a>
            <a href="#contact">Contact</a>
          </nav>
          <HealthBadge healthStatus={healthStatus} healthError={healthError} />
        </div>
      </header>
      {children}
    </div>
  );
}
