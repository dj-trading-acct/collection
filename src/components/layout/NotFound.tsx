import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Pokemon Not Found</h2>
      <p className="text-gray-500 mb-6">
        The Pokemon you are looking for does not exist or has been removed.
      </p>
      <Link
        to="/"
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Back to Collection
      </Link>
    </div>
  );
}
