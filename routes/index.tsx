import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Gyakusan</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold">Gyakusan</h1>
        <p class="my-4">
          合格から逆算する、挫折しない伴走者
        </p>
        <div class="mt-8">
            <a href="/exams/new" class="btn btn-primary">Create New Plan</a>
        </div>
      </div>
    </>
  );
}
