(function() {
  // Prevent double loading
  if (window.AiraOSWidgetLoaded) return;
  window.AiraOSWidgetLoaded = true;

  // Find our script script tag
  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  const tenantId = scriptTag ? scriptTag.getAttribute('data-tenant-id') || 't-1' : 't-1';
  const title = scriptTag ? scriptTag.getAttribute('data-title') || 'AI Assistant' : 'AI Assistant';
  const color = scriptTag ? scriptTag.getAttribute('data-color') || '#0ea5e9' : '#0ea5e9';
  const position = scriptTag ? scriptTag.getAttribute('data-position') || 'right' : 'right';
  const mode = scriptTag ? scriptTag.getAttribute('data-mode') || 'hybrid' : 'hybrid';

  // Create widget container & launcher styles
  const style = document.createElement('style');
  style.innerHTML = `
    .airaos-widget-launcher {
      position: fixed;
      bottom: 24px;
      ${position}: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${color};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .airaos-widget-launcher:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }
    .airaos-widget-launcher:active {
      transform: scale(0.95);
    }
    .airaos-widget-container {
      position: fixed;
      bottom: 96px;
      ${position}: 24px;
      width: 380px;
      height: 600px;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
      z-index: 999998;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      border: 1px solid rgba(255,255,255,0.08);
      background: #090f1d;
    }
    .airaos-widget-container.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .airaos-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    @media (max-width: 480px) {
      .airaos-widget-container {
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 0 !important;
      }
      .airaos-widget-launcher.open {
        bottom: 20px !important;
        ${position}: 20px !important;
        width: 44px !important;
        height: 44px !important;
        z-index: 9999999 !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Determine site base path
  const scriptUrl = scriptTag ? scriptTag.src : '';
  const urlParts = scriptUrl.split('/');
  const baseDomain = urlParts[0] + '//' + urlParts[2]; // e.g., http://localhost:3001 or http://vps-ip:3001

  // Create launcher button
  const launcher = document.createElement('div');
  launcher.className = 'airaos-widget-launcher';
  launcher.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s ease;">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  document.body.appendChild(launcher);

  // Create iframe container
  const container = document.createElement('div');
  container.className = 'airaos-widget-container';
  
  const iframeSrc = `${baseDomain}/widget-chat.html?tenantId=${encodeURIComponent(tenantId)}&color=${encodeURIComponent(color)}&title=${encodeURIComponent(title)}&mode=${encodeURIComponent(mode)}`;
  container.innerHTML = `
    <iframe class="airaos-widget-iframe" src="${iframeSrc}" allow="microphone"></iframe>
  `;
  document.body.appendChild(container);

  // Toggle widget state
  let isOpen = false;
  
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      container.classList.add('open');
      launcher.classList.add('open');
      launcher.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(90deg);">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      container.classList.remove('open');
      launcher.classList.remove('open');
      launcher.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  }

  launcher.addEventListener('click', toggleWidget);

  // Listen for close instructions from inside iframe (e.g. mobile closing)
  window.addEventListener('message', function(event) {
    if (event.data === 'airaos-widget-close') {
      if (isOpen) toggleWidget();
    }
  });
})();
