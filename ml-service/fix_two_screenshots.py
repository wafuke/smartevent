import os
import json
import urllib.request
from playwright.sync_api import sync_playwright

BASE_DIR = r"c:\Users\userss\Desktop\is project stuff\smartevent"
OUT_DIR = os.path.join(BASE_DIR, "ml-service", "reports", "doc_figures")


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


def main():
    student_user, student_token = api_login("student@strathmore.edu")
    organizer_user, organizer_token = api_login("organizer@strathmore.edu")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 1020},
            device_scale_factor=2,
        )

        def intercept_external(route):
            url = route.request.url
            if any(h in url for h in ["localhost", "127.0.0.1", "[::1]", "file://", "data:"]):
                route.continue_()
            elif "cdn.tailwindcss.com" in url:
                route.fulfill(status=200, content_type="application/javascript", body=b"window.tailwind = {};")
            else:
                route.fulfill(status=200, content_type="text/css", body=b"")

        context.route("**/*", intercept_external)
        page = context.new_page()

        # 1. Fix fig5_8_organizer_prediction_ui.png: wait until Forecasted Attendance renders inside the modal!
        set_auth_in_page(page, organizer_user, organizer_token)
        page.goto("http://[::1]:5173/organizer/dashboard", wait_until="domcontentloaded")
        page.wait_for_selector("text=Strathmore AI & Machine Learning", timeout=10000)
        page.wait_for_timeout(500)
        all_events_btn = page.locator("button", has_text="All Campus Events").first
        if all_events_btn.is_visible():
            all_events_btn.click()
            page.wait_for_timeout(400)
        ml_btn = page.locator("button", has_text="ML Forecast").first
        ml_btn.click()
        page.wait_for_selector("text=Forecasted Attendance", timeout=15000)
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(OUT_DIR, "fig5_8_organizer_prediction_ui.png"), full_page=False)
        print("Re-captured fig5_8_organizer_prediction_ui.png with full ML forecast")

        # 2. Fix app4_student_rsvp_qr_pass.png: wait until student RSVPs load and click Digital Pass button!
        set_auth_in_page(page, student_user, student_token)
        page.goto("http://[::1]:5173/student/dashboard", wait_until="domcontentloaded")
        page.wait_for_selector("text=Strathmore AI & Machine Learning", timeout=10000)
        page.wait_for_timeout(500)
        pass_btn = page.locator("button", has_text="Digital Pass").first
        pass_btn.click()
        page.wait_for_selector("text=Strathmore SmartEvent Digital Entry Pass", timeout=10000)
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(OUT_DIR, "app4_student_rsvp_qr_pass.png"), full_page=False)
        print("Re-captured app4_student_rsvp_qr_pass.png with QR code pass modal")

        browser.close()


if __name__ == "__main__":
    main()
