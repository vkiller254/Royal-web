/* =========================================
   script.js — Formspree-ready, Multi-form, Robust
   Drop-in replacement for your site
   ========================================= */

(() => {
  /* ======= Small helpers ======= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const isFormspree = url => {
    try { return new URL(url).hostname.includes('formspree.io'); } catch (e) { return false; }
  };

  /* ======= Toast area ======= */
  (function createToastArea(){
    if ($('.toast-area')) return;
    const area = document.createElement('div');
    area.className = 'toast-area';
    area.setAttribute('aria-live','polite');
    area.setAttribute('aria-atomic','true');
    document.body.appendChild(area);
    const style = document.createElement('style');
    style.textContent = `
      .toast-area{position:fixed;right:16px;top:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
      .toast{pointer-events:auto;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);transform:translateY(-8px);opacity:0;transition:all .22s}
      .toast.visible{transform:none;opacity:1}
      .toast.success{background:#e6ffef;color:#065f46}
      .toast.error{background:#fff1f2;color:#9f1239}
      .toast.info{background:#eff6ff;color:#1e3a8a}
      .form-status.info{color:#1e3a8a}.form-status.success{color:#065f46}.form-status.error{color:#9f1239}
      .btn-spinner{margin-left:8px}.highlight-glow{box-shadow:0 0 0 4px rgba(99,102,241,0.08)}
    `;
    document.head.appendChild(style);
  })();

  function showToast(msg, type='info', ms=3000){
    const a = document.querySelector('.toast-area');
    if (!a) return console.warn('No toast area');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    a.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('visible'));
    setTimeout(()=> { t.classList.remove('visible'); setTimeout(()=> t.remove(), 250); }, ms);
  }

  function setFormStatus(form, message, type='info'){
    let s = form.querySelector('.form-status');
    if (!s){ s = document.createElement('div'); s.className='form-status'; s.setAttribute('role','status'); s.style.marginTop='.6rem'; form.appendChild(s); }
    s.textContent = message; s.className = 'form-status ' + type;
  }

  /* ======= Smooth scroll (keeps your existing behavior) ======= */
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const headerOffset = 80;
    const pos = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0,pos), behavior: 'smooth' });
    target.classList.add('highlight-glow'); setTimeout(()=> target.classList.remove('highlight-glow'), 1000);
  }));

  /* ======= Form selection: handle all forms that:
        - have data-send OR
        - have action host containing formspree.io OR
        - have id bookingForm OR quickMessageForm (backwards compat)
  ======= */
  const forms = Array.from(document.querySelectorAll('form')).filter(f => {
    const action = (f.getAttribute('action') || '').trim();
    return f.hasAttribute('data-send') || isFormspree(action) || f.id === 'bookingForm' || f.id === 'quickMessageForm';
  });

  if (!forms.length) return;

  /* ======= Main handler for each form ======= */
  forms.forEach(form => {
    // default required fields (used unless form sets data-required)
    const defaultRequired = ['name','email','phone','business','description','category','deadline'];
    const dataReq = (form.getAttribute('data-required') || '').trim();
    const requiredFields = dataReq ? dataReq.split(',').map(s=>s.trim()).filter(Boolean) : defaultRequired;

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRx = /^[\d+\-().\s]{6,20}$/;

    // ensure submit button
    let submitBtn = form.querySelector('[type="submit"]');
    if (!submitBtn) { submitBtn = document.createElement('button'); submitBtn.type='submit'; submitBtn.textContent='Submit'; form.appendChild(submitBtn); }

    // spinner
    let spinner = submitBtn.querySelector('.btn-spinner');
    if (!spinner){ spinner = document.createElement('span'); spinner.className='btn-spinner'; spinner.setAttribute('aria-hidden','true'); spinner.style.display='none'; spinner.textContent='⏳'; submitBtn.appendChild(spinner); }

    let sending = false;
    const controllers = [];

    form.addEventListener('submit', async function handler(e){
      e.preventDefault();
      if (sending) return;

      // Build value map — prefer name, else id
      const values = {};
      // include all form controls with name or id (inputs, textareas, selects)
      const controls = Array.from(form.querySelectorAll('input, textarea, select')).filter(el => el.type !== 'submit' && el.type !== 'button');
      controls.forEach(el => {
        const key = el.name && el.name.trim() ? el.name.trim() : (el.id && el.id.trim() ? el.id.trim() : null);
        if (!key) return;
        if (el.type === 'checkbox') {
          values[key] = values[key] || [];
          if (el.checked) values[key].push(el.value);
        } else if (el.type === 'radio') {
          if (el.checked) values[key] = el.value;
        } else {
          values[key] = el.value != null ? (el.value+'').trim() : '';
        }
      });

      // Validate required fields (map required fields to either name or id present)
      const missing = requiredFields.filter(k => {
        // if form has an element with name=k or id=k
        const elByName = form.querySelector(`[name="${k}"]`);
        const elById = form.querySelector('#' + k);
        const keyPresent = elByName || elById;
        if (!keyPresent) return false; // if field not present in this form, don't mark missing
        const key = elByName ? elByName.name : elById.id;
        const val = values[key];
        // empty string or empty array => missing
        if (val == null) return true;
        if (Array.isArray(val)) return val.length === 0;
        return (val + '').trim().length === 0;
      });

      if (missing.length) {
        const pretty = missing.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
        showToast(`Please fill required: ${pretty}`, 'error', 3500);
        setFormStatus(form, `Missing: ${pretty}`, 'error');
        const firstMissingEl = form.querySelector(`[name="${missing[0]}"]`) || form.querySelector('#' + missing[0]);
        if (firstMissingEl) firstMissingEl.focus();
        return;
      }

      // basic email/phone validation (only if present)
      const emailKey = Object.keys(values).find(k => k.toLowerCase() === 'email');
      if (emailKey && values[emailKey] && !emailRx.test(values[emailKey])) {
        showToast('Please enter a valid email address', 'error');
        setFormStatus(form, 'Invalid email', 'error');
        form.querySelector(`#${emailKey}`)?.focus();
        return;
      }
      const phoneKey = Object.keys(values).find(k => k.toLowerCase() === 'phone');
      if (phoneKey && values[phoneKey] && !phoneRx.test(values[phoneKey])) {
        showToast('Please enter a valid phone number', 'error');
        setFormStatus(form, 'Invalid phone', 'error');
        form.querySelector(`#${phoneKey}`)?.focus();
        return;
      }

      // ready to send
      sending = true;
      submitBtn.disabled = true;
      spinner.style.display = 'inline-block';
      setFormStatus(form, 'Sending...', 'info');

      const hasFiles = !!form.querySelector('input[type="file"]');
      const explicitFormat = (form.getAttribute('data-format') || '').toLowerCase(); // 'json' or 'multipart'
      let useJson = false;
      if (hasFiles) useJson = false;
      else if (explicitFormat === 'json') useJson = true;
      else if (explicitFormat === 'multipart') useJson = false;
      else {
        const action = (form.getAttribute('action') || '').trim();
        useJson = isFormspree(action); // prefer JSON for Formspree
      }

      const controller = new AbortController();
      controllers.push(controller);
      const timeoutMs = Number(form.getAttribute('data-timeout')) || 20000;
      const timeoutId = setTimeout(()=> controller.abort(), timeoutMs);

      const action = (form.getAttribute('action') || '').trim();
      const method = (form.getAttribute('method') || 'POST').toUpperCase();

      try {
        if (!action){
          console.warn('No form action; logging data instead.');
          console.log('Form values:', values);
          showToast('No form action—data logged to console.', 'error', 5000);
          setFormStatus(form, 'No form action specified.', 'error');
        } else if (!window.fetch) {
          showToast('Legacy browser — performing native submit.', 'info', 3000);
          setFormStatus(form, 'Submitting (legacy)...', 'info');
          form.removeEventListener('submit', handler);
          form.submit();
        } else {
          let fetchOptions = { method, signal: controller.signal, headers: {} };
          if (useJson) {
            // Build object for JSON: ensure arrays remain arrays
            const payload = {};
            Object.keys(values).forEach(k => { payload[k] = values[k]; });
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(payload);
          } else {
            // Build FormData but ensure keys exist (use name or id)
            const fd = new FormData();
            // append all controls (prefer name, else id)
            controls.forEach(el => {
              const key = el.name && el.name.trim() ? el.name.trim() : (el.id && el.id.trim() ? el.id.trim() : null);
              if (!key) return;
              if (el.type === 'file') {
                // append files (possibly multiple)
                const files = el.files;
                if (!files) return;
                for (let i=0;i<files.length;i++) fd.append(key, files[i]);
              } else if (el.type === 'checkbox') {
                if (el.checked) fd.append(key, el.value);
              } else if (el.type === 'radio') {
                if (el.checked) fd.append(key, el.value);
              } else {
                fd.append(key, el.value || '');
              }
            });
            fetchOptions.body = fd;
            // do NOT set Content-Type — browser will set multipart boundary
          }

          const res = await fetch(action, fetchOptions);
          clearTimeout(timeoutId);

          console.info('Form response:', res.status, res.statusText, 'redirected=', res.redirected);

          let bodyText = null;
          try { bodyText = await res.text(); } catch (err) {}

          if (res.ok || res.redirected) {
            let successMsg = 'Submitted successfully!';
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json') && bodyText) {
              try {
                const parsed = JSON.parse(bodyText);
                if (parsed && (parsed.message || parsed.success)) successMsg = parsed.message || parsed.success;
              } catch (err) {}
            }
            showToast(successMsg, 'success', 3500);
            setFormStatus(form, 'Submitted — thank you!', 'success');
            form.reset();
          } else {
            const serverMsg = bodyText ? `Server response: ${bodyText}` : `${res.status} ${res.statusText}`;
            console.error('Server error:', serverMsg);
            showToast('Submission failed. Check console/network tab.', 'error', 5000);
            setFormStatus(form, `Submission failed: ${serverMsg}`, 'error');
          }
        }
      } catch (err) {
        console.error('Submit error:', err);
        if (err.name === 'AbortError') {
          showToast('Request timed out. Please try again.', 'error', 4000);
          setFormStatus(form, 'Request timed out', 'error');
        } else {
          showToast('Submission failed. See console for details.', 'error', 5000);
          setFormStatus(form, 'Submission failed. See console for details.', 'error');
        }
      } finally {
        sending = false;
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        const idx = controllers.indexOf(controller); if (idx > -1) controllers.splice(idx,1);
        clearTimeout(timeoutId);
      }
    }); // end submit handler
  }); // end forms.forEach

  /* ======= small UI extras: hamburger, reveal, slider (kept minimal) ======= */
  document.addEventListener('DOMContentLoaded', ()=> {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');
    if (hamburger && navLinks) {
      hamburger.setAttribute('aria-expanded','false');
      hamburger.addEventListener('click', ()=> {
        const open = hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('no-scroll', open);
      });
      navItems.forEach(link => link.addEventListener('click', ()=> {
        hamburger.classList.remove('active'); navLinks.classList.remove('active'); hamburger.setAttribute('aria-expanded','false'); document.body.classList.remove('no-scroll');
      }));
    }

    // reveal
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      const run = ()=> { const t = window.innerHeight * 0.85; reveals.forEach(el => el.classList.toggle('show', el.getBoundingClientRect().top < t)); };
      window.addEventListener('scroll', ()=> requestAnimationFrame(run), {passive:true});
      run();
    }

    // slider basic already in your HTML paths (kept minimal)
  });
})(); 
