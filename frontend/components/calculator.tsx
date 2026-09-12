"use client";

import { useState } from "react";
import Image from "next/image";

const BRAND = {
  blue: "#0EB8D1",
  dark: "#222222",
  bg: "#F8FAFC",
  lightBlueBg: "#F0FDFA",
};

const DEFAULT_API_URL = "https://your-render-api-url.onrender.com/calculate";

export default function Calculator() {
  const [currentAge, setCurrentAge] = useState<number | "">("");
  const [lifeCover, setLifeCover] = useState<number | "">("");
  const [premium, setPremium] = useState<number | "">("");
  const [kiwisaverBalance, setKiwisaverBalance] = useState<number | "">("");
  const [salary, setSalary] = useState<number | "">("");
  const [kiwisaverRate, setKiwisaverRate] = useState(0);
  const [kiwisaverRateInput, setKiwisaverRateInput] = useState("");
  const [investmentType, setInvestmentType] = useState<"growth" | "balanced" | "conservative">("balanced");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-NZ").format(val);
  const parseNumber = (val: string) => Number(val.replace(/[^0-9.]/g, ""));

  async function runProjection() {
    setLoading(true);
    setError("");
    setResults(null);

    if (
      currentAge === "" ||
      lifeCover === "" ||
      premium === "" ||
      kiwisaverBalance === "" ||
      salary === "" ||
      kiwisaverRateInput === ""
    ) {
      setError("Please fill in all inputs.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        current_age: currentAge,
        life_cover: lifeCover,
        premium: premium,
        kiwisaver_balance: kiwisaverBalance,
        salary: salary,
        kiwisaver_rate: Number(kiwisaverRateInput) / 100,
        investment_type: investmentType,
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError("The projection could not be calculated. Please check the API URL and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <Image
              src="/assets/logo_cropped.png"
              alt="Logo"
              width={280}
              height={100}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <p className="tagline-inside">Rethink today. Reinvest into tomorrow.</p>
        </div>
      </header>

      <h1 className="main-heading">
        Project <span style={{ color: BRAND.blue }}>Calculator</span>
      </h1>

      <section className="form-card">
        <h2>Enter your details</h2>

        <div className="form-grid">
          <label>
            Current Age
            <div className="input-wrapper">
              <input
                type="text"
                value={currentAge === "" ? "" : currentAge}
                onChange={(e) => setCurrentAge(parseNumber(e.target.value))}
              />
            </div>
          </label>

          <label>
            Life Cover
            <div className="input-wrapper currency">
              <span className="prefix">$</span>
              <input
                type="text"
                value={lifeCover === "" ? "" : lifeCover}
                onChange={(e) => setLifeCover(parseNumber(e.target.value))}
              />
            </div>
          </label>

          <label>
            Premium
            <div className="input-wrapper currency">
              <span className="prefix">$</span>
              <input
                type="text"
                value={premium === "" ? "" : premium}
                onChange={(e) => setPremium(parseNumber(e.target.value))}
              />
            </div>
          </label>

          <label>
            KiwiSaver Balance
            <div className="input-wrapper currency">
              <span className="prefix">$</span>
              <input
                type="text"
                value={kiwisaverBalance === "" ? "" : kiwisaverBalance}
                onChange={(e) => setKiwisaverBalance(parseNumber(e.target.value))}
              />
            </div>
          </label>

          <label>
            Salary
            <div className="input-wrapper currency">
              <span className="prefix">$</span>
              <input
                type="text"
                value={salary === "" ? "" : salary}
                onChange={(e) => setSalary(parseNumber(e.target.value))}
              />
            </div>
          </label>

          <label>
            KiwiSaver Rate (%)
            <div className="input-wrapper percentage">
              <input
                type="text"
                value={kiwisaverRateInput}
                onChange={(e) => {
                  setKiwisaverRateInput(e.target.value);
                  setKiwisaverRate(Number(e.target.value.replace(/[^0-9.]/g, "")));
                }}
              />
              <span className="suffix">%</span>
            </div>
          </label>

          <label>
            Investment Type
            <div className="input-wrapper select-wrap">
              <select
                value={investmentType}
                onChange={(e) => setInvestmentType(e.target.value as "growth" | "balanced" | "conservative")}
              >
                <option value="growth">Growth</option>
                <option value="balanced">Balanced</option>
                <option value="conservative">Conservative</option>
              </select>
            </div>
          </label>
        </div>

        <button className="submit-button" onClick={runProjection} disabled={loading}>
          {loading ? "Calculating..." : "Run Projection"}
        </button>

        {error && <div className="error-box">{error}</div>}

        {results && (
          <div className="results-card">
            <h3>Summary</h3>
            <div className="results-grid">
              <div className="result-box">
                <span className="label">Total Savings</span>
                <strong>${formatCurrency(results.total_savings)}</strong>
              </div>
              <div className="result-box">
                <span className="label">KiwiSaver Increase</span>
                <strong>${formatCurrency(results.kiwisaver_increase)}</strong>
              </div>
              <div className="result-box">
                <span className="label">Increase %</span>
                <strong>{results.kiwisaver_increase_pct}%</strong>
              </div>
              <div className="result-box">
                <span className="label">True Cost / Year</span>
                <strong>${formatCurrency(results.true_cost_per_year)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
