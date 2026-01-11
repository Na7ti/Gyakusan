import { Head } from "$fresh/runtime.ts";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login - Gyakusan</title>
      </Head>
      <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div class="p-8 bg-white rounded-lg shadow-md w-96">
          <h1 class="mb-6 text-2xl font-bold text-center text-gray-800">Login</h1>
          <p class="mb-6 text-sm text-center text-gray-600">
            Development Mode (Mock Auth)
          </p>
          <form method="POST" action="/api/auth/mock">
            <button
              type="submit"
              class="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login as Mock User
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
