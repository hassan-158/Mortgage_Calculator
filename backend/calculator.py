from .models import KiwisaverYear, ProjectionInputs, ProjectionResult, ProjectionYear
from .constants import REPAYMENT_PERIODS_PER_YEAR


def _annual_mortgage_schedule(inputs: ProjectionInputs) -> list[dict[str, float]]:
    """Aggregate amortising loan payments into one row per projection year."""
    periods_per_year = REPAYMENT_PERIODS_PER_YEAR[inputs.repayment_frequency]
    periodic_rate = inputs.average_variable_mortgage_rate / periods_per_year
    total_periods = inputs.mortgage_term_years * periods_per_year

    if inputs.loan == 0:
        periodic_payment = 0.0
    elif periodic_rate == 0:
        periodic_payment = inputs.loan / total_periods
    else:
        periodic_payment = inputs.loan * periodic_rate / (1 - (1 + periodic_rate) ** -total_periods)

    balance = inputs.loan
    schedule = []
    for year in range(1, inputs.years + 1):
        balance_start = balance
        annual_interest = 0.0
        annual_principal = 0.0
        annual_payment = 0.0

        for _ in range(periods_per_year):
            if balance <= 1e-9:
                break
            interest = balance * periodic_rate
            principal = min(balance, max(0.0, periodic_payment - interest))
            payment = interest + principal
            balance -= principal
            annual_interest += interest
            annual_principal += principal
            annual_payment += payment

        if balance <= 1e-9:
            balance = 0.0

        schedule.append({
            "balance_start": balance_start,
            "interest": annual_interest,
            "principal": annual_principal,
            "payment": annual_payment,
            "balance_end": max(0.0, balance),
            "periodic_payment": periodic_payment if balance_start > 1e-9 else 0.0,
        })

    return schedule


def _calculate_kiwisaver_projection(
    inputs: ProjectionInputs,
    mortgage_schedule: list[dict[str, float]],
) -> list[KiwisaverYear]:
    """Project KiwiSaver growth using annual contribution escalation and optional mortgage top-ups."""
    periods_per_year = REPAYMENT_PERIODS_PER_YEAR[inputs.repayment_frequency]
    periodic_return = inputs.kiwisaver_return_on_investment / periods_per_year
    periodic_rent = inputs.weekly_property_income * 52 / periods_per_year
    balance = inputs.kiwisaver_starting_capital
    projection = []

    for year, mortgage in enumerate(mortgage_schedule, start=1):
        starting_balance = balance
        contributions = 0.0
        top_ups = 0.0
        investment_return = 0.0
        annual_contribution_per_week = inputs.kiwisaver_contribution_per_week * (1 + inputs.kiwisaver_contribution_escalation_rate) ** (year - 1)
        periodic_contribution = annual_contribution_per_week * 52 / periods_per_year

        for _ in range(periods_per_year):
            top_up = (
                max(0.0, mortgage["periodic_payment"] - periodic_rent)
                if inputs.kiwisaver_top_up_enabled
                else 0.0
            )
            contribution = periodic_contribution + top_up
            period_return = (balance + contribution) * periodic_return
            balance += contribution + period_return
            contributions += periodic_contribution
            top_ups += top_up
            investment_return += period_return

        projection.append(
            KiwisaverYear(
                year=year,
                starting_balance=starting_balance,
                contributions=contributions,
                mortgage_rent_top_ups=top_ups,
                investment_return=investment_return,
                ending_balance=balance,
            )
        )

    return projection


def calculate_projection(inputs: ProjectionInputs) -> ProjectionResult:
    """Run an annual property investment projection.

    The mortgage is amortised at the selected repayment frequency using one
    constant annual interest rate. Property appreciation is applied at each
    year-end, while that year's operating income and costs use the year-start
    assumptions.
    """
    initial_equity = inputs.property_cost - inputs.loan
    mortgage_schedule = _annual_mortgage_schedule(inputs)
    kiwisaver_projection = _calculate_kiwisaver_projection(inputs, mortgage_schedule)
    projection = []
    property_value = inputs.property_cost
    total_income = 0.0
    total_expenses = 0.0
    total_cash_flow = 0.0

    for year in range(1, inputs.years + 1):
        gross_income = (
            inputs.weekly_property_income
            * (52 - inputs.vacancy_weeks)
            * (1 + inputs.income_escalation_rate) ** (year - 1)
        )
        manager_fee = gross_income * inputs.property_manager_fee_rate
        maintenance_cost = property_value * inputs.maintenance_rate
        annual_rates = inputs.annual_rates * (1 + inputs.rates_escalation_rate) ** (year - 1)
        annual_insurance = inputs.annual_insurance * (1 + inputs.insurance_escalation_rate) ** (year - 1)
        mortgage = mortgage_schedule[year - 1]
        renovation_cost = (
            inputs.property_cost * inputs.renovation_cost_rate
            if year % 10 == 0
            else 0.0
        )
        expenses = (
            manager_fee
            + maintenance_cost
            + annual_rates
            + annual_insurance
            + mortgage["payment"]
            + renovation_cost
        )
        net_cash_flow = gross_income - expenses
        property_value_end = property_value * (1 + inputs.return_on_investment)

        projection.append(
            ProjectionYear(
                year=year,
                property_value_start=property_value,
                property_value_end=property_value_end,
                gross_property_income=gross_income,
                property_manager_fee=manager_fee,
                maintenance_cost=maintenance_cost,
                annual_rates=annual_rates,
                annual_insurance=annual_insurance,
                mortgage_balance_start=mortgage["balance_start"],
                mortgage_interest=mortgage["interest"],
                mortgage_principal_repaid=mortgage["principal"],
                mortgage_payment=mortgage["payment"],
                renovation_cost=renovation_cost,
                net_cash_flow=net_cash_flow,
            )
        )
        total_income += gross_income
        total_expenses += expenses
        total_cash_flow += net_cash_flow
        property_value = property_value_end

    liquidation_cost = property_value * inputs.liquidation_cost_rate
    mortgage_balance_at_sale = mortgage_schedule[-1]["balance_end"]
    net_sale_proceeds = property_value - liquidation_cost - mortgage_balance_at_sale
    total_benefit = total_cash_flow + net_sale_proceeds - initial_equity

    return ProjectionResult(
        years=inputs.years,
        initial_equity=initial_equity,
        total_income=total_income,
        total_expenses=total_expenses,
        total_cash_flow=total_cash_flow,
        sale_price=property_value,
        liquidation_cost=liquidation_cost,
        total_mortgage_payments=sum(row["payment"] for row in mortgage_schedule),
        total_principal_repaid=sum(row["principal"] for row in mortgage_schedule),
        mortgage_balance_at_sale=mortgage_balance_at_sale,
        net_sale_proceeds=net_sale_proceeds,
        total_benefit=total_benefit,
        projection=projection,
        kiwisaver_projection=kiwisaver_projection,
        kiwisaver_final_balance=kiwisaver_projection[-1].ending_balance,
    )
