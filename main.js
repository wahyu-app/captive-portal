const byId = (id) => document.getElementById(id);
const signInForm = byId('sign-in-form');
const passwordForm = byId('password-form');
const title = byId('portal-title');
const subtitle = byId('portal-subtitle');
const supportDialog = byId('support-dialog');
let pendingAction = null;
let copyFeedbackTimer = null;
let copyRequest = 0;
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
const demoAccounts = setupDemoAccounts();

function setupDemoAccounts() {
  const popup = byId('demo-accounts');
  const inputs = [byId('email'), byId('password')];
  const options = [...popup.querySelectorAll('[data-demo-account]')];
  const passwords = { success: 'Demo123!', incorrect: 'incorrect', expired: 'expired' };
  let anchor = null;
  let suppressFocus = false;
  const isOpen = () => popup.matches(':popover-open');

  function close({ restoreFocus = false } = {}) {
    const previousAnchor = anchor;
    anchor = null;
    suppressFocus = true;
    if (isOpen()) popup.hidePopover();
    if (restoreFocus) previousAnchor?.focus({ preventScroll: true });
    suppressFocus = false;
  }

  function position() {
    if (!anchor || !isOpen()) return;
    const bounds = anchor.closest('.input-shell').getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewLeft = viewport?.offsetLeft || 0;
    const viewTop = viewport?.offsetTop || 0;
    const viewWidth = viewport?.width || document.documentElement.clientWidth;
    const viewHeight = viewport?.height || window.innerHeight;
    const padding = 8;
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
    const width = Math.min(bounds.width, viewWidth - padding * 2);
    const left = Math.max(viewLeft + padding, Math.min(bounds.left, viewLeft + viewWidth - padding - width));

    // Viewport coordinates keep the top-layer popup aligned during scrolling and keyboard resizing.
    popup.style.setProperty('--demo-width', `${width}px`);
    const naturalHeight = popup.scrollHeight;
    const below = Math.max(0, viewTop + viewHeight - padding - bounds.bottom - gap);
    const above = Math.max(0, bounds.top - gap - viewTop - padding);
    const useBelow = below >= naturalHeight || below >= above;
    const available = Math.max(1, Math.min(viewHeight - padding * 2, useBelow ? below : above));
    const height = Math.min(naturalHeight, available);
    const preferredTop = useBelow ? bounds.bottom + gap : bounds.top - gap - height;
    const top = Math.max(viewTop + padding, Math.min(preferredTop, viewTop + viewHeight - padding - height));
    popup.style.setProperty('--demo-left', `${left}px`);
    popup.style.setProperty('--demo-top', `${top}px`);
    popup.style.setProperty('--demo-height', `${available}px`);
  }

  function open(input) {
    if (pendingAction || suppressFocus || signInForm.classList.contains('hidden')) return;
    anchor = input;
    if (!isOpen()) popup.showPopover();
    position();
  }

  inputs.forEach((input) => {
    input.addEventListener('focus', () => open(input));
    input.addEventListener('click', () => open(input));
    input.addEventListener('input', () => close());
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open(input);
        (event.key === 'ArrowDown' ? options[0] : options.at(-1)).focus();
      } else if (event.key === 'Tab' && isOpen()) {
        close();
      }
    });
  });

  options.forEach((button, index) => {
    button.addEventListener('click', () => {
      inputs[0].value = 'demo@perkom.test';
      inputs[1].value = passwords[button.dataset.demoAccount];
      clearSignInFeedback();
      inputs.forEach(clearError);
      resetPasswordVisibility();
      close();
      byId('connect-button').focus();
      byId('announcer').textContent = `${button.textContent.trim()} demo account filled. Press ${byId('connect-button').textContent} to continue.`;
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        options[(index + step + options.length) % options.length].focus();
      } else if (event.key === 'Tab' && event.shiftKey && index === 0) {
        event.preventDefault();
        close({ restoreFocus: true });
      } else if (event.key === 'Tab' && !event.shiftKey && index === options.length - 1) {
        event.preventDefault();
        const next = anchor === inputs[0] ? inputs[1] : byId('connect-button');
        close();
        next.focus();
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (isOpen() && !inputs.includes(event.target) && !popup.contains(event.target)) close();
  });
  document.addEventListener('focusin', (event) => {
    if (isOpen() && !inputs.includes(event.target) && !popup.contains(event.target)) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      close({ restoreFocus: true });
    }
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', (event) => {
    if (!popup.contains(event.target)) position();
  }, true);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);

  return {
    close,
    focusInput(input) {
      suppressFocus = true;
      input.focus();
      suppressFocus = false;
    },
  };
}

function show(element, visible, display = 'flex') {
  element.classList.toggle('hidden', !visible);
  element.classList.toggle(display, visible);
}

function clearSignInFeedback() {
  const failed = byId('portal').dataset.state === 'failed';
  const notice = byId('success-notice');
  if (!failed && notice.classList.contains('hidden')) return;

  show(byId('failure-notice'), false);
  show(notice, false);
  byId('success-message').textContent = '';
  byId('announcer').textContent = '';

  // Restore the sign-in presentation without resetting fields or moving focus.
  if (failed) {
    byId('portal').dataset.state = 'signin';
    title.textContent = states.signin.title;
    subtitle.textContent = states.signin.subtitle;
    byId('connect-button').textContent = 'Connect';
    byId('password').placeholder = 'Enter password';
    signInForm.removeAttribute('aria-describedby');
    const url = new URL(window.location.href);
    url.searchParams.delete('state');
    window.history.replaceState(null, '', url);
    document.title = `${states.signin.title} · PERKOM Wi-Fi`;
  }
}

function cancelPendingAction() {
  if (!pendingAction) return;
  const action = pendingAction;
  pendingAction = null;
  clearTimeout(action.timer);
  action.controls.forEach(({ control, disabled }) => { control.disabled = disabled; });
  action.button.textContent = action.label;
  byId('portal').removeAttribute('aria-busy');
}

function runDemoAction(button, label, complete) {
  if (pendingAction) return;
  demoAccounts.close();
  const action = {
    button,
    label: button.textContent,
    controls: [...byId('portal').querySelectorAll('input, button')].map(control => ({ control, disabled: control.disabled })),
    timer: null,
  };
  pendingAction = action;
  action.controls.forEach(({ control }) => { control.disabled = true; });
  button.textContent = label;
  byId('portal').setAttribute('aria-busy', 'true');
  byId('announcer').textContent = label;
  action.timer = setTimeout(() => {
    if (pendingAction !== action) return;
    // Restore controls before rendering so the destination field can receive focus.
    cancelPendingAction();
    complete();
  }, 1000);
}

function clearError(input) {
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  const error = byId(`${input.id}-error`);
  error.textContent = '';
  delete error.dataset.validity;
  show(error, false, 'block');
}

function setError(input, message) {
  const error = byId(`${input.id}-error`);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', error.id);
  error.dataset.validity = 'error';
  if (error.textContent !== message) error.textContent = message;
  show(error, true, 'block');
}

function updatePasswordMatch() {
  const password = byId('new-password').value;
  const confirmation = byId('confirm-password');
  if (!password || !confirmation.value) {
    clearError(confirmation);
    return;
  }
  if (password !== confirmation.value) {
    setError(confirmation, 'Passwords don’t match.');
    return;
  }
  const feedback = byId('confirm-password-error');
  confirmation.removeAttribute('aria-invalid');
  confirmation.setAttribute('aria-describedby', feedback.id);
  feedback.dataset.validity = 'success';
  if (feedback.textContent !== 'Passwords match.') feedback.textContent = 'Passwords match.';
  show(feedback, true, 'block');
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
    setError(byId('confirm-password'), 'Passwords don’t match.');
    firstInvalid ??= byId('confirm-password');
  }
  if (firstInvalid) {
    firstInvalid.focus();
    byId('announcer').textContent = 'Please check the highlighted fields.';
    return false;
  }
  if (form === passwordForm) updatePasswordMatch();
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

function renderState(state, { focus = false, updateUrl = true, currentPassword = 'expired' } = {}) {
  cancelPendingAction();
  demoAccounts.close();
  if (!Object.hasOwn(states, state)) state = 'signin';
  const connected = state === 'connected';
  const failed = state === 'failed';
  const expired = state === 'expired';
  const { title: heading, subtitle: description } = states[state];
  document.querySelectorAll('input').forEach(clearError);
  resetPasswordVisibility();
  passwordForm.reset();
  if (expired) byId('current-password').value = currentPassword;
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
  show(byId('sign-out-button'), connected);
  show(byId('success-notice'), false);
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
    if (failed) demoAccounts.focusInput(byId('password'));
    else title.focus();
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
  input.addEventListener('input', () => {
    if (signInForm.contains(input)) clearSignInFeedback();
    if (input.id !== 'confirm-password') clearError(input);
    if (input.id === 'new-password' || input.id === 'confirm-password') updatePasswordMatch();
  });
});

signInForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (pendingAction) return;
  clearSignInFeedback();
  demoAccounts.close();
  byId('email').value = byId('email').value.trim();
  if (!validate(signInForm)) return;

  // Reserved values select the local demo scenarios; no authentication request is sent.
  const password = byId('password').value;
  const nextState = password === 'incorrect' ? 'failed' : password === 'expired' ? 'expired' : 'connected';
  runDemoAction(byId('connect-button'), 'Connecting…', () => {
    renderState(nextState, { focus: true, currentPassword: password });
  });
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (pendingAction) return;
  if (!validate(passwordForm)) return;
  runDemoAction(passwordForm.querySelector('[type="submit"]'), 'Saving…', () => {
    renderState('signin', { focus: true });
    const notice = byId('success-notice');
    byId('success-message').textContent = 'Password updated. Please sign in again.';
    show(notice, true);
  });
});

byId('sign-out-button').addEventListener('click', () => {
  runDemoAction(byId('sign-out-button'), 'Signing out…', () => {
    signInForm.reset();
    renderState('signin', { focus: true });
    const notice = byId('success-notice');
    byId('success-message').textContent = 'You’ve signed out.';
    show(notice, true);
  });
});

function clearSupportCopyFeedback() {
  delete byId('copy-support-email').dataset.copied;
  show(byId('copy-support-check'), false, 'block');
  byId('copy-support-label').textContent = 'Copy email';
  byId('support-copy-status').classList.remove('sr-only');
  byId('support-copy-status').textContent = '';
  show(byId('support-copy-status'), false, 'block');
}

function resetSupportCopy() {
  copyRequest += 1;
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = null;
  clearSupportCopyFeedback();
  byId('copy-support-email').disabled = false;
}

byId('copy-support-email').addEventListener('click', async () => {
  const button = byId('copy-support-email');
  if (button.disabled) return;
  const request = ++copyRequest;
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = null;
  clearSupportCopyFeedback();
  button.disabled = true;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(byId('support-email').textContent.trim());
    if (request !== copyRequest || !supportDialog.open) return;
    button.dataset.copied = 'true';
    byId('copy-support-label').textContent = 'Copied';
    show(byId('copy-support-check'), true, 'block');
    byId('support-copy-status').classList.add('sr-only');
    byId('support-copy-status').textContent = 'Email copied.';
    show(byId('support-copy-status'), true, 'block');
    copyFeedbackTimer = setTimeout(resetSupportCopy, 2000);
  } catch {
    if (request !== copyRequest || !supportDialog.open) return;
    byId('support-copy-status').textContent = 'Unable to copy. Select and copy the email manually.';
    show(byId('support-copy-status'), true, 'block');
  } finally {
    if (request === copyRequest) button.disabled = false;
  }
});

byId('support-button').addEventListener('click', () => {
  demoAccounts.close();
  resetSupportCopy();
  supportDialog.showModal();
});
byId('close-support').addEventListener('click', () => supportDialog.close());
byId('dismiss-support').addEventListener('click', () => supportDialog.close());
supportDialog.addEventListener('click', (event) => {
  if (event.target !== supportDialog) return;
  const bounds = supportDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) supportDialog.close();
});
supportDialog.addEventListener('close', () => {
  resetSupportCopy();
  byId('support-button').focus();
});
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
window.addEventListener('pagehide', () => {
  cancelPendingAction();
  resetSupportCopy();
});
renderState(readState(), { updateUrl: false });
