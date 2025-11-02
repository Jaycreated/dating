import { Link } from 'react-router-dom';

export const MinimalHeader = () => {
  return (
    <header className="py-4 px-6">
      <Link to="/" className="flex items-center">
        <img 
          src="/images/Pairfect logo.png" 
          alt="Pairfect Logo" 
          className="h-10 w-auto"
        />
      </Link>
    </header>
  );
};

export default MinimalHeader;
