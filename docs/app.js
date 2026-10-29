(() => {
  const owner = 'Yudhachenn';
  const repo = 'vezkio-studio';
  const downloadButton = document.getElementById('download-button');
  const releaseMeta = document.getElementById('release-meta');
  const releasesUrl = `https://github.com/${owner}/${repo}/releases`;
  document.getElementById('year').textContent = String(new Date().getFullYear());
  async function checkRelease() {
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
  checkRelease();
})();
