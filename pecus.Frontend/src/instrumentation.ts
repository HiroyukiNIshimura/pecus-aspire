export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { instrumentHttpRequests } = await import('./libs/serverMetrics');
    instrumentHttpRequests();
  }
}
