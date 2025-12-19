export function rankRestaurants(menuItems, userPrefs = {}) {
  return menuItems
    .map(item => {
      const rating = item.restaurantId.rating || 3.5;
      const sentiment = item.restaurantId.sentimentScore || 0.2;

      let preferenceBoost = 0;

      if (
        userPrefs.prefersVeg !== null &&
        item.isVeg === userPrefs.prefersVeg
      ) {
        preferenceBoost += 0.2;
      }

      if (
        userPrefs.avgSpice !== null &&
        Math.abs(item.spicinessLevel - userPrefs.avgSpice) <= 1
      ) {
        preferenceBoost += 0.1;
      }

      const finalScore =
        rating * 0.4 +
        sentiment * 0.3 +
        preferenceBoost;

      return {
        item,
        finalScore,
        reasoning: [
          rating >= 4 ? "High restaurant rating" : null,
          sentiment >= 0.3 ? "Positive user sentiment" : null,
          preferenceBoost > 0 ? "Matches your preferences" : null
        ].filter(Boolean)
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
