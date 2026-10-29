(() => {
  'use strict';
  const owner = 'Yudhachenn';
  const repo = 'vezkio-studio';
  const repositoryUrl = `https://github.com/${owner}/${repo}`;
  const downloadButton = document.getElementById('download-button');
  const releaseMeta = document.getElementById('release-meta');
  const releasesUrl = `${repositoryUrl}/releases`;
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // The existing download button stays connected to real published GitHub Releases.
  async function checkRelease() {
    if (!downloadButton || !releaseMeta) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      let response;
      try {
        response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error(`Release unavailable (${response.status})`);
      const release = await response.json();
      if (release.draft || release.prerelease) throw new Error('No stable release yet');
      const installer = (release.assets || []).find(item =>
        typeof item.name === 'string' && /-setup\.exe$/i.test(item.name) &&
        typeof item.browser_download_url === 'string' &&
        /^https:\/\/github\.com\//i.test(item.browser_download_url)
      );
      if (!installer) throw new Error('No installer attached to release');
      downloadButton.href = installer.browser_download_url;
      downloadButton.removeAttribute('aria-disabled');
      downloadButton.classList.remove('download-disabled');
      downloadButton.innerHTML = '<span>↓</span> Download for Windows';
      releaseMeta.textContent = `Rilis terbaru ${release.tag_name} • ${installer.name} • via GitHub Releases`;
    } catch {
      downloadButton.href = releasesUrl;
      downloadButton.setAttribute('aria-disabled', 'true');
      downloadButton.classList.add('download-disabled');
      downloadButton.innerHTML = '<span>↗</span> Belum ada installer publik';
      releaseMeta.textContent = 'Belum ada rilis stabil. Installer akan tampil setelah release resmi diterbitkan.';
    }
  }

  // Product tour: independent, on-demand tabs. No autoplay and no costly background rendering.
  const tabs = [...document.querySelectorAll('.tour-tab')];
  const panels = [...document.querySelectorAll('.tour-panel')];
  const activateTab = (tab, moveFocus = false) => {
    if (!tab) return;
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) {
      const selected = panel.id === `panel-${tab.dataset.tab}`;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    }
    if (moveFocus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activateTab(tabs[nextIndex], true);
    });
  });

  // GitHub Pages is a static website: a form cannot directly create issues without
  // a server and credentials. Instead, visitors review and submit a prefilled Issue.
  const form = document.getElementById('feedback-form');
  const title = document.getElementById('feedback-title');
  const details = document.getElementById('feedback-details');
  const confirmation = document.getElementById('feedback-public');
  const counter = document.getElementById('feedback-count');
  const help = document.getElementById('feedback-help');
  if (form && title && details && confirmation && counter && help) {
    const updateCount = () => { counter.textContent = `${details.value.length} / ${details.maxLength}`; };
    details.addEventListener('input', () => { details.setCustomValidity(''); updateCount(); });
    title.addEventListener('input', () => title.setCustomValidity(''));
    confirmation.addEventListener('change', () => {
      help.classList.remove('is-error');
    });
    updateCount();
    form.addEventListener('submit', event => {
      event.preventDefault();
      help.classList.remove('is-error', 'is-ready');
      const subject = title.value.trim();
      const message = details.value.trim();
      title.setCustomValidity(subject.length >= 8 ? '' : 'Tuliskan judul minimal 8 karakter.');
      details.setCustomValidity(message.length >= 20 ? '' : 'Ceritakan detail minimal 20 karakter.');
      if (!form.reportValidity()) {
        help.textContent = 'Lengkapi judul, pesan, dan persetujuan publik terlebih dahulu.';
        help.classList.add('is-error');
        return;
      }
      const kind = form.querySelector('input[name="kind"]:checked')?.value || 'Feedback';
      const issueTitle = `[${kind}] ${subject}`;
      const issueBody = [
        '## Jenis feedback', kind,
        '', '## Penjelasan', message,
        '', '---', 'Dikirim melalui halaman Feedback VEZKIO Studio.',
        'Versi yang ditampilkan di situs: 1.2.x.',
        'Mohon jangan membagikan password, token, atau informasi pribadi.'
      ].join('\n');
      const url = new URL(`${repositoryUrl}/issues/new`);
      url.searchParams.set('title', issueTitle);
      url.searchParams.set('body', issueBody);
      help.textContent = 'Membuka GitHub... Periksa isi laporan, lalu klik "Submit new issue" di GitHub.';
      help.classList.add('is-ready');
      // Full navigation is intentionally user initiated; no automatic submission occurs.
      window.location.assign(url.toString());
    });
  }

  checkRelease();
})();
