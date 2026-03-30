(function () {
  const form = document.getElementById('asset-form');
  const messageEl = document.getElementById('message');
  const submitBtn = document.getElementById('submit-btn');
  const modelSelect = document.getElementById('modelId');
  const modelsPill = document.getElementById('models-pill');

  // Check authentication first (JWT)
  async function checkAuth() {
    try {
      const token = localStorage.getItem('hte-jwt-token');
      if (!token) {
        window.location.href = '/login.html';
        return false;
      }
      
      const res = await fetch('/api/auth', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      
      if (!data.authenticated) {
        localStorage.removeItem('hte-jwt-token');
        window.location.href = '/login.html';
        return false;
      }
      return true;
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('hte-jwt-token');
      window.location.href = '/login.html';
      return false;
    }
  }

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
    submitBtn.disabled = isBusy;
    submitBtn.dataset.busy = isBusy ? 'true' : 'false';
  }

  function setModelsPill(state, text) {
    if (!modelsPill) return;
    modelsPill.dataset.state = state;
    modelsPill.textContent = text;
  }

  // Autocomplete functionality
  function createAutocomplete(input, apiUrl) {
    let currentTimeout;
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(dropdown);

    input.addEventListener('input', function() {
      const value = this.value.trim();
      
      clearTimeout(currentTimeout);
      dropdown.style.display = 'none';
      
      if (value.length < 2) {
        return;
      }
      
      currentTimeout = setTimeout(async () => {
        try {
          const token = localStorage.getItem('hte-jwt-token');
          const res = await fetch(apiUrl + '?q=' + encodeURIComponent(value), {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const suggestions = await res.json();
          
          if (suggestions.length === 0) {
            dropdown.style.display = 'none';
            return;
          }
          
          dropdown.innerHTML = '';
          suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = suggestion;
            item.addEventListener('click', function() {
              input.value = suggestion;
              dropdown.style.display = 'none';
              input.focus();
            });
            dropdown.appendChild(item);
          });
          
          dropdown.style.display = 'block';
        } catch (err) {
          console.error('Autocomplete error:', err);
        }
      }, 300);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Hide dropdown on Escape key
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });
  }

  async function loadModels() {
    try {
      setModelsPill('loading', 'Loading models…');
      const token = localStorage.getItem('hte-jwt-token');
      const res = await fetch('/api/models', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        var msg = data.detail || data.error || ('HTTP ' + res.status);
        throw new Error(msg);
      }
      var models = Array.isArray(data) ? data : [];
      models.forEach(function (m) {
        const opt = document.createElement('option');
        opt.value = m.model_id;
        opt.textContent = m.model_name;
        modelSelect.appendChild(opt);
      });
      setModelsPill('ok', 'Models ready');
    } catch (err) {
      setModelsPill('error', 'Models failed');
      showMessage('Could not load compressor models. ' + (err.message || String(err)), 'error');
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessage();

    const customerName = document.getElementById('customerName').value.trim();
    const modelId = document.getElementById('modelId').value;
    const locationTag = document.getElementById('locationTag').value.trim();
    const serialNumber = document.getElementById('serialNumber').value.trim();

    if (!customerName || !modelId || !locationTag || !serialNumber) {
      showMessage('All fields are required.', 'error');
      return;
    }

    setBusy(true);

    try {
      const token = localStorage.getItem('hte-jwt-token');
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          customerName,
          modelId: Number(modelId),
          locationTag,
          serialNumber
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('hte-jwt-token');
          window.location.href = '/login.html';
          return;
        }
        showMessage(data.error || 'Failed to add asset.', 'error');
        return;
      }

      if (data.duplicate) {
        showMessage(
          'Serial number "' + serialNumber + '" already exists (Asset ID: ' + data.assetId + ')',
          'error'
        );
        // Clear the serial number field for easy re-entry
        document.getElementById('serialNumber').value = '';
        document.getElementById('serialNumber').focus();
      } else {
        showMessage(
          'Asset added successfully. Asset ID: ' + data.assetId,
          'success'
        );
        form.reset();
        document.getElementById('modelId').focus();
      }
    } catch (err) {
      showMessage('Network error: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  });

  // Initialize app
  async function init() {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
      loadModels();
      // Initialize autocomplete for input fields
      createAutocomplete(document.getElementById('customerName'), '/api/customers/search');
      createAutocomplete(document.getElementById('locationTag'), '/api/locations/search');
      createAutocomplete(document.getElementById('serialNumber'), '/api/serial-numbers/search');
      
      // Add logout functionality
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
          try {
            const token = localStorage.getItem('hte-jwt-token');
            const res = await fetch('/api/logout', { 
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            localStorage.removeItem('hte-jwt-token');
            window.location.href = '/login.html';
          } catch (err) {
            console.error('Logout error:', err);
            localStorage.removeItem('hte-jwt-token');
            window.location.href = '/login.html';
          }
        });
      }
    }
  }

  init();
})();
