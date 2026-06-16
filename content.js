(() => {
  const DIALOG_ID = 'overlay-perfect-dialog';
  const IMG_ID = 'overlay-perfect-img';

  function getOrCreateDialog() {
    let dialog = document.getElementById(DIALOG_ID);
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = DIALOG_ID;
    dialog.style.cssText = `
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      max-width: none;
      max-height: none;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      overflow: visible;
    `;

    const style = document.createElement('style');
    style.textContent = `
      #${DIALOG_ID}::backdrop { background: transparent; }
      #${IMG_ID} {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        display: block;
        pointer-events: none;
        user-select: none;
      }
      #${IMG_ID}.difference {
        filter: invert(1);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(dialog);
    dialog.addEventListener('cancel', e => e.preventDefault());

    return dialog;
  }

  function getOrCreateImg(dialog) {
    let img = document.getElementById(IMG_ID);
    if (!img) {
      img = document.createElement('img');
      img.id = IMG_ID;
      dialog.appendChild(img);
    }
    return img;
  }

  function openDialog(dialog) {
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  function showOverlay({ dataUrl, opacity, width, difference }) {
    const dialog = getOrCreateDialog();
    const img = getOrCreateImg(dialog);

    img.src = dataUrl;
    img.style.opacity = opacity;
    img.style.width = width + 'px';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.classList.toggle('difference', !!difference);

    openDialog(dialog);
  }

  function updateOverlay({ opacity, width, difference }) {
    const img = document.getElementById(IMG_ID);
    if (!img) return;
    if (opacity !== undefined) img.style.opacity = opacity;
    if (width !== undefined) img.style.width = width + 'px';
    if (difference !== undefined) img.classList.toggle('difference', difference);
  }

  function hideOverlay() {
    const img = document.getElementById(IMG_ID);
    if (img) img.style.visibility = 'hidden';
    const dialog = document.getElementById(DIALOG_ID);
    if (dialog && dialog.open) dialog.close();
  }

  function bringToTop() {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) return;
    const img = document.getElementById(IMG_ID);
    if (!img || !img.src) return;
    if (!dialog.contains(img)) dialog.appendChild(img);
    img.style.display = 'block';
    img.style.visibility = 'visible';
    openDialog(dialog);
  }

  // On load: if page already has an open modal, put our dialog on top of it
  function initOnPageLoad() {
    const siteModal = document.querySelector('dialog[open]');
    if (!siteModal) return;

    // We only do this if we already have an image loaded
    chrome.storage.local.get(['dataUrl', 'opacity', 'width'], ({ dataUrl, opacity, width }) => {
      if (!dataUrl) return;
      const dialog = getOrCreateDialog();
      const img = getOrCreateImg(dialog);
      img.src = dataUrl;
      img.style.opacity = (opacity ?? 50) / 100;
      img.style.width = (width ?? 1280) + 'px';
      img.style.height = 'auto';
      img.style.display = 'block';
      openDialog(dialog);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnPageLoad);
  } else {
    initOnPageLoad();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'showOverlay') showOverlay(msg);
    if (msg.action === 'updateOverlay') updateOverlay(msg);
    if (msg.action === 'hideOverlay') hideOverlay();
    if (msg.action === 'bringToTop') bringToTop();
  });
})();
