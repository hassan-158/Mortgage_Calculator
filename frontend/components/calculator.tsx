"use client";

import { useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

type Frequency = "weekly" | "fortnightly" | "monthly";

type FormState = {
  years: string;
  propertyCost: string;
  loan: string;
  mortgageRate: string;
  mortgageTerm: string;
  frequency: Frequency;
  propertyReturn: string;
  weeklyIncome: string;
  incomeEscalation: string;
  maintenanceRate: string;
  annualRates: string;
  ratesEscalation: string;
  annualInsurance: string;
  insuranceEscalation: string;
  vacancyWeeks: string;
  managerFee: string;
  renovationRate: string;
  liquidationRate: string;
  startingCapital: string;
  kiwiReturn: string;
  contribution: string;
  contributionEscalation: string;
  topUp: boolean;
};

type ProjectionResult = {
  years: number;
  initial_equity: number;
  total_income: number;
  total_expenses: number;
  total_cash_flow: number;
  sale_price: number;
  liquidation_cost: number;
  total_mortgage_payments: number;
  total_principal_repaid: number;
  mortgage_balance_at_sale: number;
  net_sale_proceeds: number;
  total_benefit: number;
  kiwisaver_final_balance: number;
  projection: Array<{
    year: number;
    mortgage_payment: number;
    mortgage_interest: number;
    mortgage_principal_repaid: number;
    mortgage_balance_start: number;
    property_value_end: number;
    net_cash_flow: number;
  }>;
  kiwisaver_projection: Array<{
    year: number;
    contributions: number;
    mortgage_rent_top_ups: number;
    investment_return: number;
    ending_balance: number;
  }>;
};

const initialForm: FormState = {
  years: "10",
  propertyCost: "900000",
  loan: "720000",
  mortgageRate: "5.98",
  mortgageTerm: "30",
  frequency: "monthly",
  propertyReturn: "4.5",
  weeklyIncome: "850",
  incomeEscalation: "3.5",
  maintenanceRate: "1",
  annualRates: "3800",
  ratesEscalation: "3.5",
  annualInsurance: "2200",
  insuranceEscalation: "5",
  vacancyWeeks: "2",
  managerFee: "8",
  renovationRate: "10",
  liquidationRate: "2",
  startingCapital: "180000",
  kiwiReturn: "6.5",
  contribution: "70",
  contributionEscalation: "3",
  topUp: true,
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/calculate";
const money = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 });
const preciseMoney = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 2 });

function number(value: string) {
  return Number(value) || 0;
}

function percent(value: string) {
  return number(value) / 100;
}

function formatMoney(value: number, precise = false) {
  return `$${(precise ? preciseMoney : money).format(value)}`;
}

function Field({
  label,
  hint,
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step = "1",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  prefix?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={`input-shell ${prefix ? "has-prefix" : ""} ${suffix ? "has-suffix" : ""}`}>
        {prefix && <span className="input-affix">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <span className="input-affix input-suffix">{suffix}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export default function Calculator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [results, setResults] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function runProjection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      years: number(form.years),
      property_cost: number(form.propertyCost),
      loan: number(form.loan),
      average_variable_mortgage_rate: percent(form.mortgageRate),
      mortgage_term_years: number(form.mortgageTerm),
      repayment_frequency: form.frequency,
      return_on_investment: percent(form.propertyReturn),
      kiwisaver_starting_capital: number(form.startingCapital),
      kiwisaver_return_on_investment: percent(form.kiwiReturn),
      kiwisaver_contribution_per_week: number(form.contribution),
      kiwisaver_contribution_escalation_rate: percent(form.contributionEscalation),
      kiwisaver_top_up_enabled: form.topUp,
      weekly_property_income: number(form.weeklyIncome),
      income_escalation_rate: percent(form.incomeEscalation),
      maintenance_rate: percent(form.maintenanceRate),
      annual_rates: number(form.annualRates),
      rates_escalation_rate: percent(form.ratesEscalation),
      annual_insurance: number(form.annualInsurance),
      insurance_escalation_rate: percent(form.insuranceEscalation),
      vacancy_weeks: number(form.vacancyWeeks),
      property_manager_fee_rate: percent(form.managerFee),
      renovation_cost_rate: percent(form.renovationRate),
      liquidation_cost_rate: percent(form.liquidationRate),
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("The API rejected this projection.");
      }
      setResults(await response.json());
    } catch (requestError) {
      console.error(requestError);
      setError("The projection could not be reached. Check that the API is running and try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(initialForm);
    setResults(null);
    setError("");
  }

  const spread = results ? results.total_benefit - results.kiwisaver_final_balance : 0;
  const impliedStartingCapital = number(form.propertyCost) - number(form.loan);
  const startingCapitalWarning = Math.abs(number(form.startingCapital) - impliedStartingCapital) > 0.01;
  const totalContributions = results ? results.kiwisaver_projection.reduce((sum, year) => sum + year.contributions, 0) : 0;
  const totalTopUps = results ? results.kiwisaver_projection.reduce((sum, year) => sum + year.mortgage_rent_top_ups, 0) : 0;
  const totalDeposits = results ? number(form.startingCapital) + totalContributions : 0;
  const totalInvestmentGrowth = results ? results.kiwisaver_final_balance - totalDeposits - totalTopUps : 0;
  const totalPropertyCost = results ? results.total_expenses + results.initial_equity + results.mortgage_balance_at_sale + results.liquidation_cost : 0;
  const projectedPropertyBalance = results ? results.total_benefit : 0;

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="workspace-topline">
          <span>NZD / annual projection</span>
          <button className="reset-button" type="button" onClick={reset} title="Reset all inputs">
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        <form onSubmit={runProjection}>
          <section className="form-section horizon-section">
            <div className="section-heading">
              <div><span className="section-index">01</span><h2>Timeframe</h2></div>
              <p></p>
            </div>
            <div className="horizon-grid">
              <Field label="Projection length" value={form.years} suffix="years" min="1" max="99" onChange={(value) => update("years", value)} />
              <div className="frequency-field">
                <span className="field-label">Mortgage repayments</span>
                <div className="segmented-control">
                  {(["weekly", "fortnightly", "monthly"] as Frequency[]).map((frequency) => (
                    <button className={form.frequency === frequency ? "active" : ""} type="button" key={frequency} onClick={() => update("frequency", frequency)}>
                      {frequency}
                    </button>
                  ))}
                </div>
                <span className="field-hint">Used to calculate mortgage repayments</span>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <div><span className="section-index">02</span><h2>Property Investment</h2></div>
              <p></p>
            </div>
            <div className="field-grid field-grid-3">
              <Field label="Property cost" value={form.propertyCost} prefix="$" onChange={(value) => update("propertyCost", value)} />
              <Field label="Mortgage" value={form.loan} prefix="$" onChange={(value) => update("loan", value)} />
              <Field label="Mortgage Rate" value={form.mortgageRate} suffix="%" step="0.01" onChange={(value) => update("mortgageRate", value)} />
              <Field label="Mortgage Term" value={form.mortgageTerm} suffix="years" min="1" max="50" onChange={(value) => update("mortgageTerm", value)} />
              <Field label="Property ROI" value={form.propertyReturn} suffix="% / year" step="0.1" onChange={(value) => update("propertyReturn", value)} />
              <Field label="Property Income" value={form.weeklyIncome} prefix="$" suffix="/ week" onChange={(value) => update("weeklyIncome", value)} />
              <Field label="Income Growth Rate" value={form.incomeEscalation} suffix="% / year" step="0.1" onChange={(value) => update("incomeEscalation", value)} />
              <Field label="Vacancy" value={form.vacancyWeeks} suffix="weeks / year" step="0.5" onChange={(value) => update("vacancyWeeks", value)} />
              <Field label="Property Manager Fees" value={form.managerFee} suffix="% of income" step="0.1" onChange={(value) => update("managerFee", value)} />
            </div>
            <div className="subsection-label">Annual costs and sale</div>
            <div className="field-grid field-grid-4">
              <Field label="Maintenance Fees" value={form.maintenanceRate} suffix="% of value" step="0.1" onChange={(value) => update("maintenanceRate", value)} />
              <Field label="Property Rates" value={form.annualRates} prefix="$" suffix="/ year" onChange={(value) => update("annualRates", value)} />
              <Field label="Rates Growth Rate" value={form.ratesEscalation} suffix="% / year" step="0.1" onChange={(value) => update("ratesEscalation", value)} />
              <Field label="Property Insurance" value={form.annualInsurance} prefix="$" suffix="/ year" onChange={(value) => update("annualInsurance", value)} />
              <Field label="Property Insurance Growth Rate" value={form.insuranceEscalation} suffix="% / year" step="0.1" onChange={(value) => update("insuranceEscalation", value)} />
              <Field label="Renovation Cost" value={form.renovationRate} suffix="% every 10 years" step="0.1" onChange={(value) => update("renovationRate", value)} />
              <Field label="Liquidation Cost" value={form.liquidationRate} suffix="% on sale" step="0.1" onChange={(value) => update("liquidationRate", value)} />
            </div>
          </section>

          <section className="form-section kiwi-section">
            <div className="section-heading">
              <div><span className="section-index">03</span><h2>KiwiSaver / Managed Fund</h2></div>
              <p></p>
            </div>
            <div className="field-grid field-grid-4">
              <Field label="Starting capital" value={form.startingCapital} prefix="$" onChange={(value) => update("startingCapital", value)} />
              <Field label="Investment ROI" value={form.kiwiReturn} suffix="% / year" step="0.1" onChange={(value) => update("kiwiReturn", value)} />
              <Field label="Contribution" value={form.contribution} prefix="$" suffix="/ week" onChange={(value) => update("contribution", value)} />
              <Field label="Contribution Growth Rate" value={form.contributionEscalation} suffix="% / year" step="0.1" onChange={(value) => update("contributionEscalation", value)} />
              <button type="button" className={`toggle-field ${form.topUp ? "selected" : ""}`} onClick={() => update("topUp", !form.topUp)} aria-pressed={form.topUp}>
                <span className="toggle-copy"><span className="field-label">Top up the difference</span><span className="field-hint">Mortgage payment less rent</span></span>
                <span className="toggle-control">{form.topUp && <Check size={14} />}</span>
              </button>
            </div>
            {startingCapitalWarning && (
              <div className="warning-box" role="alert">
                Starting capital should usually match the initial equity: {formatMoney(impliedStartingCapital)}. Current value is {formatMoney(number(form.startingCapital))}.
              </div>
            )}
          </section>

          <div className="action-row">
            <p>All rates are entered as percentages. Results are shown in today&apos;s dollars.</p>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Running the model" : "Run the projection"}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        {error && <div className="error-box" role="alert">{error}</div>}

        {results && (
          <section className="results-section" aria-live="polite">
            <div className="results-heading">
              <div><span className="eyebrow">Your projection</span><h2>The spread after {results.projection.length} years</h2></div>
              <p>One view of the property outcome, one view of the invested alternative.</p>
            </div>
            <div className="comparison-grid">
              <article className="outcome-panel property-outcome">
                <div className="outcome-top"><span className="outcome-kicker">Property</span><span className="outcome-year">Entire term</span></div>
                <strong>{formatMoney(projectedPropertyBalance)}</strong>
                <span className="outcome-label">Projected balance</span>
                <div className="outcome-details">
                  <span>Property Value <b>{formatMoney(results.sale_price)}</b></span>
                  <span>Total Property Income <b>{formatMoney(results.total_income)}</b></span>
                  <span>Total Property Cost <b>{formatMoney(totalPropertyCost)}</b></span>
                </div>
              </article>
              <article className="outcome-panel kiwi-outcome">
                <div className="outcome-top"><span className="outcome-kicker">KiwiSaver</span><span className="outcome-year">Entire term</span></div>
                <strong>{formatMoney(results.kiwisaver_final_balance)}</strong>
                <span className="outcome-label">Projected balance</span>
                <div className="outcome-details">
                  <span>Total Top Up <b>{formatMoney(totalTopUps)}</b></span>
                  <span>Total Deposits <b>{formatMoney(totalDeposits)}</b></span>
                  <span>Total Growth <b>{formatMoney(totalInvestmentGrowth)}</b></span>
                </div>
              </article>
            </div>
            <div className={`spread-note ${spread >= 0 ? "property-leads" : "kiwi-leads"}`}>
              <span className="note-dot" /> {spread >= 0 ? `Property leads by ${formatMoney(Math.abs(spread))} on this model.` : `KiwiSaver leads by ${formatMoney(Math.abs(spread))} on this model.`}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
