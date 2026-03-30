(function () {
  const form = document.getElementById('login-form');
  const messageEl = document.getElementById('message');
  const loginBtn = document.getElementById('login-btn');

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'toast ' + type;
    messageEl.hidden = false;

    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(function () {
      messageEl.hidden = true;
    }, 5200);
  }

  function hideMessage() {
    messageEl.hidden = true;
  }

  function setBusy(isBusy) {
    loginBtn.disabled = isBusy;
    loginBtn.dataset.busy = isBusy ? 'true' : 'false';
  }

  // Check if already authenticated
  async function checkAuth() {
    try {
      const token = localStorage.getItem('hte-token');
      if (!token) return false;
      
      const res = await fetch('/api/auth', {
        headers: { 'Authorization': token }
      });
      const data = await res.json();
      
      if (data.authenticated) {
        window.location.href = '/';
        return true;
      } else {
        localStorage.removeItem('hte-token');
        return false;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('hte-token');
      return false;
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessage();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showMessage('Username and password are required.', 'error');
      return;
    }

    setBusy(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || 'Login failed.', 'error');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('hte-token', data.token);
      
      showMessage('Login successful! Redirecting...', 'success');
      
      // Redirect to main app after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (err) {
      showMessage('Network error: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  });

  // Check authentication on page load
  checkAuth();
})();
