import Router6 from 'router6';
import { Context, createRegistry, NavigateCraqAction } from 'craq';

import actionsMiddleware from '../index';

describe('actionsMiddleware', () => {
  describe('server side', () => {
    const getTestContext = (throwingAction, shouldThrow) => {
      const router = new Router6([
        {
          path: '/abc',
          name: 'name',
          config: {
            actions: ['notThrowing/action', 'throwing/action'],
          },
        },
        {
          path: '/def',
          name: 'def',
          config: {
            actions: [],
          },
        },
        {
          name: '404',
          path: '/(.*)',
          config: {
            error: true,
            actions: ['404/action'],
          },
        },
      ]);
      const actions = createRegistry<NavigateCraqAction>();

      actions.register('404/action', () => {});
      actions.register('notThrowing/action', () => {});
      actions.register('throwing/action', throwingAction);

      const context = new Context({
        store: null,
        router,
        registries: { actions, components: createRegistry() },
      });

      router.use(
        actionsMiddleware(context, {
          onError: (error, { name }) => {
            context.stats.error = error;
            context.stats.actions[name] = false;
            if (shouldThrow) throw error;
          },
          onSuccess: ({ name }) => {
            context.stats.actions[name] = true;
          },
        }),
      );

      return context;
    };

    it('throw any error', () => {
      const context = getTestContext(
        () => Promise.reject(new Error('NOPE')),
        true,
      );

      expect(() =>
        context.router.navigateToPath('/abc?a=1', {}),
      ).rejects.toEqual(new Error('NOPE'));
    });

    it('handle any error', async () => {
      const context = getTestContext(
        () => Promise.reject(new Error('NOPE')),
        false,
      );

      const route = await context.router.navigateToPath('/abc?a=1', {});

      expect(context.stats.error).toEqual(new Error('NOPE'));
      expect(context.stats.actions).toBeDefined();
      expect(context.stats.actions['throwing/action']).toBeFalsy();
      expect(context.stats.actions['notThrowing/action']).toBe(true);
      expect(route).toMatchObject({
        state: undefined,
        query: { a: '1' },
        params: {},
        config: {
          actions: ['notThrowing/action', 'throwing/action'],
        },
        name: 'name',
        path: '/abc',
      });
    });
  });
});
