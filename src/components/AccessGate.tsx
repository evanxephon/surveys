import { FormEvent, useState } from 'react';

interface AccessGateProps {
  isChecking: boolean;
  error: string | null;
  onSubmit: (code: string) => Promise<void>;
}

export function AccessGate({
  isChecking,
  error,
  onSubmit,
}: AccessGateProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }
    await onSubmit(code.trim());
  };

  return (
    <section className="px-6 pb-12 pt-8 sm:px-8">
      <div className="mx-auto flex min-h-[100svh] max-w-xl items-center">
        <div className="w-full rounded-[34px] border border-white/10 bg-[#120f0d]/88 p-6 shadow-glow backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-parchment/66">Access</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-fog">
            输入授权码后，才能进入这场测试。
          </h1>
          <p className="mt-4 text-sm leading-7 text-fog/70">
            发货链接里的 `?k=` 参数会自动校验。你也可以手动输入 32 位授权码。
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-parchment/60">
                Access Code
              </span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="请输入 32 位授权码"
                className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-base text-fog outline-none transition placeholder:text-fog/30 focus:border-parchment/30"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>

            {error ? (
              <p className="text-sm leading-6 text-[#d9a592]">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isChecking}
              className="w-full rounded-full border border-parchment/24 bg-parchment/90 px-5 py-4 text-sm tracking-[0.14em] text-soot transition hover:bg-parchment disabled:cursor-wait disabled:opacity-70"
            >
              {isChecking ? '校验中...' : '验证并进入'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
