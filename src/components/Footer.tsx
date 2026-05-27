import { wedding } from '../data/wedding';

export function Footer() {
  return (
    <footer className="footer section-reveal">
      <p>
        Контактная информация:
      </p>
      <p>
      Жених Алексей Тел.:<a href="tel:+79203458216">+7 (920) 345-82-16</a> Telegram: <a href="https://t.me/alexcpu7">@alexcpu7</a>
      </p>
      <p>
      Невеста Марина Тел.:<a href="tel:+79996731623">+7 (999) 673-16-23</a> Telegram: <a href="https://t.me/lomova_m">@lomova_m</a>
      </p>
      <p>
      Организатор Анастасия Тел.:<a href="tel:+79111408467">+7 (911) 140-84-67</a> Telegram: <a href="https://t.me/AX_events">@AX_events</a>
      </p>
      <strong>{wedding.couple.label}</strong>
    </footer>
  );
}
