const isInPagesDirectory = window.location.pathname.split('/').includes('pages');

export function getPageUrl(filename) {
  return `${isInPagesDirectory ? '' : 'pages/'}${filename}`;
}

export function getHomeUrl() {
  return isInPagesDirectory ? '../index.html' : 'index.html';
}
