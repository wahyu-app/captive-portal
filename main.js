const byId = (id) => document.getElementById(id);
const signInForm = byId('sign-in-form');
const passwordForm = byId('password-form');
const title = byId('portal-title');
const subtitle = byId('portal-subtitle');
const supportDialog = byId('support-dialog');
const states = {
  signin: {
    title: 'Sign in to Wi-Fi',
    subtitle: 'Use your work account to connect.',
  },
  failed: {
    title: 'Unable to sign in',
    subtitle: 'Check your credentials and try again.',
  },
  expired: {
    title: 'Update your password',
    subtitle: 'Your password has expired. Update it to continue using the Wi-Fi network.',
  },
  connected: {
    title: 'You’re connected',
    subtitle: 'Your work internet access is ready.\nHave a productive day!',
  },
};

function show(element, visible, display = 'flex') {
  element.classList.toggle('hidden', !visible);
  element.classList.toggle(display, visible);
}

function clearError(input) {
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  const error = byId(`${input.id}-error`);
  error.textContent = '';
  show(error, false, 'block');
}

function setError(input, message) {
  const error = byId(`${input.id}-error`);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', error.id);
  error.textContent = message;
  show(error, true, 'block');
}

function validate(form) {
  const inputs = [...form.querySelectorAll('input')];
  let firstInvalid;
  for (const input of inputs) {
    clearError(input);
    let message = '';
    if (!input.value.trim()) {
      message = input.type === 'email' ? 'Enter your work email.' : 'Enter your password.';
    } else if (input.type === 'email' && !input.validity.valid) {
      message = 'Enter a valid work email address.';
    }
    if (message) {
      setError(input, message);
      firstInvalid ??= input;
    }
  }
  if (form === passwordForm && byId('confirm-password').value &&
      byId('confirm-password').value !== byId('new-password').value) {
    setError(byId('confirm-password'), 'Your new passwords don’t match. Please try again.');
    firstInvalid ??= byId('confirm-password');
  }
  if (firstInvalid) {
    firstInvalid.focus();
    byId('announcer').textContent = 'Please check the highlighted fields.';
    return false;
  }
  return true;
}

function resetPasswordVisibility() {
  document.querySelectorAll('[data-toggle]').forEach((button) => {
    byId(button.dataset.toggle).type = 'password';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', button.dataset.label);
    button.querySelector('use').setAttribute('href', './assets/icons.svg#eye-off');
  });
}

function renderState(state, { focus = false, updateUrl = true } = {}) {
  if (!Object.hasOwn(states, state)) state = 'signin';
  const connected = state === 'connected';
  const failed = state === 'failed';
  const expired = state === 'expired';
  const { title: heading, subtitle: description } = states[state];
  document.querySelectorAll('input').forEach(clearError);
  resetPasswordVisibility();
  passwordForm.reset();
  byId('password').value = '';
  title.textContent = heading;
  subtitle.textContent = description;
  subtitle.classList.toggle('whitespace-pre-line', connected);
  subtitle.classList.toggle('leading-[1.6]', connected || expired);
  subtitle.classList.toggle('leading-[1.23077]', !connected && !expired);
  subtitle.classList.toggle('max-sm:leading-[1.45]', !connected && !expired);
  byId('portal').dataset.state = state;
  byId('portal-header').classList.toggle('gap-6', connected);
  byId('portal-header').classList.toggle('gap-2.5', !connected);
  byId('portal-heading').classList.toggle('contents', !connected);
  byId('portal-heading').classList.toggle('flex', connected);
  byId('portal-heading').classList.toggle('flex-col', connected);
  byId('portal-heading').classList.toggle('gap-2.5', connected);
  show(byId('connected-badge'), connected);
  show(byId('failure-notice'), failed);
  show(byId('expired-notice'), expired);
  show(byId('network-details'), connected);
  show(byId('success-notice'), false, 'block');
  show(signInForm, !connected && !expired);
  show(passwordForm, expired);
  byId('connect-button').textContent = failed ? 'Try again' : 'Connect';
  byId('password').placeholder = failed ? 'Your password' : 'Enter password';
  if (failed) {
    signInForm.setAttribute('aria-describedby', 'failure-description');
  } else {
    signInForm.removeAttribute('aria-describedby');
  }
  if (connected) signInForm.reset();
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (state === 'signin') url.searchParams.delete('state');
    else url.searchParams.set('state', state);
    window.history.replaceState(null, '', url);
  }
  document.title = `${heading} · PERKOM Wi-Fi`;
  if (focus) {
    (failed ? byId('password') : title).focus();
    byId('announcer').textContent = `${heading}. ${description}`;
  }
}

document.querySelectorAll('[data-toggle]').forEach((button) => {
  button.dataset.label = button.getAttribute('aria-label');
  button.addEventListener('click', () => {
    const input = byId(button.dataset.toggle);
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', button.dataset.label.replace('Show', visible ? 'Hide' : 'Show'));
    button.querySelector('use').setAttribute('href', `./assets/icons.svg#${visible ? 'eye' : 'eye-off'}`);
  });
});

document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', () => clearError(input));
});

signInForm.addEventListener('submit', (event) => {
  event.preventDefault();
  byId('email').value = byId('email').value.trim();
  if (!validate(signInForm)) return;

  // Reserved values select the local demo scenarios; no authentication request is sent.
  const password = byId('password').value;
  const nextState = password === 'incorrect' ? 'failed' : password === 'expired' ? 'expired' : 'connected';
  renderState(nextState, { focus: true });
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validate(passwordForm)) return;
  renderState('signin', { focus: true });
  const notice = byId('success-notice');
  notice.textContent = 'Password updated. Sign in again using your new password.';
  show(notice, true, 'block');
});

byId('support-button').addEventListener('click', () => supportDialog.showModal());
byId('close-support').addEventListener('click', () => supportDialog.close());
byId('dismiss-support').addEventListener('click', () => supportDialog.close());
supportDialog.addEventListener('click', (event) => {
  if (event.target !== supportDialog) return;
  const bounds = supportDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) supportDialog.close();
});
supportDialog.addEventListener('close', () => byId('support-button').focus());
supportDialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const buttons = [...supportDialog.querySelectorAll('button:not([disabled])')];
  const first = buttons[0];
  const last = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function readState() {
  return new URLSearchParams(window.location.search).get('state') || 'signin';
}

window.addEventListener('popstate', () => renderState(readState(), { focus: true, updateUrl: false }));
renderState(readState(), { updateUrl: false });
