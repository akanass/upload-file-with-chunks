import { MDCRipple } from '@material/ripple';

// add ripple effect
const rippleSelectors =
  '.mdc-button, .mdc-icon-button, .mdc-card__primary-action';
[].map.call(
  document.querySelectorAll(rippleSelectors),
  (el) => new MDCRipple(el),
);
