import supabase from "./supabase.js";

// ─── UI Panel Toggle Buttons ──────────────────────────────────────────────────
// These are the buttons INSIDE .toggle-box (class="btn register-btn" / "btn login-btn")
// They only slide the panel left/right — they have NO auth logic.
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn'); // toggle panel → show register form
const loginBtn = document.querySelector('.login-btn');    // toggle panel → show login form

registerBtn.addEventListener('click', () => {
    container.classList.add('active');     // slides panel to reveal register form
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active'); // slides panel back to show login form
});

// ─── Input References (defined once, no shadowing) ────────────────────────────
const l_emailInput = document.getElementById("L-email");
const l_passwordInput = document.getElementById("L-password");
const s_userNameInput = document.getElementById("S-userName");
const s_emailInput = document.getElementById("S-Email");
const s_passwordInput = document.getElementById("S-password");
const login_btn = document.getElementById("login-btn");    // form submit button
const register_btn = document.getElementById("register-btn"); // form submit button

// ─── Register Form Submit Button (#register-btn) ──────────────────────────────
register_btn.addEventListener('click', async (e) => {
    e.preventDefault(); // prevents form submission / page reload

    const userName = s_userNameInput.value.trim();
    const email = s_emailInput.value.trim();
    const password = s_passwordInput.value;

    if (!userName || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { userName }
        }
    });

    if (error) {
        alert(error.message);
    } else {
        window.location.href = "dashboard.html";
    }
});

// ─── Login Form Submit Button (#login-btn) ────────────────────────────────────
login_btn.addEventListener('click', async (e) => {
    e.preventDefault(); // prevents form submission / page reload

    const email = l_emailInput.value.trim();
    const password = l_passwordInput.value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert(error.message);
    } else {
        window.location.href = "dashboard.html";
    }
});

var signInWithGoogle = document.getElementById("signInWithGoogle")
signInWithGoogle.addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'http://127.0.0.1:5500/dashboard.html'
        }
    })

  if (error) {
    console.log("Google login error:", error.message);
  }
})

// ─── Auth State Listener ──────────────────────────────────────────────────────
// Only auto-redirects on INITIAL_SESSION if user is already logged in.
// SIGNED_IN redirect removed to avoid race conditions with the login button handler.
supabase.auth.onAuthStateChange((event, session) => {
    console.log(event, session);

    if (event === 'INITIAL_SESSION' && session) {
        // Already logged in — send to dashboard immediately
        window.location.href = "dashboard.html";
    }

    if (event === 'SIGNED_OUT') {
        console.log("User signed out");
    }
});
