from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ProjectionInputs(BaseModel):
    """Inputs for a residential property investment projection.

    Rates are decimal fractions: 0.06 represents 6%. The mortgage uses a
    constant annual rate and is amortised using the selected frequency.
    """

    years: int = Field(ge=1, le=99)
    property_cost: float = Field(gt=0)
    loan: float = Field(ge=0)
    average_variable_mortgage_rate: float = Field(ge=0, le=1)
    mortgage_term_years: int = Field(ge=1, le=50)
    repayment_frequency: Literal["weekly", "fortnightly", "monthly"] = "monthly"
    return_on_investment: float = Field(ge=-1, le=1)
    kiwisaver_starting_capital: float = Field(ge=0)
    kiwisaver_return_on_investment: float = Field(ge=-1, le=1)
    kiwisaver_contribution_per_week: float = Field(ge=0)
    kiwisaver_contribution_escalation_rate: float = Field(ge=-1, le=1)
    kiwisaver_top_up_enabled: bool = False
    weekly_property_income: float = Field(ge=0)
    income_escalation_rate: float = Field(ge=-1, le=1)
    maintenance_rate: float = Field(ge=0, le=1)
    annual_rates: float = Field(ge=0)
    rates_escalation_rate: float = Field(ge=-1, le=1)
    annual_insurance: float = Field(ge=0)
    insurance_escalation_rate: float = Field(ge=-1, le=1)
    vacancy_weeks: float = Field(ge=0, le=52)
    property_manager_fee_rate: float = Field(ge=0.01, le=0.20)
    renovation_cost_rate: float = Field(ge=0, le=1)
    liquidation_cost_rate: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def mortgage_cannot_exceed_property_cost(self) -> "ProjectionInputs":
        if self.loan > self.property_cost:
            raise ValueError("loan cannot exceed property_cost")
        return self


class ProjectionYear(BaseModel):
    year: int
    property_value_start: float
    property_value_end: float
    gross_property_income: float
    property_manager_fee: float
    maintenance_cost: float
    annual_rates: float
    annual_insurance: float
    mortgage_balance_start: float
    mortgage_interest: float
    mortgage_principal_repaid: float
    mortgage_payment: float
    renovation_cost: float
    net_cash_flow: float


class KiwisaverYear(BaseModel):
    year: int
    starting_balance: float
    contributions: float
    mortgage_rent_top_ups: float
    investment_return: float
    ending_balance: float


class ProjectionResult(BaseModel):
    years: int
    initial_equity: float
    total_income: float
    total_expenses: float
    total_cash_flow: float
    sale_price: float
    liquidation_cost: float
    total_mortgage_payments: float
    total_principal_repaid: float
    mortgage_balance_at_sale: float
    net_sale_proceeds: float
    total_benefit: float
    projection: list[ProjectionYear]
    kiwisaver_projection: list[KiwisaverYear]
    kiwisaver_final_balance: float
