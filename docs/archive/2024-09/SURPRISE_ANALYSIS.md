# Surprise Calculation Analysis

## Current Logic
```typescript
const surprise = actualNum - forecastNum;

// Color coding:
if (surprise > 0) return 'text-green-600';  // Actual better than forecast
if (surprise < 0) return 'text-red-600';    // Actual worse than forecast
```

## Test Cases

### GDP QoQ Examples

#### Case 1: Both Negative (Recession scenario)
- Forecast: -0.2%
- Actual: -0.5%
- Surprise: -0.5 - (-0.2) = -0.3
- Color: RED ✅ (Correct - actual recession worse than forecast)
- Logic: -0.5% recession is worse than -0.2% recession

#### Case 2: Both Positive (Growth scenario)
- Forecast: 3.0%
- Actual: 3.3%
- Surprise: 3.3 - 3.0 = +0.3
- Color: GREEN ✅ (Correct - actual growth better than forecast)

#### Case 3: Forecast negative, Actual positive
- Forecast: -0.1%
- Actual: +0.2%
- Surprise: 0.2 - (-0.1) = +0.3
- Color: GREEN ✅ (Correct - avoided recession, much better than forecast)

#### Case 4: Forecast positive, Actual negative
- Forecast: +0.5%
- Actual: -0.1%
- Surprise: -0.1 - 0.5 = -0.6
- Color: RED ✅ (Correct - fell into recession, much worse than forecast)

## Conclusion

The current "Universal Higher is Better" logic is mathematically and economically correct for all indicators currently in the system:

- **PMI indicators**: Higher values = expansion, lower = contraction
- **Consumer confidence**: Higher = more optimistic
- **Industrial Production**: Higher growth rates = better economy
- **Retail Sales**: Higher growth = better consumer spending
- **GDP**: Higher growth rates = better economy (even if negative, less negative is better)

No changes needed to surprise calculation logic.

## Economic Interpretation

For GDP specifically:
- Positive GDP growth: Economy expanding
- Negative GDP growth: Economy contracting (recession)
- Less negative growth is still better than more negative growth
- Therefore: -0.2% is better than -0.5%, so actual -0.5% vs forecast -0.2% should be RED

The current system correctly handles this scenario.