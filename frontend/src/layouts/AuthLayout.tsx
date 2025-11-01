import { Outlet } from 'react-router-dom';
import { MinimalHeader } from '../components/MinimalHeader';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      <MinimalHeader />
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
