document.addEventListener('DOMContentLoaded', function () {

  // ---------- Local Storage Keys (Fallback & Offline Sync) ----------
  const USERS_STORAGE_KEY = 'ojas_registered_users';
  const CURRENT_USER_KEY = 'ojas_logged_in_user';

  // Local storage helpers
  function getStoredUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUserToStorage(newUser) {
    const users = getStoredUsers();
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  function getLoggedInUser() {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setLoggedInUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function clearLoggedInUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // ---------- DOM Elements ----------
  const modal = document.getElementById('registerModal');
  const modalTabTrial = document.getElementById('modalTabTrial');
  const modalTabLogin = document.getElementById('modalTabLogin');
  const modalEyebrow = document.getElementById('modalEyebrow');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('registerForm');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const closeBtn = document.getElementById('closeRegisterModal');
  const toast = document.getElementById('successToast');

  // Field wrappers
  const fieldNameGroup = document.getElementById('fieldNameGroup');
  const fieldPhoneGroup = document.getElementById('fieldPhoneGroup');
  const fieldEmailGroup = document.getElementById('fieldEmailGroup');
  const fieldPasswordGroup = document.getElementById('fieldPasswordGroup');
  const fieldLoginAccountGroup = document.getElementById('fieldLoginAccountGroup');
  const forgotRow = document.getElementById('forgotRow');

  const countrySelects = document.querySelectorAll('.country-select');

  let currentTab = 'trial'; // 'trial' or 'login'
  let toastTimer = null;

  // ---------- Update Navbar State (Logged In vs Logged Out) ----------
  function updateNavUI() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    const loggedUser = getLoggedInUser();
    let existingCta = document.getElementById('openRegisterModal');
    let existingUserNav = document.getElementById('userNavContainer');

    if (loggedUser) {
      if (existingCta) existingCta.style.display = 'none';

      if (!existingUserNav) {
        existingUserNav = document.createElement('div');
        existingUserNav.id = 'userNavContainer';
        existingUserNav.className = 'user-profile-nav';
        navRight.appendChild(existingUserNav);
      }

      existingUserNav.style.display = 'flex';
      existingUserNav.innerHTML = `
        <span class="user-greeting">👋 Hi, <strong>${escapeHtml(loggedUser.name)}</strong></span>
        <button type="button" class="nav-logout-btn" id="navLogoutBtn">Logout</button>
      `;

      const logoutBtn = document.getElementById('navLogoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = function () {
          clearLoggedInUser();
          updateNavUI();
          showToast('👋 You have logged out successfully. You can log back in anytime!');
        };
      }
    } else {
      if (existingUserNav) existingUserNav.style.display = 'none';

      if (!existingCta) {
        existingCta = document.createElement('button');
        existingCta.type = 'button';
        existingCta.className = 'nav-cta';
        existingCta.id = 'openRegisterModal';
        existingCta.textContent = 'Login';
        navRight.appendChild(existingCta);
      }

      existingCta.style.display = 'inline-flex';
      existingCta.textContent = 'Login';
      existingCta.onclick = function () {
        openModal('login');
      };
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- Populate Country Codes from JSON ----------
  function loadCountryCodes() {
    fetch('countries.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load countries');
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        countrySelects.forEach(select => {
          select.innerHTML = '';
          data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = `${item.label || item.code}`;
            if (item.code === '+91') opt.selected = true;
            select.appendChild(opt);
          });
        });
      })
      .catch(err => {
        console.warn('Using default country codes fallback:', err);
      });
  }

  loadCountryCodes();
  updateNavUI();

  // ---------- Modal Tab Handler ----------
  function setTab(tabName) {
    currentTab = tabName;

    if (tabName === 'trial') {
      if (modalTabTrial) modalTabTrial.classList.add('active');
      if (modalTabLogin) modalTabLogin.classList.remove('active');

      if (modalEyebrow) modalEyebrow.textContent = '14 DAYS ONLINE | FREE YOGA';
      if (modalTitle) modalTitle.innerHTML = 'Start your free<br>journey today';
      if (modalSubmitBtn) modalSubmitBtn.textContent = 'REGISTER NOW FOR FREE';

      // Show trial fields, hide login-only fields
      if (fieldNameGroup) fieldNameGroup.style.display = 'grid';
      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'grid';
      if (fieldEmailGroup) fieldEmailGroup.style.display = 'grid';
      if (fieldPasswordGroup) fieldPasswordGroup.style.display = 'grid';
      if (fieldLoginAccountGroup) fieldLoginAccountGroup.style.display = 'none';
      if (forgotRow) forgotRow.style.display = 'none';

    } else if (tabName === 'login') {
      if (modalTabLogin) modalTabLogin.classList.add('active');
      if (modalTabTrial) modalTabTrial.classList.remove('active');

      if (modalEyebrow) modalEyebrow.textContent = 'WELCOME BACK TO OJAS';
      if (modalTitle) modalTitle.innerHTML = 'Login to your<br>account';
      if (modalSubmitBtn) modalSubmitBtn.textContent = 'LOGIN TO YOUR ACCOUNT';

      // Show login fields, hide registration-only fields
      if (fieldNameGroup) fieldNameGroup.style.display = 'none';
      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'none';
      if (fieldEmailGroup) fieldEmailGroup.style.display = 'none';
      if (fieldLoginAccountGroup) fieldLoginAccountGroup.style.display = 'grid';
      if (fieldPasswordGroup) fieldPasswordGroup.style.display = 'grid';
      if (forgotRow) forgotRow.style.display = 'flex';
    }
  }

  if (modalTabTrial) {
    modalTabTrial.addEventListener('click', function () {
      setTab('trial');
    });
  }

  if (modalTabLogin) {
    modalTabLogin.addEventListener('click', function () {
      setTab('login');
    });
  }

  // ---------- Modal Open / Close ----------
  function openModal(defaultTab = 'trial') {
    if (!modal) return;
    setTab(defaultTab);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    // Focus appropriate first field
    setTimeout(() => {
      if (defaultTab === 'trial') {
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        if (nameInput) nameInput.focus();
      } else {
        const accountInput = modalForm ? modalForm.querySelector('input[name="loginAccount"]') : null;
        if (accountInput) accountInput.focus();
      }
    }, 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    sessionStorage.setItem('ojas_popup_dismissed', 'true');
  }

  // ---------- Automatic 3-4 Sec Pop Up Trigger ----------
  setTimeout(function () {
    const isDismissed = sessionStorage.getItem('ojas_popup_dismissed') === 'true';
    const isLogged = getLoggedInUser();

    if (!isLogged && !isDismissed && modal && !modal.classList.contains('active')) {
      openModal('trial');
    }
  }, 3500);

  // ---------- Trigger Buttons Binding ----------
  const openLoginBtn = document.getElementById('openRegisterModal');
  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', function () {
      openModal('login');
    });
  }

  const heroStartBtn = document.getElementById('heroStartBtn');
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', function () {
      const loggedUser = getLoggedInUser();
      if (loggedUser) {
        showToast('🧘 Welcome back, ' + loggedUser.name + '! Ready for today\'s practice.');
      } else {
        openModal('trial');
      }
    });
  }

  document.querySelectorAll('.session-item-cta, .pricing-cta').forEach(btn => {
    btn.addEventListener('click', function () {
      const loggedUser = getLoggedInUser();
      if (loggedUser) {
        showToast('✨ Starting practice session for ' + loggedUser.name);
      } else {
        openModal('trial');
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // ---------- Toast Notification ----------
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 4000);
  }

  // ---------- Form Submission (Supports both XAMPP PHP API & Local Storage) ----------
  if (modalForm) {
    modalForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (currentTab === 'trial') {
        // --- REGISTRATION ---
        const nameInput = modalForm.querySelector('input[name="name"]');
        const phoneInput = modalForm.querySelector('input[name="phone"]');
        const emailInput = modalForm.querySelector('input[name="email"]');
        const countrySelect = modalForm.querySelector('select[name="countryCode"]');
        const passwordInput = modalForm.querySelector('input[name="password"]');

        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const countryCode = countrySelect ? countrySelect.value : '+91';
        const password = passwordInput ? passwordInput.value.trim() : '123456';

        if (!name) {
          showToast('⚠️ Please enter your name.');
          if (nameInput) nameInput.focus();
          return;
        }

        if (!phone || phone.length < 6) {
          showToast('⚠️ Please enter a valid phone number.');
          if (phoneInput) phoneInput.focus();
          return;
        }

        const payload = { name, phone, countryCode, email, password };

        // Try PHP backend API first (if hosted on XAMPP)
        fetch('api.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json())
          .then(data => {
            console.log('API Register Response:', data);
            if (data.status === 'success' || data.status === 'exists') {
              setLoggedInUser(data.user);
              closeModal();
              updateNavUI();
              showToast(data.status === 'exists' ? `✨ Account recognized! Welcome back, ${data.user.name}.` : `🎉 Registered in database! Welcome, ${data.user.name}.`);
              modalForm.reset();
            } else {
              showToast('❌ ' + (data.message || 'Error saving user.'));
            }
          })
          .catch(() => {
            // Offline / Standalone Browser Fallback (Local Storage)
            const existingUsers = getStoredUsers();
            const found = existingUsers.find(u => u.phone === phone || (email && u.email === email));

            if (found) {
              setLoggedInUser(found);
              closeModal();
              updateNavUI();
              showToast(`✨ Account recognized! Welcome back, ${found.name}.`);
            } else {
              const newUser = { name, phone, countryCode, email, password };
              saveUserToStorage(newUser);
              setLoggedInUser(newUser);
              closeModal();
              updateNavUI();
              showToast(`🎉 Registration successful! Welcome to Ojas, ${name}.`);
            }
            modalForm.reset();
          });

      } else {
        // --- LOGIN TAB ---
        const accountInput = modalForm.querySelector('input[name="loginAccount"]');
        const passwordInput = modalForm.querySelector('input[name="password"]');

        const accountIdentifier = accountInput ? accountInput.value.trim() : '';
        const passwordEntered = passwordInput ? passwordInput.value.trim() : '';

        if (!accountIdentifier) {
          showToast('⚠️ Please enter your registered Phone Number or Email.');
          if (accountInput) accountInput.focus();
          return;
        }

        const payload = { loginAccount: accountIdentifier, password: passwordEntered };

        // Try PHP backend API first
        fetch('api.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json())
          .then(data => {
            console.log('API Login Response:', data);
            if (data.status === 'success') {
              setLoggedInUser(data.user);
              closeModal();
              updateNavUI();
              showToast(`✨ Welcome back, ${data.user.name}! Logged in successfully.`);
              modalForm.reset();
            } else if (data.status === 'not_found') {
              showToast('❌ Account not found. Switching to Register tab for you...');
              setTimeout(() => {
                setTab('trial');
                const nameIn = modalForm.querySelector('input[name="name"]');
                if (nameIn) nameIn.focus();
              }, 1200);
            } else {
              showToast('❌ ' + (data.message || 'Login failed. Check your password.'));
            }
          })
          .catch(() => {
            // Offline / Standalone Browser Fallback
            const existingUsers = getStoredUsers();
            const matchedUser = existingUsers.find(u => u.phone === accountIdentifier || u.email === accountIdentifier);

            if (!matchedUser) {
              showToast('❌ Account not found. Switching to Register tab...');
              setTimeout(() => {
                setTab('trial');
                const nameIn = modalForm.querySelector('input[name="name"]');
                if (nameIn) nameIn.focus();
              }, 1200);
            } else {
              setLoggedInUser(matchedUser);
              closeModal();
              updateNavUI();
              showToast(`✨ Welcome back, ${matchedUser.name}! Logged in successfully.`);
              modalForm.reset();
            }
          });
      }
    });
  }

});
