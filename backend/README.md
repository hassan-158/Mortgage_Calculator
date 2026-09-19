# Backend service

The calculator simulates a property investment one year at a time. Rates are
passed as decimal fractions, so `0.06` means 6%.

## Model assumptions

- The mortgage uses one constant annual rate for the full projection.
- The loan is amortised using the selected repayment frequency and mortgage
  term. Any balance remaining at the end of the projection is repaid on sale.
- Vacancy removes that many weeks from the property's 52-week income year.
- Property income, rates, and insurance escalate annually from year 1.
- Annual maintenance is charged as a percentage of the property's value at the
	start of each year.
- Renovation cost is charged in years 10, 20, 30, and so on, as a percentage
	of the original property cost.
- Sale occurs at the end of the final year after property appreciation. The
	liquidation percentage is charged against the final sale price.
- `total_benefit` is cumulative operating cash flow plus net sale proceeds,
	less the initial equity contribution.
- The KiwiSaver baseline starts with its own starting capital and adds the
	weekly contribution at the selected mortgage repayment frequency.
- When enabled, the KiwiSaver top-up is the positive difference between the
	mortgage payment and the property's weekly income treated as rent, converted
	to each selected repayment period.
- KiwiSaver investment returns are applied each repayment period using one
	constant annual return rate.

## Run locally

```bash
uv run uvicorn backend.api:app --reload
```

## Render deployment

Use a Render Web Service with the following start command:

```bash
uv run uvicorn api:app --host 0.0.0.0 --port $PORT
```

The app is designed to expose a `POST /calculate` endpoint.
