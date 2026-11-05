'use strict';

// Keep every section readable if JavaScript is unavailable.
const pages = [...document.querySelectorAll('[data-page]')];
const navigationLinks = [...document.querySelectorAll('[data-nav-link]')];
const sidebar = document.querySelector('[data-sidebar]');
const sidebarButton = document.querySelector('[data-sidebar-btn]');
const dialog = document.querySelector('.photo-dialog');
let gallery = [];
let galleryPromise;
let photoIndex = 0;

function selectedPage() {
  const id = location.hash.slice(1);
  return pages.some(page => page.dataset.page === id) ? id : 'about';
}

function showPage(id, moveFocus = false) {
  for (const page of pages) {
    const selected = page.dataset.page === id;
    page.classList.toggle('active', selected);
    page.hidden = !selected;
  }
  for (const link of navigationLinks) {
    const selected = link.dataset.navLink === id;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = `Dijie Zhu — ${id === 'about' ? 'Robotics & Machine Learning' : id[0].toUpperCase() + id.slice(1)}`;
  if (moveFocus) {
    window.scrollTo(0, 0);
    document.getElementById(id).focus({preventScroll: true});
  }
  if (id === 'photos' && !galleryPromise) galleryPromise = loadGallery();
}

document.documentElement.classList.add('js');
showPage(selectedPage());

for (const link of document.querySelectorAll('[data-nav-link], [data-page-link]')) {
  link.addEventListener('click', event => {
    // Preserve the usual open-in-new-tab behavior for modified clicks.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = link.dataset.navLink || link.dataset.pageLink;
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    showPage(id, true);
  });
}
window.addEventListener('popstate', () => showPage(selectedPage(), true));
window.addEventListener('hashchange', () => showPage(selectedPage()));

sidebarButton.addEventListener('click', () => {
  const expanded = sidebar.classList.toggle('active');
  sidebarButton.setAttribute('aria-expanded', String(expanded));
  sidebarButton.setAttribute('aria-label', expanded ? 'Hide profile links' : 'Show profile links');
  sidebarButton.querySelector('span').textContent = expanded ? 'Hide links' : 'Show links';
});

async function loadGallery() {
  const grid = document.getElementById('photo-grid');
  try {
    const response = await fetch('./Misc/gallery.json');
    if (!response.ok) throw new Error('Gallery unavailable');
    const data = await response.json();
    gallery = data.filter(item => item && typeof item.src === 'string');
    gallery.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Open photo ${index + 1}`);
      const img = document.createElement('img');
      img.src = item.thumb || item.src;
      img.alt = item.alt || item.caption || `Photography by Dijie Zhu, photo ${index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img);
      button.addEventListener('click', () => { updatePhoto(index); dialog.showModal(); });
      grid.append(button);
    });
  } catch {
    const message = document.createElement('p');
    message.className = 'section-intro';
    message.textContent = 'The photos could not be loaded. Please refresh the page to try again.';
    grid.append(message);
    galleryPromise = null;
  }
}

function updatePhoto(index) {
  if (!gallery.length) return;
  photoIndex = (index + gallery.length) % gallery.length;
  const item = gallery[photoIndex];
  const image = document.getElementById('photo-full');
  image.src = item.full || item.src;
  image.alt = item.alt || item.caption || `Photography by Dijie Zhu, photo ${photoIndex + 1}`;
  document.getElementById('photo-caption').textContent = item.caption || `${photoIndex + 1} / ${gallery.length}`;
}
document.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
document.querySelector('[data-photo-prev]').addEventListener('click', () => updatePhoto(photoIndex - 1));
document.querySelector('[data-photo-next]').addEventListener('click', () => updatePhoto(photoIndex + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); updatePhoto(photoIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); updatePhoto(photoIndex + 1); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
