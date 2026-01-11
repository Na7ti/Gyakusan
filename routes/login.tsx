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
            <h1 class="text-4xl font-black text-primary tracking-tighter mb-2 italic">GYAKUSAN</h1>
            <p class="text-gray-500 font-medium">合格への最短ルートを逆算する</p>
          </div>
          
          <div class="py-10">
            <a
              href="/api/auth/google"
              class="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-full px-6 py-4 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-md active:scale-95"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-6 h-6" alt="Google" />
              Googleでログイン
            </a>
          </div>

          <div class="text-center text-sm text-gray-400">
            ログインすることで<a href="#" class="underline hover:text-primary">利用規約</a>に同意したことになります
          </div>
        </div>
      </div>
    </>
  );
}
