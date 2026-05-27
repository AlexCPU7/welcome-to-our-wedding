import { wedding } from '../data/wedding';

export function Footer() {
  return (
    <footer className="footer section-reveal">
      <p>Спасибо, что будете рядом в этот важный для нас день.</p>
      <strong>{wedding.couple.label}</strong>
    </footer>
  );
}
