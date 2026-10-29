// Componente de estrellas (visualizacion y seleccion interactiva)

export function createStarRatingDisplay(rating, maxStars = 10) {
  const rounded = Math.round(Number(rating) || 0);
  let starsHtml = '';

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= rounded;
    starsHtml += `<span class="star-rating__star ${isFilled ? 'star-rating__star--filled' : ''}" aria-hidden="true">★</span>`;
  }

  return `
    <div class="star-rating" role="img" aria-label="Calificacion: ${rating} de ${maxStars}">
      ${starsHtml}
      <span class="star-rating__value">${rating}/${maxStars}</span>
    </div>
  `;
}

export function createInteractiveStarRating(container, maxOrCb = 10, cb) {
  const el = typeof container === 'string' 
    ? (document.getElementById(container) || document.querySelector(container))
    : container;

  if (!el) return;

  let maxStars = 10;
  let onChange = null;

  if (typeof maxOrCb === 'function') {
    onChange = maxOrCb;
  } else {
    maxStars = maxOrCb || 10;
    onChange = cb;
  }

  el.classList.add('star-rating', 'star-rating--interactive');
  el.innerHTML = '';

  for (let i = maxStars; i >= 1; i--) {
    const star = document.createElement('span');
    star.className = 'star-rating__star';
    star.textContent = '★';
    star.dataset.value = i;
    star.setAttribute('role', 'button');
    star.setAttribute('tabindex', '0');
    star.setAttribute('aria-label', `${i} estrellas`);

    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.value, 10);
      setActiveStars(el, val, maxStars);
      if (typeof onChange === 'function') {
        onChange(val);
      }
    });

    star.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        star.click();
      }
    });

    el.appendChild(star);
  }
}

function setActiveStars(container, selectedValue, maxStars) {
  const stars = container.querySelectorAll('.star-rating__star');
  stars.forEach((s) => {
    const val = parseInt(s.dataset.value, 10);
    if (val <= selectedValue) {
      s.classList.add('star-rating__star--filled', 'star-rating__star--active');
    } else {
      s.classList.remove('star-rating__star--filled', 'star-rating__star--active');
    }
  });
}
