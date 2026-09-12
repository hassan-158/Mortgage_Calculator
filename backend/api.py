from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import ProjectionRequest
from backend.calculator import calculator_phaseout
from backend.constants import *

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/calculate")
def calculate_projection(req: ProjectionRequest):
    max_t = STOP_AGE - req.current_age
    S0 = req.salary * req.kiwisaver_rate

    investment_map = {
        "growth": GROWTH_INVESTMENT_RETURN,
        "balanced": BALANCED_INVESTMENT_RETURN,
        "conservative": CONSERVATIVE_INVESTMENT_RETURN,
    }

    selected_return = investment_map.get(req.investment_type.lower())

    df_offset, _ = calculator_phaseout(
        max_t=max_t,
        L=req.life_cover,
        P0=req.premium,
        g=PREMIUM_ESCALATION,
        r_avg=selected_return,
        K0=req.kiwisaver_balance,
        si=SALARY_INCREASE,
        S0=S0,
        alpha=OFFSET_ALPHA
    )

    df_no_offset, _ = calculator_phaseout(
        max_t=max_t,
        L=req.life_cover,
        P0=req.premium,
        g=PREMIUM_ESCALATION,
        r_avg=selected_return,
        K0=req.kiwisaver_balance,
        si=SALARY_INCREASE,
        S0=S0,
        alpha=NO_OFFSET_ALPHA
    )

    total_premium_with_offset = df_offset["Premium w/ Offset"].sum()
    total_premium_without_offset = df_no_offset["Baseline Premium"].sum()
    total_savings = total_premium_without_offset - total_premium_with_offset

    ks_end_with_offset = df_offset["KiwiSaver End Balance"].iloc[-1]
    ks_end_without_offset = df_no_offset["KiwiSaver End Balance"].iloc[-1]

    total_ks_increase = ks_end_with_offset - ks_end_without_offset
    ks_increase_pct = ((total_ks_increase / ks_end_without_offset) * 100) if ks_end_without_offset > 0 else 0
    per_year_true_cost = total_ks_increase / max(1, STOP_AGE - req.current_age)

    return {
        "total_savings": max(0, round(total_savings, 2)),
        "kiwisaver_increase": max(0, round(total_ks_increase, 2)),
        "kiwisaver_increase_pct": round(ks_increase_pct, 2),
        "true_cost_per_year": max(0, round(per_year_true_cost, 2)),
        "investment_type": req.investment_type,
    }
