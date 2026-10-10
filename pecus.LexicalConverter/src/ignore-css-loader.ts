import type { LoadHook } from 'node:module';

const CSS_MODULE_SOURCE = 'export default {};';

export const load: LoadHook = async (url, context, nextLoad) => {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: CSS_MODULE_SOURCE,
    };
  }

  return nextLoad(url, context);
};
