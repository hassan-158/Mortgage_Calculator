import pandas as pd
import numpy as np
from typing import Tuple


def calculator_phaseout(max_t: int,
                        L: float,
                        P0: float,
                        g: float,
                        r_avg: float,
                        K0: float,
                        si: float,
                        S0: float,
                        alpha: float = 1.0) -> Tuple[pd.DataFrame, int]:
    """
    Phase-out model: offsetting reduces required premium over time.
    Returns a dataframe of annual values and the year when cover is fully extinguished.
    """
    rows = []
    Kt = float(K0)
    full_cover_t = np.inf

    for t in range(max_t + 1):
        Pt = float(P0) * (1.0 + g) ** t
        Ot = min(alpha * Kt, L)
        Et = max(0.0, L - Ot)

        P_off_t = Pt * (Et / L) if L > 0 else 0.0
        dPt = Pt - P_off_t
        Vt = dPt

        St = float(S0) * (1.0 + si) ** t
        avg_capital_base = Kt + 0.5 * (St + Vt)
        return_t = r_avg * avg_capital_base

        Kt1 = Kt + St + Vt + return_t

        rows.append({
            "year": t + 1,
            "KiwiSaver Start Balance": Kt,
            "Baseline Premium": Pt,
            "Offset": Ot,
            "Effective Cover": Et,
            "Premium w/ Offset": P_off_t,
            "Premium Saving": dPt,
            "Voluntary Contribution": Vt,
            "Annual Salary Contribution": St,
            "Annual Investment Return": return_t,
            "KiwiSaver End Balance": Kt1
        })

        Kt = Kt1
        if Kt >= L and full_cover_t == np.inf:
            full_cover_t = t + 1

    df = pd.DataFrame(rows)
    if full_cover_t == np.inf:
        full_cover_t = None
    return df, full_cover_t
