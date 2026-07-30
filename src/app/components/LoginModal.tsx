"use client";

export default function LoginModal() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Entrar</h2>
        <form className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome"
            className="rounded border px-3 py-2"
          />
          <input
            type="password"
            placeholder="Chave de Acesso"
            className="rounded border px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
