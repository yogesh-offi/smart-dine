export function inferUserPreferences(saved = [], tracker = []) {
  if (!saved.length) {
    return {
      prefersVeg: null,
      avgSpice: null
    };
  }

  const vegCount = saved.filter(s => s.isVeg).length;
  const avgSpice =
    saved.reduce((sum, s) => sum + (s.spiceLevel || 0), 0) / saved.length;

  return {
    prefersVeg: vegCount >= saved.length / 2,
    avgSpice: Math.round(avgSpice)
  };
}
