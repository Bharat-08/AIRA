// src/pages/LoginPage.tsx
export function LoginPage() {
  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold text-yellow-500">Authentication Required</h1>
        <p className="mt-4 text-gray-300">You need to log in to access the dashboard.</p>
        <a href="http://localhost:8000/auth/google/login"
          className="mt-6 inline-block bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-500">
          Login with Google
        </a>
      </div>
    </div>
  );
}
