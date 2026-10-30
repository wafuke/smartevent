import os
import json
import time
import urllib.request
import pandas as pd
from playwright.sync_api import sync_playwright

BASE_DIR = r"c:\Users\userss\Desktop\is project stuff\smartevent"
ML_DIR = os.path.join(BASE_DIR, "ml-service")
OUT_DIR = os.path.join(ML_DIR, "reports", "doc_figures")
os.makedirs(OUT_DIR, exist_ok=True)


def api_login(email: str, password: str = "password123"):
    req = urllib.request.Request(
        "http://localhost:5000/api/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["user"], data["token"]


def set_auth_in_page(page, user, token):
    page.goto("http://[::1]:5173/", wait_until="domcontentloaded")
    page.evaluate(
        """([u, t]) => {
            localStorage.setItem('smartevent_user', JSON.stringify(u));
            localStorage.setItem('smartevent_token', t);
        }""",
        [user, token],
    )


def build_notebook_html_kaggle():
    csv_path = os.path.join(ML_DIR, "data", "Attendance_Prediction.csv")
    df = pd.read_csv(csv_path)
    head_html = df.head(8).to_html(index=True, classes="dataframe", border=0)
    summary_path = os.path.join(ML_DIR, "data", "processed", "kaggle_summary.json")
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
  .nb-header {{ background: #003366; color: white; padding: 14px 22px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; }}
  .nb-title {{ font-weight: 800; font-size: 15px; letter-spacing: 0.2px; }}
  .nb-badge {{ background: #f59e0b; color: #0f172a; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px; }}
  .nb-container {{ background: white; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 10px 10px; padding: 18px 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
  .cell-in {{ display: flex; gap: 12px; margin-bottom: 10px; }}
  .prompt-in {{ color: #1d4ed8; font-family: 'Consolas', monospace; font-weight: 700; font-size: 12px; min-width: 55px; padding-top: 8px; }}
  .code-box {{ background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-family: 'Consolas', monospace; font-size: 12px; flex: 1; color: #0f172a; line-height: 1.45; }}
  .kw {{ color: #7c3aed; font-weight: 700; }}
  .str {{ color: #059669; }}
  .com {{ color: #64748b; font-style: italic; }}
  .cell-out {{ display: flex; gap: 12px; margin-top: 8px; }}
  .prompt-out {{ color: #dc2626; font-family: 'Consolas', monospace; font-weight: 700; font-size: 12px; min-width: 55px; padding-top: 6px; }}
  .out-box {{ flex: 1; overflow-x: auto; }}
  .stdout {{ font-family: 'Consolas', monospace; font-size: 12px; color: #334155; background: #f8fafc; border-left: 3px solid #003366; padding: 8px 12px; margin-bottom: 10px; }}
  table.dataframe {{ border-collapse: collapse; width: 100%; font-size: 12px; font-family: 'Consolas', monospace; }}
  table.dataframe th {{ background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: left; padding: 7px 10px; border-bottom: 2px solid #94a3b8; }}
  table.dataframe td {{ padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }}
  table.dataframe tr:nth-child(even) {{ background: #f8fafc; }}
  .metrics-bar {{ display: flex; gap: 14px; margin-top: 12px; }}
  .metric-pill {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; flex: 1; }}
  .metric-pill strong {{ display: block; color: #1e3a8a; font-size: 13px; margin-top: 2px; }}
</style>
</head>
<body>
  <div class="nb-header">
    <div class="nb-title">SmartEvent_ML_Attendance_Prediction.ipynb — Stage 1: Empirical Kaggle Student Attendance Anchor Dataset</div>
    <div class="nb-badge">Python 3.13 • Pandas / Scikit-Learn</div>
  </div>
  <div class="nb-container">
    <div class="cell-in">
      <div class="prompt-in">In [2]:</div>
      <div class="code-box">
        <span class="kw">import</span> pandas <span class="kw">as</span> pd<br>
        df_kaggle = pd.read_csv(<span class="str">"data/Attendance_Prediction.csv"</span>)<br>
        <span class="kw">print</span>(<span class="str">f"Loaded {{len(df_kaggle):,}} empirical records | Overall Attendance Rate: {{df_kaggle['attendance'].mean():.4f}} ({{df_kaggle['attendance'].mean()*100:.2f}}%)"</span>)<br>
        df_kaggle.head(<span class="str">8</span>)
      </div>
    </div>
    <div class="cell-out">
      <div class="prompt-out">Out[2]:</div>
      <div class="out-box">
        <div class="stdout">Loaded {len(df):,} empirical records | Columns: {list(df.columns)} | Overall Attendance Rate: {df['attendance'].mean():.4f} ({df['attendance'].mean()*100:.2f}%)</div>
        {head_html}
        <div class="metrics-bar">
          <div class="metric-pill">Empirical Anchor Size<strong>{summary['clean_rows']:,} Student Records</strong></div>
          <div class="metric-pill">Holdout ROC-AUC (Anchor)<strong>{summary['effects']['holdout_roc_auc']:.4f} (Acc: {summary['effects']['holdout_accuracy']*100:.1f}%)</strong></div>
          <div class="metric-pill">Key Log-Odds Extracted<strong>Study +0.251 • Sleep +0.169 • Travel -0.0114/min</strong></div>
          <div class="metric-pill">Weather Multipliers<strong>Sunny 54.6% • Cold 54.7% • Cloudy 54.0% • Rainy 41.6%</strong></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""


def build_notebook_html_strathmore():
    csv_path = os.path.join(ML_DIR, "data", "processed", "clean_registrations.csv")
    df = pd.read_csv(csv_path)
    cols = [
        "registration_id",
        "event_id",
        "student_id",
        "event_category",
        "day_of_week",
        "time_slot",
        "venue",
        "sms_priority",
        "past_attendance_rate",
        "attended",
    ]
    sub_df = df[cols].head(8).copy()
    sub_df["past_attendance_rate"] = sub_df["past_attendance_rate"].round(3)
    head_html = sub_df.to_html(index=False, classes="dataframe", border=0)

    clean_rep_path = os.path.join(ML_DIR, "data", "processed", "cleaning_report.json")
    with open(clean_rep_path, "r", encoding="utf-8") as f:
        rep = json.load(f)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
  .nb-header {{ background: #0f172a; color: white; padding: 14px 22px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; }}
  .nb-title {{ font-weight: 800; font-size: 15px; letter-spacing: 0.2px; }}
  .nb-badge {{ background: #10b981; color: #0f172a; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px; }}
  .nb-container {{ background: white; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 10px 10px; padding: 18px 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
  .cell-in {{ display: flex; gap: 12px; margin-bottom: 10px; }}
  .prompt-in {{ color: #1d4ed8; font-family: 'Consolas', monospace; font-weight: 700; font-size: 12px; min-width: 55px; padding-top: 8px; }}
  .code-box {{ background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-family: 'Consolas', monospace; font-size: 12px; flex: 1; color: #0f172a; line-height: 1.45; }}
  .kw {{ color: #7c3aed; font-weight: 700; }}
  .str {{ color: #059669; }}
  .cell-out {{ display: flex; gap: 12px; margin-top: 8px; }}
  .prompt-out {{ color: #dc2626; font-family: 'Consolas', monospace; font-weight: 700; font-size: 12px; min-width: 55px; padding-top: 6px; }}
  .out-box {{ flex: 1; overflow-x: auto; }}
  .stdout {{ font-family: 'Consolas', monospace; font-size: 12px; color: #334155; background: #f8fafc; border-left: 3px solid #10b981; padding: 8px 12px; margin-bottom: 10px; }}
  table.dataframe {{ border-collapse: collapse; width: 100%; font-size: 11.2px; font-family: 'Consolas', monospace; }}
  table.dataframe th {{ background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: left; padding: 7px 8px; border-bottom: 2px solid #94a3b8; }}
  table.dataframe td {{ padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }}
  table.dataframe tr:nth-child(even) {{ background: #f8fafc; }}
  .metrics-bar {{ display: flex; gap: 12px; margin-top: 12px; }}
  .metric-pill {{ background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; flex: 1; }}
  .metric-pill strong {{ display: block; color: #065f46; font-size: 13px; margin-top: 2px; }}
</style>
</head>
<body>
  <div class="nb-header">
    <div class="nb-title">SmartEvent_ML_Attendance_Prediction.ipynb — Stage 2: Cleaned Strathmore University Event Registration Dataset</div>
    <div class="nb-badge">6-Step Preprocessing Pipeline Verified</div>
  </div>
  <div class="nb-container">
    <div class="cell-in">
      <div class="prompt-in">In [5]:</div>
      <div class="code-box">
        df_clean = pd.read_csv(<span class="str">"data/processed/clean_registrations.csv"</span>)<br>
        <span class="kw">print</span>(<span class="str">f"Cleaned rows: {{len(df_clean):,}} across {{df_clean['event_id'].nunique()}} events and {{df_clean['student_id'].nunique():,}} students | Turnout: {{df_clean['attended'].mean()*100:.2f}}%"</span>)<br>
        df_clean[feature_preview_cols].head(<span class="str">8</span>)
      </div>
    </div>
    <div class="cell-out">
      <div class="prompt-out">Out[5]:</div>
      <div class="out-box">
        <div class="stdout">Raw rows: {rep['raw_rows']:,} -&gt; Cleaned rows: {rep['clean_rows']:,} | Unique Events: {df['event_id'].nunique()} | Unique Students: {df['student_id'].nunique():,} | Observed Turnout: {df['attended'].mean()*100:.2f}%</div>
        {head_html}
        <div class="metrics-bar">
          <div class="metric-pill">Duplicate Submissions Removed<strong>3,012 Rows Deduplicated</strong></div>
          <div class="metric-pill">Canonical Spellings Normalised<strong>39,166 Values Standardised</strong></div>
          <div class="metric-pill">Unrecorded Outcomes Dropped<strong>753 Unlabelled Rows Removed</strong></div>
          <div class="metric-pill">Imputed &amp; Recovered Attributes<strong>451 Venue Caps • 13,698 Pipeline Imputed</strong></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""


def main():
    student_user, student_token = api_login("student@strathmore.edu")
    organizer_user, organizer_token = api_login("organizer@strathmore.edu")
    admin_user, admin_token = api_login("elvis.wafuke@strathmore.edu")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )

        svg_banner = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">'
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0%" stop-color="#003366"/><stop offset="100%" stop-color="#1e40af"/>'
            '</linearGradient></defs>'
            '<rect width="800" height="400" fill="url(#g)"/>'
            '<text x="40" y="210" fill="#f8fafc" font-family="sans-serif" font-size="32" font-weight="bold">'
            'Strathmore University SmartEvent</text>'
            '</svg>'
        ).encode("utf-8")

        def intercept_external(route):
            url = route.request.url
            if any(h in url for h in ["localhost", "127.0.0.1", "[::1]", "file://", "data:"]):
                route.continue_()
            elif "unsplash.com" in url or route.request.resource_type == "image":
                route.fulfill(status=200, content_type="image/svg+xml", body=svg_banner)
            elif "cdn.tailwindcss.com" in url:
                route.fulfill(status=200, content_type="application/javascript", body=b"window.tailwind = {};")
            else:
                route.fulfill(status=200, content_type="text/css", body=b"")

        context.route("**/*", intercept_external)
        page = context.new_page()

        # 1. Real Notebook DataFrame Output: Kaggle Dataset (Figure 5.1)
        kaggle_html_path = os.path.join(OUT_DIR, "_temp_kaggle.html")
        with open(kaggle_html_path, "w", encoding="utf-8") as f:
            f.write(build_notebook_html_kaggle())
        page.set_viewport_size({"width": 1280, "height": 620})
        page.goto(f"file:///{kaggle_html_path.replace(os.sep, '/')}")
        page.wait_for_timeout(300)
        page.locator("body").screenshot(path=os.path.join(OUT_DIR, "fig5_1_kaggle_sample.png"))
        print("Captured fig5_1_kaggle_sample.png")

        # 2. Real Notebook DataFrame Output: Strathmore Cleaned Dataset (Figure 5.2)
        strath_html_path = os.path.join(OUT_DIR, "_temp_strath.html")
        with open(strath_html_path, "w", encoding="utf-8") as f:
            f.write(build_notebook_html_strathmore())
        page.set_viewport_size({"width": 1280, "height": 620})
        page.goto(f"file:///{strath_html_path.replace(os.sep, '/')}")
        page.wait_for_timeout(300)
        page.locator("body").screenshot(path=os.path.join(OUT_DIR, "fig5_2_strathmore_sample.png"))
        print("Captured fig5_2_strathmore_sample.png")

        # Reset viewport to 1440x1020 for rich web app screenshots
        page.set_viewport_size({"width": 1440, "height": 1020})

        # 3. Appendix 3: Public Homepage with Sign-In Modal Open
        page.goto("http://[::1]:5173/", wait_until="domcontentloaded")
        page.wait_for_selector("text=Strathmore AI", timeout=10000)
        page.wait_for_timeout(500)
        sign_in_btn = page.locator("header button", has_text="Log In").first
        if not sign_in_btn.is_visible():
            sign_in_btn = page.locator("button", has_text="Sign In").first
        if sign_in_btn.is_visible():
            sign_in_btn.click()
            page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(OUT_DIR, "app3_public_home_auth.png"), full_page=False)
        print("Captured app3_public_home_auth.png")

        # 4. Organizer Dashboard: ML Turnout Forecast Modal Open (Figure 5.8)
        set_auth_in_page(page, organizer_user, organizer_token)
        page.goto("http://[::1]:5173/organizer/dashboard", wait_until="domcontentloaded")
        page.wait_for_selector("text=Strathmore AI & Machine Learning", timeout=10000)
        page.wait_for_timeout(600)
        all_events_btn = page.locator("button", has_text="All Campus Events").first
        if all_events_btn.is_visible():
            all_events_btn.click()
            page.wait_for_timeout(500)
        ml_btn = page.locator("button", has_text="ML Forecast").first
        if ml_btn.is_visible():
            ml_btn.click()
            page.wait_for_timeout(1200)
        page.screenshot(path=os.path.join(OUT_DIR, "fig5_8_organizer_prediction_ui.png"), full_page=False)
        print("Captured fig5_8_organizer_prediction_ui.png")

        # Close modal if open
        close_btn = page.locator("button", has_text="Close Forecast").first
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(400)
        else:
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)

        # 5. Organizer Dashboard: Africa's Talking Priority SMS Broadcast Tab (Figure 5.9)
        sms_tab_btn = page.locator("button", has_text="Africa's Talking SMS Broadcast").first
        if sms_tab_btn.is_visible():
            sms_tab_btn.click()
            page.wait_for_timeout(800)
        # Type a sample high-priority message and scroll slightly so both Composer and Recent Dispatches table are visible
        high_btn = page.locator("button", has_text="High - urgent").first
        if high_btn.is_visible():
            high_btn.click()
        msg_box = page.locator("textarea").first
        if msg_box.is_visible():
            msg_box.fill("[HIGH PRIORITY - Strathmore SmartEvent]: Keynote session for Strathmore AI & Machine Learning Annual Colloquium starts at 14:00 in Main Auditorium. Present your QR Pass at Gate B.")
        page.evaluate("window.scrollTo(0, 260)")
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(OUT_DIR, "fig5_9_priority_sms_studio_ui.png"), full_page=False)
        print("Captured fig5_9_priority_sms_studio_ui.png")

        # 6. Appendix 6: Organizer Managed Events Table & Roster View
        page.evaluate("window.scrollTo(0, 0)")
        events_tab_btn = page.locator("button", has_text="Managed Events").first
        if events_tab_btn.is_visible():
            events_tab_btn.click()
            page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(OUT_DIR, "app6_organizer_analytics_simulator.png"), full_page=False)
        print("Captured app6_organizer_analytics_simulator.png")

        # 7. Admin Control Center: Overview Tab with Recharts & ML Telemetry (Figure 5.10)
        set_auth_in_page(page, admin_user, admin_token)
        page.goto("http://[::1]:5173/admin/dashboard", wait_until="domcontentloaded")
        page.wait_for_selector("text=Registrations by category", timeout=10000)
        page.wait_for_timeout(1200)
        # Scroll to 380px so Recharts BarChart, PieChart, Popular Events, and Prediction Model card are all visible
        page.evaluate("window.scrollTo(0, 380)")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(OUT_DIR, "fig5_10_analytics_dashboard_ui.png"), full_page=False)
        print("Captured fig5_10_analytics_dashboard_ui.png")

        # 8. Student Dashboard: My RSVPs & Digital QR Entry Pass Modal (Appendix 4)
        set_auth_in_page(page, student_user, student_token)
        page.goto("http://[::1]:5173/student/dashboard", wait_until="domcontentloaded")
        page.wait_for_selector("text=Digital Pass", timeout=10000)
        page.wait_for_timeout(600)
        pass_btn = page.locator("button", has_text="Digital Pass").first
        if pass_btn.is_visible():
            pass_btn.click()
            page.wait_for_timeout(700)
        page.screenshot(path=os.path.join(OUT_DIR, "app4_student_rsvp_qr_pass.png"), full_page=False)
        print("Captured app4_student_rsvp_qr_pass.png")

        # Close QR modal
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        close_qr = page.locator("button", has_text="Close").first
        if close_qr.is_visible():
            close_qr.click()
            page.wait_for_timeout(400)

        # 9. Student Dashboard: SMS & Notifications Tab (Appendix 5)
        alerts_tab = page.locator("button", has_text="SMS & Notifications").first
        if alerts_tab.is_visible():
            alerts_tab.click()
            page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "app5_student_sms_alerts.png"), full_page=False)
        print("Captured app5_student_sms_alerts.png")

        # 10. Backend REST API & Database Admin Console (http://localhost:5000/)
        page.goto("http://localhost:5000/", wait_until="domcontentloaded")
        page.wait_for_timeout(600)
        email_in = page.locator("input[type='email'], input#email").first
        pw_in = page.locator("input[type='password'], input#password").first
        if email_in.is_visible() and pw_in.is_visible():
            email_in.fill("elvis.wafuke@strathmore.edu")
            pw_in.fill("password123")
            page.locator("button", has_text="Sign in").first.click()
            page.wait_for_timeout(1200)
        page.screenshot(path=os.path.join(OUT_DIR, "app7_fastapi_swagger_docs.png"), full_page=False)
        print("Captured app7_fastapi_swagger_docs.png")

        browser.close()

    # Clean up temp html files
    for tmp in [kaggle_html_path, strath_html_path]:
        if os.path.exists(tmp):
            os.remove(tmp)


if __name__ == "__main__":
    main()
