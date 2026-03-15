import type { FullWeights, RoleId } from '../types';

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function checkSession() {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    return {
      ok: response.ok,
      unreachable: false,
    };
  } catch {
    return {
      ok: false,
      unreachable: true,
    };
  }
}

export async function redeemAccessCode(code: string) {
  try {
    const response = await fetch('/api/auth/redeem', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const payload = await parseJson(response);
    return {
      ok: response.ok,
      unreachable: false,
      message: payload?.message as string | undefined,
    };
  } catch {
    return {
      ok: false,
      unreachable: true,
      message: '授权服务未启动或不可达。',
    };
  }
}

export async function recordAttempt({
  resultId,
  answers,
  scores,
}: {
  resultId: RoleId;
  answers: Array<{ questionId: string; optionId: string }>;
  scores: FullWeights;
}) {
  try {
    const response = await fetch('/api/attempts', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resultId, answers, scores }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
