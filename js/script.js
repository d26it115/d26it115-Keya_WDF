/* ============================================================
   STUDENTHUB — PORTAL SCRIPT
   Modules: theme · navigation · slider · modal · forms ·
            search · password strength · toast
   Every module is guarded so the file is safe on any page.
   ============================================================ */

(function () {
    "use strict";

    /* --------------------------------------------------------
       Helpers
    -------------------------------------------------------- */

    const $ = (id) => document.getElementById(id);

    function toast(message, type) {
        let el = document.querySelector(".toast");
        if (!el) {
            el = document.createElement("div");
            el.className = "toast";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.toggle("ok", type === "ok");
        el.classList.add("show");
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove("show"), 3200);
    }

    window.StudentHub = { toast: toast };

    /* --------------------------------------------------------
       1. Dark mode (persisted)
    -------------------------------------------------------- */

    const themeBtn = $("themeBtn");
    const savedTheme = localStorage.getItem("sh-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    function syncThemeLabel() {
        if (!themeBtn) return;
        const dark = document.body.classList.contains("dark-mode");
        themeBtn.textContent = dark ? "☀️" : "🌙";
        themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
        themeBtn.title = dark ? "Light mode" : "Dark mode";
    }

    syncThemeLabel();

    if (themeBtn) {
        themeBtn.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem(
                "sh-theme",
                document.body.classList.contains("dark-mode") ? "dark" : "light"
            );
            syncThemeLabel();
        });
    }

    /* --------------------------------------------------------
       2. Mobile navigation
    -------------------------------------------------------- */

    const menuBtn = $("menuBtn");
    const mainNav = $("mainNav");

    function closeMenu() {
        if (!mainNav || !menuBtn) return;
        mainNav.classList.remove("menu-open");
        menuBtn.textContent = "☰";
        menuBtn.setAttribute("aria-expanded", "false");
    }

    if (menuBtn && mainNav) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.addEventListener("click", function () {
            const open = mainNav.classList.toggle("menu-open");
            menuBtn.textContent = open ? "✕" : "☰";
            menuBtn.setAttribute("aria-expanded", String(open));
        });

        mainNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", function (e) {
            if (
                mainNav.classList.contains("menu-open") &&
                !mainNav.contains(e.target) &&
                !menuBtn.contains(e.target)
            ) {
                closeMenu();
            }
        });
    }

    /* Active nav link based on current file */
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".main-nav a").forEach((link) => {
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (href === page || (page === "" && href === "index.html")) {
            link.classList.add("active");
        }
    });

    /* --------------------------------------------------------
       3. Hero heading switcher (demo control)
    -------------------------------------------------------- */

    const heading = $("welcomeheading");
    const changeBtn = $("changeBtn");

    if (heading && changeBtn) {
        const original = heading.textContent.trim();
        const alternate = "Your Campus, Simplified.";
        changeBtn.addEventListener("click", function () {
            heading.textContent =
                heading.textContent.trim() === original ? alternate : original;
        });
    }

    /* --------------------------------------------------------
       4. Dismissible notice
    -------------------------------------------------------- */

    const notification = $("notification");
    const closeBtn = $("closeBtn");

    if (notification && closeBtn) {
        closeBtn.addEventListener("click", function () {
            notification.style.display = "none";
        });
    }

    /* --------------------------------------------------------
       5. Announcement modal
    -------------------------------------------------------- */

    const modal = $("announceModal");
    const openModalBtn = $("OpenModelBtn");

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("open");
        document.body.style.overflow = "";
    }

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal || e.target.closest("[data-close-modal]")) {
                closeModal();
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeModal();
        });
    }

    if (openModalBtn && modal) {
        openModalBtn.addEventListener("click", function () {
            modal.classList.add("open");
            document.body.style.overflow = "hidden";
            const close = modal.querySelector(".modal-close");
            if (close) close.focus();
        });
    }

    /* --------------------------------------------------------
       6. Image slider
    -------------------------------------------------------- */

    const sliderImage = $("sliderImage");
    const nextButton = $("nextButton");
    const prevButton = $("prevButton");
    const dotsWrap = $("sliderDots");

    if (sliderImage) {
        const images = (sliderImage.dataset.images || "")
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);

        const captions = (sliderImage.dataset.captions || "")
            .split("|")
            .map((s) => s.trim());

        if (images.length > 0) {
            let index = 0;
            let timer = null;

            const captionEl = $("sliderCaption");

            function renderDots() {
                if (!dotsWrap) return;
                dotsWrap.innerHTML = "";
                images.forEach((_, i) => {
                    const dot = document.createElement("span");
                    if (i === index) dot.classList.add("on");
                    dot.addEventListener("click", () => show(i));
                    dotsWrap.appendChild(dot);
                });
            }

            function show(i) {
                index = (i + images.length) % images.length;
                sliderImage.style.opacity = "0";
                setTimeout(() => {
                    sliderImage.src = images[index];
                    if (captionEl && captions[index]) {
                        captionEl.textContent = captions[index];
                    }
                    sliderImage.style.opacity = "1";
                }, 180);
                renderDots();
                restart();
            }

            function restart() {
                clearInterval(timer);
                timer = setInterval(() => show(index + 1), 5000);
            }

            if (nextButton) nextButton.addEventListener("click", () => show(index + 1));
            if (prevButton) prevButton.addEventListener("click", () => show(index - 1));

            renderDots();
            restart();
        }
    }

    /* --------------------------------------------------------
       7. Forms — inline validation + friendly feedback
    -------------------------------------------------------- */

    function setFieldError(input, message) {
        const field = input.closest(".field");
        if (!field) return;
        field.classList.add("invalid");
        const err = field.querySelector(".error");
        if (err) err.textContent = message;
    }

    function clearFieldError(input) {
        const field = input.closest(".field");
        if (field) field.classList.remove("invalid");
    }

    function validateForm(form) {
        let ok = true;
        form.querySelectorAll("input, textarea, select").forEach((input) => {
            clearFieldError(input);
            if (input.type === "radio") return;

            const value = (input.value || "").trim();

            if (input.required && !value && input.type !== "checkbox") {
                setFieldError(input, "This field is required.");
                ok = false;
                return;
            }

            if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setFieldError(input, "Enter a valid email address.");
                ok = false;
            }

            if (input.type === "tel" && value && !/^[6-9]\d{9}$/.test(value)) {
                setFieldError(input, "Enter a valid 10-digit mobile number.");
                ok = false;
            }
        });

        /* required radio groups */
        form.querySelectorAll("[data-required-radio]").forEach((group) => {
            const name = group.dataset.requiredRadio;
            const checked = form.querySelector('input[name="' + name + '"]:checked');
            if (!checked) {
                ok = false;
                group.classList.add("invalid");
                const err = group.parentElement.querySelector(".error");
                if (err) err.textContent = "Please make a selection.";
            } else {
                group.classList.remove("invalid");
            }
        });

        /* required checkbox */
        form.querySelectorAll('input[type="checkbox"][required]').forEach((cb) => {
            if (!cb.checked) {
                ok = false;
                const note = cb.closest(".check");
                if (note) note.style.color = "var(--red)";
            } else {
                const note = cb.closest(".check");
                if (note) note.style.color = "";
            }
        });

        return ok;
    }

    /* Live re-validation */
    document.querySelectorAll(".form").forEach((form) => {
        form.addEventListener("input", (e) => {
            if (e.target.matches("input, textarea, select")) clearFieldError(e.target);
        });
    });

    /* Generic demo submit (contact / feedback) */
    document.querySelectorAll("form[data-demo-submit]").forEach((form) => {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm(form)) {
                toast("Please fix the highlighted fields.", "err");
                return;
            }
            const msg = form.querySelector(".form-message");
            if (msg) {
                msg.textContent = form.dataset.demoSubmit || "Submitted successfully!";
                msg.classList.add("show");
            }
            toast(form.dataset.demoSubmit || "Submitted successfully!", "ok");
            form.reset();
        });
    });

    /* Login → dashboard */
    const loginForm = $("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm(loginForm)) {
                toast("Please fix the highlighted fields.", "err");
                return;
            }
            localStorage.setItem(
                "sh-user",
                JSON.stringify({
                    email: loginForm.querySelector('[name="email"]').value.trim(),
                    at: Date.now()
                })
            );
            toast("Welcome back! Redirecting to your dashboard…", "ok");
            setTimeout(() => (window.location.href = "dashboard.html"), 700);
        });
    }

    /* Register → PHP processor (with client-side pre-check) */
    const registerForm = $("registerForm");
    if (registerForm) {
        const password = registerForm.querySelector('[name="password"]');
        const confirm = registerForm.querySelector('[name="confirmPassword"]');
        const strength = $("strengthMeter");

        if (password && strength) {
            password.addEventListener("input", function () {
                const v = password.value;
                let score = 0;
                if (v.length >= 8) score++;
                if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
                if (/\d/.test(v)) score++;
                if (/[@$!%*?&]/.test(v)) score++;
                strength.className = "strength" + (v ? " s" + score : "");
            });
        }

        registerForm.addEventListener("submit", function (e) {
            if (!validateForm(registerForm)) {
                e.preventDefault();
                toast("Please fix the highlighted fields.", "err");
                return;
            }
            if (
                password &&
                confirm &&
                confirm.value &&
                password.value !== confirm.value
            ) {
                e.preventDefault();
                setFieldError(confirm, "Passwords do not match.");
                toast("Passwords do not match.", "err");
                return;
            }
            /* allow PHP to process the real submission */
        });
    }

    /* Success message from ?success=1 */
    const successMessage = $("successMessage");
    if (successMessage) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "1") {
            successMessage.textContent = "Registration successful! You can now log in.";
            successMessage.classList.add("show");
        }
    }

    /* --------------------------------------------------------
       8. Client-side login guard for dashboard/profile
    -------------------------------------------------------- */

    if (["dashboard.html", "profile.html"].includes(page)) {
        const who = document.querySelectorAll("[data-user-email]");
        if (who.length) {
            try {
                const user = JSON.parse(localStorage.getItem("sh-user") || "null");
                if (user && user.email) {
                    who.forEach((el) => (el.textContent = user.email));
                }
            } catch (_) {
                /* ignore corrupt storage */
            }
        }
    }

    /* --------------------------------------------------------
       9. Table search (admin / registrations)
    -------------------------------------------------------- */

    document.querySelectorAll("[data-search-target]").forEach((input) => {
        const table = document.querySelector(input.dataset.searchTarget);
        if (!table) return;

        input.addEventListener("input", function () {
            const q = input.value.toLowerCase().trim();
            let visible = 0;

            table.querySelectorAll("tbody tr").forEach((row) => {
                const hit = row.textContent.toLowerCase().includes(q);
                row.style.display = hit ? "" : "none";
                if (hit) visible++;
            });

            const empty = table.parentElement.querySelector(".empty-note");
            if (empty) empty.style.display = visible ? "none" : "block";
        });
    });

    /* --------------------------------------------------------
       10. FAQ — keep one item open at a time
    -------------------------------------------------------- */

    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
        item.addEventListener("toggle", function () {
            if (item.open) {
                faqItems.forEach((other) => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

    /* --------------------------------------------------------
       11. Rating label (feedback page)
    -------------------------------------------------------- */

    const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    document.querySelectorAll('.rating input[type="radio"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            const out = $("ratingOut");
            if (out) out.textContent = ratingLabels[radio.value] || "";
        });
    });

})();
