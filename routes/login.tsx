import { Head } from "$fresh/runtime.ts";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Gyakusan</title>
      </Head>
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div class="text-center">
            <h1 class="text-4xl font-black text-primary tracking-tighter mb-2">GYAKUSAN</h1>
            <p class="text-gray-500 font-medium">合格への最短ルートを逆算する</p>
          </div>
          
          <div class="py-10">
            <a
              href="/api/auth/google"
              class="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-full px-6 py-3 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-6 h-6" alt="Google" />
              Googleでログイン
            </a>
            
            <div class="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span class="w-8 h-[1px] bg-gray-200"></span>
              <span>OR (Development Only)</span>
              <span class="w-8 h-[1px] bg-gray-200"></span>
            </div>

            <form action="/api/auth/mock" method="POST" class="mt-4">
              <button class="w-full btn btn-ghost btn-sm text-gray-400 hover:text-primary transition-colors">
                Skip to Mock Login
              </button>
            </form>
          </div>

          <div class="text-center text-sm text-gray-400">
            ログインすることで利用規約に同意したことになります
          </div>
        </div>
      </div>
    </>
  );
}
