import {
  StatelessOAuthStateStore,
  STATE_COOKIE_PATH,
} from './oauth-state.store';

function mockReq(cookies: Record<string, string> = {}) {
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  return { req: { cookies, res } as any, res };
}

describe('StatelessOAuthStateStore', () => {
  const store = new StatelessOAuthStateStore(true);

  describe('store', () => {
    it('sets an httpOnly cookie and hands back the same value as the state', () => {
      const { req, res } = mockReq();
      const callback = jest.fn();

      store.store(req, callback);

      expect(res.cookie).toHaveBeenCalledWith(
        'oauth_state',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: STATE_COOKIE_PATH,
        }),
      );
      const nonce = res.cookie.mock.calls[0][1];
      expect(callback).toHaveBeenCalledWith(null, nonce);
    });

    it('generates a different value each call', () => {
      const { req: req1 } = mockReq();
      const { req: req2 } = mockReq();
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      store.store(req1, cb1);
      store.store(req2, cb2);

      expect(cb1.mock.calls[0][1]).not.toBe(cb2.mock.calls[0][1]);
    });
  });

  describe('verify', () => {
    it('succeeds when the provided state matches the cookie, and clears the cookie', () => {
      const { req, res } = mockReq({ oauth_state: 'abc123' });
      const callback = jest.fn();

      store.verify(req, 'abc123', callback);

      expect(callback).toHaveBeenCalledWith(null, true, undefined);
      expect(res.clearCookie).toHaveBeenCalledWith('oauth_state', {
        path: STATE_COOKIE_PATH,
      });
    });

    it('fails when there is no cookie at all (e.g. a victim who never started the flow)', () => {
      const { req } = mockReq({});
      const callback = jest.fn();

      store.verify(req, 'whatever-the-attacker-supplies', callback);

      expect(callback).toHaveBeenCalledWith(null, false, expect.any(Object));
    });

    it("fails when the provided state doesn't match the cookie", () => {
      const { req } = mockReq({ oauth_state: 'abc123' });
      const callback = jest.fn();

      store.verify(req, 'someone-elses-state', callback);

      expect(callback).toHaveBeenCalledWith(null, false, expect.any(Object));
    });

    it('fails when no state is provided at all', () => {
      const { req } = mockReq({ oauth_state: 'abc123' });
      const callback = jest.fn();

      store.verify(req, undefined as unknown as string, callback);

      expect(callback).toHaveBeenCalledWith(null, false, expect.any(Object));
    });
  });
});
