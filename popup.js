const fileInput = document.getElementById('file-input');
const preview = document.getElementById('preview');
const opacitySlider = document.getElementById('opacity');
const opacityVal = document.getElementById('opacity-val');
const widthSlider = document.getElementById('width');
const widthNum = document.getElementById('width-num');
const differenceToggle = document.getElementById('difference');
const btnResetWidth = document.getElementById('btn-reset-width');
const btnShow = document.getElementById('btn-show');

let naturalWidth = null;
const btnTop = document.getElementById('btn-top');
const btnHide = document.getElementById('btn-hide');

let currentDataUrl = null;

function setWidth(val) {
  val = Math.max(100, Math.min(2560, parseInt(val) || 100));
  widthSlider.value = val;
  widthNum.value = val;
  return val;
}

chrome.storage.local.get(['dataUrl', 'opacity', 'width', 'difference', 'naturalWidth'], (data) => {
  if (data.dataUrl) {
    currentDataUrl = data.dataUrl;
    preview.src = data.dataUrl;
    preview.style.display = 'block';
  }
  if (data.opacity !== undefined) {
    opacitySlider.value = data.opacity;
    opacityVal.textContent = data.opacity;
  }
  if (data.width !== undefined) setWidth(data.width);
  if (data.naturalWidth !== undefined) naturalWidth = data.naturalWidth;
  if (data.difference !== undefined) differenceToggle.checked = data.difference;
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentDataUrl = ev.target.result;
    preview.src = currentDataUrl;
    preview.style.display = 'block';

    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth || 1280;
      naturalWidth = naturalW;
      setWidth(naturalW);
      chrome.storage.local.set({ dataUrl: currentDataUrl, width: naturalW, naturalWidth: naturalW });
      sendShow();
    };
    img.src = currentDataUrl;
  };
  reader.readAsDataURL(file);
});

opacitySlider.addEventListener('input', () => {
  opacityVal.textContent = opacitySlider.value;
  chrome.storage.local.set({ opacity: opacitySlider.value });
  sendToContent({ action: 'updateOverlay', opacity: opacitySlider.value / 100 });
});

widthSlider.addEventListener('input', () => {
  const val = setWidth(widthSlider.value);
  chrome.storage.local.set({ width: val });
  sendToContent({ action: 'updateOverlay', width: val });
});

widthNum.addEventListener('change', () => {
  const val = setWidth(widthNum.value);
  chrome.storage.local.set({ width: val });
  sendToContent({ action: 'updateOverlay', width: val });
});

btnResetWidth.addEventListener('click', () => {
  if (!naturalWidth) return;
  const val = setWidth(naturalWidth);
  chrome.storage.local.set({ width: val });
  sendToContent({ action: 'updateOverlay', width: val });
});

btnShow.addEventListener('click', () => {
  if (!currentDataUrl) return;
  sendShow();
});

btnTop.addEventListener('click', () => {
  sendToContent({ action: 'bringToTop' });
});

btnHide.addEventListener('click', () => {
  sendToContent({ action: 'hideOverlay' });
});

differenceToggle.addEventListener('change', () => {
  chrome.storage.local.set({ difference: differenceToggle.checked });
  sendToContent({ action: 'updateOverlay', difference: differenceToggle.checked });
});

function sendShow() {
  sendToContent({
    action: 'showOverlay',
    dataUrl: currentDataUrl,
    opacity: opacitySlider.value / 100,
    width: parseInt(widthSlider.value),
    difference: differenceToggle.checked,
  });
}


function sendToContent(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg);
  });
}
